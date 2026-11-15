#!/usr/bin/env python3
"""
Sigoli.TSE — malhas municipais históricas do IBGE (BR1940 … BR1985, "Evolução da divisão territorial") → GeoJSON por
UF em data/malhas-historicas/{ano}/{uf}.geojson.gz, com o código do IBGE de hoje no id (o do município-sede).

Os shapefiles (shp/malha brasil por municipio/BR{ano}/ARCINFO) vêm em Albers SAD69 (em km) e com o código do
município em número de ponto flutuante (perde dígitos): o município é achado pelo nome dentro da UF e, quando o
nome mudou, pelo centro dos municípios de hoje que caem dentro dele (vale o que tem dado da eleição do ano ou, sem
isso, o de nome mais parecido).
Coordenadas arredondadas na grade de 0,0008° (~90 m): a borda comum de dois vizinhos continua idêntica e a topologia
(e a simplificação) é feita depois, no workflow (scripts/malha-historica.mjs).

Uso: python3 scripts/malha-historica.py --shp "<pasta>/BR1980/ARCINFO/BR1980" --ano 1982 --saida BR1980
(--ano: eleição cujos dados ajudam a achar o município; a malha vale para os anos de data/malhas-historicas/anos.json)
"""
import argparse, collections, difflib, json, math, os, re, struct, unicodedata

a = argparse.ArgumentParser(); a.add_argument('--shp'); a.add_argument('--ano', type=int); a.add_argument('--grade', type=float, default=0.0008); a.add_argument('--saida')
a = a.parse_args()

# --- Albers SAD69 (GRS67 truncado), unidade km (do .prj)
A = 6378160.0 / 1000; F = 1 / 298.25; E2 = 2 * F - F * F; E = math.sqrt(E2)
LAT0, LAT1, LAT2, LON0 = map(math.radians, (5.0, 1.0, -14.0, -59.0))
m = lambda p: math.cos(p) / math.sqrt(1 - E2 * math.sin(p) ** 2)
q = lambda p: (1 - E2) * (math.sin(p) / (1 - E2 * math.sin(p) ** 2) - (1 / (2 * E)) * math.log((1 - E * math.sin(p)) / (1 + E * math.sin(p))))
M1, M2, Q0, Q1, Q2 = m(LAT1), m(LAT2), q(LAT0), q(LAT1), q(LAT2)
N = (M1 ** 2 - M2 ** 2) / (Q2 - Q1); C = M1 ** 2 + N * Q1; RHO0 = A * math.sqrt(C - N * Q0) / N
def inv(x, y):
    dy = RHO0 - y
    rho = math.copysign(math.hypot(x, dy), N)
    th = math.atan2(x, dy) if N > 0 else math.atan2(-x, -dy)
    qq = (C - (rho * N / A) ** 2) / N
    phi = math.asin(max(-1, min(1, qq / 2)))
    for _ in range(15):
        s = math.sin(phi)
        d = (1 - E2 * s * s) ** 2 / (2 * math.cos(phi)) * (qq / (1 - E2) - s / (1 - E2 * s * s) + 1 / (2 * E) * math.log((1 - E * s) / (1 + E * s)))
        phi += d
        if abs(d) < 1e-12: break
    return math.degrees(LON0 + th / N), math.degrees(phi)

def ler_dbf(p):
    b = open(p, 'rb').read(); n, hl, rl = struct.unpack('<IHH', b[4:12]); flds = []; o = 32
    while b[o] != 0x0D:
        flds.append((b[o:o + 11].split(b'\0')[0].decode('latin1'), b[o + 16])); o += 32
    out = []
    for i in range(n):
        r = b[hl + i * rl: hl + (i + 1) * rl]; p0 = 1; d = {}
        for nome, l in flds: d[nome] = r[p0:p0 + l].decode('latin1').strip(); p0 += l
        out.append(d)
    return out

def ler_shp(p):
    b = open(p, 'rb').read(); o = 100; out = []
    while o < len(b):
        _, tam = struct.unpack('>ii', b[o:o + 8]); conteudo = b[o + 8: o + 8 + tam * 2]; o += 8 + tam * 2
        tipo = struct.unpack('<i', conteudo[:4])[0]
        if tipo == 0: out.append([]); continue
        np_, npts = struct.unpack('<ii', conteudo[36:44])
        partes = list(struct.unpack(f'<{np_}i', conteudo[44:44 + 4 * np_])) + [npts]
        pts = struct.unpack(f'<{2 * npts}d', conteudo[44 + 4 * np_: 44 + 4 * np_ + 16 * npts])
        aneis = [[(pts[2 * k], pts[2 * k + 1]) for k in range(partes[j], partes[j + 1])] for j in range(np_)]
        out.append(aneis)
    return out

