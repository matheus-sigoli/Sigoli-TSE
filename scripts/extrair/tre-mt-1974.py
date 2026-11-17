#!/usr/bin/env python3
"""Mato Grosso (com o atual MS) 1974, Senado (uma vaga): TRE-MT, folhas de resultado por município (PDF do acervo,
Mapas/MT/Resultados/MT 1974.pdf), transcritas em data/tre/fontes/mt-1974/senado.txt (ARENA, MDB, brancos e nulos;
cada folha conferida com o seu total de votantes, menos Corumbá e Ladário, em que a soma da própria folha passa do
número de votantes escrito). A folha só traz o partido: ARENA = Mendes Canale (eleito), MDB = Bezerra Neto.
Municípios do sul (hoje MS) ficam com o código de MS. Uso: python3 scripts/extrair/tre-mt-1974.py"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar, chave
mt, ms = ibge_por_nome('mt'), ibge_por_nome('ms')
NOMES = {'Mato Grosso': 'Vila Bela da Santíssima Trindade'}
CANDS = [('MENDES CANALE', 'ARENA'), ('BEZERRA NETO', 'MDB')]
s = []; fora = []
for l in open('data/tre/fontes/mt-1974/senado.txt', encoding='utf8'):
    if l.startswith('#') or not l.strip(): continue
    p = l.strip().split(';'); ib = mt(NOMES.get(p[1], p[1])) or ms(p[1])
    if not ib: fora.append(p[1]); continue
    v = list(map(int, p[3:]))
    for (n, pt), x in zip(CANDS, v): s.append(('senador', 1, ib, '_' + chave(n), n, pt, x))
    s += [('senador', 1, ib, '#brancos', '', '', v[2]), ('senador', 1, ib, '#nulos', '', '', v[3])]
os.makedirs('data/tre/1974', exist_ok=True)
gravar('data/tre/1974/mt.csv', s, {('senador', '_' + chave('MENDES CANALE')): 'S'},
       fonte='TRE-MT, resultado das eleições de 15 de novembro de 1974 por município (Senado: votos por partido)')
print('sem código:', fora)
