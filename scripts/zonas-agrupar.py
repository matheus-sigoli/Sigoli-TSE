#!/usr/bin/env python3
"""
Zonas eleitorais de 1950–1952 → data/malhas-historicas/agrupar/{ano}-{uf}.csv.

Nas eleições de 1950–1955 os votos de vários municípios vinham juntos, pela zona eleitoral (o banco de dados de
Presidente diz "A votação inclui os votos do município de …"). O município sem resultado próprio vai, no mapa, para o
município da mesma zona que tem o resultado (em vez de ficar sem cor ou ir para o vizinho de maior divisa).
Zonas: data/tre/fontes/zonas/{uf}-{ano da lista}.txt ("zona(s);municípios", "ac:1;Rio Branco" para outra UF), dos mapas
"Limites das Zonas Eleitorais de 1.950/1.952" (Carlos H. da Graça e Daniel Galuch Junior, 2015, fonte TSE).
Só entram os municípios sem resultado em nenhum cargo daquele ano (lidos de public/data/{ano}/*/1/{uf}.json). Com
--vizinho, o arquivo termina com "*;vizinho": quem não está na lista vai para o vizinho, como antes.
Uso: python3 scripts/zonas-agrupar.py --ano 1950 --lista data/tre/fontes/zonas/al-1950.txt [--vizinho]
Depois: node scripts/malha-historica.mjs --ano {ano}.
"""
import argparse, collections, glob, json, os, re, sys
sys.path.insert(0, os.path.join(os.path.dirname(__file__), 'extrair'))
from comum import ibge_por_nome, chave

a = argparse.ArgumentParser(); a.add_argument('--ano', required=True); a.add_argument('--lista', required=True)
a.add_argument('--vizinho', action='store_true'); a = a.parse_args()
uf_lista = os.path.basename(a.lista).split('-')[0]
# nomes da época que não são os de hoje
ANTIGOS = {
    'al': {}, 'se': {'COTINGUIBA': 'Nossa Senhora do Socorro', 'BOQUIM': 'Boquim'},
    'mt': {'MATOGROSSO': 'Vila Bela da Santíssima Trindade', 'POXOREO': 'Poxoréu'},
    'am': {'UAUPES': 'São Gabriel da Cachoeira'}, 'ac': {}, 'rr': {}, 'ro': {},
    'es': {'ESPIRITOSANTO': 'Vila Velha'},
    'go': {'SUCUAPARA': 'Bela Vista de Goiás', 'MIRACEMADONORTE': 'Miracema do Tocantins', 'CHAPEU': 'Itapuranga'},
    'rs': {'CAI': 'São Sebastião do Caí', 'LIVRAMENTO': "Sant'Ana do Livramento", 'BOMJESUSDOTRIUNFO': 'Triunfo',
           'APARADOSDASERRA': 'Bom Jesus', 'GENERALVARGAS': 'São Vicente do Sul', 'ERVAL': 'Herval'},
}
# a malha antiga põe TO em GO, MS em MT
UF_DADOS = {'to': 'go', 'ms': 'mt'}
zonas = collections.defaultdict(list)  # (uf, zona) → [ibge]
fora = []
achadores = {}
for l in open(a.lista, encoding='utf8'):
    l = l.strip()
    if not l or l.startswith('#'): continue
    zs, ms = l.split(';')
    uf = uf_lista
    if ':' in zs: uf, zs = zs.split(':')
    cands = [uf] + (['ms'] if uf == 'mt' else []) + (['to'] if uf == 'go' else [])
    for nome in ms.split(','):
        ib = None
        for u in cands:
            if u not in achadores: achadores[u] = ibge_por_nome(u)
            ib = achadores[u](ANTIGOS.get(uf, {}).get(chave(nome), nome))
            if ib: break
        if not ib: fora.append(f'{nome}-{uf}'); continue
        for z in zs.split(','): zonas[(uf, z)].append(ib)

saidas = collections.defaultdict(list)
for (uf, z), ibs in zonas.items():
    com = set()
    for f in glob.glob(f'public/data/{a.ano}/*/1/{uf}.json'):
        com |= set(json.load(open(f))['mun'])
    if not com: continue
    sede = next((i for i in ibs if i in com), None)
    if not sede: continue
    for i in ibs:
        if i not in com and i != sede: saidas[uf].append((i, sede))
for uf, pares in saidas.items():
    caminho = f'data/malhas-historicas/agrupar/{a.ano}-{uf}.csv'
    vistos = dict(pares)
    with open(caminho, 'w', encoding='utf8') as g:
        g.write('ibge;sede\n' + ''.join(f'{i};{s}\n' for i, s in vistos.items()) + ('*;vizinho\n' if a.vizinho else ''))
    print(caminho, len(vistos), 'municípios juntados à zona')
if fora: print('sem código:', ', '.join(fora))
