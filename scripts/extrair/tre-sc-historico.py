#!/usr/bin/env python3
"""Santa Catarina 1947–1965 (governador; senado em 1950): mapas gerais do TRE-SC no acervo (Mapas/SC/SC {ano}.pdf),
transcritos à mão em data/tre/fontes/sc-{ano}/. Os totais do estado batem com a linha TOTAL de cada mapa, menos 1947
(Irineu Bornhausen fica 20 votos abaixo) e 1965 (as linhas por município somam um pouco mais que o TOTAL da folha).
- 1947: por zona eleitoral (35 zonas; as duas de Florianópolis somam); no mapa, a sede da zona recebe o resultado e os
  municípios sem dado vão para o vizinho (data/malhas-historicas/agrupar/1947-sc.csv). Serra Alta = São Bento do Sul.
- 1950 e o senado de 1950: só votos dos candidatos (a Resenha Eleitoral não traz brancos e nulos por município).
- 1955, 1960 e 1965: com brancos e nulos.
Uso: python3 scripts/extrair/tre-sc-historico.py"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar, chave
achar = ibge_por_nome('sc')
NOMES = {'Serra Alta': 'São Bento do Sul', 'Dois Irmãos': 'Presidente Castello Branco', 'Ganchos': 'Governador Celso Ramos'}
F = 'data/tre/fontes/sc-{}/{}.txt'
fora = []

def linhas(ano, arq):
    for l in open(F.format(ano, arq), encoding='utf8'):
        if l.startswith('#') or not l.strip(): continue
        yield l.strip().split(';')

def cod(nome):
    c = achar(NOMES.get(nome, nome))
    if not c: fora.append(nome)
    return c

def add(s, cargo, ib, cands, votos, br=None, nu=None):
    for (n, p), v in zip(cands, votos): s.append((cargo, 1, ib, '_' + chave(n), n, p, int(v)))
    if br is not None: s += [(cargo, 1, ib, '#brancos', '', '', int(br)), (cargo, 1, ib, '#nulos', '', '', int(nu))]

ANOS = {
    1947: ('Aderbal Ramos da Silva', [('ADERBAL RAMOS DA SILVA', 'PSD'), ('IRINEU BORNHAUSEN', 'UDN'), ('CARLOS SADA', 'PRP')]),
    1950: ('Irineu Bornhausen', [('IRINEU BORNHAUSEN', 'UDN'), ('UDO DEEKE', 'PSD')]),
    1955: ('Jorge Lacerda', [('FRANCISCO BENJAMIM GALLOTTI', 'PSD'), ('JORGE LACERDA', 'PRP')]),
    1960: ('Celso Ramos', [('CELSO RAMOS', 'PSD'), ('IRINEU BORNHAUSEN', 'UDN')]),
    1965: ('Ivo Silveira', [('IVO SILVEIRA', 'PSD'), ('ANTÔNIO CARLOS KONDER REIS', 'UDN')]),
}
FONTE = {1947: 'TRE-SC, Apuração final do pleito de 19 de janeiro de 1947 (por zona eleitoral)',
         1950: 'TRE-SC, Resenha Eleitoral (jan.-fev. 1951), resultado por município',
         1955: 'TRE-SC, Mapa geral por município do pleito de 3 de outubro de 1955',
         1960: 'TRE-SC, Resultado das eleições de 3-10-1960 por município',
         1965: 'TRE-SC, Eleição de 3 de outubro de 1965, votação por município'}
for ano, (eleito, G) in ANOS.items():
    s = []
    if ano == 1947:
        for z in linhas(ano, 'governador'):
            ib = cod(z[1])
            if ib: add(s, 'governador', ib, G, z[3:6], z[6], z[7])
    elif ano == 1950:
        for r in linhas(ano, 'governador'):
            ib = cod(r[0])
            if ib: add(s, 'governador', ib, G, r[1:3])
        for r in linhas(ano, 'senador'):
            ib = cod(r[0])
            if ib: add(s, 'senador', ib, [('CARLOS GOMES DE OLIVEIRA', 'PTB'), ('NEREU RAMOS', 'PSD')], r[1:3])
    elif ano == 1955:
        for r in linhas(ano, 'governador'):
            ib = cod(r[0])
            if ib: add(s, 'governador', ib, G, r[1:3], r[3], r[4])
    elif ano == 1960:
        for r in linhas(ano, 'governador'):
            ib = cod(r[0])
            if ib: add(s, 'governador', ib, G, r[3:5], r[1], r[2])
    else:
        for r in linhas(ano, 'governador'):
            ib = cod(r[0])
            if ib: add(s, 'governador', ib, G, r[2:4], r[4], r[5])
    el = {('governador', '_' + chave(eleito.upper())): 'S'}
    if ano == 1950: el[('senador', '_' + chave('CARLOS GOMES DE OLIVEIRA'))] = 'S'
    nome = f'data/tre/{ano}/sc-tre.csv' if ano == 1955 else f'data/tre/{ano}/sc.csv'
    os.makedirs(f'data/tre/{ano}', exist_ok=True)
    gravar(nome, s, el, fonte=FONTE[ano])
print('sem código:', sorted(set(fora)))
