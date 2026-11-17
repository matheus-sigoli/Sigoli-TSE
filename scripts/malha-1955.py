#!/usr/bin/env python3
"""
Sigoli.TSE — malha municipal de 1955 do acervo (Malhas/shp/1955/MALHA1955FINAL: policônica SIRGAS 2000, meridiano
central -54°, em metros; um polígono por município com o código do IBGE de hoje do município-sede no campo `codigo`)
→ GeoJSON por UF em data/malhas-historicas/BR1955/{uf}.geojson.gz, no mesmo formato de scripts/malha-historica.py.
O código 3099901 é o antigo Distrito Federal (cidade do Rio de Janeiro): vai para o RJ como 3304557.

Uso: python3 scripts/malha-1955.py --shp "<pasta>/MALHA1955FINAL"
"""
import argparse, collections, gzip, json, math, os, struct, sys
sys.path.insert(0, os.path.dirname(__file__))

a = argparse.ArgumentParser(); a.add_argument('--shp', required=True); a.add_argument('--grade', type=float, default=0.0008)
a.add_argument('--saida', default='BR1955'); a = a.parse_args()

# --- policônica (Snyder, "Map Projections", 1987, eq. 18-17 a 18-21), elipsoide GRS80
A_ = 6378137.0; F = 1 / 298.257222101; E2 = 2 * F - F * F; E4, E6 = E2 * E2, E2 ** 3; LON0 = math.radians(-54.0)
C0, C2, C4, C6 = 1 - E2 / 4 - 3 * E4 / 64 - 5 * E6 / 256, 3 * E2 / 8 + 3 * E4 / 32 + 45 * E6 / 1024, 15 * E4 / 256 + 45 * E6 / 1024, 35 * E6 / 3072
Mn = lambda p: C0 * p - C2 * math.sin(2 * p) + C4 * math.sin(4 * p) - C6 * math.sin(6 * p)  # M/a
Mn1 = lambda p: C0 - 2 * C2 * math.cos(2 * p) + 4 * C4 * math.cos(4 * p) - 6 * C6 * math.cos(6 * p)
def inv(x, y):
    if abs(y) < 1e-6: return math.degrees(x / A_ + LON0), 0.0
    AA = y / A_; B = (x / A_) ** 2 + AA * AA; phi = AA
    for _ in range(30):
        s2 = math.sin(2 * phi); C = math.sqrt(1 - E2 * math.sin(phi) ** 2) * math.tan(phi); m, m1 = Mn(phi), Mn1(phi)
        d = (AA * (C * m + 1) - m - 0.5 * (m * m + B) * C) / (E2 * s2 * (m * m + B - 2 * AA * m) / (4 * C) + (AA - m) * (C * m1 - 2 / s2) - m1)
        phi -= d
        if abs(d) < 1e-12: break
    C = math.sqrt(1 - E2 * math.sin(phi) ** 2) * math.tan(phi)
    return math.degrees(math.asin(max(-1, min(1, x * C / A_))) / math.sin(phi) + LON0), math.degrees(phi)

def ler_dbf(p):
    b = open(p, 'rb').read(); n, hl, rl = struct.unpack('<IHH', b[4:12]); flds = []; o = 32
    while b[o] != 0x0D: flds.append((b[o:o + 11].split(b'\0')[0].decode('latin1'), b[o + 16])); o += 32
    out = []
    for i in range(n):
        r = b[hl + i * rl: hl + (i + 1) * rl]; p0 = 1; d = {}
        for nome, l in flds: d[nome] = r[p0:p0 + l].decode('utf8', 'replace').strip(); p0 += l
        out.append(d)
    return out

def ler_shp(p):
    b = open(p, 'rb').read(); o = 100; out = []
    while o < len(b):
        _, tam = struct.unpack('>ii', b[o:o + 8]); c = b[o + 8: o + 8 + tam * 2]; o += 8 + tam * 2
        if struct.unpack('<i', c[:4])[0] == 0: out.append([]); continue
        np_, npts = struct.unpack('<ii', c[36:44])
        partes = list(struct.unpack(f'<{np_}i', c[44:44 + 4 * np_])) + [npts]
        pts = struct.unpack(f'<{2 * npts}d', c[44 + 4 * np_: 44 + 4 * np_ + 16 * npts])
        out.append([[(pts[2 * k], pts[2 * k + 1]) for k in range(partes[j], partes[j + 1])] for j in range(np_)])
    return out

def area(r): return sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(r, r[1:] + r[:1])) / 2

UF = {'11': 'ro', '12': 'ac', '13': 'am', '14': 'rr', '15': 'pa', '16': 'ap', '17': 'go', '21': 'ma', '22': 'pi', '23': 'ce', '24': 'rn',
      '25': 'pb', '26': 'pe', '27': 'al', '28': 'se', '29': 'ba', '31': 'mg', '32': 'es', '33': 'rj', '35': 'sp', '41': 'pr', '42': 'sc',
      '43': 'rs', '50': 'mt', '51': 'mt', '52': 'go', '53': 'go'}
hoje = {m['ibge']: m['nome'] for m in json.load(open('public/data/2026/municipios.json', encoding='utf8'))}
G = a.grade; porUf = collections.defaultdict(dict); fora = []
for r, aneis in zip(ler_dbf(a.shp + '.dbf'), ler_shp(a.shp + '.shp')):
    cod = r['codigo']
    if cod == '3099901': cod = '3304557'
    if not aneis or cod[:2] not in UF: fora.append(r); continue
    geo = []
    for anel in aneis:
        pts = []
        for x, y in anel:
            lon, lat = inv(x, y); p = (round(round(lon / G) * G, 6), round(round(lat / G) * G, 6))
            if not pts or pts[-1] != p: pts.append(p)
        if len(pts) >= 4: geo.append(pts)
    polys = []
    for anel in geo:
        if area(anel) < 0 or not polys: polys.append([anel])
        else: polys[-1].append(anel)
    if not polys: continue
    uf = UF[cod[:2]]
    f = porUf[uf].get(cod)
    if f: f['geometry']['coordinates'] += [[[list(p) for p in anel] for anel in pol] for pol in polys]; continue
    nome = 'Distrito Federal (Rio de Janeiro)' if r['codigo'] == '3099901' else r['nome']
    porUf[uf][cod] = {'type': 'Feature', 'id': cod, 'properties': {'n': nome, 'h': hoje.get(cod, nome)},
                      'geometry': {'type': 'MultiPolygon', 'coordinates': [[[list(p) for p in anel] for anel in pol] for pol in polys]}}
saida = f'data/malhas-historicas/{a.saida}'; os.makedirs(saida, exist_ok=True)
for uf, fs in porUf.items():
    with gzip.open(f'{saida}/{uf}.geojson.gz', 'wt', compresslevel=9) as g:
        json.dump({'type': 'FeatureCollection', 'features': list(fs.values())}, g, separators=(',', ':'))
print(f'{sum(len(v) for v in porUf.values())} municípios em {len(porUf)} UFs; sem UF/geometria: {len(fora)}', [f['codigo'] + ' ' + f['nome'] for f in fora][:10])
print('códigos que não existem hoje:', [(uf, c) for uf, fs in porUf.items() for c in fs if c not in hoje][:20])
