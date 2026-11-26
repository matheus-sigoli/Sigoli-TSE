#!/usr/bin/env python3
"""
Malhas estaduais históricas do acervo (Malhas/shp/Malha Estadual/) → data/malhas-estaduais/{ano}.json (GeoJSON em
graus, simplificado), base do mapa "por estado" (scripts/estados-malha.py).

- Shapefiles (limite de província 1872; limite estadual 1900, 1911, 1920, 1950, 1960, 1970, 1980 e 1991), projeção
  policônica (SIRGAS 2000, meridiano central −54°): lidos e desprojetados aqui mesmo (malha_estadual/shp.py), sem GDAL.
- 1835: a de 1872 com o Paraná junto de São Paulo e o Amazonas junto do Pará (malha_estadual/juntar.py).
- 1945 (com os territórios de Ponta Porã e do Iguaçu): o SVG do acervo ("1945_Brazilian_Election_Map…"), sem
  coordenadas. Ele é georreferenciado pelos estados que não mudaram entre 1945 e 1950 (centro e extremos de cada um contra
  a malha de 1950), com um ajuste de 2º grau; o erro médio fica em ~0,04° (uns 4 km).
Uso: python3 scripts/extrair/malha-estadual.py --pasta "<acervo>/Malhas/shp/Malha Estadual" (pasta com os .zip extraídos)
"""
import argparse, glob, json, math, os, re, sys, unicodedata, zipfile, tempfile
import numpy as np
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'malha_estadual'))
from shp import dbf, shp, inv
from svgpath import parse
from juntar import juntar

def chave(s): return re.sub(r'[^A-Z]', '', ''.join(c for c in unicodedata.normalize('NFD', s) if unicodedata.category(c) != 'Mn').upper())
UF = {
    'AMAZONAS': 'am', 'PIAUHY': 'pi', 'PIAUI': 'pi', 'CEARA': 'ce', 'RIOGRANDEDONORTE': 'rn', 'PERNAMBUCO': 'pe', 'ALAGOAS': 'al',
    'SERGIPE': 'se', 'MINASGERAES': 'mg', 'MINASGERAIS': 'mg', 'PARANA': 'pr', 'RIOGRANDEDOSUL': 'rs', 'GOYAZ': 'go', 'GOIAS': 'go',
    'PARA': 'pa', 'MARANHAO': 'ma', 'PARAHYBA': 'pb', 'PARAHYBADONORTE': 'pb', 'PARAIBA': 'pb', 'BAHIA': 'ba',
    'MUNICIPIONEUTRO': 'df', 'DISTRICTOFEDERAL': 'df', 'DISTRITOFEDERAL': 'df', 'BRASILIA': 'df', 'ESPIRITOSANTO': 'es',
    'RIODEJANEIRO': 'rj', 'SAOPAULO': 'sp', 'SANTACATHARINA': 'sc', 'SANTACATARINA': 'sc', 'MATTOGROSSO': 'mt', 'MATOGROSSO': 'mt',
    'MATOGROSSODOSUL': 'ms', 'TERRITORIODOACRE': 'ac', 'ACRE': 'ac', 'TERRITORIODOGUAPORE': 'ro', 'TERRITORIODERONDONIA': 'ro',
    'RONDONIA': 'ro', 'TERRITORIODORIOBRANCO': 'rr', 'TERRITORIODERORAIMA': 'rr', 'RORAIMA': 'rr', 'TERRITORIODOAMAPA': 'ap',
    'AMAPA': 'ap', 'TERRITORIODEFERNANDODENORONHA': 'fn', 'DISTRITOESTADUALDEFERNANDODENORONHAPE': 'pe', 'GUANABARA': 'gb',
    'TOCANTINS': 'to',
}
# grafia de hoje para o nome que aparece no site (a malha guarda a da época: Piauhy, Goyaz…)
NOME = {'pi': 'Piauí', 'go': 'Goiás', 'mg': 'Minas Gerais', 'al': 'Alagoas', 'pb': 'Paraíba', 'sc': 'Santa Catarina',
        'mt': 'Mato Grosso', 'es': 'Espírito Santo', 'ce': 'Ceará', 'rn': 'Rio Grande do Norte', 'pe': 'Pernambuco', 'se': 'Sergipe',
        'pr': 'Paraná', 'rs': 'Rio Grande do Sul', 'pa': 'Pará', 'ma': 'Maranhão', 'ba': 'Bahia', 'rj': 'Rio de Janeiro',
        'sp': 'São Paulo', 'am': 'Amazonas', 'ms': 'Mato Grosso do Sul', 'to': 'Tocantins', 'gb': 'Guanabara'}

