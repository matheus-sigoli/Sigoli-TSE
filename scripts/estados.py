#!/usr/bin/env python3
"""
Resultado por estado (mapa "por estado" do Brasil): public/data/{ano}/{cargo}/{turno}/estados.json, com as chaves
das áreas = sigla da UF (as mesmas da malha /geo/[{ano}/]estados.json, scripts/estados-malha.py).

- Cargo nacional (Presidente, Vice, plebiscito): arquivo completo (como o br.json), com cada UF = soma dos municípios dela
  (UF da época) ou, quando houver, o resultado oficial do estado em data/oficial/{ano}.csv (linhas com a UF; o mesmo
  formato de scripts/oficial.py). Estado sem município nenhum no site entra só com a linha oficial.
- Cargo estadual (Governador, Senador, Deputados): resumo (como o br.json), área = vencedor no estado, pelo total do
  arquivo da UF (que já tem o total oficial, scripts/oficial.py), e a lista de eleitos de cada UF.

Planilha com resultados por estado (inclusive de anos sem nada por município): vira linhas de data/oficial/{ano}.csv;
scripts/oficial.py cria o arquivo da UF que ainda não existe (cargo estadual) e este script monta o mapa por estado.
Ordem: tre.py/historico.py → oficial.py → resumo-br.mjs → estados.py → pintam.mjs
Uso: python3 scripts/estados.py [--ano 1950]
"""
import argparse, collections, csv, difflib, glob, json, os, re, unicodedata

NACIONAIS = {'presidente', 'vice-presidente', 'forma', 'sistema'}
MUNICIPAIS = {'prefeito', 'vereador'}
CODIGO_UF = {'11': 'ro', '12': 'ac', '13': 'am', '14': 'rr', '15': 'pa', '16': 'ap', '17': 'to', '21': 'ma', '22': 'pi',
             '23': 'ce', '24': 'rn', '25': 'pb', '26': 'pe', '27': 'al', '28': 'se', '29': 'ba', '31': 'mg', '32': 'es',
             '33': 'rj', '35': 'sp', '41': 'pr', '42': 'sc', '43': 'rs', '50': 'ms', '51': 'mt', '52': 'go', '53': 'df'}
TOT = {'#eleitorado': 0, '#comparecimento': 1, '#abstencao': 2, '#brancos': 4, '#nulos': 5}


def uf_da_epoca(ibge, ano):
    uf = CODIGO_UF.get(str(ibge)[:2])
    if uf == 'ms' and ano < 1979: return 'mt'
    if uf == 'to' and ano < 1989: return 'go'
    return uf


def chave(s):
    s = ''.join(c for c in unicodedata.normalize('NFD', str(s)) if unicodedata.category(c) != 'Mn').upper()
    return re.sub(r'[^A-Z]', '', s)


def achar_cand(cands, nome, partido):
    k = chave(nome)
    if k:
        sc = [(1.0 if (chave(c['nome']) in k or k in chave(c['nome'])) and len(chave(c['nome'])) > 5 else
               difflib.SequenceMatcher(None, k, chave(c['nome'])).ratio(), i) for i, c in enumerate(cands)]
        if sc and max(sc)[0] >= 0.72: return max(sc)[1]
    mesmos = [i for i, c in enumerate(cands) if partido and chave(c['partido']) == chave(partido)]
    return mesmos[0] if len(mesmos) == 1 else None


def oficiais(ano):
    """(cargo, turno) → uf → linhas de data/oficial/{ano}.csv"""
    g = collections.defaultdict(lambda: collections.defaultdict(list))
    p = f'data/oficial/{ano}.csv'
    if os.path.exists(p):
        for r in csv.DictReader(open(p, encoding='utf8'), delimiter=';'):
            g[(r['cargo'], int(r['turno']))][r['uf'].lower()].append(r)
    return g


