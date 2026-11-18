#!/usr/bin/env python3
"""Piauí 1990, governador 2º turno (25/11/1990): votação por município da publicação do TRE-PI (foto da p. 23 no
acervo, Mapas/PI/Resultados/1990 2T.jpg), transcrita em data/tre/fontes/pi-1990/governador-2t.txt. Só os municípios
1 a 59 (de Agricolândia a José de Freitas); cada linha conferida (candidatos + brancos + nulos = total).
Freitas Neto (PFL, eleito) × Wall Ferraz (PSDB). Uso: python3 scripts/extrair/tre-pi-1990.py"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar, chave
achar = ibge_por_nome('pi')
C = [('FREITAS NETO', 'PFL'), ('WALL FERRAZ', 'PSDB')]
s = []
for l in open('data/tre/fontes/pi-1990/governador-2t.txt', encoding='utf8'):
    if l.startswith('#') or not l.strip(): continue
    p = l.strip().split(';'); ib = achar(p[0]); v = list(map(int, p[1:]))
    for (n, pt), x in zip(C, v): s.append(('governador', 2, ib, '_' + chave(n), n, pt, x))
    s += [('governador', 2, ib, '#brancos', '', '', v[2]), ('governador', 2, ib, '#nulos', '', '', v[3]), ('governador', 2, ib, '#comparecimento', '', '', v[4])]
gravar('data/tre/1990/pi.csv', s, {('governador', '_' + chave('FREITAS NETO')): 'S'},
       fonte='TRE-PI, votação por município do 2º turno de 1990 (municípios de A a José de Freitas)')