def simplificar(pts, tol):
    """Douglas-Peucker; anel fechado: em duas metades (do 1º ponto ao mais distante dele e de volta)"""
    if len(pts) < 5: return pts
    if pts[0] == pts[-1]:
        far = max(range(len(pts)), key=lambda i: (pts[i][0] - pts[0][0]) ** 2 + (pts[i][1] - pts[0][1]) ** 2)
        if 0 < far < len(pts) - 1:
            return _dp(pts[:far + 1], tol)[:-1] + _dp(pts[far:], tol)
    return _dp(pts, tol)

def _dp(pts, tol):
    if len(pts) < 3: return pts
    keep = [False] * len(pts); keep[0] = keep[-1] = True; pilha = [(0, len(pts) - 1)]
    while pilha:
        a, b = pilha.pop(); (x1, y1), (x2, y2) = pts[a], pts[b]; dx, dy = x2 - x1, y2 - y1; L = math.hypot(dx, dy) or 1e-9
        md, mi = 0, None
        for i in range(a + 1, b):
            d = abs(dy * (pts[i][0] - x1) - dx * (pts[i][1] - y1)) / L
            if d > md: md, mi = d, i
        if mi is not None and md > tol: keep[mi] = True; pilha += [(a, mi), (mi, b)]
    return [p for p, k in zip(pts, keep) if k]

