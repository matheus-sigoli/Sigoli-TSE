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


# ---- divisão política de cada época (sobre a malha municipal histórica de 1950, a mais antiga que há)
RIO = '3304557'
TERRITORIOS_1943 = {  # Decreto-Lei 6.550/1944 (municípios de cada território federal)
    'pp': ['5006903', '5002100', '5006606', '5003702', '5005608', '5005806', '5005400'],  # Ponta Porã
    'ig': ['4108304', '4105706', '4113304', '4114401', '4204202'],  # Iguaçu (Iguaçu = Laranjeiras do Sul; Xapecó = Chapecó)
}
NOMES_EPOCA = {'df': 'Distrito Federal', 'gb': 'Guanabara', 'pp': 'Território de Ponta Porã', 'ig': 'Território do Iguaçu',
               'fn': 'Território de Fernando de Noronha'}


def regras(ano):
    """(município → UF da época; None tira o município do mapa) e nomes, para os anos antes de 1960 e a Guanabara"""
    troca, nomes = {}, {}
    if ano < 1960: troca[RIO] = 'df'; nomes['df'] = 'Município Neutro (Corte)' if ano < 1889 else 'Distrito Federal'
    elif ano <= 1974: troca[RIO] = 'gb'; nomes['gb'] = 'Guanabara'
    if ano < 1943:
        # antes dos territórios de 1943: Guaporé era do AM (Porto Velho) e do MT (Guajará-Mirim), Rio Branco do AM, Amapá do PA
        troca.update({'1100205': 'am', '1100106': 'mt', '1400100': 'am', '1400209': 'am',
                      '1600105': 'pa', '1600303': 'pa', '1600402': 'pa', '1600501': 'pa'})
        if ano < 1904: troca.update({k: None for k in ('1200104', '1200203', '1200302', '1200401', '1200500', '1200609', '1200708')})  # o Acre era da Bolívia
        else: nomes['ac'] = 'Território do Acre'
    elif ano < 1947:
        for t, ms in TERRITORIOS_1943.items():
            for m in ms: troca[m] = t
        nomes.update({'ac': 'Território do Acre', 'ap': 'Território do Amapá', 'ro': 'Território do Guaporé', 'rr': 'Território do Rio Branco',
                      'pp': NOMES_EPOCA['pp'], 'ig': NOMES_EPOCA['ig']})
    elif ano < 1962:
        nomes.update({'ac': 'Território do Acre', 'ap': 'Território do Amapá', 'ro': 'Território do Guaporé' if ano < 1956 else 'Território de Rondônia',
                      'rr': 'Território do Rio Branco'})
    return troca, nomes


def estados(topo, troca=None, nomes=None):
    troca, nomes = troca or {}, nomes or {}
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
        if str(g.get('id')) in troca: uf = troca[str(g.get('id'))]
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
        saida.append({'type': 'Feature', 'id': uf, 'properties': {'n': nomes.get(uf) or NOMES.get(uf, uf.upper())},
                      'geometry': {'type': 'MultiPolygon', 'coordinates': [[a] for a in aneis]}})
    return {'type': 'FeatureCollection', 'bbox': topo.get('bbox'), 'features': saida}


a = argparse.ArgumentParser(); a.add_argument('--ano'); a.add_argument('--anos', help='anos só com resultado por estado (malha de 1950), ex.: 1886,1894') ; a = a.parse_args()
alvos = []  # (malha municipal, ano, destino)
if a.anos:
    for x in a.anos.split(','): alvos.append(('public/geo/1950/br.json', int(x), f'public/geo/{x}/estados.json'))
else:
    arqs = [f'public/geo/{a.ano}/br.json'] if a.ano else ['public/geo/br.json'] + sorted(glob.glob('public/geo/[0-9]*/br.json'))
    for arq in arqs:
        d = os.path.basename(os.path.dirname(arq))
        if d == '2024' or not os.path.exists(arq): continue
        alvos.append((arq, int(d) if d.isdigit() else 2026, os.path.join(os.path.dirname(arq), 'estados.json')))
def historica(ano):
    """malha estadual da época (data/malhas-estaduais/, scripts/extrair/malha-estadual.py), até 1998"""
    for lim, f in ((1889, '1872'), (1904, '1900'), (1919, '1911'), (1945, '1920'), (1946, '1945'), (1960, '1950'), (1970, '1960'),
                   (1978, '1970'), (1989, '1980'), (2002, '1991')):
        if ano < lim:
            p = f'data/malhas-estaduais/{f}.json'
            return p if os.path.exists(p) else None
    return None


for arq, ano, dest in alvos:
    h = historica(ano)
    if h:
        fc = json.load(open(h, encoding='utf8'))
        for ft in fc['features']:
            if ft['id'] == 'ro' and 1956 <= ano < 1982: ft['properties']['n'] = 'Território de Rondônia'
            if ft['id'] == 'rr' and 1962 <= ano < 1990: ft['properties']['n'] = 'Território de Roraima'
    else:
        fc = estados(json.load(open(arq, encoding='utf8')), *regras(ano))
    os.makedirs(os.path.dirname(dest), exist_ok=True)
    with open(dest, 'w', encoding='utf8') as f: json.dump(fc, f, ensure_ascii=False, separators=(',', ':'))
    # o site acha a malha dos estados do ano pela lista de malhas trocadas da pasta
    lista = os.path.join(os.path.dirname(dest), 'malhas.json')
    l = json.load(open(lista)) if os.path.exists(lista) else []
    if 'estados.json' not in l: json.dump(l + ['estados.json'], open(lista, 'w'))
    print(dest, len(fc['features']), 'UFs,', sum(len(x['geometry']['coordinates']) for x in fc['features']), 'anéis,',
          os.path.getsize(dest) // 1024, 'KB')
