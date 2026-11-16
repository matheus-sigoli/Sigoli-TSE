#!/usr/bin/env python3
"""Pernambuco 1978, Senador: TRE-PE, Relatório das Eleições de 1978, quadro "Resultado das Eleições de 15.11.78 -
Senado Federal" por município (votos por partido), em data/tre/fontes/pe-1978/senado-por-municipio.tsv.
O quadro por município só traz o partido: a ARENA soma as sublegendas Nilo Coelho (367.720, eleito) e Cid Sampaio
(325.777); o MDB é Jarbas Vasconcelos (654.592). Uso: python3 scripts/extrair/tre-pe-1978.py"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar, chave
achar = ibge_por_nome('pe')
NOMES = {'Af. da Ingazeira': 'Afogados da Ingazeira', 'Jaboatão': 'Jaboatão dos Guararapes', 'Cabo': 'Cabo de Santo Agostinho',
         'Itamaracá': 'Ilha de Itamaracá', 'Sítio dos Moreiras': 'Moreilândia', 'Iguaraci': 'Iguaracy', 'Carnalba': 'Carnaíba',
         'Chá de Alegria': 'Chã de Alegria', 'lati': 'Iati', 'ltaquitinga': 'Itaquitinga', 'Parimatama': 'Paranatama',
         'Petrolimi': 'Petrolina', 'Ferre\'ros': 'Ferreiros', 'Barra Guabiraba': 'Barra de Guabiraba',
         'Belém São Francisco': 'Belém do São Francisco', 'Cachoei ri n ha': 'Cachoeirinha', 'Camocim S. Félix': 'Camocim de São Félix',
         'Santa Maria Cambucá': 'Santa Maria do Cambucá', 'São José Belmonte': 'São José do Belmonte', 'Ouricuri .': 'Ouricuri',
         'Salgadinho\'': 'Salgadinho', 'Taquaritinga do Nort': 'Taquaritinga do Norte', 'Brejo Madre de Deus': 'Brejo da Madre de Deus'}
CANDS = [('NILO COELHO E CID SAMPAIO (SUBLEGENDAS)', 'ARENA'), ('JARBAS VASCONCELOS', 'MDB')]
saida = []
for l in open('data/tre/fontes/pe-1978/senado-por-municipio.tsv', encoding='utf8'):
    if l.startswith('#') or not l.strip(): continue
    n, nome, *v = l.rstrip('\n').split('\t'); v = list(map(int, v))
    i = achar(NOMES.get(nome, nome))
    if not i: continue
    for (c, p), x in zip(CANDS, v): saida.append(('senador', 1, i, '_' + chave(c), c, p, x))
    saida += [('senador', 1, i, '#brancos', '', '', v[2]), ('senador', 1, i, '#nulos', '', '', v[3])]
gravar('data/tre/1978/pe.csv', saida, {('senador', '_' + chave(CANDS[0][0])): 'S'},
       fonte='TRE-PE, Relatório das Eleições de 1978 (Senado Federal, votos por partido e município; ARENA = sublegendas Nilo Coelho, eleito, e Cid Sampaio)')
