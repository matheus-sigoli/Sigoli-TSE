#!/usr/bin/env python3
"""Pernambuco 1986, Governador e Senador (2 vagas): TRE-PE, Relatório das Eleições de 1986, "Eleições Majoritárias
(resultados por município)", transcrito à mão das páginas digitalizadas em data/tre/fontes/pe-1986/ (governador.tsv,
senador.txt; senado conferido com 2 × votantes do governador e com o total do estado).
Uso: python3 scripts/extrair/tre-pe-1986.py"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar, chave
achar = ibge_por_nome('pe')
NOMES = {'JABOATÃO': 'Jaboatão dos Guararapes', 'CABO': 'Cabo de Santo Agostinho', 'ITAMARACÁ': 'Ilha de Itamaracá',
         'SÍTIO DOS MOREIRAS': 'Moreilândia', 'BELÉM DE SÃO FRANCISCO': 'Belém do São Francisco', 'IGUARACI': 'Iguaracy'}
GOV = [('JOSÉ MÚCIO MONTEIRO', 'PFL'), ('MIGUEL ARRAES', 'PMDB')]
SEN = [('ROBERTO MAGALHÃES', 'PFL'), ('MARGARIDA CANTARELLI', 'PFL'), ('MANSUETO DE LAVOR', 'PMDB'), ('ANTÔNIO FARIAS', 'PMB'),
       ('JACOB TUMAJAN', 'N/I'), ('CID SAMPAIO', 'PL'), ('IVAN MAURÍCIO', 'N/I')]
P = 'data/tre/fontes/pe-1986/'
G = [l.rstrip('\n').split('\t') for l in open(P + 'governador.tsv', encoding='utf8') if not l.startswith('#')]
ib = []
for g in G:
    i = achar(NOMES.get(g[0], g[0]))
    if not i: print('  ⚠ sem código:', g[0])
    ib.append(i)
saida = []
for i, g in zip(ib, G):
    if not i: continue
    v = list(map(int, g[1:]))
    for (n, p), x in zip(GOV, v): saida.append(('governador', 1, i, '_' + chave(n), n, p, x))
    saida += [('governador', 1, i, '#brancos', '', '', v[2]), ('governador', 1, i, '#nulos', '', '', v[3])]
L = [l.split() for l in open(P + 'senador.txt', encoding='utf8') if l.strip() and not l.startswith('#')]
k = 0; j = 0
while j < len(L):
    n = int(L[j][1]); rows = [list(map(int, r)) for r in L[j + 1:j + 10]]; j += 10
    for c in range(n):
        i = ib[k]; k += 1
        if not i: continue
        for (nm, p), r in zip(SEN, rows): saida.append(('senador', 1, i, '_' + chave(nm), nm, p, r[c]))
        saida += [('senador', 1, i, '#brancos', '', '', rows[7][c]), ('senador', 1, i, '#nulos', '', '', rows[8][c])]
gravar('data/tre/1986/pe.csv', saida, {('governador', '_' + chave('MIGUEL ARRAES')): 'S',
       ('senador', '_' + chave('MANSUETO DE LAVOR')): 'S', ('senador', '_' + chave('ANTÔNIO FARIAS')): 'S'},
       fonte='TRE-PE, Relatório das Eleições de 1986 (eleições majoritárias, resultados por município)')
