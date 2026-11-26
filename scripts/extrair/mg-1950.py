#!/usr/bin/env python3
"""
Presidente, Vice-Presidente e Governador 1950 em Minas Gerais, por zona eleitoral: quadros datilografados do TRE-MG do
acervo ("Resultados sobre o Brasil geral/1950 Presidente e Vice/", Presidente: Serviço de Controle do Eleitorado, 1978;
Vice: 6ª Seção, 1951, com os dados do Departamento Estadual de Estatística; Governador e Vice: "Mapas/MG/Resultados/1950.pdf" e "1950 VICE.pdf"),
transcritos em data/tre/fontes/mg-1950/ (presidente.txt, vice.txt e governador.txt; cada linha confere: candidatos +
brancos + nulos = comparecimento, e a soma das zonas = o total do estado do quadro).
- Zona = nome do município-sede; "=Fulano" = município que votou incluído em outra zona (vira grupo explícito).
- Município de hoje sem polígono na malha de 1950 soma no polígono de 1950 onde fica a sede.
- Os outros municípios de 1950 (sem zona própria) ficam com o vizinho que tem dado (agrupar "*;vizinho"): o quadro não
  diz que municípios formavam cada zona.
Saída: data/tre/1950/mg-brasil.csv (Presidente e Vice), data/tre/1950/mg.csv (Governador) e data/malhas-historicas/agrupar/1950-mg.csv.
Uso: python3 scripts/extrair/mg-1950.py
"""
import collections, glob, gzip, json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from comum import gravar, chave, ibge_por_nome

FONTES = 'data/tre/fontes/mg-1950'
# nomes de 1950 → nome de hoje
ANTIGOS = {'GIMIRIM': 'Poço Fundo', 'JOAORIBEIRO': 'Entre Rios de Minas', 'BRASILIA': 'Brasília de Minas', 'PIUI': 'Piumhi',
           'SILVESTREFERRAZ': 'Carmo de Minas', 'BRASOPOLIS': 'Brazópolis', 'SAOTOMASDEAQUINO': 'São Tomás de Aquino',
           'CONSELHEIROLAFAIETE': 'Conselheiro Lafaiete', 'SAOJOAODELREI': 'São João del Rei', 'ITABIRITO': 'Itabirito'}
CANDS = {
    'presidente': [('CRISTIANO MACHADO', 'PSD'), ('EDUARDO GOMES', 'UDN'), ('GETÚLIO VARGAS', 'PTB'), ('JOÃO MANGABEIRA', 'PSB')],
    'vice-presidente': [('ALÍPIO CORREIA NETO', 'PSB'), ('ALTINO ARANTES', 'PSD'), ('CAFÉ FILHO', 'PSP'), ('ODILON BRAGA', 'UDN'),
                        ('VITORINO FREIRE', 'PST')],
    'governador': [('GABRIEL DE RESENDE PASSOS', 'UDN'), ('JUSCELINO KUBITSCHEK', 'PSD')],
    'vice-governador': [('CLÓVIS SALGADO DA GAMA', 'PR'), ('PEDRO ALEIXO', 'UDN')],
}
ELEITOS = {('presidente', '_GETULIOVARGAS'): 'S', ('vice-presidente', '_CAFEFILHO'): 'S', ('governador', '_JUSCELINOKUBITSCHEK'): 'S', ('vice-governador', '_CLOVISSALGADODAGAMA'): 'S'}

malha = {}
for ft in json.load(gzip.open('data/malhas-historicas/BR1950/mg.geojson.gz'))['features']:
    malha[ft['id']] = [pol[0] for pol in ft['geometry']['coordinates']] if ft['geometry']['type'] == 'MultiPolygon' else [ft['geometry']['coordinates'][0]]
def dentro(x, y, anel):
    c = False
    for (x0, y0), (x1, y1) in zip(anel, anel[1:] + anel[:1]):
        if (y0 > y) != (y1 > y) and x < (x1 - x0) * (y - y0) / (y1 - y0) + x0: c = not c
    return c
centros = {}
t = json.load(open('public/geo/uf/mg.json')); tr = t.get('transform')
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
    return next((k for k, aneis in malha.items() if any(dentro(x, y, r) for r in aneis)), None)

achar = ibge_por_nome('mg')
def codigo(nome):
    ib = achar(ANTIGOS.get(chave(nome), nome))
    alvo = poligono_de(ib) if ib else None
    if ib and alvo != ib: print(f'  {nome} ({ib}) → polígono de 1950 {alvo}')
    return alvo

linhas, grupos, conf = [], {}, {}
for arq, cargo in (('presidente.txt', 'presidente'), ('vice.txt', 'vice-presidente'), ('governador.txt', 'governador'), ('vice-governador.txt', 'vice-governador')):
    n = len(CANDS[cargo]); sem_secoes = cargo == 'presidente'
    tot = collections.Counter()
    for l in open(os.path.join(FONTES, arq), encoding='utf8'):
        if l.startswith('#') or not l.strip(): continue
        p = l.strip().split(';')
        cod = codigo(p[1])
        if not cod: continue
        if p[2].startswith('='):
            sede = codigo(p[2][1:])
            if sede and sede != cod: grupos[cod] = sede
            continue
        v = list(map(int, p[2:] if sem_secoes else p[3:]))
        cand, br, nu = v[:n], v[n], v[n + 1]
        for (nome, part), x in zip(CANDS[cargo], cand):
            linhas.append((cargo, 1, cod, '_' + chave(nome), nome, part, x)); tot[nome] += x
        linhas += [(cargo, 1, cod, '#brancos', '', '', br), (cargo, 1, cod, '#nulos', '', '', nu),
                   (cargo, 1, cod, '#comparecimento', '', '', sum(cand) + br + nu)]
        tot['#brancos'] += br; tot['#nulos'] += nu
    print(cargo, dict(tot))
gravar('data/tre/1950/mg-brasil.csv', [r for r in linhas if 'governador' not in r[0]], ELEITOS,
       fonte='Acervo Sigoli.TSE, quadros do TRE-MG da eleição de 1950 para Presidente e Vice-Presidente (por zona eleitoral)')
gravar('data/tre/1950/mg.csv', [r for r in linhas if 'governador' in r[0]], ELEITOS,
       fonte='TRE-MG, quadro geral da eleição de 1950 para Governador e Vice-Governador do Estado (por zona eleitoral), do acervo Sigoli.TSE')
with open('data/malhas-historicas/agrupar/1950-mg.csv', 'w') as f:
    f.write('ibge;sede\n*;vizinho\n' + ''.join(f'{k};{v}\n' for k, v in sorted(grupos.items())))
print(len(grupos), 'municípios incluídos em outra zona;', len({r[2] for r in linhas}), 'zonas no mapa;', len(malha), 'polígonos em 1950')
