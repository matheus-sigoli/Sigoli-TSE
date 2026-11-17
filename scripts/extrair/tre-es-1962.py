#!/usr/bin/env python3
"""Espírito Santo 1962 (governador e senador, duas vagas): TRE-ES, "Resultado das Eleições de 7 de Outubro de 1962"
(folha única do acervo, Mapas/ES/Resultados/ES 1962.pdf), transcrita em data/tre/fontes/es-1962/majoritarias.txt.
Cada município conferido (senado = 2 × governador) e os totais do estado batem com a coluna TOTAL da folha.
Esp. Santo, na folha, é o atual Vila Velha. Partidos: Eurico Rezende (UDN) e Francisco Lacerda de Aguiar (PTB) pela
Coligação Democrática; Jones dos Santos Neves e Carlos Lindenberg (PSD); Raul Giuberti e Olympio José de Abreu sem
partido confirmado (N/I). Uso: python3 scripts/extrair/tre-es-1962.py"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar, chave
achar = ibge_por_nome('es')
SEN = [('EURICO REZENDE', 'UDN'), ('RAUL GIUBERTI', 'N/I'), ('CARLOS FERNANDO MONTEIRO LINDENBERG', 'PSD'), ('OLYMPIO JOSÉ DE ABREU', 'N/I')]
GOV = [('FRANCISCO LACERDA DE AGUIAR', 'PTB'), ('JONES DOS SANTOS NEVES', 'PSD')]
s = []; fora = []
for l in open('data/tre/fontes/es-1962/majoritarias.txt', encoding='utf8'):
    if l.startswith('#') or not l.strip(): continue
    p = l.strip().split(';'); ib = achar(p[0])
    if not ib: fora.append(p[0]); continue
    v = list(map(int, p[1:]))
    for (n, pt), x in zip(SEN, v[:4]): s.append(('senador', 1, ib, '_' + chave(n), n, pt, x))
    s += [('senador', 1, ib, '#brancos', '', '', v[4]), ('senador', 1, ib, '#nulos', '', '', v[5])]
    for (n, pt), x in zip(GOV, v[6:8]): s.append(('governador', 1, ib, '_' + chave(n), n, pt, x))
    s += [('governador', 1, ib, '#brancos', '', '', v[8]), ('governador', 1, ib, '#nulos', '', '', v[9])]
os.makedirs('data/tre/1962', exist_ok=True)
gravar('data/tre/1962/es.csv', s, {('governador', '_' + chave('FRANCISCO LACERDA DE AGUIAR')): 'S',
                                   ('senador', '_' + chave('EURICO REZENDE')): 'S', ('senador', '_' + chave('RAUL GIUBERTI')): 'S'},
       fonte='TRE-ES, Resultado das Eleições de 7 de Outubro de 1962 (por município)')
print('sem código:', fora)
