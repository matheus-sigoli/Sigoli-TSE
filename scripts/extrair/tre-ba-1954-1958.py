#!/usr/bin/env python3
"""Bahia 1954 (governador) e 1958 (governador e senador): TRE-BA, "Resultado final das eleições realizadas a 3 de
outubro" (PDFs do acervo, Mapas/BA/Resultados), quadros por município transcritos à mão em
data/tre/fontes/ba-1954/governador.txt e data/tre/fontes/ba-1958/majoritarias.txt (cada coluna conferida com o total de
votantes; candidatos conferidos com o total do estado). Uso: python3 scripts/extrair/tre-ba-1954-1958.py"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar, chave
achar = ibge_por_nome('ba')
NOMES = {'Ibipetuba': 'Santa Rita de Cássia', 'Livramento do Brumado': 'Livramento de Nossa Senhora', 'Santo Inácio': 'Gentio do Ouro',
         'São Filipe': 'São Felipe', 'Ruy Barbosa': 'Rui Barbosa', 'Santo Estêvão': 'Santo Estêvão', 'Itiruçu': 'Itiruçu',
         'Morro do Chapéu': 'Morro do Chapéu', 'Teperoá': 'Taperoá', 'Pindobaçu': 'Pindobaçu', 'Conceição do Almeida': 'Conceição do Almeida'}
def blocos(p, n):
    L = [l.rstrip('\n') for l in open(p, encoding='utf8') if l.strip() and not l.startswith('#')]
    i = 0
    while i < len(L):
        ms = L[i][2:].split(';'); R = [list(map(int, l.split())) for l in L[i + 1:i + 1 + n]]; i += 1 + n
        for j, m in enumerate(ms): yield m, [r[j] for r in R]
fora = set()
def ib(m):
    x = achar(NOMES.get(m, m))
    if not x: fora.add(m)
    return x
s = []
for m, v in blocos('data/tre/fontes/ba-1954/governador.txt', 5):
    for (n, p), x in zip([('ANTÔNIO BALBINO', 'PTB'), ('PEDRO CALMON', 'PSD')], v): s.append(('governador', 1, ib(m), '_' + chave(n), n, p, x))
    s += [('governador', 1, ib(m), '#brancos', '', '', v[2]), ('governador', 1, ib(m), '#nulos', '', '', v[3])]
G = [m for m, _ in blocos('data/tre/fontes/ba-1954/governador.txt', 5)]
L = [l.split() for l in open('data/tre/fontes/ba-1954/senador.txt', encoding='utf8') if l.strip() and not l.startswith('#')]
SEN54 = [('ERNESTO SIMÕES FILHO', 'PSD'), ('HÉLIO DE BURGOS CABAL', 'PR'), ('LIMA TEIXEIRA', 'PTB'), ('JURACY MAGALHÃES', 'UDN'), ('PINTO ALEIXO', 'PSD')]
k = 0; j = 0
while j < len(L):
    n = int(L[j][1]); R = [list(map(int, r)) for r in L[j + 1:j + 8]]; j += 8
    for c in range(n):
        i = ib(G[k]); k += 1
        for (nm, p), r in zip(SEN54, R): s.append(('senador', 1, i, '_' + chave(nm), nm, p, r[c]))
        s += [('senador', 1, i, '#brancos', '', '', R[5][c]), ('senador', 1, i, '#nulos', '', '', R[6][c])]
gravar('data/tre/1954/ba.csv', s, {('governador', '_' + chave('ANTÔNIO BALBINO')): 'S', ('senador', '_' + chave('JURACY MAGALHÃES')): 'S', ('senador', '_' + chave('LIMA TEIXEIRA')): 'S'},
       fonte='TRE-BA, Resultado final das eleições de 3 de outubro de 1954 (por município)')
s = []
for m, v in blocos('data/tre/fontes/ba-1958/majoritarias.txt', 11):
    i = ib(m)
    for (n, p), x in zip([('OCTÁVIO MANGABEIRA', 'PL'), ('EDUARDO CATALÃO', 'PTB')], v[:2]): s.append(('senador', 1, i, '_' + chave(n), n, p, x))
    s += [('senador', 1, i, '#brancos', '', '', v[2]), ('senador', 1, i, '#nulos', '', '', v[3])]
    for (n, p), x in zip([('JURACY MAGALHÃES', 'UDN'), ('FARANI PEDREIRA DE FREITAS', 'PSD'), ('TARCILO VIEIRA DE MELLO', 'PDC')], v[5:8]):
        s.append(('governador', 1, i, '_' + chave(n), n, p, x))
    s += [('governador', 1, i, '#brancos', '', '', v[8]), ('governador', 1, i, '#nulos', '', '', v[9])]
gravar('data/tre/1958/ba.csv', s, {('governador', '_' + chave('JURACY MAGALHÃES')): 'S', ('senador', '_' + chave('OCTÁVIO MANGABEIRA')): 'S'},
       fonte='TRE-BA, Resultado final das eleições de 3 de outubro de 1958 (por município)')
print('sem código:', sorted(fora))
