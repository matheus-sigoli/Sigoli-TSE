#!/usr/bin/env python3
"""TRE-ES, Governador 1986 (PDF digitalizado, transcrito em data/tre/fontes/es-1986/governador.tsv, linhas conferidas
pela soma = total) → data/tre/1986/es.csv. Os candidatos aparecem pelo partido/coligação (a tabela não traz nomes),
menos o eleito, Max Mauro (PMDB). Uso: python3 scripts/extrair/tre-es-1986.py"""
import csv, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar
achar = ibge_por_nome('es')
C = [('_PDT', 'PDT', 'PDT'), ('_PTPSB', 'PT-PSB', 'PT'), ('_MAXMAURO', 'MAX MAURO', 'PMDB'), ('_PFL', 'PFL', 'PFL')]
linhas = []
for r in csv.reader((l for l in open('data/tre/fontes/es-1986/governador.tsv', encoding='utf8') if not l.startswith('#')), delimiter='\t'):
    ib = achar(r[0]); v = list(map(int, r[1:]))
    for (cid, nome, p), x in zip(C, v): linhas.append(('governador', 1, ib, cid, nome, p, x))
    for t, x in zip(('#brancos', '#nulos', '#comparecimento', '#eleitorado'), v[4:]): linhas.append(('governador', 1, ib, t, '', '', x))
gravar('data/tre/1986/es.csv', linhas, {('governador', '_MAXMAURO'): 'S'}, fonte='TRE-ES, resultado das eleições de 15/11/1986 por município')
