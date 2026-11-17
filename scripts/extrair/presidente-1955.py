#!/usr/bin/env python3
"""
Presidente e Vice-Presidente 1955, por município: acervo, "Resultados sobre o Brasil geral/Banco de Dados - 1955
Presidente & Vice.xlsx" (abas Presidente e Vice-presidente: código IBGE, UF, município, votos por partido, nominais,
brancos, nulos, comparecimento, eleitorado).

- O antigo Distrito Federal (código 3099901, cidade do Rio de Janeiro) vai para o RJ como 3304557.
- MS (códigos 50…) fica no MT e TO (17…) em GO, como os estados eram em 1955.
- Município da planilha que não tem polígono na malha de 1955 (data/malhas-historicas/BR1955, de scripts/malha-1955.py)
  soma no polígono de 1955 onde fica a sua sede de hoje.
- Linhas repetidas com o mesmo código (ex.: Alvinópolis-MG) são somadas.
Saída: data/tre/1955/{uf}-brasil.csv (presidente e vice-presidente). Depois: scripts/tre.py --ano 1955 e
node scripts/resumo-br.mjs --ano 1955 --cargo presidente (e vice-presidente).
Uso: python3 scripts/extrair/presidente-1955.py --xlsx "<acervo>/Resultados sobre o Brasil geral/Banco de Dados - 1955 Presidente & Vice.xlsx"
"""
import argparse, collections, glob, gzip, json, os, sys
import openpyxl
sys.path.insert(0, os.path.dirname(__file__))
from comum import gravar, chave

a = argparse.ArgumentParser(); a.add_argument('--xlsx', required=True); a = a.parse_args()
UF = {'11': 'ro', '12': 'ac', '13': 'am', '14': 'rr', '15': 'pa', '16': 'ap', '17': 'go', '21': 'ma', '22': 'pi', '23': 'ce', '24': 'rn',
      '25': 'pb', '26': 'pe', '27': 'al', '28': 'se', '29': 'ba', '31': 'mg', '32': 'es', '33': 'rj', '35': 'sp', '41': 'pr', '42': 'sc',
      '43': 'rs', '50': 'mt', '51': 'mt', '52': 'go', '53': 'go'}
CANDS = {
    'presidente': {'PSD': ('JUSCELINO KUBITSCHEK', 'PSD'), 'UDN': ('JUAREZ TÁVORA', 'UDN'), 'PSP': ('ADEMAR DE BARROS', 'PSP'),
                   'PRP': ('PLÍNIO SALGADO', 'PRP')},
    'vice-presidente': {'PTB': ('JOÃO GOULART', 'PTB'), 'UDN': ('MILTON CAMPOS', 'UDN'), 'PSP': ('DANTON COELHO', 'PSP')},
}
ELEITOS = {'presidente': 'JUSCELINO KUBITSCHEK', 'vice-presidente': 'JOÃO GOULART'}
ABAS = {'Presidente': 'presidente', 'Vice-presidente': 'vice-presidente'}

# malha de 1955: polígonos por UF, para achar onde fica a sede de quem não tem polígono
malha = {}
for f in glob.glob('data/malhas-historicas/BR1955/*.geojson.gz'):
    for ft in json.load(gzip.open(f))['features']: malha[ft['id']] = [r for pol in ft['geometry']['coordinates'] for r in pol[:1]]
def dentro(x, y, anel):
    c = False
    for (x0, y0), (x1, y1) in zip(anel, anel[1:] + anel[:1]):
        if (y0 > y) != (y1 > y) and x < (x1 - x0) * (y - y0) / (y1 - y0) + x0: c = not c
    return c
centros = {}
for arq in glob.glob('public/geo/uf/*.json'):
    t = json.load(open(arq)); tr = t.get('transform')
    for g in t['objects']['municipios']['geometries']:
        arcs = g['arcs'] if g['type'] == 'MultiPolygon' else [g['arcs']]
        anel = max((p[0] for p in arcs), key=lambda r: sum(len(t['arcs'][~i if i < 0 else i]) for i in r))
        xs, ys = [], []
        for i in anel:
            x = y = 0
            for dx, dy in t['arcs'][~i if i < 0 else i]:
                x += dx; y += dy; xs.append(x * tr['scale'][0] + tr['translate'][0]); ys.append(y * tr['scale'][1] + tr['translate'][1])
        centros[str(g['id'])] = (sum(xs) / len(xs), sum(ys) / len(ys))
def poligono_de(cod):
    if cod in malha: return cod
    if cod not in centros: return None
    x, y = centros[cod]
    return next((k for k, aneis in malha.items() if k[:2] == cod[:2] and any(dentro(x, y, r) for r in aneis)), None)

wb = openpyxl.load_workbook(a.xlsx, read_only=True, data_only=True)
linhas = collections.defaultdict(list); movidos = []
for aba, cargo in ABAS.items():
    ws = wb[aba]; rows = [list(r) + [None] * 4 for r in ws.iter_rows(values_only=True)]
    H = [h for h in rows[0] if h]
    col = {h: i for i, h in enumerate(H)}
    soma = collections.defaultdict(collections.Counter)
    for r in rows[1:]:
        if r[0] is None: continue
        cod = str(int(r[0])); cod = '3304557' if cod == '3099901' else cod
        alvo = poligono_de(cod)
        if not alvo: print('  ⚠ sem polígono:', cod, r[1], r[2]); continue
        if alvo != cod: movidos.append(f'{r[2]}-{r[1]} → {alvo}')
        for h in list(CANDS[cargo]) + ['Votos Brancos', 'Votos Nulos', 'Comparecimento', 'Eleitorado']:
            v = r[col[h]]
            if isinstance(v, (int, float)): soma[alvo][h] += int(v)
    for cod, s in soma.items():
        uf = UF[cod[:2]]
        for sg, (nome, part) in CANDS[cargo].items():
            linhas[uf].append((cargo, 1, cod, '_' + chave(nome), nome, part, s[sg]))
        for h, n in (('Votos Brancos', '#brancos'), ('Votos Nulos', '#nulos'), ('Comparecimento', '#comparecimento'), ('Eleitorado', '#eleitorado')):
            if h in s: linhas[uf].append((cargo, 1, cod, n, '', '', s[h]))
os.makedirs('data/tre/1955', exist_ok=True)
eleitos = {(c, '_' + chave(n)): 'S' for c, n in ELEITOS.items()}
for uf, ls in sorted(linhas.items()):
    gravar(f'data/tre/1955/{uf}-brasil.csv', ls, eleitos,
           fonte='Acervo Sigoli.TSE, banco de dados da eleição de 1955 para Presidente e Vice-Presidente (por município)')
print(len(movidos), 'municípios somados no polígono de 1955 da sua sede:', '; '.join(sorted(set(movidos))))
