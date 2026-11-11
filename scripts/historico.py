#!/usr/bin/env python3
"""
Sigoli.TSE — resultados antigos a partir das planilhas do acervo (data/historico/).

Organização (ver data/historico/LEIA-ME.md):
  data/historico/{cargo}/{UF}.xlsx      cargo = governador, senador, presidente…; UF = SP, MG…
    aba "ANO NT"   (ex.: "1990 1T", "1990 2T"; "1958" = 1º turno): uma linha por município
        CDG  MUN  [APTOS COMPARECIMENTO BRANCOS NULOS]  <uma coluna por candidato: a sigla do partido>  [% … MAPA]
        CDG = código do IBGE do município (o de hoje); colunas que começam com % e a coluna MAPA são ignoradas.
    aba "CANDIDATOS" (opcional): ANO  TURNO  PARTIDO  NUMERO  NOME  VICE  PARTIDO VICE  COLIGACAO  ELEITO
        PARTIDO é o mesmo texto do cabeçalho da coluna de votos; sem a aba, o candidato aparece pelo partido.
  As outras abas (BASE, Associação, Planilha1…) são ignoradas.

Saída: public/data/{ano}/{cargo}/{turno}/{uf}.json (mesmo formato do site) e, se faltar, municipios.json e meta.json do ano.
Linhas com o mesmo CDG são somadas (municípios da época que hoje são um só).
Relatório: municípios fora da lista do IBGE ou de outra UF, códigos repetidos, linhas sem voto, totais por candidato.

Uso: python3 scripts/historico.py [--de data/historico] [--ano 1990] [--uf SP] [--cargo governador] [--conferir]
     --conferir só lê e mostra o relatório, sem gravar.
"""
import argparse, json, os, re, sys, unicodedata
import openpyxl

def sem_acento(s):
    return ''.join(c for c in unicodedata.normalize('NFD', str(s)) if unicodedata.category(c) != 'Mn').upper().strip()

ABA = re.compile(r'^\s*(\d{4})\s*(?:(\d)\s*º?\s*T)?\s*$', re.I)
TOTAIS = {'APTOS': 0, 'ELEITORADO': 0, 'COMPARECIMENTO': 1, 'VOTANTES': 1, 'ABSTENCAO': 2, 'ABSTENCOES': 2, 'BRANCOS': 4, 'NULOS': 5}
IGNORAR = {'CDG', 'MUN', 'MUNICIPIO', 'MAPA', 'UF', 'MUN SEM ACENTO', 'VALIDOS', 'VOTOS VALIDOS', 'TOTAL'}

def ler_candidatos(wb):
    if 'CANDIDATOS' not in [sem_acento(n) for n in wb.sheetnames]: return {}
    ws = wb[[n for n in wb.sheetnames if sem_acento(n) == 'CANDIDATOS'][0]]
    linhas = list(ws.iter_rows(values_only=True))
    cab = [sem_acento(c or '') for c in linhas[0]]
    out = {}
    for r in linhas[1:]:
        d = dict(zip(cab, r))
        if not d.get('ANO') or not d.get('PARTIDO'): continue
        out[(int(d['ANO']), int(d.get('TURNO') or 1), sem_acento(d['PARTIDO']))] = d
    return out

def ler_aba(ws):
    linhas = [r for r in ws.iter_rows(values_only=True)]
    cab = [str(c).strip() if c is not None else '' for c in linhas[0]]
    i_cdg = next((i for i, c in enumerate(cab) if sem_acento(c) == 'CDG'), None)
    i_mun = next((i for i, c in enumerate(cab) if sem_acento(c) in ('MUN', 'MUNICIPIO')), None)
    if i_cdg is None: return None
    tot, cand = {}, []
    for i, c in enumerate(cab):
        k = sem_acento(c)
        if not k or i in (i_cdg, i_mun) or k.startswith('%') or k in IGNORAR or k.startswith('COLUNA'): continue
        if k in TOTAIS: tot[TOTAIS[k]] = i
        else: cand.append((c, i))
    mun = {}
    for r in linhas[1:]:
        cdg = r[i_cdg] if i_cdg < len(r) else None
        if cdg is None or not re.fullmatch(r'\d{7}(\.0)?', str(cdg)): continue
        votos = [int(r[i] or 0) if i < len(r) and isinstance(r[i], (int, float)) else 0 for _, i in cand]
        t = {k: int(r[i] or 0) if isinstance(r[i], (int, float)) else 0 for k, i in tot.items()}
        mun.setdefault(str(int(float(cdg))), []).append((r[i_mun] if i_mun is not None else '', votos, t))
    return cand, tot, mun

