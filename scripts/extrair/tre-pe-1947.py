#!/usr/bin/env python3
"""Pernambuco 1947 (19 de janeiro), Governador e Senador (1 vaga): TRE-PE, relatório da Comissão Apuradora, votação
dos candidatos por zona eleitoral (PDF do acervo, Mapas/PE/Resultados/PE 1947.pdf, p. 0461-0472), transcrito em
data/tre/fontes/pe-1947/majoritarias.txt (só votos dos candidatos). A soma das zonas bate com as colunas Capital,
Interior e Total do relatório, com diferença de poucas dezenas de votos em alguns candidatos. As zonas de 1947 têm a
mesma numeração das de 1954/1962 (mesmas sedes, conferidas na lista das juntas apuradoras); cada zona vai para a sede
e, no mapa, os municípios sem zona vão para o vizinho (data/malhas-historicas/agrupar/1947-pe.csv).
Partidos (Agência Senado e TSE): Barbosa Lima Sobrinho (PSD, eleito), Neto Campelo (UDN), Pelópidas Silveira (PSB),
Eurico de Souza Leão (N/I); Senado: Apolônio Sales (PSD, eleito), Arruda Câmara (PDC), Alcedo Coutinho (sem partido,
apoiado pelo PCB: N/I). Uso: python3 scripts/extrair/tre-pe-1947.py"""
import collections, importlib.util, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar, chave
achar = ibge_por_nome('pe')
SEDE = {z: 'Recife' for z in range(1, 10)}
SEDE.update(dict(enumerate('''Olinda;Jaboatão dos Guararapes;Paulista;São Lourenço da Mata;Moreno;Cabo de Santo Agostinho;Ipojuca;Paudalho;Vitória de Santo Antão;Escada;
Carpina;Glória do Goitá;Sirinhaém;Nazaré da Mata;Limoeiro;Goiana;Rio Formoso;Itambé;Ribeirão;Gameleira;
Gravatá;Amaraji;Aliança;Bom Jardim;Surubim;Bezerros;Timbaúba;Palmares;Água Preta;Bonito;
São Joaquim do Monte;Caruaru;Barreiros;Catende;São Caetano;Belo Jardim;Vertentes;Quipapá;Altinho;Panelas;
Jurema;Taquaritinga do Norte;São Bento do Una;Canhotinho;Brejo da Madre de Deus;Pesqueira;Garanhuns;Arcoverde;Pedra;Correntes;
Buíque;Bom Conselho;Sertânia;Inajá;Águas Belas;Custódia;Afogados da Ingazeira;Flores;São José do Egito;Triunfo;
Petrolândia;Serra Talhada;Floresta;Belém de São Francisco;São José do Belmonte;Salgueiro;Serrita;Cabrobó;Parnamirim;Exu;
Bodocó;Santa Maria da Boa Vista;Ouricuri;Petrolina;Araripina'''.replace('\n', '').split(';'), start=10)))
GOV = [('NETO CAMPELO', 'UDN'), ('BARBOSA LIMA SOBRINHO', 'PSD'), ('EURICO DE SOUZA LEÃO', 'N/I'), ('PELÓPIDAS SILVEIRA', 'PSB')]
SEN = [('ARRUDA CÂMARA', 'PDC'), ('ALCEDO COUTINHO', 'N/I'), ('APOLÔNIO SALES', 'PSD')]
mun = collections.defaultdict(lambda: [0] * 7); fora = []
for l in open('data/tre/fontes/pe-1947/majoritarias.txt', encoding='utf8'):
    if l.startswith('#') or not l.strip(): continue
    r = list(map(int, l.strip().split(';'))); ib = achar(SEDE.get(r[0], ''))
    if not ib: fora.append(r[0]); continue
    for j in range(7): mun[ib][j] += r[1 + j]
out = []
for ib, v in mun.items():
    for (n, p), x in zip(GOV, v[:4]): out.append(('governador', 1, ib, '_' + chave(n), n, p, x))
    for (n, p), x in zip(SEN, v[4:]): out.append(('senador', 1, ib, '_' + chave(n), n, p, x))
os.makedirs('data/tre/1947', exist_ok=True)
gravar('data/tre/1947/pe.csv', out, {('governador', '_' + chave('BARBOSA LIMA SOBRINHO')): 'S', ('senador', '_' + chave('APOLÔNIO SALES')): 'S'},
       fonte='TRE-PE, Comissão Apuradora das eleições de 19 de janeiro de 1947 (por zona eleitoral)')
print('zonas sem sede:', fora)
