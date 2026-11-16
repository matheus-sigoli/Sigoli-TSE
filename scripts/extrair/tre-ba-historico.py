#!/usr/bin/env python3
"""Bahia, Governador 1947 e 1950: PDFs datilografados do acervo transcritos à mão (linhas conferidas pela soma) em
data/tre/fontes/ba-{ano}/governador.tsv → data/tre/{ano}/ba.csv. Uso: python3 scripts/extrair/tre-ba-historico.py"""
import csv, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar, chave
achar = ibge_por_nome('ba')
ANOS = {
    1947: ([('OTÁVIO MANGABEIRA', 'UDN'), ('MEDEIROS NETO', 'PSD')], None, 'Representação política: resultado da eleição para Governo do Estado (19/01/1947)'),
    1950: ([('RÉGIS PACHECO', 'PSD'), ('JURACI MAGALHÃES', 'UDN')], ('#brancos', '#nulos', '#comparecimento'), 'TRE-BA, eleições de 3/10/1950, Governador do Estado'),
}
for ano, (cands, tots, fonte) in ANOS.items():
    linhas = []; soma = [0] * len(cands)
    for r in csv.reader((l for l in open(f'data/tre/fontes/ba-{ano}/governador.tsv', encoding='utf8') if not l.startswith('#')), delimiter='\t'):
        ib = achar(r[0]); v = list(map(int, r[1:]))
        votos = v[1:] if ano == 1947 else v[:len(cands)]
        for i, ((n, p), x) in enumerate(zip(cands, votos)):
            linhas.append(('governador', 1, ib, '_' + chave(n), n, p, x)); soma[i] += x
        if tots:
            for t, x in zip(tots, v[len(cands):]): linhas.append(('governador', 1, ib, t, '', '', x))
    venc = max(range(len(cands)), key=lambda i: soma[i])
    os.makedirs(f'data/tre/{ano}', exist_ok=True)
    gravar(f'data/tre/{ano}/ba.csv', linhas, {('governador', '_' + chave(cands[venc][0])): 'S'}, fonte=fonte)
