#!/usr/bin/env python3
"""
Sigoli.TSE — arquivo nacional completo de Presidente/Vice-Presidente (o site usa br.json também na visão por UF) a
partir dos arquivos por UF que scripts/tre.py grava: public/data/{ano}/{cargo}/{turno}/{uf}.json → br.json
(mesmo formato dos anos do TSE: cands, total {t, c, p}, mun {ibge: {t, c}}). Depois: node scripts/pintam.mjs --ano.
Uso: python3 scripts/presidente-br.py --ano 1955 --cargo presidente [--turno 1]
"""
import argparse, glob, json, os
a = argparse.ArgumentParser(); a.add_argument('--ano', type=int, required=True); a.add_argument('--cargo', required=True)
a.add_argument('--turno', type=int, default=1); a = a.parse_args()
d = f'public/data/{a.ano}/{a.cargo}/{a.turno}'
arqs = [json.load(open(f, encoding='utf8')) for f in sorted(glob.glob(f'{d}/[a-z][a-z].json')) if not f.endswith(('br.json', 'zz.json'))]
cands = {}
for x in arqs:
    for c in x['cands']: cands.setdefault(c['id'], {**c})
mun = {}; tc = {k: 0 for k in cands}; tt = [0] * 6; fonte = ''
for x in arqs:
    fonte = fonte or x.get('fonte', '')
    for k, m in x['mun'].items():
        por = {c['id']: v for c, v in zip(x['cands'], m['c'])}
        mun[k] = {'t': m['t'], 'c': por}
        for i in range(6): tt[i] += m['t'][i] or 0
        for cid, v in por.items(): tc[cid] += v
ordem = sorted(cands, key=lambda k: -tc[k])
saida = {'v': 1, 'cargo': a.cargo, 'turno': a.turno, 'tipo': 'maj', 'vagas': 1, 'atualizado': '', 'fonte': fonte,
         'cands': [cands[k] for k in ordem], 'partidos': [], 'abr': 'br',
         'total': {'t': tt, 'c': [tc[k] for k in ordem], 'p': []},
         'mun': {k: {'t': m['t'], 'c': [m['c'].get(c, 0) for c in ordem]} for k, m in mun.items()}}
json.dump(saida, open(f'{d}/br.json', 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
print(f'{d}/br.json: {len(mun)} municípios · ' + ' | '.join(f"{cands[k]['nome']} {tc[k]}" for k in ordem), '· t', tt)
