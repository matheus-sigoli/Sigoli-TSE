#!/usr/bin/env python3
"""Pernambuco 1962, Governador e Senador (2 vagas): TRE-PE, "Relatório Final das Eleições de 1962", quadro das
eleições majoritárias por zona eleitoral, transcrito à mão em data/tre/fontes/pe-1962/majoritarias.txt (cada zona
conferida: soma do governador = soma do vice; senado = 2 × governador). Cada zona vai para o município-sede
(zonas 1–9 = Recife). Zonas cuja sede não conseguimos identificar ficam de fora do mapa (o total oficial do estado
vem de data/oficial/1962.csv). Uso: python3 scripts/extrair/tre-pe-1962.py"""
import os, sys, collections
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar, chave
achar = ibge_por_nome('pe')
SEDE = {z: 'Recife' for z in range(1, 10)}
SEDE.update(dict(enumerate('''Olinda;Jaboatão dos Guararapes;Paulista;São Lourenço da Mata;Moreno;Cabo de Santo Agostinho;Ipojuca;Paudalho;Vitória de Santo Antão;Escada;
Carpina;Glória do Goitá;Sirinhaém;Nazaré da Mata;Limoeiro;Goiana;Rio Formoso;Itambé;Ribeirão;Gameleira;
Gravatá;Amaraji;Aliança;Bom Jardim;Surubim;Bezerros;Timbaúba;Palmares;Água Preta;Bonito;
São Joaquim do Monte;Caruaru;Barreiros;Catende;São Caetano;Belo Jardim;Vertentes;Quipapá;Altinho;Panelas;
Jurema;Taquaritinga do Norte;São Bento do Una;Canhotinho;Brejo da Madre de Deus;Pesqueira;Garanhuns;Arcoverde;Pedra;;
Buíque;Bom Conselho;Sertânia;Inajá;Águas Belas;Custódia;Afogados da Ingazeira;Flores;São José do Egito;Triunfo;
Petrolândia;Serra Talhada;Floresta;Belém de São Francisco;São José do Belmonte;Salgueiro;Serrita;Cabrobó;Parnamirim;Exu;
Bodocó;Santa Maria da Boa Vista;Ouricuri;Petrolina;Araripina;Igarassu;Agrestina;Angelim;João Alfredo;Lagoa dos Gatos;
Macaparana;Maraial;Orobó;Vicência;Lajedo;Palmeirina;Sanharó;Alagoinha;Tabira;Santa Cruz do Capibaribe;
Camocim de São Félix;Cortês;Joaquim Nabuco;São Vicente Ferrer;Riacho das Almas;Cupira;Poção;Carnaíba;Tacaratu;Itapetim;
Toritama;Garanhuns'''.replace('\n', '').split(';'), start=10)))
SEDE.update({113: 'Belém de Maria', 114: 'Betânia', 116: 'Cachoeirinha', 118: 'Ipubi', 119: 'Itaíba', 121: 'Jataúba',
             127: 'Terra Nova', 128: 'Tuparetama', 130: 'Verdejante'})
GOV = [('JOÃO CLEOFAS', 'UDN'), ('ARMANDO MONTEIRO FILHO', 'PRT'), ('MIGUEL ARRAES', 'PST')]
SEN = [('PESSOA DE QUEIROZ', 'UDN'), ('NOVAES FILHO', 'PL'), ('MENDONÇA DE MELO', 'N/I'), ('JARBAS MARANHÃO', 'PSD'),
       ('BARBOSA LIMA SOBRINHO', 'PSB'), ('JOSÉ ERMÍRIO DE MORAES', 'PTB')]
L = [l.split() for l in open('data/tre/fontes/pe-1962/majoritarias.txt', encoding='utf8') if l.strip() and not l.startswith('#')]
mun = collections.defaultdict(lambda: [0] * 18); fora = []
i = 0
while i < len(L):
    zonas = list(map(int, L[i][1:])); linhas = [list(map(int, r)) for r in L[i + 1:i + 19]]; i += 19
    for k, z in enumerate(zonas):
        nome = SEDE.get(z)
        ib = achar(nome) if nome else None
        if not ib: fora.append((z, nome)); continue
        for j in range(18): mun[ib][j] += linhas[j][k]
print('zonas fora do mapa:', fora)
saida = []
for ib, v in mun.items():
    for (n, p), x in zip(GOV, v[0:3]): saida.append(('governador', 1, ib, '_' + chave(n), n, p, x))
    saida += [('governador', 1, ib, '#brancos', '', '', v[3]), ('governador', 1, ib, '#nulos', '', '', v[4])]
    for (n, p), x in zip(SEN, v[10:16]): saida.append(('senador', 1, ib, '_' + chave(n), n, p, x))
    saida += [('senador', 1, ib, '#brancos', '', '', v[16]), ('senador', 1, ib, '#nulos', '', '', v[17])]
os.makedirs('data/tre/1962', exist_ok=True)
gravar('data/tre/1962/pe.csv', saida, {('governador', '_' + chave('MIGUEL ARRAES')): 'S',
       ('senador', '_' + chave('JOSÉ ERMÍRIO DE MORAES')): 'S', ('senador', '_' + chave('PESSOA DE QUEIROZ')): 'S'},
       fonte='TRE-PE, Relatório Final das Eleições de 1962 (eleições majoritárias por zona eleitoral; cada zona somada no município-sede)')
