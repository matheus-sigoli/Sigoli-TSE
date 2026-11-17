#!/usr/bin/env python3
"""Pernambuco 1954, Governador e Senador (2 vagas): TRE-PE, "Resultado Final das Eleições Realizadas a 3 de Outubro
de 1954" (PDF do acervo, Mapas/PE/Resultados/PE 1954.pdf), por zona eleitoral, transcrito à mão em
data/tre/fontes/pe-1954/governador.txt e senador.txt. Cada zona conferida (governador: candidatos + brancos + nulos =
votantes; senado = 2 × votantes) e cada página com a sua linha SOMA (algumas somas do próprio relatório não fecham por
poucos votos). Cada zona vai para o município-sede (1–9 = Recife); no mapa, os municípios sem zona vão para o vizinho
(data/malhas-historicas/agrupar/1954-pe.csv). Partidos: Cordeiro de Farias (PSD, coligação PSD-PSP), João Cleofas
(UDN); Senado como na Agência Senado (primeiro partido da legenda). Uso: python3 scripts/extrair/tre-pe-1954.py"""
import collections, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar, chave
achar = ibge_por_nome('pe')
GOV = [('JOÃO CLEOFAS', 'UDN'), ('OSVALDO CORDEIRO DE FARIAS', 'PSD')]
SEN = [('BARBOSA LIMA SOBRINHO', 'UDN'), ('JARBAS MARANHÃO', 'UDN'), ('NOVAES FILHO', 'PSD'), ('JOÃO INÁCIO RIBEIRO ROMA', 'PSD')]
def ler(arq):
    for l in open(f'data/tre/fontes/pe-1954/{arq}.txt', encoding='utf8'):
        if l.startswith('#') or not l.strip() or l.startswith('SOMA'): continue
        yield l.strip().split(';')
sede = {}; g = collections.defaultdict(lambda: [0] * 4); s = collections.defaultdict(lambda: [0] * 6); fora = []
for r in ler('governador'):
    ib = achar(r[1])
    if not ib: fora.append(r[1]); continue
    sede[r[0]] = ib
    for j in range(4): g[ib][j] += int(r[2 + j])
for r in ler('senador'):
    ib = sede.get(r[0])
    if not ib: continue
    for j in range(6): s[ib][j] += int(r[1 + j])
out = []
for ib, v in g.items():
    for (n, p), x in zip(GOV, v): out.append(('governador', 1, ib, '_' + chave(n), n, p, x))
    out += [('governador', 1, ib, '#brancos', '', '', v[2]), ('governador', 1, ib, '#nulos', '', '', v[3])]
for ib, v in s.items():
    for (n, p), x in zip(SEN, v): out.append(('senador', 1, ib, '_' + chave(n), n, p, x))
    out += [('senador', 1, ib, '#brancos', '', '', v[4]), ('senador', 1, ib, '#nulos', '', '', v[5])]
os.makedirs('data/tre/1954', exist_ok=True)
gravar('data/tre/1954/pe.csv', out, {('governador', '_' + chave('OSVALDO CORDEIRO DE FARIAS')): 'S',
                                     ('senador', '_' + chave('JARBAS MARANHÃO')): 'S', ('senador', '_' + chave('NOVAES FILHO')): 'S'},
       fonte='TRE-PE, Resultado Final das Eleições de 3 de outubro de 1954 (por zona eleitoral)')
print('sem código:', fora)
