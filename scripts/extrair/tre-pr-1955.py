#!/usr/bin/env python3
"""Paraná 1955 (governador): TRE-PR, "Mapa totalizador" da eleição majoritária para governador (Curitiba, novembro de
1955; PDF do acervo, Mapas/PR/Resultados, p. 9-15), transcrito em data/tre/fontes/pr-1955/governador.txt. Cada linha
conferida (soma dos cinco candidatos = coluna "Somas") e os totais dos candidatos batem exatamente com o total do mapa
(Tourinho 46.082, Lupion 185.108, Osório 417, Mader 66.207, Barros 131.152). As colunas de brancos/nulos/votantes do
mapa estão às vezes deslocadas uma linha, por isso o comparecimento não é usado. Municípios com mais de uma zona somam.
Araruva é a atual Marilândia do Sul e Rio Cinzas, Jundiaí do Sul. Partidos (Wikipédia): Lupion PSD, Mário de Barros PTB, Othon Mader UDN, Luís Tourinho PSP, Carlos Amoreti Osório PSB.
Uso: python3 scripts/extrair/tre-pr-1955.py"""
import collections, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar, chave
achar = ibge_por_nome('pr')
NOMES = {'Timbú': 'Campina Grande do Sul', 'Timoneira': 'Almirante Tamandaré', 'Amoreira': 'Nova América da Colina',
         'Araruva': 'Marilândia do Sul', 'Rio Cinzas': 'Jundiaí do Sul'}
CANDS = [('LUÍS CARLOS PEREIRA TOURINHO', 'PSP'), ('MOISÉS LUPION', 'PSD'), ('CARLOS AMORETI OSÓRIO', 'PSB'),
         ('OTHON MADER', 'UDN'), ('MÁRIO BATISTA DE BARROS', 'PTB')]
soma = collections.defaultdict(lambda: [0] * 7); fora = set()
for l in open('data/tre/fontes/pr-1955/governador.txt', encoding='utf8'):
    if l.startswith('#') or not l.strip(): continue
    p = l.strip().split(';'); nome = NOMES.get(p[0], p[0]); ib = achar(nome)
    if not ib: fora.add(p[0]); continue
    v = list(map(int, p[1:6])) + list(map(int, p[7:9]))
    soma[ib] = [a + b for a, b in zip(soma[ib], v)]
s = []
for ib, v in soma.items():
    for (n, pt), x in zip(CANDS, v): s.append(('governador', 1, ib, '_' + chave(n), n, pt, x))
    s += [('governador', 1, ib, '#brancos', '', '', v[5]), ('governador', 1, ib, '#nulos', '', '', v[6])]
os.makedirs('data/tre/1955', exist_ok=True)
gravar('data/tre/1955/pr.csv', s, {('governador', '_' + chave('MOISÉS LUPION')): 'S'},
       fonte='TRE-PR, Mapa totalizador da eleição para governador de 3 de outubro de 1955 (por município)')
print('sem código:', sorted(fora), len(soma))
