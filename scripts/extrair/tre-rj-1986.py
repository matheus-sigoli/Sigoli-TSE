#!/usr/bin/env python3
"""TRE-RJ/SERPRO, 1986, "Candidatos mais votados no município" (PDF digitalizado, 101 páginas) → data/tre/1986/rj.csv.
O OCR (scripts/extrair/tre-rj-1986-ocr.py, tesseract) lê a linha GOVERN. com o voto de cada partido, brancos e nulos;
cada município é conferido pela soma = votantes; os que não fecharam foram lidos à mão na imagem.
Resultado em data/tre/fontes/rj-1986-governador.json. Uso: python3 scripts/extrair/tre-rj-1986.py"""
import json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar
achar = ibge_por_nome('rj')
C = {'PMDB': ('_MOREIRAFRANCO', 'WELLINGTON MOREIRA FRANCO'), 'PDT': ('_DARCYRIBEIRO', 'DARCY RIBEIRO'),
     'PT': ('_GABEIRA', 'FERNANDO PAULO NAGLE GABEIRA'), 'PASART': ('_AARAO', 'AARÃO STEINBRUCH'),
     'PDS': ('_TIMOTEO', 'AGNALDO TIMÓTEO'), 'PSB': ('_SINVAL', 'SINVAL PALMEIRA'), 'PND': ('_PND', 'PND')}
d = json.load(open('data/tre/fontes/rj-1986-governador.json', encoding='utf8'))
linhas = []
for mun, r in d.items():
    ib = achar(mun)
    for p, v in r['c'].items(): linhas.append(('governador', 1, ib, C[p][0], C[p][1], p, v))
    linhas += [('governador', 1, ib, '#brancos', '', '', r['brancos']), ('governador', 1, ib, '#nulos', '', '', r['nulos']),
               ('governador', 1, ib, '#comparecimento', '', '', r['votantes'])]
gravar('data/tre/1986/rj.csv', linhas, {('governador', '_MOREIRAFRANCO'): 'S'}, fonte='TRE-RJ/SERPRO, candidatos mais votados no município, eleições de 15/11/1986')
