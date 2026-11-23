#!/usr/bin/env python3
"""
Malha dos estados de cada ano (mapa "por estado", para eleições sem o detalhe por município): public/geo/estados.json e,
nos anos com malha própria do Brasil (/geo/{ano}/br.json: fusões, malha histórica), public/geo/{ano}/estados.json.

Sai da própria malha municipal do ano (TopoJSON): o contorno de um estado são os arcos usados uma vez só pelos municípios
dele (os arcos entre dois municípios do mesmo estado aparecem duas vezes). Assim a UF é a da época (na malha histórica o
MS está no MT e o TO em GO) e as divisas batem com o mapa por município.
Saída: GeoJSON, um MultiPolygon por UF (anéis externos e buracos juntos: o site desenha com fill-rule evenodd).
Uso: python3 scripts/estados-malha.py [--ano 1950]
"""
import argparse, collections, glob, json, os

NOMES = {'ac': 'Acre', 'al': 'Alagoas', 'am': 'Amazonas', 'ap': 'Amapá', 'ba': 'Bahia', 'ce': 'Ceará', 'df': 'Distrito Federal',
         'es': 'Espírito Santo', 'go': 'Goiás', 'ma': 'Maranhão', 'mg': 'Minas Gerais', 'ms': 'Mato Grosso do Sul', 'mt': 'Mato Grosso',
         'pa': 'Pará', 'pb': 'Paraíba', 'pe': 'Pernambuco', 'pi': 'Piauí', 'pr': 'Paraná', 'rj': 'Rio de Janeiro',
         'rn': 'Rio Grande do Norte', 'ro': 'Rondônia', 'rr': 'Roraima', 'rs': 'Rio Grande do Sul', 'sc': 'Santa Catarina',
         'se': 'Sergipe', 'sp': 'São Paulo', 'to': 'Tocantins'}


def estados(topo):
    t = topo.get('transform')
    # arcos em inteiros (quantizados) para casar as pontas sem erro de arredondamento
    arcos = []
    for a in topo['arcs']:
        if t:
            x = y = 0; pts = []
            for dx, dy in a: x += dx; y += dy; pts.append((x, y))
        else: pts = [tuple(p) for p in a]
        arcos.append(pts)
    sx, sy = t['scale'] if t else (1, 1)
    tx, ty = t['translate'] if t else (0, 0)
    geo = lambda p: [round(p[0] * sx + tx, 5), round(p[1] * sy + ty, 5)]

    uso = collections.defaultdict(collections.Counter)  # uf → arco → vezes
    ocorr = collections.defaultdict(list)  # uf → arcos com sentido, na ordem dos anéis
    for g in topo['objects']['municipios']['geometries']:
        uf = (g.get('properties') or {}).get('uf')
        if not uf or g.get('type') not in ('Polygon', 'MultiPolygon'): continue
        polis = g['arcs'] if g['type'] == 'MultiPolygon' else [g['arcs']]
        for pol in polis:
            for anel in pol:
                for i in anel:
                    uso[uf][i if i >= 0 else ~i] += 1
                    ocorr[uf].append(i)
    saida = []
    for uf in sorted(uso):
        # arcos do contorno: usados uma vez só, no sentido em que o município os usa
        borda = [i for i in ocorr[uf] if uso[uf][i if i >= 0 else ~i] == 1]
        segs = [arcos[i] if i >= 0 else arcos[~i][::-1] for i in borda]
        porInicio = collections.defaultdict(list)
        for k, s in enumerate(segs): porInicio[s[0]].append(k)
        usado = [False] * len(segs)
        aneis = []
        for k in range(len(segs)):
            if usado[k]: continue
            anel = list(segs[k]); usado[k] = True
            while anel[-1] != anel[0]:
                prox = next((j for j in porInicio[anel[-1]] if not usado[j]), None)
                if prox is None: break  # anel aberto (não deveria acontecer): fica como está
                usado[prox] = True
                anel += segs[prox][1:]
            if len(anel) >= 4: aneis.append([geo(p) for p in anel])
        saida.append({'type': 'Feature', 'id': uf, 'properties': {'n': NOMES.get(uf, uf.upper())},
                      'geometry': {'type': 'MultiPolygon', 'coordinates': [[a] for a in aneis]}})
    return {'type': 'FeatureCollection', 'bbox': topo.get('bbox'), 'features': saida}


a = argparse.ArgumentParser(); a.add_argument('--ano'); a = a.parse_args()
arqs = [f'public/geo/{a.ano}/br.json'] if a.ano else ['public/geo/br.json'] + sorted(glob.glob('public/geo/[0-9]*/br.json'))
for arq in arqs:
    if not os.path.exists(arq): continue
    fc = estados(json.load(open(arq, encoding='utf8')))
    dest = os.path.join(os.path.dirname(arq), 'estados.json')
    with open(dest, 'w', encoding='utf8') as f: json.dump(fc, f, ensure_ascii=False, separators=(',', ':'))
    print(dest, len(fc['features']), 'UFs,', sum(len(x['geometry']['coordinates']) for x in fc['features']), 'anéis,',
          os.path.getsize(dest) // 1024, 'KB')
