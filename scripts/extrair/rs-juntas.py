#!/usr/bin/env python3
"""
Rio Grande do Sul, 1947 e 1950: votação por junta apuradora, do banco de dados do NUPERGS/UFRGS.

As juntas de 1945–1950 apuravam um ou mais municípios juntos ("JUNTA 7 - 1950" = Porto Alegre, Canoas e Gravataí); a lista
de cada uma vem de https://www.ufrgs.br/nupergs/banco/index.php/junta/{junta}/{ano} e a votação, do banco "voto nominal"
(município "JUNTA n - ano"). Arquivos: data/tre/fontes/nupergs/juntas-{ano}.txt e votos.txt.

Juntas com município em comum (Porto Alegre tem sete em 1950) formam um grupo; o voto do grupo fica no primeiro município
(a sede) e os outros vão para data/malhas-historicas/agrupar/{ano}-rs.csv: cada um tem o próprio polígono, com a cor da
sede, e é selecionado junto com ela. O banco não tem a junta 30 (1947: Júlio de Castilhos e Tupanciretã; 1950: Jaguari e
General Vargas).

Saída: data/tre/1947/rs.csv (Governador) e data/tre/1950/rs.csv (Governador e Senador). Presidente 1950 já está no site
(data/tre/1950/rs-brasil.csv) e bate junta a junta com este banco; aqui ele só entra nos grupos do mapa.
Depois: scripts/tre.py --ano 1947 e --ano 1950, node scripts/malha-historica.mjs --ano 1947 (e 1950).
Uso: python3 scripts/extrair/rs-juntas.py
"""
import collections, csv, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar, chave

FONTES = 'data/tre/fontes/nupergs'
# grafia do banco / nome da época → município de hoje
ANTIGOS = {'CAI': 'São Sebastião do Caí', 'LIVRAMENTO': "Sant'Ana do Livramento", 'BOMJESUSDOTRIUNFO': 'Triunfo',
           'APARADOSDASERRA': 'Bom Jesus', 'GENERALVARGAS': 'São Vicente do Sul', 'HERVAL': 'Herval', 'HERVALDOSUL': 'Herval',
           'CANGUSSU': 'Canguçu', 'SANTOANTONIO': 'Santo Antônio da Patrulha', 'ENCANTADOP': 'Encantado',
           'PALMERIRADASMISSOES': 'Palmeira das Missões', 'SAIJERONIMO': 'São Jerônimo', 'GALCAMARA': 'General Câmara'}
# (ano, código no votos.txt) → cargo e candidatos na ordem das colunas; '#brancos'/'#nulos' são os totais
CARGOS = {
    ('1947', 'g'): ('governador', [('ALBERTO PASQUALINI', 'PTB'), ('WALTER JOBIM', 'PSD'), ('DÉCIO MARTINS COSTA', 'PL')], 'WALTER JOBIM'),
    ('1950', 'g'): ('governador', [('ERNESTO DORNELLES', 'PTB'), ('CYLON ROSA', 'PSD'), ('EDGAR SCHNEIDER', 'PL'),
                                   ('BRUNO DE MENDONÇA LIMA', 'PSB'), '#brancos', '#nulos'], 'ERNESTO DORNELLES'),
    ('1950', 's'): ('senador', [('ALBERTO PASQUALINI', 'PTB'), ('PLÍNIO SALGADO', 'PRP'), ('DÉCIO MARTINS COSTA', 'PL'),
                                '#brancos', '#nulos'], 'ALBERTO PASQUALINI'),
}
FONTE = ('NUPERGS/UFRGS, banco de dados eleitorais do Rio Grande do Sul (votação por junta apuradora; a junta que apurava '
         'vários municípios aparece no primeiro deles)')

achar = ibge_por_nome('rs')
votos = collections.defaultdict(dict)  # (ano, cód) → junta → [votos]
for l in open(f'{FONTES}/votos.txt', encoding='utf8'):
    if l.startswith('#') or not l.strip(): continue
    ano, j, c, *v = l.split()
    votos[(ano, c)][j] = [int(x) for x in v]

for ano in ('1947', '1950'):
    juntas = {}
    for l in open(f'{FONTES}/juntas-{ano}.txt', encoding='utf8'):
        if l.startswith('#') or not l.strip(): continue
        j, ms = l.strip().split(';')
        ibs = [achar(ANTIGOS.get(chave(m), m)) for m in ms.split(', ')]
        assert all(ibs), (ano, j, ms)
        juntas[j] = ibs
    # grupos: juntas ligadas por município em comum
    pai = {j: j for j in juntas}
    def raiz(x):
        while pai[x] != x: x = pai[x]
        return x
    dono = {}
    for j, ibs in juntas.items():
        for ib in ibs:
            if ib in dono: pai[raiz(j)] = raiz(dono[ib])
            else: dono[ib] = j
    grupos = collections.defaultdict(lambda: {'juntas': [], 'mun': []})
    for j in juntas:
        g = grupos[raiz(j)]
        g['juntas'].append(j)
        g['mun'] += [ib for ib in juntas[j] if ib not in g['mun']]
    linhas, eleitos = [], {}
    for (a, c), (cargo, cands, eleito) in CARGOS.items():
        if a != ano: continue
        eleitos[(cargo, '_' + chave(eleito))] = 'S'
        for g in grupos.values():
            js = [j for j in g['juntas'] if j in votos[(a, c)]]
            if not js: continue
            sede = g['mun'][0]
            for i, cand in enumerate(cands):
                v = sum(votos[(a, c)][j][i] for j in js)
                if isinstance(cand, str): linhas.append((cargo, 1, sede, cand, '', '', v))
                else: linhas.append((cargo, 1, sede, '_' + chave(cand[0]), cand[0], cand[1], v))
    os.makedirs(f'data/tre/{ano}', exist_ok=True)
    gravar(f'data/tre/{ano}/rs.csv', linhas, eleitos, fonte=FONTE)
    # mapa: cada município da junta fica com a sede (quem tem dado próprio em algum cargo não é juntado; ver malha-historica)
    pares = [(ib, g['mun'][0]) for g in grupos.values() for ib in g['mun'][1:]]
    with open(f'data/malhas-historicas/agrupar/{ano}-rs.csv', 'w', encoding='utf8') as f:
        f.write('ibge;sede\n' + ''.join(f'{i};{s}\n' for i, s in pares))
    print(ano, len(grupos), 'grupos de juntas,', len(pares), 'municípios juntados à sede')
