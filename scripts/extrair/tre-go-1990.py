#!/usr/bin/env python3
"""Goiás, Governador de 1990 (turno único): TRE-GO, boletim de totalização por zona e município (TIF do acervo,
Mapas/GO/Resultados), transcrito à mão em data/tre/fontes/go-1990/governador.txt. Cada linha de município foi conferida
(candidatos + brancos + nulos = total impresso) e as linhas "=" são os totais de zona impressos, conferidos com a soma
dos municípios. A coluna PL do boletim vem sempre vazia (o PL estava na coligação Mutirão e Progresso) e é ignorada.
Algumas páginas não estão no TIF; a soma transcrita fica ~0,4% abaixo do "TOTAL GERAL DO ESTADO" impresso.
Municípios com mais de uma zona (Goiânia, Anápolis…) somam.
Nomes e números dos candidatos: Wikipédia, "Eleições estaduais em Goiás em 1990" (resultado do TRE-GO).
Uso: python3 scripts/extrair/tre-go-1990.py"""
import collections, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar
achar = ibge_por_nome('go')
NOMES = {'Moçâmedes': 'Mossâmedes', 'Bom Jesus de Goiás': 'Bom Jesus'}
# colunas do arquivo: uniao_acorda_goias;pt_psb;mutirao_e_progresso;popular;pl;brancos;nulos;total
CANDS = [('17', 'PAULO ROBERTO CUNHA', 'PDC'), ('13', 'VALDI CAMARCIO', 'PT'), ('15', 'IRIS REZENDE MACHADO', 'PMDB'),
         ('12', 'IRAM DE ALMEIDA SARAIVA', 'PDT')]
soma = collections.defaultdict(lambda: [0] * 7); fora = []
for l in open('data/tre/fontes/go-1990/governador.txt', encoding='utf8'):
    if l.startswith(('#', '=')) or not l.strip(): continue
    p = l.strip().split(';'); nome = NOMES.get(p[1], p[1]); ib = achar(nome)
    if not ib: fora.append(nome); continue
    v = list(map(int, p[2:]))
    soma[ib] = [a + b for a, b in zip(soma[ib], v[:4] + v[5:8])]
linhas = []
for ib, v in soma.items():
    linhas += [('governador', 1, ib, n, nm, pt, x) for (n, nm, pt), x in zip(CANDS, v[:4])]
    linhas += [('governador', 1, ib, '#brancos', '', '', v[4]), ('governador', 1, ib, '#nulos', '', '', v[5]),
               ('governador', 1, ib, '#comparecimento', '', '', v[6])]
gravar('data/tre/1990/go.csv', linhas, {('governador', '15')},
       fonte='TRE-GO, totalização da eleição para Governador de 3 de outubro de 1990, por zona e município')
print('sem código:', fora, len(soma), [sum(v[i] for v in soma.values()) for i in range(7)])
