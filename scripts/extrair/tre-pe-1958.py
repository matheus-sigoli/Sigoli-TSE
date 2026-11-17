#!/usr/bin/env python3
"""Pernambuco 1958, Senador (1 vaga): TRE-PE, relatório das eleições de 1958, "Eleição majoritária para Senador" por
zona eleitoral (p. 1794 do PDF do acervo, Mapas/PE/Resultados/PE 1958.pdf), transcrito em
data/tre/fontes/pe-1958/senador.txt e conferido linha a linha com os votantes da zona. O mapa do governador não está
no PDF (só o do vice-governador). Cada zona vai para a sede (mesma numeração de 1962; zona 111 = Garanhuns) e, no mapa,
os municípios sem zona vão para o vizinho (data/malhas-historicas/agrupar/1958-pe.csv).
Uso: python3 scripts/extrair/tre-pe-1958.py"""
import collections, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar, chave
achar = ibge_por_nome('pe')
src = open(os.path.join(os.path.dirname(__file__), 'tre-pe-1962.py'), encoding='utf8').read()
lista = re.search(r"SEDE.update\(dict\(enumerate\('''(.*?)'''", src, re.S).group(1).replace('\n', '').split(';')
SEDE = {z: 'Recife' for z in range(1, 10)}
SEDE.update(dict(enumerate(lista, start=10)))
SEDE[59] = 'Correntes'
SEN = [('APOLÔNIO SALES', 'PSD'), ('BARROS CARVALHO', 'PTB')]
mun = collections.defaultdict(lambda: [0] * 4); fora = []
for l in open('data/tre/fontes/pe-1958/senador.txt', encoding='utf8'):
    if l.startswith('#') or not l.strip(): continue
    r = list(map(int, l.strip().split(';'))); ib = achar(SEDE.get(r[0]) or '')
    if not ib: fora.append(r[0]); continue
    for j in range(4): mun[ib][j] += r[1 + j]
out = []
for ib, v in mun.items():
    for (n, p), x in zip(SEN, v[:2]): out.append(('senador', 1, ib, '_' + chave(n), n, p, x))
    out += [('senador', 1, ib, '#brancos', '', '', v[2]), ('senador', 1, ib, '#nulos', '', '', v[3])]
os.makedirs('data/tre/1958', exist_ok=True)
gravar('data/tre/1958/pe.csv', out, {('senador', '_' + chave('BARROS CARVALHO')): 'S'},
       fonte='TRE-PE, relatório das eleições de 3 de outubro de 1958 (Senado por zona eleitoral)')
print('zonas sem sede:', fora)
