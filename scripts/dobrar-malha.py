#!/usr/bin/env python3
"""
Sigoli.TSE — resultado por município de hoje → município da época, para os anos cuja malha é de depois da eleição
(1835 usa a malha de 1872 e 1947 a de 1940, do acervo, scripts/extrair/malha-municipal-acervo.py; em 1960, municípios instalados logo depois da eleição). Planilhas do acervo às vezes dão o voto já repartido pelos municípios de hoje
(ex.: Osasco em 1947, que era distrito de São Paulo); aqui cada município que não está na malha do ano soma no
polígono da malha que contém o seu ponto interior (pela malha do IBGE de 1985). Rodar depois de tre.py/oficial.py e
antes de resumo-br.mjs/pintam.mjs. Uso: python3 scripts/dobrar-malha.py [--ano 1947]
"""
import argparse, glob, gzip, json, os
MALHA = {1835: 'BR1872', 1947: 'BR1940', 1960: 'BR1960'}
a = argparse.ArgumentParser(); a.add_argument('--ano', type=int); a = a.parse_args()
H = 'data/malhas-historicas'
CODIGO_UF = {'11': 'ro', '12': 'ac', '13': 'am', '14': 'rr', '15': 'pa', '16': 'ap', '17': 'to', '21': 'ma', '22': 'pi', '23': 'ce',
             '24': 'rn', '25': 'pb', '26': 'pe', '27': 'al', '28': 'se', '29': 'ba', '31': 'mg', '32': 'es', '33': 'rj', '35': 'sp',
             '41': 'pr', '42': 'sc', '43': 'rs', '50': 'ms', '51': 'mt', '52': 'go', '53': 'df'}

def aneis(geom):
    c = geom['coordinates']
    return [r for p in (c if geom['type'] == 'MultiPolygon' else [c]) for r in p]

def dentro(pt, rings):
    x, y = pt; ins = False
    for r in rings:
        for i in range(len(r)):
            x1, y1 = r[i - 1][:2]; x2, y2 = r[i][:2]
            if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1: ins = not ins
    return ins

def ponto(rings):  # ponto interior: meio do maior trecho horizontal na latitude do centro da caixa
    ys = [p[1] for r in rings for p in r]; y = (min(ys) + max(ys)) / 2 + 1e-7
    xs = sorted(r[i - 1][0] + (r[i][0] - r[i - 1][0]) * (y - r[i - 1][1]) / (r[i][1] - r[i - 1][1])
                for r in rings for i in range(len(r)) if (r[i - 1][1] > y) != (r[i][1] > y))
    seg = max(((xs[i + 1] - xs[i], (xs[i] + xs[i + 1]) / 2) for i in range(0, len(xs) - 1, 2)), default=(0, xs[0] if xs else 0))
    return seg[1], y

def feats(m, uf):  # MT tinha o MS e GO tinha o TO
    out = []
    for u in [uf] + {'mt': ['ms'], 'go': ['to']}.get(uf, []):
        p = f'{H}/{m}/{u}.geojson.gz'
        if os.path.exists(p): out += json.load(gzip.open(p))['features']
    return out

for ano, m in MALHA.items():
    if a.ano and a.ano != ano: continue
    for arq in sorted(glob.glob(f'public/data/{ano}/*/*/[a-z][a-z].json')):
        uf = os.path.basename(arq)[:2]
        if uf in ('br', 'zz'): continue
        d = json.load(open(arq, encoding='utf8'))
        alvo = feats(m, uf); ids = {str(f['id']) for f in alvo}
        fora = [k for k in d['mun'] if k not in ids]
        if not fora or not alvo: continue
        # (pela UF do código: o arquivo pode ser o da UF da época, ex.: Macapá no Pará em 1835)
        hoje = {str(f['id']): aneis(f['geometry']) for u in {uf} | {CODIGO_UF.get(k[:2], uf) for k in fora} for f in feats('BR1985', u)}
        movidos = []
        for k in fora:
            if k not in hoje: print(f'  ⚠ {arq}: {k} sem polígono de 1985'); continue
            pt = ponto(hoje[k])
            dest = next((str(f['id']) for f in alvo if dentro(pt, aneis(f['geometry']))), None)
            if not dest:  # fora da UF na malha da época (ex.: Mantena, na região contestada com o ES): o polígono mais perto
                perto = lambda f: min((p[0] - pt[0]) ** 2 + (p[1] - pt[1]) ** 2 for r in aneis(f['geometry']) for p in r[::5])
                dest = str(min(alvo, key=perto)['id'])
                print(f'  ⚠ {arq}: {k} fora da malha {m}, vai para o polígono mais perto ({dest})')
            a1, b1 = d['mun'].pop(k), d['mun'].setdefault(dest, {'t': [0] * 6, 'c': [0] * len(d['cands'])})
            b1['t'] = [(x or 0) + (y or 0) for x, y in zip(b1['t'], a1['t'])]
            b1['c'] = [x + y for x, y in zip(b1['c'] + [0] * (len(a1['c']) - len(b1['c'])), a1['c'] + [0] * (len(b1['c']) - len(a1['c'])))]
            movidos.append(f'{k}→{dest}')
        if d.get('oficial'): d['oficial']['municipios'] = len(d['mun'])
        json.dump(d, open(arq, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
        print(f'{arq}: {len(movidos)} município(s) de hoje somados no da época · ' + ' '.join(movidos))
