#!/usr/bin/env python3
"""Mato Grosso (com o atual MS) 1955, Vice-Governador, por junta apuradora: folha "Eleição majoritária para
Vice-Governador" do acervo (Mapas/MT/Resultados/MT 1955 VICE.webp), transcrita em data/tre/fontes/mt-1955/
vice-governador.txt (cada junta conferida: candidatos + brancos + nulos = votantes). As 24 juntas são as mesmas do
governador de 1955 e do senado de 1954 (scripts/extrair/mt-1954-senador.py): cada uma vai para o município-sede.
Partidos sem confirmação na fonte (N/I). Uso: python3 scripts/extrair/mt-1955-vice.py"""
import os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from comum import gravar, chave
src = open(os.path.join(os.path.dirname(__file__), 'mt-1954-senador.py'), encoding='utf8').read()
SEDE = eval(re.search(r'SEDE = (\{.*?\})', src, re.S).group(1))
CANDS = [('HENRIQUE JOSÉ VIEIRA NETO', 'N/I'), ('OTACÍLIO FAUSTINO DA SILVA', 'N/I')]
saida = []
for l in open('data/tre/fontes/mt-1955/vice-governador.txt', encoding='utf8'):
    if l.startswith('#') or not l.strip(): continue
    v = list(map(int, l.strip().split(';'))); ib = SEDE[v[0]]
    for (n, p), x in zip(CANDS, v[1:3]): saida.append(('vice-governador', 1, ib, '_' + chave(n), n, p, x))
    saida += [('vice-governador', 1, ib, '#brancos', '', '', v[3]), ('vice-governador', 1, ib, '#nulos', '', '', v[4]),
              ('vice-governador', 1, ib, '#comparecimento', '', '', v[5])]
gravar('data/tre/1955/mt-vice.csv', saida, {('vice-governador', '_' + chave('HENRIQUE JOSÉ VIEIRA NETO')): 'S'},
       fonte='TRE-MT, eleição majoritária para Vice-Governador de 1955 por junta apuradora (acervo Sigoli.TSE), no município-sede')
