#!/usr/bin/env python3
"""Bahia, Senador 1990: TRE-BA, "Demonstrativo da votação do candidato VP-005" (PDF do acervo, Mapas/BA/Resultados/
1990 - BA - Governador e Senador.pdf, páginas 33 a 62, uma listagem por candidato), lido por OCR e conferido em
data/tre/fontes/ba-1990/senador.csv: cada voto bate com o percentual impresso (voto / comparecimento) e as linhas que não
batiam foram lidas na imagem. As somas por candidato batem com a "votação total" impressa (Elizabeth Wagner 8 votos abaixo,
Josaphat Marinho 1). Salvador vem por zona eleitoral e soma. Uso: python3 scripts/extrair/tre-ba-1990-senado.py"""
import collections, csv, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from comum import gravar, chave
linhas_csv = [l for l in open('data/tre/fontes/ba-1990/senador.csv', encoding='utf8') if not l.startswith('#')]
rd = csv.reader(linhas_csv, delimiter=';'); cab = next(rd)
cands = [re.match(r'(.+) \((.+)\)', c).groups() for c in cab[3:]]
soma = collections.defaultdict(lambda: [0] * (1 + len(cands)))
for r in rd:
    soma[r[0]] = [a + int(b) for a, b in zip(soma[r[0]], r[2:])]
linhas = []
for ib, v in soma.items():
    linhas += [('senador', 1, ib, '_' + chave(n), n, p, x) for (n, p), x in zip(cands, v[1:])]
    linhas.append(('senador', 1, ib, '#comparecimento', '', '', v[0]))
gravar('data/tre/1990/ba-senado.csv', linhas, {('senador', '_' + chave('JOSAPHAT RAMOS MARINHO')): 'S'},
       fonte='TRE-BA, demonstrativo da votação do candidato a Senador por município, eleições de 3/10/1990')
print(len(soma), [sum(v[i] for v in soma.values()) for i in range(len(cands) + 1)])
