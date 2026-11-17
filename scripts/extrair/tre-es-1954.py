#!/usr/bin/env python3
"""Espírito Santo 1954 (governador e senador, duas vagas): TRE-ES, atas e mapas das comissões apuradoras por zona
(PDF do acervo, Mapas/ES/Resultados/ES 1954.pdf), resultados por município transcritos à mão em
data/tre/fontes/es-1954/majoritarias.txt (cada município conferido com o total de votantes: governador = votantes,
senado = 2 × votantes). Baixo Guandu (7ª zona) fica sem governador: a página do relatório com esse quadro falta no PDF.
Partidos: Eurico Salles (PSD), Francisco Lacerda de Aguiar (PTB, pela Coligação Democrática), Attílio Vivacqua (PR),
Asdrúbal Soares (PSP), Ary Vianna (PSD), Dulcino Monteiro de Castro (UDN). Uso: python3 scripts/extrair/tre-es-1954.py"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar, chave
achar = ibge_por_nome('es')
GOV = [('EURICO DE AGUIAR SALLES', 'PSD'), ('FRANCISCO LACERDA DE AGUIAR', 'PTB')]
SEN = [('ARY VIANNA', 'PSD'), ('DULCINO MONTEIRO DE CASTRO', 'UDN'), ('ASDRÚBAL SOARES', 'PSP'), ('ATTÍLIO VIVACQUA', 'PR')]
s = []; fora = []
for l in open('data/tre/fontes/es-1954/majoritarias.txt', encoding='utf8'):
    if l.startswith('#') or not l.strip(): continue
    p = l.strip().split(';'); ib = achar(p[1])
    if not ib: fora.append(p[1]); continue
    g, sn = p[2:6], p[6:12]
    if g[0]:
        for (n, pt), v in zip(GOV, g): s.append(('governador', 1, ib, '_' + chave(n), n, pt, int(v)))
        s += [('governador', 1, ib, '#brancos', '', '', int(g[2])), ('governador', 1, ib, '#nulos', '', '', int(g[3]))]
    for (n, pt), v in zip(SEN, sn): s.append(('senador', 1, ib, '_' + chave(n), n, pt, int(v)))
    s += [('senador', 1, ib, '#brancos', '', '', int(sn[4])), ('senador', 1, ib, '#nulos', '', '', int(sn[5]))]
os.makedirs('data/tre/1954', exist_ok=True)
gravar('data/tre/1954/es.csv', s, {('governador', '_' + chave('FRANCISCO LACERDA DE AGUIAR')): 'S',
                                   ('senador', '_' + chave('ATTÍLIO VIVACQUA')): 'S', ('senador', '_' + chave('ARY VIANNA')): 'S'},
       fonte='TRE-ES, atas e mapas de apuração das eleições de 3 de outubro de 1954 (por município)')
print('sem código:', fora)