def salvar(feicoes, dest):
    xs = [p[0] for f in feicoes.values() for r in f['aneis'] for p in r]; ys = [p[1] for f in feicoes.values() for r in f['aneis'] for p in r]
    fc = {'type': 'FeatureCollection', 'bbox': [min(xs), min(ys), max(xs), max(ys)], 'features': [
        {'type': 'Feature', 'id': uf, 'properties': {'n': f['n']},
         'geometry': {'type': 'MultiPolygon', 'coordinates': [[[[round(x, 4), round(y, 4)] for x, y in r]] for r in f['aneis']]}}
        for uf, f in sorted(feicoes.items())]}
    json.dump(fc, open(dest, 'w', encoding='utf8'), ensure_ascii=False, separators=(',', ':'))
    print(dest, len(fc['features']), 'UFs,', os.path.getsize(dest) // 1024, 'KB')

def de_shapefile(base, tol=900, juntas=None):
    """juntas: {uf: uf de destino} — províncias que ainda não existiam (1835: Paraná em São Paulo, Amazonas no Pará)"""
    brutos, nomes = {}, {}
    for reg, g in zip(dbf(base + '.dbf'), shp(base + '.shp')):
        nome = re.sub(r'\s+', ' ', reg['nome']).strip(); uf = UF[chave(nome)]
        nomes[uf] = NOME.get(uf) or nome.replace('De Rondônia', 'de Rondônia')
        if uf == 'df': nomes[uf] = 'Município Neutro (Corte)' if 'neutro' in nome.lower() else 'Distrito Federal'
        brutos.setdefault(uf, []).extend([[tuple(p) for p in r] for r in g])
    for de, para in (juntas or {}).items():
        brutos[para] = juntar(brutos[para], brutos.pop(de))
    feicoes = {}
    for uf, aneis in brutos.items():
        f = feicoes[uf] = {'n': nomes[uf], 'aneis': []}
        for r in aneis:
            r = simplificar(r, tol)
            if len(r) >= 4: f['aneis'].append([inv(x, y) for x, y in r])
    return feicoes

a = argparse.ArgumentParser(); a.add_argument('--pasta', required=True); a = a.parse_args()
os.makedirs('data/malhas-estaduais', exist_ok=True)
tmp = tempfile.mkdtemp()
for z in sorted(glob.glob(os.path.join(a.pasta, '*.zip'))):
    d = os.path.join(tmp, os.path.basename(z)[:-4]); zipfile.ZipFile(z).extractall(d)
ref1950 = None
for s in sorted(glob.glob(os.path.join(tmp, '*', '*.shp'))):
    ano = re.search(r'(\d{4})', os.path.basename(s)).group(1)
    f = de_shapefile(s[:-4])
    if ano == '1950': ref1950 = f
    salvar(f, f'data/malhas-estaduais/{ano}.json')
    if ano == '1872':  # 1835 (eleição do Regente): ainda sem as províncias do Amazonas (1850) e do Paraná (1853)
        salvar(de_shapefile(s[:-4], juntas={'pr': 'sp', 'am': 'pa'}), 'data/malhas-estaduais/1835.json')

# ---- 1945, do SVG
svgs = glob.glob(os.path.join(a.pasta, '1945*.svg'))
if svgs and ref1950:
    s = open(svgs[0], encoding='utf8').read()
    # caminhos dos estados (o mapa da Wikimedia não tem nome neles: a posição diz quem é quem)
    ROT = {'path16': 'rs', 'path18': 'sc', 'path3440': 'ig', 'path20': 'pr', 'path22': 'sp', 'path24': 'rj', 'path2754': 'df',
           'path26': 'es', 'path28': 'mg', 'path30': 'go', 'path34': 'ba', 'path36': 'se', 'path38': 'al', 'path40': 'pe',
           'path42': 'pb', 'path44': 'rn', 'path46': 'ce', 'path48': 'pi', 'path50': 'ma', 'path54': 'pa', 'path56': 'ap',
           'path3452': 'pp', 'path3450': 'mt', 'path62': 'ro', 'use66': 'am', 'path70': 'rr', 'path72': 'ac'}
    svg = {}
    for pid, uf in ROT.items():
        tag = re.search(r'<path\b[^>]*?\bid="%s"[^>]*>' % pid, s, re.S).group(0)
        svg[uf] = parse(re.search(r'\sd="([^"]*)"', tag).group(1), passo=3)
    def centro(rings):
        A = cx = cy = 0
        for r in rings:
            for (x1, y1), (x2, y2) in zip(r, r[1:] + r[:1]):
                c = x1 * y2 - x2 * y1; A += c; cx += (x1 + x2) * c; cy += (y1 + y2) * c
        return cx / (3 * A), cy / (3 * A)
    def ext(rings):
        pts = [p for r in rings for p in r]
        return [min(pts, key=lambda p: p[0]), max(pts, key=lambda p: p[0]), min(pts, key=lambda p: p[1]), max(pts, key=lambda p: p[1])]
    P, Q = [], []
    for uf in ('rs', 'sp', 'rj', 'es', 'mg', 'go', 'ba', 'se', 'al', 'pe', 'pb', 'rn', 'ce', 'pi', 'ma', 'pa', 'ap', 'ro', 'am', 'rr', 'ac', 'df'):
        r50 = ref1950[uf]['aneis']
        P.append(centro(svg[uf])); Q.append(centro(r50))
        es, er = ext(svg[uf]), ext(r50)
        P += es; Q += [er[0], er[1], er[3], er[2]]  # y do SVG cresce para baixo
    P, Q = np.array(P), np.array(Q)
    def feats(p):
        x, y = p[:, 0] / 4000, p[:, 1] / 4000
        return np.stack([np.ones_like(x), x, y, x * x, x * y, y * y], 1)
    m = np.ones(len(P), bool)
    for _ in range(5):  # tira os pares que não batem (ilhas, pontas diferentes) e ajusta de novo
        F = feats(P[m]); cx = np.linalg.lstsq(F, Q[m, 0], rcond=None)[0]; cy = np.linalg.lstsq(F, Q[m, 1], rcond=None)[0]
        r = np.hypot(feats(P) @ cx - Q[:, 0], feats(P) @ cy - Q[:, 1]); m = r < max(0.15, np.median(r) * 3)
    print(f'1945: georreferência com {m.sum()} de {len(P)} pontos, erro médio {r[m].mean():.3f}°')
    nomes45 = {'ac': 'Território do Acre', 'ap': 'Território do Amapá', 'ro': 'Território do Guaporé', 'rr': 'Território do Rio Branco',
               'pp': 'Território de Ponta Porã', 'ig': 'Território do Iguaçu', 'df': 'Distrito Federal'}
    feicoes = {}
    for uf, rings in svg.items():
        aneis = []
        for rr in rings:
            if len(rr) < 4: continue
            pts = feats(np.array(rr)); lon, lat = pts @ cx, pts @ cy
            aneis.append(simplificar(list(zip(lon.tolist(), lat.tolist())), 0.004))
        feicoes[uf] = {'n': nomes45.get(uf) or NOME.get(uf) or ref1950[uf]['n'], 'aneis': [x for x in aneis if len(x) >= 4]}
    salvar(feicoes, 'data/malhas-estaduais/1945.json')