def area(r): return sum(x0 * y1 - x1 * y0 for (x0, y0), (x1, y1) in zip(r, r[1:] + r[:1])) / 2
def chave(s):
    s = ''.join(c for c in unicodedata.normalize('NFD', str(s)) if unicodedata.category(c) != 'Mn').upper()
    return re.sub(r'[^A-Z0-9]', '', s)
def dentro(pt, aneis):
    x, y = pt; c = False
    for r in aneis:
        for (x0, y0), (x1, y1) in zip(r, r[1:] + r[:1]):
            if (y0 > y) != (y1 > y) and x < (x1 - x0) * (y - y0) / (y1 - y0) + x0: c = not c
    return c

SIGLA = {'RONDONIA': 'ro', 'ACRE': 'ac', 'AMAZONAS': 'am', 'RORAIMA': 'rr', 'PARA': 'pa', 'AMAPA': 'ap', 'TOCANTINS': 'to', 'MARANHAO': 'ma',
         'PIAUI': 'pi', 'CEARA': 'ce', 'RIOGRANDEDONORTE': 'rn', 'PARAIBA': 'pb', 'PERNAMBUCO': 'pe', 'ALAGOAS': 'al', 'SERGIPE': 'se', 'BAHIA': 'ba',
         'MINASGERAIS': 'mg', 'ESPIRITOSANTO': 'es', 'RIODEJANEIRO': 'rj', 'SAOPAULO': 'sp', 'PARANA': 'pr', 'SANTACATARINA': 'sc',
         'RIOGRANDEDOSUL': 'rs', 'MATOGROSSODOSUL': 'ms', 'MATOGROSSO': 'mt', 'GOIAS': 'go', 'DISTRITOFEDERAL': 'df'}
rows, shapes = ler_dbf(a.shp + '.dbf'), ler_shp(a.shp + '.shp')
assert len(rows) == len(shapes)
hoje = [m for m in json.load(open('public/data/2026/municipios.json', encoding='utf8')) if m['uf'] != 'zz']
# centro de cada município de hoje (da malha do site): ponto para achar em qual município histórico ele cai
centros = {}
for uf in {m['uf'] for m in hoje}:
    t = json.load(open(f'public/geo/uf/{uf}.json')); tr = t.get('transform')
    for g in t['objects']['municipios']['geometries']:
        arcs = g['arcs'] if g['type'] == 'MultiPolygon' else [g['arcs']]
        anel = max((p[0] for p in arcs), key=lambda r: sum(len(t['arcs'][~i if i < 0 else i]) for i in r))
        xs, ys = [], []
        for i in anel:
            arc = t['arcs'][~i if i < 0 else i]; x = y = 0
            for dx, dy in arc:
                x += dx; y += dy
                if tr: xs.append(x * tr['scale'][0] + tr['translate'][0]); ys.append(y * tr['scale'][1] + tr['translate'][1])
                else: xs.append(dx); ys.append(dy)
        centros[str(g['id'])] = (sum(xs) / len(xs), sum(ys) / len(ys))
dados = set()
for raiz, _, arqs in (x for ano in range(1945, a.ano + 5) for x in os.walk(f'public/data/{ano}')):  # municípios com dado até pouco depois da malha
    for f in arqs:
        if re.fullmatch(r'[a-z]{2}\.json', f) and f not in ('br.json', 'zz.json'):
            try: dados |= set(json.load(open(os.path.join(raiz, f))).get('mun', {}))
            except Exception: pass

G = a.grade
porUf = collections.defaultdict(list); relatorio = collections.Counter(); sem = []
PEQ = {'De', 'Da', 'Do', 'Das', 'Dos', 'E', "D'"}
def titulo(n):
    return ' '.join(w.lower() if i and w in PEQ else w for i, w in enumerate(n.title().split()))
poligonos = []
for r, aneis in zip(rows, shapes):
    if not aneis: continue
    ufn = r.get('NOMEUF', '').upper()
    uf = SIGLA.get(chave(ufn), ufn.lower()[:2])
    if uf == 'to': uf = 'go'
    geo = []
    for anel in aneis:
        pts = []
        for x, y in anel:
            lon, lat = inv(x, y); p = (round(round(lon / G) * G, 6), round(round(lat / G) * G, 6))
            if not pts or pts[-1] != p: pts.append(p)
        if len(pts) >= 4: geo.append(pts)
    if not geo: continue
    # anéis: horário = externo (padrão do shapefile); anti-horário = buraco do anterior
    polys = []
    for anel in geo:
        if area(anel) < 0 or not polys: polys.append([anel])
        else: polys[-1].append(anel)
    poligonos.append((uf, r.get('NOMEMUN', ''), polys))
