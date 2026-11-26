#!/usr/bin/env python3
"""Estado do Rio de Janeiro 1954 (governador e senador, duas vagas): TRE-RJ, "Resultado Geral das Eleições de 3 de
Outubro de 1954" (1955; PDF do acervo, Mapas/RJ/Resultados), mapas do Sistema Majoritário por zona e município
transcritos à mão em data/tre/fontes/rj-1954/governador.txt (p. 75) e senador.txt (p. 48). Cada município conferido
com o seu total de votantes (senado = 2 × governador) e cada faixa da tabela com o "a transportar"; os totais do estado
batem com a coluna TOTAL do TRE-RJ. Partidos: Pereira Pinto, Abelardo Matta e Paulo Bruno pela UDN (coligação APF no relatório). Itaverá é o atual Rio Claro. Uso: python3 scripts/extrair/tre-rj-1954.py"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar, chave
achar = ibge_por_nome('rj')
NOMES = {'Itaverá': 'Rio Claro'}
GOV = [('BRÍGIDO FERNANDES TINOCO', 'PSB'), ('DARUIZ ROSÉS PARANHOS DE OLIVEIRA', 'PSP'), ('JOSÉ CARLOS PEREIRA PINTO', 'UDN'),
       ('MIGUEL COUTO FILHO', 'PSD')]
SEN = [('ABELARDO DOS SANTOS MATTA', 'UDN'), ('MURILO CESAR DOS SANTOS', 'PSP'), ('PAULO BRUNO BRITO DE ARAÚJO', 'UDN'),
       ('PAULO DA SILVA FERNANDES', 'PSD'), ('TARCÍSIO D\'ALMEIDA MIRANDA', 'PSD')]
# Vice-Governador (p. 76; cada linha confere com os votantes e os totais batem com a coluna TOTAL): Roberto Silveira (PTB,
# na chapa de Miguel Couto); Horácio Gomes Leite de Carvalho Júnior e Walter Peixoto sem partido confirmado (N/I)
VICE = [('HORÁCIO GOMES LEITE DE CARVALHO JÚNIOR', 'N/I'), ('ROBERTO TEIXEIRA DA SILVEIRA', 'PTB'), ('WALTER PEIXOTO', 'N/I')]
s = []; fora = []
for arq, cargo, cands in (('governador', 'governador', GOV), ('senador', 'senador', SEN), ('vice-governador', 'vice-governador', VICE)):
    for l in open(f'data/tre/fontes/rj-1954/{arq}.txt', encoding='utf8'):
        if l.startswith('#') or not l.strip(): continue
        p = l.strip().split(';'); ib = achar(NOMES.get(p[0], p[0]))
        if not ib: fora.append(p[0]); continue
        v = list(map(int, p[1:]))
        if cargo == 'vice-governador': s.append((cargo, 1, ib, '#comparecimento', '', '', v[-1])); v = v[:-1]
        for (n, pt), x in zip(cands, v): s.append((cargo, 1, ib, '_' + chave(n), n, pt, x))
        s += [(cargo, 1, ib, '#brancos', '', '', v[-2]), (cargo, 1, ib, '#nulos', '', '', v[-1])]
os.makedirs('data/tre/1954', exist_ok=True)
gravar('data/tre/1954/rj.csv', s, {('governador', '_' + chave('MIGUEL COUTO FILHO')): 'S',
                                   ('senador', '_' + chave('PAULO DA SILVA FERNANDES')): 'S',
                                   ('vice-governador', '_' + chave('ROBERTO TEIXEIRA DA SILVEIRA')): 'S',
                                   ('senador', '_' + chave('TARCÍSIO D\'ALMEIDA MIRANDA')): 'S'},
       fonte='TRE-RJ, Resultado Geral das Eleições de 3 de Outubro de 1954 (por município)')
print('sem código:', fora)
