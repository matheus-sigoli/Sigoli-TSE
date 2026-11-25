#!/usr/bin/env python3
"""
Eleições antigas, só por estado: planilha do acervo "Resultados sobre o Brasil geral/Eleições Presidenciais por Estado
(1881-1930).xlsx" (uma aba por eleição; Império 1884–1886 = eleições legislativas, votos por partido; República Velha
1894–1930 = Presidente e Vice; 1945 Presidente; 1950 Presidente e Vice, que já estão no site por município e ganham o
resultado oficial de cada estado).

Cada aba: linha 2 = título do bloco ("ELEIÇÃO DE 1894 - PRESIDENTE", "... - VICE", "... - SUPLEMENTAR",
"... - LEGISLATIVAS"), linha 3 = "Estado" e os nomes, linha 4 = partidos; colunas de "%" e a linha TOTAL são ignoradas
(o total sai da soma; a do TOTAL só confere). "ESTADOS EM GUERRA - SEM ELEIÇÕES" (1894: PR, SC, RS) fica sem resultado.
Saída: linhas por UF (e a do Brasil, só nos anos que não estão no site) em data/oficial/{ano}.csv, as mesmas que
scripts/oficial.py e scripts/estados.py leem. Depois: python3 scripts/estados.py --ano {ano}.
Uso: python3 scripts/extrair/estados-antigos.py --xlsx "<acervo>/Resultados sobre o Brasil geral/Eleições Presidenciais por Estado (1881-1930).xlsx"
"""
import argparse, collections, csv, os, re
import openpyxl

UF = {'Acre': 'ac', 'Território do Acre': 'ac', 'Alagoas': 'al', 'Amapá': 'ap', 'Território do Amapá': 'ap', 'Amazonas': 'am',
      'Bahia': 'ba', 'Ceará': 'ce', 'Distrito Federal': 'df', 'Espírito Santo': 'es', 'Goiás': 'go', 'Guaporé': 'ro',
      'Território do Guaporé': 'ro', 'Maranhão': 'ma', 'Mato Grosso': 'mt', 'Minas Gerais': 'mg', 'Pará': 'pa', 'Paraíba': 'pb',
      'Paraná': 'pr', 'Pernambuco': 'pe', 'Piauí': 'pi', 'Rio Branco': 'rr', 'Território do Rio Branco': 'rr',
      'Rio de Janeiro': 'rj', 'Rio Grande do Norte': 'rn', 'Rio Grande do Sul': 'rs', 'Santa Catarina': 'sc', 'São Paulo': 'sp',
      'Sergipe': 'se', 'Território de Fernando de Noronha': 'fn', 'Território de Ponta Porã': 'pp', 'Território do Iguaçu': 'ig'}
# nomes como ficam no site
NOMES = {'Artur Bernades': 'Artur Bernardes', 'Washignton Luís': 'Washington Luís', 'Justiano Chermont': 'Justo Chermont',
         'Mangabeira': 'João Mangabeira', 'Rolim Teles': 'Mário Rolim Teles', 'Yedo Fiúza': 'Yedo Fiúza'}
NO_SITE = {1950}  # anos que já estão no site por município: só as linhas das UFs
FONTE = 'Planilha "Eleições Presidenciais por Estado (1881-1930)" do acervo Sigoli.TSE (votos por estado)'

a = argparse.ArgumentParser(); a.add_argument('--xlsx', required=True); a = a.parse_args()
wb = openpyxl.load_workbook(a.xlsx, data_only=True)
num = lambda v: int(round(v)) if isinstance(v, (int, float)) else (0 if v in (None, '', '—', '-') else None)
saidas = collections.defaultdict(list)  # ano → linhas do CSV
resumo = []
for ws in wb:
    m = re.match(r'(\d{4})', ws.title)
    if not m: continue  # MODELO, Página12 (cópia da tabela do Vice de 1950)
    ano = int(m.group(1))
    rows = [list(r) for r in ws.iter_rows(values_only=True)]
    tit, cab, par = rows[1], rows[2], rows[3]
    blocos = [i for i, c in enumerate(cab) if c == 'Estado']
    for b, ini in enumerate(blocos):
        fim = blocos[b + 1] if b + 1 < len(blocos) else len(cab)
        titulo = next((str(tit[i]) for i in range(ini, -1, -1) if tit[i]), '')
        legis = 'LEGISLATIVA' in titulo
        cargo = 'camara' if legis else 'vice-presidente' if ('VICE' in titulo or (ano in (1903, 1920) and 'SUPLEMENTAR' in titulo)) else 'presidente'
        cols = []  # (coluna, nome, partido) — candidatos, "Outros", brancos/nulos
        for i in range(ini + 1, fim):
            h = cab[i] if cab[i] is not None else ''
            if str(h).startswith('%'): continue
            p = par[i] or ''
            if h == 'Votos' and p in ('Brancos', 'Nulos'): cols.append((i, '#' + p.lower(), '')); continue
            if legis and not h and p: cols.append((i, p, p)); continue
            if h == 'Outros': cols.append((i, 'Outros', 'OUTROS')); continue
            if h: cols.append((i, NOMES.get(h, h), p))
        votos, conf = {}, None
        for r in rows[4:]:
            nome = r[ini]
            if not nome: continue
            vs = [num(r[i]) for i, _, _ in cols]
            if nome == 'TOTAL': conf = vs; continue
            if nome == 'DEPUTADOS': continue
            if nome not in UF: print('  ⚠ estado desconhecido:', ws.title, nome); continue
            if any(v is None for v in vs) or not any(vs): continue  # "ESTADOS EM GUERRA", #DIV/0!, em branco
            votos[UF[nome]] = vs
        if not votos: print(f'{ws.title}: {cargo} sem nenhum estado com votos'); continue
        tot = [sum(v[k] for v in votos.values()) for k in range(len(cols))]
        if conf and [x for x in conf if x is not None] and conf != tot:
            print(f'  ⚠ {ws.title} {cargo}: soma {tot} ≠ TOTAL da planilha {conf}')
        cands = [k for k, (_, n, _) in enumerate(cols) if not n.startswith('#') and n != 'Outros']
        venc = max(cands, key=lambda k: tot[k])
        linhas = saidas[ano]
        ufs = list(votos) + ([] if ano in NO_SITE else ['br'])
        for uf in ufs:
            vs = tot if uf == 'br' else votos[uf]
            for k, (_, n, p) in enumerate(cols):
                if n.startswith('#'): linhas.append((cargo, 1, uf, n, '', vs[k], '', FONTE))
                else: linhas.append((cargo, 1, uf, n, p, vs[k], 'S' if (uf == 'br' and k == venc and not legis) else '', FONTE))
        resumo.append(f'{ano} {cargo}: {len(votos)} UFs, vencedor {cols[venc][1]} ({tot[venc]:,} votos)'.replace(',', '.'))

for ano, linhas in sorted(saidas.items()):
    p = f'data/oficial/{ano}.csv'
    velhas = []
    if os.path.exists(p):
        velhas = [r for r in csv.reader(open(p, encoding='utf8'), delimiter=';')][1:]
        velhas = [r for r in velhas if r[-1] != FONTE]  # roda de novo sem duplicar
    with open(p, 'w', encoding='utf8', newline='') as f:
        w = csv.writer(f, delimiter=';', lineterminator='\n')
        w.writerow(['cargo', 'turno', 'uf', 'candidato', 'partido', 'votos', 'eleito', 'fonte'])
        for r in velhas: w.writerow(r)
        for r in linhas: w.writerow(r)
print('\n'.join(resumo))