# 1ª passada: nome igual ao de hoje (esses códigos ficam tomados)
tomados = collections.defaultdict(set)
for uf, nome, polys in poligonos:
    ufs_busca = ['go', 'to'] if uf == 'go' else [uf]
    if sum(1 for m in hoje if m['uf'] in ufs_busca and chave(m['nome']) == chave(nome)) == 1:
        tomados[uf].add(next(m['ibge'] for m in hoje if m['uf'] in ufs_busca and chave(m['nome']) == chave(nome)))
for uf, nome, polys in poligonos:
    ufs_busca = ['go', 'to'] if uf == 'go' else [uf]
    cands = [m for m in hoje if m['uf'] in ufs_busca]
    k = chave(nome)
    # 1) nome igual  2) município de hoje cujo centro cai dentro, não tomado por outro polígono e com dado
    # 3) o único não tomado que cai dentro  4) o de nome mais parecido dentre os que caem dentro
    dentroDele = [m for m in cands if m['ibge'] in centros and dentro(centros[m['ibge']], [p[0] for p in polys])]
    livres = [m for m in dentroDele if m['ibge'] not in tomados[uf]]
    iguais = [m for m in cands if chave(m['nome']) == k]
    escolha = None
    if len(iguais) == 1: escolha = iguais[0]; relatorio['nome'] += 1
    elif len(iguais) > 1:
        dd = [m for m in iguais if m in dentroDele]; escolha = (dd or iguais)[0]; relatorio['nome'] += 1
    else:
        comDado = [m for m in livres if m['ibge'] in dados]
        if len(comDado) == 1: escolha = comDado[0]; relatorio['dado'] += 1
        elif len(livres) == 1: escolha = livres[0]; relatorio['centro'] += 1
        elif livres or dentroDele:
            escolha = max(comDado or livres or dentroDele, key=lambda m: difflib.SequenceMatcher(None, chave(m['nome']), k).ratio()); relatorio['parecido'] += 1
            sem.append(f'{uf} {nome} → {escolha["nome"]} (aproximado)')
        else:
            mm = difflib.get_close_matches(k, [chave(m['nome']) for m in cands], n=1, cutoff=0.75)
            if mm: escolha = next(m for m in cands if chave(m['nome']) == mm[0]); relatorio['parecido'] += 1; sem.append(f'{uf} {nome} → {escolha["nome"]} (só nome)')
            else: relatorio['sem'] += 1; sem.append(f'{uf} {nome}: sem correspondência'); continue
    if escolha['ibge'] not in tomados[uf]: tomados[uf].add(escolha['ibge'])
    # nome da época quando era outro (ex.: Augusto Severo, hoje Campo Grande - RN)
    n = escolha['nome'] if chave(escolha['nome']) == k else titulo(nome)
    porUf[uf].append({'type': 'Feature', 'id': escolha['ibge'], 'properties': {'n': n, 'h': escolha['nome']},
                      'geometry': {'type': 'MultiPolygon', 'coordinates': [[[list(p) for p in anel] for anel in pol] for pol in polys]}})

saida = f'data/malhas-historicas/{a.saida or a.ano}'
os.makedirs(saida, exist_ok=True)
dup = 0
for uf, fs in porUf.items():
    # dois polígonos no mesmo código (ilhas registradas à parte, ou nome repetido): junta num MultiPolygon
    porId = {}
    for f in fs:
        if f['id'] in porId: porId[f['id']]['geometry']['coordinates'] += f['geometry']['coordinates']; dup += 1
        else: porId[f['id']] = f
    import gzip
    with gzip.open(f'{saida}/{uf}.geojson.gz', 'wt', compresslevel=9) as g: json.dump({'type': 'FeatureCollection', 'features': list(porId.values())}, g, separators=(',', ':'))
print(f'{a.ano}: {sum(len(v) for v in porUf.values())} polígonos em {len(porUf)} UFs · por nome {relatorio["nome"]}, por dado {relatorio["dado"]}, por centro {relatorio["centro"]}, '
      f'aproximados {relatorio["parecido"]}, sem {relatorio["sem"]}, juntados {dup}')
open(f'{saida}/relatorio.txt', 'w').write('\n'.join(sem) + '\n')
