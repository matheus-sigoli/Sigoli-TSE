#!/usr/bin/env python3
"""
Sigoli.TSE — "juntos" por cargo: município sem resultado num cargo que votou junto com outro (mesma zona eleitoral).

A malha do ano (scripts/malha-historica.mjs) já marca com "z" quem votou junto em TODOS os cargos; mas, quando um cargo
tem resultado por município e outro só por zona (1955: Presidente por município e Governador de MG por zona), o polígono
fica sem "z" e o Governador o deixaria cinza. Aqui, para cada arquivo de UF de cada cargo do ano com
data/malhas-historicas/agrupar/{ano}-{uf}.csv, os polígonos da malha sem resultado nesse cargo (e sem "z") ganham, no
próprio arquivo, `juntos: {município: sede}`: a sede da lista ou, com "*;vizinho", o vizinho com resultado de maior
divisa (em ondas, até todos terem). O site pinta e seleciona os dois juntos, como com o "z".
Também junta os das UFs no br.json do cargo. Rodar por último, depois de malha-historica.mjs, presidente-br.py e
resumo-br.mjs (que refazem o br.json), e antes de pintam.mjs.
Uso: python3 scripts/juntos.py [--ano 1955]
"""
import argparse, collections, glob, json, os

a = argparse.ArgumentParser(); a.add_argument('--ano', type=int); a = a.parse_args()
for arq_g in sorted(glob.glob('data/malhas-historicas/agrupar/*.csv')):
    ano, uf = os.path.basename(arq_g)[:-4].split('-')
    if a.ano and int(ano) != a.ano: continue
    linhas = [l.strip().split(';') for l in open(arq_g, encoding='utf8').read().strip().split('\n')[1:] if l.strip()]
    grupo = {k: v for k, v in linhas}
    vizinho = grupo.pop('*', None) == 'vizinho'
    lista = json.load(open(f'public/geo/{ano}/malhas.json')) if os.path.exists(f'public/geo/{ano}/malhas.json') else []
    malha = f'public/geo/{ano}/uf/{uf}.json' if f'uf/{uf}.json' in lista else f'public/geo/uf/{uf}.json'
    if not os.path.exists(malha): continue
    t = json.load(open(malha, encoding='utf8'))
    geoms = [g for g in t['objects']['municipios']['geometries'] if g.get('type') in ('Polygon', 'MultiPolygon')]
    ids = [str(g['id']) for g in geoms]
    comz = {str(g['id']) for g in geoms if (g.get('properties') or {}).get('z')}
    # divisa = arcos em comum
    arcos = {}
    for g in geoms:
        polis = g['arcs'] if g['type'] == 'MultiPolygon' else [g['arcs']]
        s = collections.Counter()
        for p in polis:
            for anel in p:
                for i in anel: s[i if i >= 0 else ~i] += len(t['arcs'][i if i >= 0 else ~i])
        arcos[str(g['id'])] = s
    donos = collections.defaultdict(set)
    for k, s in arcos.items():
        for i in s: donos[i].add(k)
    viz = {k: collections.Counter() for k in ids}
    for i, ks in donos.items():
        for k in ks:
            for o in ks:
                if o != k: viz[k][o] += arcos[k][i]
    for arq in sorted(glob.glob(f'public/data/{ano}/*/[12]/{uf}.json')):
        d = json.load(open(arq, encoding='utf8'))
        if d.get('resumo'): continue
        com = set(d['mun'])
        if not com: continue
        dest = {k: k for k in com}
        for k in ids:  # a lista da zona primeiro
            if k not in com and k not in comz and grupo.get(k) in com: dest[k] = grupo[k]
        if vizinho:
            for _ in range(50):
                novos = {}
                for k in ids:
                    if k in dest or k in comz: continue
                    cand = [(n, o) for o, n in viz[k].items() if o in dest]
                    if cand: novos[k] = dest[max(cand)[1]]
                if not novos: break
                dest.update(novos)
        juntos = {k: v for k, v in sorted(dest.items()) if k != v}
        if juntos == d.get('juntos', {}): continue
        if juntos: d['juntos'] = juntos
        else: d.pop('juntos', None)
        json.dump(d, open(arq, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
        print(f'{arq}: {len(juntos)} município(s) com o resultado de outro')

# o arquivo do Brasil (resumo dos cargos estaduais; o do Presidente, que o site usa também na visão da UF) junta os das UFs
anos = {int(os.path.basename(p)[:4]) for p in glob.glob('data/malhas-historicas/agrupar/*.csv')}
for ano in sorted(anos):
    if a.ano and ano != a.ano: continue
    for br_p in sorted(glob.glob(f'public/data/{ano}/*/[12]/br.json')):
        br = json.load(open(br_p, encoding='utf8'))
        if br.get('soEstados'): continue
        juntos = {}
        for p in sorted(glob.glob(os.path.join(os.path.dirname(br_p), '[a-z][a-z].json'))):
            if p.endswith(('/br.json', '/zz.json')): continue
            juntos.update(json.load(open(p, encoding='utf8')).get('juntos', {}))
        if juntos == br.get('juntos', {}): continue
        if juntos: br['juntos'] = juntos
        else: br.pop('juntos', None)
        json.dump(br, open(br_p, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
        print(f'{br_p}: {len(juntos)} juntos das UFs')