def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--de', default='data/historico'); ap.add_argument('--ano', type=int); ap.add_argument('--uf'); ap.add_argument('--cargo')
    ap.add_argument('--conferir', action='store_true'); ap.add_argument('--saida', default='public/data')
    a = ap.parse_args()
    lista = [m for m in json.load(open('public/data/2026/municipios.json', encoding='utf8')) if m['uf'] != 'zz']
    ibge_ok = {m['ibge']: m for m in lista}
    problemas = 0
    for cargo in sorted(os.listdir(a.de)):
        pasta = os.path.join(a.de, cargo)
        if not os.path.isdir(pasta) or (a.cargo and cargo != a.cargo): continue
        for arq in sorted(f for f in os.listdir(pasta) if f.lower().endswith('.xlsx') and not f.startswith('~$')):
            uf = os.path.splitext(arq)[0].lower()
            if a.uf and uf != a.uf.lower(): continue
            wb = openpyxl.load_workbook(os.path.join(pasta, arq), data_only=True)
            cands_info = ler_candidatos(wb)
            for nome in wb.sheetnames:
                m = ABA.match(nome)
                if not m: continue
                ano, turno = int(m.group(1)), int(m.group(2) or 1)
                if a.ano and ano != a.ano: continue
                lido = ler_aba(wb[nome])
                if not lido: print(f'  {cargo}/{arq} "{nome}": sem coluna CDG, ignorada'); continue
                cand, tot, mun = lido
                rotulo = f'{ano} {cargo} {turno}º turno {uf.upper()}'
                fora = sorted(k for k in mun if k not in ibge_ok or ibge_ok[k]['uf'] != uf)
                rep = sorted(k for k, v in mun.items() if len(v) > 1)
                vazios = sorted(k for k, v in mun.items() if not sum(sum(x[1]) for x in v))
                if fora: problemas += 1
                # candidatos do mais votado ao menos
                soma = [sum(x[1][j] for v in mun.values() for x in v) for j in range(len(cand))]
                ordem = sorted([j for j in range(len(cand)) if soma[j] > 0], key=lambda j: -soma[j])
                cands = []
                for pos, j in enumerate(ordem):
                    sigla = cand[j][0]
                    info = cands_info.get((ano, turno, sem_acento(sigla)), {})
                    eleito = str(info.get('ELEITO') or '').strip().upper() in ('SIM', 'S', 'ELEITO', 'X') if info else (turno == 2 and pos == 0)
                    cands.append({'id': str(info.get('NUMERO') or sem_acento(sigla)), 'n': str(info.get('NUMERO') or ''),
                                  'nome': str(info.get('NOME') or sigla).upper(), 'partido': sigla.upper(), 'eleito': eleito,
                                  'situacao': 'Eleito' if eleito else ('2º turno' if turno == 1 and info.get('ELEITO') and 'TURNO' in sem_acento(info['ELEITO']) else 'Não eleito'),
                                  **({'vices': [{'tipo': 'v', 'nome': str(info['VICE']).upper(), 'partido': str(info.get('PARTIDO VICE') or '').upper()}]} if info.get('VICE') else {}),
                                  **({'col': str(info['COLIGACAO']).upper()} if info.get('COLIGACAO') else {})})
                saida_mun, tt, tc = {}, [0] * 6, [0] * len(ordem)
                for k, v in sorted(mun.items()):
                    if k in fora: continue
                    # várias linhas com o mesmo código = municípios da época que hoje são um só: soma
                    votos = [sum(x[1][j] for x in v) for j in range(len(cand))]
                    t0 = {k: sum(x[2].get(k, 0) for x in v) for k in set().union(*[x[2] for x in v])}
                    c = [votos[j] for j in ordem]
                    val = sum(c)
                    t = [t0.get(0, 0), t0.get(1, 0), t0.get(2, 0), val, t0.get(4, 0), t0.get(5, 0)]
                    if t[0] and not t[2] and t[1]: t[2] = t[0] - t[1]
                    if t[1] and not (t[4] or t[5]) and t[1] > val: pass  # brancos e nulos juntos não dá para separar
                    saida_mun[k] = {'t': t, 'c': c}
                    tt = [x + y for x, y in zip(tt, t)]; tc = [x + y for x, y in zip(tc, c)]
                print(f'{rotulo}: {len(saida_mun)} municípios · ' + ' | '.join(f"{cands[i]['nome']} {tc[i]}" for i in range(min(4, len(cands))))
                      + (f' · sem totais de eleitorado/brancos/nulos' if not tot else ''))
                if fora: print(f'  ⚠ fora da lista do IBGE ou de outra UF: {fora[:10]}{"…" if len(fora) > 10 else ""}')
                if rep: print(f'  · mesmo código em mais de uma linha (somadas: municípios da época que hoje são um só): {rep[:10]}')
                if vazios: print(f'  · {len(vazios)} municípios sem voto: {vazios[:10]}')
                if a.conferir: continue
                dest = os.path.join(a.saida, str(ano), cargo, str(turno)); os.makedirs(dest, exist_ok=True)
                json.dump({'v': 1, 'cargo': cargo, 'turno': turno, 'abr': uf, 'tipo': 'maj', 'vagas': 1, 'atualizado': '',
                           'semTotais': not tot, 'cands': cands, 'partidos': [], 'total': {'t': tt, 'c': tc, 'p': []}, 'mun': saida_mun},
                          open(os.path.join(dest, f'{uf}.json'), 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
                base = os.path.join(a.saida, str(ano))
                if not os.path.exists(os.path.join(base, 'municipios.json')):
                    json.dump(lista, open(os.path.join(base, 'municipios.json'), 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
                    json.dump({'fonte': 'Acervo de planilhas de Matheus Sigoli (data/historico)'}, open(os.path.join(base, 'meta.json'), 'w', encoding='utf8'), ensure_ascii=False)
    sys.exit(1 if problemas and a.conferir else 0)

if __name__ == '__main__':
    main()
