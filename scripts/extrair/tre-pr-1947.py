#!/usr/bin/env python3
"""Paraná 1947 (governador): planilha do acervo (Mapas/PR/Resultados/PR 1947.xlsx, "Resultados das Eleições de 1947"),
votos de Lupion e Bento Munhoz por município, sem brancos e nulos. A soma dos municípios (91.041 e 45.941) bate com o
total oficial a menos de 18 votos de Lupion (a linha TOTAL da planilha só soma parte das linhas); o total do estado
fica o oficial (data/oficial/1947.csv, Wikipédia). Imbuial (distrito de Colombo) soma em
Colombo; Timoneira é Almirante Tamandaré; Wenceslau é Wenceslau Braz. Uso: python3 scripts/extrair/tre-pr-1947.py"""
import collections, os, sys, openpyxl
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar, chave
ARQ = '/mnt/user-data/uploads/Acervo de Mapas - Governador/Mapas/PR/Resultados/PR 1947.xlsx'
achar = ibge_por_nome('pr')
NOMES = {'Imbuial (dist. de Colombo)': 'Colombo', 'Timoneira (Alm. Tamandaré)': 'Almirante Tamandaré', 'Wenceslau': 'Wenceslau Braz',
         'Pìraquara': 'Piraquara', 'Piraí': 'Piraí do Sul'}
CANDS = [('MOISÉS LUPION', 'PSD'), ('BENTO MUNHOZ DA ROCHA', 'PR')]
soma = collections.defaultdict(lambda: [0, 0]); fora = []
ws = openpyxl.load_workbook(ARQ, data_only=True).active
dentro = False
for r in ws.iter_rows(values_only=True):
    if r[0] == 'Município/Zona eleitoral': dentro = True; continue
    if not dentro or not r[0]: continue
    if r[0] == 'TOTAL': break
    ib = achar(NOMES.get(r[0], r[0]))
    if not ib: fora.append(r[0]); continue
    soma[ib] = [soma[ib][0] + int(r[2] or 0), soma[ib][1] + int(r[3] or 0)]
s = [('governador', 1, ib, '_' + chave(n), n, pt, x) for ib, v in soma.items() for (n, pt), x in zip(CANDS, v)]
os.makedirs('data/tre/1947', exist_ok=True)
gravar('data/tre/1947/pr.csv', s, {('governador', '_' + chave('MOISÉS LUPION')): 'S'},
       fonte='Acervo Sigoli.TSE, Resultados das Eleições de 1947 no Paraná (por município)')
print('sem código:', fora, len(soma), [sum(v[i] for v in soma.values()) for i in (0, 1)])
