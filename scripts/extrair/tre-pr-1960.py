#!/usr/bin/env python3
"""Paraná 1960: Presidente, Vice-Presidente e Governador por município, TRE-PR, "Resultados gerais apurados" (31/10/1960;
PDF do acervo, Mapas/PR/Resultados/PR 1960.pdf, p. 4-8, 9-12 e 15-18), transcritos em data/tre/fontes/pr-1960/.
Cada linha conferida (candidatos + brancos + nulos = votantes), cada zona com a sua "Soma total" e os três totais do
estado batem exatamente com os "Totais finais" do TRE-PR. Municípios com mais de uma zona (Curitiba, Ponta Grossa,
Londrina, Guarapuava) somam. Partidos: Jânio (PTN), Ademar (PSP), Lott (PSD); Milton Campos (UDN), Jango (PTB),
Fernando Ferrari (MTR); Ney Braga (PDC), Plínio Franco Ferreira da Costa (PSD), Nelson Maculan (PTB).
Uso: python3 scripts/extrair/tre-pr-1960.py"""
import collections, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar, chave
achar = ibge_por_nome('pr')
COD = {'Munhoz de Melo': '4116307'}
ARQ = {'presidente': ('presidente', [('JÂNIO QUADROS', 'PTN'), ('ADEMAR DE BARROS', 'PSP'), ('HENRIQUE TEIXEIRA LOTT', 'PSD')]),
       'vice-presidente': ('vice', [('FERNANDO FERRARI', 'MTR'), ('JOÃO GOULART', 'PTB'), ('MILTON CAMPOS', 'UDN')]),
       'governador': ('governador', [('NEY BRAGA', 'PDC'), ('PLÍNIO FRANCO FERREIRA DA COSTA', 'PSD'), ('NELSON MACULAN', 'PTB')])}
ELEITOS = {'presidente': 'JÂNIO QUADROS', 'vice-presidente': 'JOÃO GOULART', 'governador': 'NEY BRAGA'}
out = {'gov': [], 'br': []}; fora = set()
for cargo, (arq, cands) in ARQ.items():
    soma = collections.defaultdict(lambda: [0] * 6)
    for l in open(f'data/tre/fontes/pr-1960/{arq}.txt', encoding='utf8'):
        if l.startswith(('#', '=')) or not l.strip(): continue
        p = l.strip().split(';'); ib = COD.get(p[1]) or achar(p[1])
        if not ib: fora.add(p[1]); continue
        soma[ib] = [a + int(b) for a, b in zip(soma[ib], p[2:8])]
    dest = out['gov'] if cargo == 'governador' else out['br']
    for ib, v in soma.items():
        for (n, pt), x in zip(cands, v): dest.append((cargo, 1, ib, '_' + chave(n), n, pt, x))
        dest += [(cargo, 1, ib, '#brancos', '', '', v[3]), (cargo, 1, ib, '#nulos', '', '', v[4]), (cargo, 1, ib, '#comparecimento', '', '', v[5])]
el = {(c, '_' + chave(n)): 'S' for c, n in ELEITOS.items()}
F = 'TRE-PR, Resultados gerais apurados nas eleições de 3 de outubro de 1960 (por município)'
gravar('data/tre/1960/pr.csv', out['gov'], el, fonte=F)
gravar('data/tre/1960/pr-presidente.csv', out['br'], el, fonte=F)
print('sem código:', sorted(fora))
