#!/usr/bin/env python3
"""
TRE-RS, 1986 e 1990: CSV com uma linha por município e candidato (Município;Candidato;Ano;Cargo;Votos;%;Partido),
em data/tre/fontes/rs/{ano}.csv → data/tre/{ano}/rs.csv. Sem número de candidato: o id é o nome.
"LEGENDA X" = voto de legenda do partido X (nos deputados) ou, no Governador de 1990, o voto no candidato do partido
(a cédula de 1990 marcava o partido). Eleitos: dados abaixo (as planilhas não marcam; deputados sem marca de eleito).
O Deputado Estadual de 1986 fica de fora: boa parte das linhas do arquivo não tem o município.
Uso: python3 scripts/extrair/tre-rs.py
"""
import collections, csv, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar, chave

achar = ibge_por_nome('rs')
CARGO = {'GOVERNADOR DO ESTADO': ('governador', 1), 'GOVERNADOR DO ESTADO - 2º TURNO': ('governador', 2), 'SENADOR DA REPÚBLICA': ('senador', 1),
         'DEPUTADO FEDERAL': ('deputado-federal', 1), 'DEPUTADO ESTADUAL': ('deputado-estadual', 1)}
# candidato a governador de 1990 pelo partido (no arquivo vêm como "LEGENDA PDT" etc.)
GOV_1990 = {'PDT': 'ALCEU DE DEUS COLLARES', 'PDS': 'NELSON MARCHEZAN', 'PT': 'TARSO FERNANDO HERZ GENRO'}
ELEITOS = {1986: {('governador', 1): ['PEDRO JORGE SIMON'], ('senador', 1): ['JOSE ALBERTO FOGACA DE MEDEIROS', 'JOSE PAULO BISOL']},
           1990: {('governador', 1): [], ('governador', 2): ['LEGENDA PDT'], ('senador', 1): ['PEDRO JORGE SIMON']}}
SEGUNDO = {1990: ['LEGENDA PDT', 'LEGENDA PDS']}
PART = {'PC DO B': 'PC do B', 'PCDOB': 'PC do B', 'ULN': 'PL'}
for ano in (1986, 1990):
    f = f'data/tre/fontes/rs/{ano}.csv'
    if not os.path.exists(f): continue
    linhas, eleitos = [], {}
    for r in list(csv.reader(open(f, encoding='latin1'), delimiter=';'))[1:]:
        if len(r) < 7 or r[3] not in CARGO: continue
        cargo, turno = CARGO[r[3]]
        # 1986, Deputado Estadual: ~10 mil linhas do arquivo vêm sem o município; fica de fora para não somar pela metade
        if ano == 1986 and cargo == 'deputado-estadual': continue
        ib = achar(r[0]); v = int(r[4] or 0); nome = r[1].strip(); part = PART.get(r[-1].strip(), r[-1].strip())
        if nome.startswith('VOTOS EM BRANCO') or nome == 'VOTOS BRANCOS': linhas.append((cargo, turno, ib, '#brancos', '', '', v)); continue
        if nome == 'VOTOS NULOS': linhas.append((cargo, turno, ib, '#nulos', '', '', v)); continue
        if nome.startswith('LEGENDA') and cargo.startswith('deputado'):
            linhas.append((cargo, turno, ib, '#legenda', '', part, v)); continue
        cid = '_' + chave(nome)
        if nome.startswith('LEGENDA') and cargo == 'governador':
            if (cargo, turno) in ELEITOS.get(ano, {}) and nome in ELEITOS[ano][(cargo, turno)]: eleitos[(cargo, cid, turno)] = 'S'
            if turno == 1 and nome in SEGUNDO.get(ano, []): eleitos[(cargo, cid, turno)] = '2'
            nome = GOV_1990.get(part, part)
        elif nome in ELEITOS.get(ano, {}).get((cargo, turno), []): eleitos[(cargo, cid)] = 'S'
        linhas.append((cargo, turno, ib, cid, nome, part, v))
    # município só com brancos/nulos num cargo (linha solta do arquivo, ex.: "CRISTAL DO SUL" em 1986, antes de existir): fora
    com_voto = {(l[0], l[1], l[2]) for l in linhas if not l[3].startswith('#')}
    linhas = [l for l in linhas if (l[0], l[1], l[2]) in com_voto]
    gravar(f'data/tre/{ano}/rs.csv', linhas, eleitos, fonte=f'TRE-RS, resultado das eleições de {ano} por município')
