#!/usr/bin/env python3
"""Paraná, Senador de 1966, 1970 e 1974: TRE-PR, mapas de votação por zona e município (PDFs do acervo, Mapas/PR/
Resultados/PR {ano}.pdf), transcritos à mão em data/tre/fontes/pr-{ano}/senador.txt. Linhas "=" são os totais de zona
impressos, conferidos com a soma dos municípios (scripts de conferência no histórico da transcrição); os totais gerais
dos candidatos batem com o "TOTAL GERAL" do TRE-PR. Municípios com mais de uma zona somam.
Uso: python3 scripts/extrair/tre-pr-senado.py"""
import collections, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar, chave
achar = ibge_por_nome('pr')
NOMES = {'Araruva': 'Marilândia do Sul', 'São João': 'São João', 'Itapejara d\'Oeste': "Itapejara d'Oeste",
         'São Jorge d\'Oeste': "São Jorge d'Oeste", 'Pérola d\'Oeste': "Pérola d'Oeste"}
ANOS = {
    1966: {'cands': [('NELSON MACULAN', 'MDB'), ('NEY BRAGA', 'ARENA'), ('AFONSO CAMARGO NETO', 'MDB')], 'eleitos': ['NEY BRAGA'],
           'fonte': 'TRE-PR, votação por zonas e municípios nas eleições de 15 de novembro de 1966'},
}
for ano, cfg in ANOS.items():
    arq = f'data/tre/fontes/pr-{ano}/senador.txt'
    if not os.path.exists(arq): continue
    n = len(cfg['cands']); soma = collections.defaultdict(lambda: [0] * n); fora = []
    for l in open(arq, encoding='utf8'):
        if l.startswith(('#', '=')) or not l.strip(): continue
        p = l.strip().split(';'); ib = achar(NOMES.get(p[0], p[0]))
        if not ib: fora.append(p[0]); continue
        soma[ib] = [a + int(b) for a, b in zip(soma[ib], p[1:1 + n])]
    s = [('senador', 1, ib, '_' + chave(nm), nm, pt, x) for ib, v in soma.items() for (nm, pt), x in zip(cfg['cands'], v)]
    os.makedirs(f'data/tre/{ano}', exist_ok=True)
    gravar(f'data/tre/{ano}/pr-senado.csv', s, {('senador', '_' + chave(e)): 'S' for e in cfg['eleitos']}, fonte=cfg['fonte'])
    print(ano, 'sem código:', fora, len(soma), [sum(v[i] for v in soma.values()) for i in range(n)])
