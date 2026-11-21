#!/usr/bin/env python3
"""Espírito Santo 1990, 1º turno, Governador e Senador: telas de totalização do SERPRO "Votação dos candidatos no município"
(PDF digitalizado do acervo, Mapas/ES/Resultados/ES 1990 1T.pdf), transcritas em data/tre/fontes/es-1990/governador-1t.txt e senador.txt.
Cada linha foi conferida com os percentuais impressos na tela (voto / comparecimento) e a soma dos 67 municípios bate com a
tela "Votação dos candidatos no estado". As telas por município não trazem brancos e nulos separados, só o comparecimento.
Uso: python3 scripts/extrair/tre-es-1990.py"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar
achar = ibge_por_nome('es')
C = [('12', 'ALBUÍNO AZEREDO', 'PDT'), ('52', 'JOSÉ IGNÁCIO FERREIRA', 'PST'), ('13', 'ROGÉRIO SARLO DE MEDEIROS', 'PT'),
     ('15', 'JOÃO DE MEDEIROS CALMON', 'PMDB')]
linhas = []; tot = [0] * 5
for l in open('data/tre/fontes/es-1990/governador-1t.txt', encoding='utf8'):
    if l.startswith('#') or not l.strip(): continue
    p = l.strip().split(';'); ib = achar(p[0]); comp = int(p[1]); v = [int(p[i]) for i in (2, 4, 6, 8)]
    for (n, nm, pt), x in zip(C, v): linhas.append(('governador', 1, ib, n, nm, pt, x))
    linhas.append(('governador', 1, ib, '#comparecimento', '', '', comp))
    tot = [a + b for a, b in zip(tot, [comp] + v)]
# Senador (uma vaga): 64 dos 67 municípios (faltam no PDF Cachoeiro de Itapemirim, Santa Teresa e Vargem Alta)
S = [('_ELCIOALVARES', 'ÉLCIO ÁLVARES', 'PFL'), ('_RENATOVIANASOARES', 'RENATO VIANA SOARES', 'PSB'), ('_MAGNOPIRESDASILVA', 'MAGNO PIRES DA SILVA', 'PT'),
     ('_JOSEMORAES', 'JOSÉ MORAES', 'PMDB'), ('_JOAODALMACIOCASTELLOMIGUEL', 'JOÃO DALMÁCIO CASTELLO MIGUEL', 'PSDB'),
     ('_FERDINANDBERREDODEMENEZES', 'FERDINAND BERREDO DE MENEZES', 'PRN'), ('_JEFFERSONDEAGUIAR', 'JEFFERSON DE AGUIAR', 'PDS')]
for l in open('data/tre/fontes/es-1990/senador.txt', encoding='utf8'):
    if l.startswith('#') or not l.strip(): continue
    p = l.strip().split(';'); ib = achar(p[0]); comp = int(p[1]); v = [int(p[i]) for i in range(2, 16, 2)]
    for (n, nm, pt), x in zip(S, v): linhas.append(('senador', 1, ib, n, nm, pt, x))
    linhas.append(('senador', 1, ib, '#comparecimento', '', '', comp))
gravar('data/tre/1990/es.csv', linhas, {('governador', '12', 1): '2', ('governador', '52', 1): '2', ('senador', '_ELCIOALVARES', 1): 'S'},
       fonte='SERPRO/TRE-ES, totalização do 1º turno de 3 de outubro de 1990 (votação dos candidatos por município)')
print(tot)