def nacional(ano, cargo, turno, br, ofi):
    n = len(br['cands'])
    por_uf = {}
    for ib, r in br['mun'].items():
        uf = uf_da_epoca(ib, ano)
        if not uf: continue  # exterior
        acc = por_uf.setdefault(uf, {'t': [0] * 6, 'c': [0] * n})
        for i, v in enumerate(r['t']): acc['t'][i] += v
        for i, v in enumerate(r['c'][:n]): acc['c'][i] += v
    fontes = {}
    for uf, rs in ofi.items():
        if uf == 'br' or any(r['votos'] == '' for r in rs): continue
        reg = {'t': [0] * 6, 'c': [0] * n}
        for r in rs:
            if r['candidato'] in TOT: reg['t'][TOT[r['candidato']]] = int(r['votos']); continue
            i = achar_cand(br['cands'], r['candidato'], r['partido'])
            if i is None: print(f'  ⚠ {ano} {cargo} {uf}: candidato "{r["candidato"]}" não está no br.json'); continue
            reg['c'][i] = int(r['votos'])
        reg['t'][3] = sum(reg['c'])
        if not reg['t'][1] and (reg['t'][4] or reg['t'][5]): reg['t'][1] = reg['t'][3] + reg['t'][4] + reg['t'][5]
        if reg['t'][0] and reg['t'][1] and not reg['t'][2]: reg['t'][2] = reg['t'][0] - reg['t'][1]
        por_uf[uf] = reg
        fontes[uf] = rs[0].get('fonte', '')
    d = {k: v for k, v in br.items() if k not in ('mun', 'pintam', 'oficial')}
    d['mun'] = por_uf
    if fontes: d['fonteEstados'] = fontes
    return d


def estadual(ano, cargo, turno):
    partidos, mun, eleitos = [], {}, {}
    total = [0] * 6
    for p in sorted(glob.glob(f'public/data/{ano}/{cargo}/{turno}/[a-z][a-z].json')):
        uf = os.path.basename(p)[:2]
        if uf in ('br', 'zz'): continue
        d = json.load(open(p, encoding='utf8'))
        for i, v in enumerate(d['total']['t']): total[i] += v
        prop = d.get('tipo') == 'prop'
        if prop:
            votos = d['total'].get('p') or []
            nomes = [x['sg'] for x in d['partidos']]
            venc = max(range(len(votos)), key=lambda i: votos[i]) if votos and max(votos) > 0 else None
            sigla, nome = (nomes[venc], '') if venc is not None else (None, '')
        else:
            votos = d['total']['c']
            venc = max(range(len(votos)), key=lambda i: votos[i]) if votos and max(votos) > 0 else None
            sigla, nome = (d['cands'][venc]['partido'], d['cands'][venc]['nome']) if venc is not None else (None, '')
        val = d['total']['t'][3] or sum(votos) or 1
        if sigla is not None:
            if sigla not in partidos: partidos.append(sigla)
            mun[uf] = [partidos.index(sigla), round(votos[venc] / val * 1000), nome]
        eleitos[uf] = [{'nome': c['nome'], 'partido': c['partido'], 'n': c.get('n', ''),
                        'votos': (d['total']['c'][i] if not prop and i < len(d['total']['c']) else 0),
                        'eleito': bool(c.get('eleito')), 'situacao': c.get('situacao', '')}
                       for i, c in enumerate(d['cands']) if c.get('eleito') or re.search('2º turno', c.get('situacao', ''))]
    if not mun: return None
    tipo = 'prop' if cargo.startswith('deputado') else 'maj'
    return {'v': 1, 'cargo': cargo, 'turno': turno, 'abr': 'br', 'tipo': tipo, 'resumo': True, 'partidos': partidos,
            'total': {'t': total}, 'eleitos': eleitos, 'mun': mun}


a = argparse.ArgumentParser(); a.add_argument('--ano', type=int); a = a.parse_args()
for dir_ano in sorted(glob.glob('public/data/[0-9]*')):
    ano = int(os.path.basename(dir_ano))
    if a.ano and ano != a.ano: continue
    ofi = oficiais(ano)
    for dir_t in sorted(glob.glob(f'{dir_ano}/*/[12]')):
        cargo, turno = dir_t.split('/')[-2], int(dir_t.split('/')[-1])
        if cargo in MUNICIPAIS: continue
        br_p = f'{dir_t}/br.json'
        br = json.load(open(br_p, encoding='utf8')) if os.path.exists(br_p) else None
        if cargo in NACIONAIS or (br and not br.get('resumo')):
            if not br: continue
            d = nacional(ano, cargo, turno, br, ofi.get((cargo, turno), {}))
        else:
            d = estadual(ano, cargo, turno)
        if not d: continue
        with open(f'{dir_t}/estados.json', 'w', encoding='utf8') as f: json.dump(d, f, ensure_ascii=False, separators=(',', ':'))
        print(f'{ano} {cargo} {turno}º: {len(d["mun"])} UFs' + (' (resumo)' if d.get('resumo') else ''))
