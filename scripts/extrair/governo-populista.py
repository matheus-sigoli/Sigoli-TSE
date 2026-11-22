#!/usr/bin/env python3
"""
Governador da República de 1946 que ainda não estava no site, da planilha do acervo "Resultados sobre o Brasil geral/
Eleições Estaduais - Governo (República Populista).xlsx" (uma aba por eleição, "1947 - Alagoas"…; 1ª linha = fonte,
2ª = cabeçalho "Municípios:", candidatos, "Total"). As outras abas (AL 1950–1965, MA 1950 e 1965, SP 1958) têm os mesmos
municípios que o site já mostra (data/historico), com menos votos; a da BA 1947 está vazia (o site usa o TRE-BA).

- Alagoas 1947: os votos vêm por grupo de municípios ("Penedo, Igreja Nova e Piassabussú"); ficam no primeiro (a sede) e os
  outros entram em data/malhas-historicas/agrupar/1947-al.csv, para aparecerem juntos no mapa.
Saída: data/tre/1947/al-planilha.csv. Depois: scripts/tre.py --ano 1947, scripts/oficial.py e scripts/malha-historica.mjs --ano 1947.
Uso: python3 scripts/extrair/governo-populista.py --xlsx "<acervo>/Resultados sobre o Brasil geral/Eleições Estaduais - Governo (República Populista).xlsx"
"""
import argparse, os, re, sys
import openpyxl
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar, chave

a = argparse.ArgumentParser(); a.add_argument('--xlsx', required=True); a = a.parse_args()
# (aba, ano, uf, candidatos [(nome, partido)] na ordem das colunas, eleito)
ABAS = [('1947 - Alagoas', 1947, 'al', [('SILVESTRE PÉRICLES', 'PSD'), ('RUI PALMEIRA', 'UDN')], 'SILVESTRE PÉRICLES')]
# nomes da época → de hoje
ANTIGOS = {'MANGUABA': 'Pilar', 'MARECHALFLORIANO': 'Piranhas', 'ARAPIACA': 'Arapiraca', 'PIASSABUSSU': 'Piaçabuçu',
           'ASSEMBLEIA': 'Viçosa', 'CONCEICAODOPARAIBA': 'Capela', 'SAOLUIZDOQUINTUNDE': 'São Luís do Quitunde'}

wb = openpyxl.load_workbook(a.xlsx, data_only=True)
for aba, ano, uf, cands, eleito in ABAS:
    achar = ibge_por_nome(uf)
    rows = list(wb[aba].iter_rows(values_only=True))
    fonte = re.sub(r'^Fonte:\s*', '', str(rows[0][0] or '')).strip()
    linhas, grupos, tot = [], [], [0] * len(cands)
    for r in rows[2:]:
        if not isinstance(r[0], str) or not r[0].strip() or re.match(r'^total', r[0].strip(), re.I): continue
        nomes = [n.strip() for n in re.split(r',\s*|\s+e\s+', r[0].strip()) if n.strip()]
        ibs = [achar(ANTIGOS.get(chave(n), n)) for n in nomes]
        if not ibs[0]: continue
        sede = ibs[0]
        grupos += [(ib, sede) for ib in ibs[1:] if ib and ib != sede]
        for i, (nome, part) in enumerate(cands):
            v = int(r[1 + i] or 0); tot[i] += v
            linhas.append(('governador', 1, sede, '_' + chave(nome), nome, part, v))
    os.makedirs(f'data/tre/{ano}', exist_ok=True)
    gravar(f'data/tre/{ano}/{uf}-planilha.csv', linhas, {('governador', '_' + chave(eleito)): 'S'},
           fonte=f'{fonte} (planilha "Eleições Estaduais - Governo (República Populista)" do acervo, por grupo de municípios)')
    if grupos:
        with open(f'data/malhas-historicas/agrupar/{ano}-{uf}.csv', 'w', encoding='utf8') as g:
            g.write('ibge;sede\n' + ''.join(f'{ib};{s}\n' for ib, s in grupos))
    print(aba, dict(zip([c[0] for c in cands], tot)), len(grupos), 'municípios juntados à sede')
