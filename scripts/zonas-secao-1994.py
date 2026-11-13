#!/usr/bin/env python3
"""
Sigoli.TSE — Presidente 1994 por zona eleitoral, a partir da votação por seção do TSE (votacao_secao_1994_BR.csv).

O arquivo por seção de 1994 só tem Presidente, 1º turno, de 17 UFs, e não traz o local de votação (NR_LOCAL_VOTACAO
= -3): dá zonas, não locais. Também não traz o eleitorado: t = [0, comparecimento, 0, válidos, brancos, nulos].
Soma conferida com o arquivo por município de 1994 (3.140 municípios; 6 diferem em até ~100 votos).

Saída: public/data/1994/presidente/1/zonas-cidade/{uf}.json (id "{ibge}-{zona}") e zonas/{uf}.json (id = zona),
com os candidatos na mesma ordem do br.json. O desenho: scripts/zonas-de-outro-ano.mjs --ano 1994 --de 1998.
Uso: python3 scripts/zonas-secao-1994.py votacao_secao_1994_BR.csv
"""
import collections, csv, json, os, sys

BASE = 'public/data/1994'
br = json.load(open(f'{BASE}/presidente/1/br.json', encoding='utf8'))
idx = {c['n']: i for i, c in enumerate(br['cands'])}
n = len(br['cands'])
tse_ibge = {str(int(m['tse'])): m['ibge'] for m in json.load(open(f'{BASE}/municipios.json', encoding='utf8')) if m.get('tse') and m['uf'] != 'zz'}

regs = collections.defaultdict(lambda: collections.defaultdict(lambda: [0] * (n + 2)))
r = csv.reader(open(sys.argv[1], encoding='latin1'), delimiter=';')
cab = next(r); I = {k: i for i, k in enumerate(cab)}
for x in r:
    if x[I['DS_CARGO']] != 'PRESIDENTE' or x[I['NR_TURNO']] != '1': continue
    uf = x[I['SG_UF']].lower()
    ib = tse_ibge[str(int(x[I['CD_MUNICIPIO']]))]
    a = regs[uf][f"{ib}-{int(x[I['NR_ZONA']])}"]
    num, v = x[I['NR_VOTAVEL']], int(x[I['QT_VOTOS']])
    if num == '95': a[n] += v
    elif num == '96': a[n + 1] += v
    else: a[idx[num]] += v

def arquivo(uf, mun):
    tt, tc = [0] * 6, [0] * n
    for m in mun.values():
        tt = [p + q for p, q in zip(tt, m['t'])]; tc = [p + q for p, q in zip(tc, m['c'])]
    return {**{k: br[k] for k in ('v', 'cargo', 'turno', 'tipo', 'vagas', 'atualizado', 'cands', 'partidos')}, 'abr': uf,
            'total': {'t': tt, 'c': tc, 'p': []}, 'mun': mun}

for uf, zonas in sorted(regs.items()):
    mun = {}
    for k, a in sorted(zonas.items()):
        c = a[:n]; val = sum(c)
        mun[k] = {'t': [0, val + a[n] + a[n + 1], 0, val, a[n], a[n + 1]], 'c': c}
    por_zona = {}
    for k, m in mun.items():
        z = k.split('-')[1]
        p = por_zona.setdefault(z, {'t': [0] * 6, 'c': [0] * n})
        p['t'] = [x + y for x, y in zip(p['t'], m['t'])]; p['c'] = [x + y for x, y in zip(p['c'], m['c'])]
    for nivel, dados in (('zonas-cidade', mun), ('zonas', por_zona)):
        os.makedirs(f'{BASE}/presidente/1/{nivel}', exist_ok=True)
        json.dump(arquivo(uf, dados), open(f'{BASE}/presidente/1/{nivel}/{uf}.json', 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
    print(uf, len(mun), 'zonas-cidade,', len(por_zona), 'zonas')
