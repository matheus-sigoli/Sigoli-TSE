#!/usr/bin/env python3
"""
Malhas municipais históricas do acervo (Malhas/shp/Malha Municipal/05_malha_municipal_{ano}.zip: 1872, 1900, 1911, 1920,
1933, 1940…) → data/malhas-historicas/BR{ano}/{uf}.geojson.gz, no mesmo formato das malhas do IBGE de
scripts/malha-historica.py (a base de scripts/malha-historica.mjs). Servem às eleições de antes da malha de 1950
(1835: a de 1872; 1947: a de 1940).

Os shapefiles vêm em policônica (SIRGAS 2000, meridiano central −54°, malha_estadual/shp.py) e já trazem o código do IBGE
(o do município de hoje que é a sede) e o nome da época. UF pelo código (o Município Neutro / Distrito Federal, 3099901, é a cidade do Rio, 3304557; o TO fica em GO, como nas malhas do IBGE; o MS
fica à parte e o malha-historica.mjs o junta ao MT). Coordenadas na grade de 0,0008° (~90 m), para a borda comum de dois
vizinhos ficar idêntica.
Uso: python3 scripts/extrair/malha-municipal-acervo.py --zip "<acervo>/Malhas/shp/Malha Municipal/05_malha_municipal_1940.zip" [--zip …]
"""
import argparse, collections, glob, gzip, json, os, re, sys, tempfile, zipfile
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'malha_estadual'))
from shp import dbf, shp, inv

UF = {'11': 'ro', '12': 'ac', '13': 'am', '14': 'rr', '15': 'pa', '16': 'ap', '17': 'go', '21': 'ma', '22': 'pi', '23': 'ce',
      '24': 'rn', '25': 'pb', '26': 'pe', '27': 'al', '28': 'se', '29': 'ba', '31': 'mg', '32': 'es', '33': 'rj', '35': 'sp',
      '41': 'pr', '42': 'sc', '43': 'rs', '50': 'ms', '51': 'mt', '52': 'go', '53': 'df'}
G = 0.0008
hoje = {m['ibge']: m['nome'] for m in json.load(open('public/data/2026/municipios.json', encoding='utf8'))}

def area(r): return sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(r, r[1:] + r[:1])) / 2

a = argparse.ArgumentParser(); a.add_argument('--zip', action='append', required=True); a = a.parse_args()
for z in a.zip:
    ano = re.search(r'(\d{4})', os.path.basename(z)).group(1)
    tmp = tempfile.mkdtemp(); zipfile.ZipFile(z).extractall(tmp)
    base = glob.glob(os.path.join(tmp, '**', '*.shp'), recursive=True)[0][:-4]
    porUf = collections.defaultdict(dict); sem = 0
    for reg, aneis in zip(dbf(base + '.dbf'), shp(base + '.shp')):
        cod = re.sub(r'\D', '', reg.get('codigo', ''))[:7]
        cod = {'3099901': '3304557'}.get(cod, cod)  # Município Neutro / Distrito Federal = a cidade do Rio de hoje
        if len(cod) != 7 or cod[:2] not in UF or not aneis: sem += 1; continue
        geo = []
        for anel in aneis:
            pts = []
            for x, y in anel:
                lon, lat = inv(x, y); p = [round(round(lon / G) * G, 6), round(round(lat / G) * G, 6)]
                if not pts or pts[-1] != p: pts.append(p)
            if len(pts) >= 4: geo.append(pts)
        polys = []
        for anel in geo:  # horário = externo; anti-horário = buraco do anterior
            if area(anel) < 0 or not polys: polys.append([anel])
            else: polys[-1].append(anel)
        if not polys: continue
        uf = UF[cod[:2]]
        f = porUf[uf].get(cod)
        if f: f['geometry']['coordinates'] += polys; continue
        nome = re.sub(r'\s+', ' ', reg.get('nome', '')).strip()
        porUf[uf][cod] = {'type': 'Feature', 'id': cod, 'properties': {'n': nome, 'h': hoje.get(cod, nome)},
                          'geometry': {'type': 'MultiPolygon', 'coordinates': polys}}
    saida = f'data/malhas-historicas/BR{ano}'
    os.makedirs(saida, exist_ok=True)
    for uf, fs in porUf.items():
        with gzip.open(f'{saida}/{uf}.geojson.gz', 'wt', compresslevel=9) as g:
            json.dump({'type': 'FeatureCollection', 'features': list(fs.values())}, g, separators=(',', ':'))
    print(f'BR{ano}: {sum(len(v) for v in porUf.values())} municípios em {len(porUf)} UFs, {sem} registros sem código')
