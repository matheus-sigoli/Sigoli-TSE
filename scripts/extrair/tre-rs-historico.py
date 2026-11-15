#!/usr/bin/env python3
"""
TRE-RS, 1950 a 1978: CSV com uma linha por município e candidato (Município;Candidato;Ano;Cargo;Votos;%;Peso;Partido),
em data/tre/fontes/rs/{ano}.csv → data/tre/{ano}/rs.csv. Sem número de candidato: o id é o nome.

Arrumações:
- linhas repetidas (mesmo município, candidato e votos) contam uma vez;
- o arquivo de 1950 traz também o Governador e o Deputado Federal de 1954 (com os municípios escritos de outro jeito):
  o ano de cada município sai dos candidatos a governador (Dornelles/Cylon = 1950; Meneghetti/Pasqualini = 1954);
- 1950 fica de fora: vem por junta apuradora, não por município;
- Suplente de Senador fica de fora; Deputado Estadual de 1966 e 1970 também (o arquivo só tem brancos e nulos);
- municípios sem nenhum voto em candidato (só brancos/nulos, linhas soltas do arquivo) ficam de fora.
Eleitos: Governador e Senador pelo mais votado (1954, 1962 e 1970: duas vagas no Senado); de 1966 a 1978 o Senado tinha
sublegendas: elege o mais votado do partido com mais votos somados. Deputados sem marca de eleito.
Uso: python3 scripts/extrair/tre-rs-historico.py
"""
import collections, csv, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar, chave

achar = ibge_por_nome('rs')
CARGO = {'GOVERNADOR DO ESTADO': 'governador', 'SENADOR DA REPÚBLICA': 'senador', 'PRESIDENTE DA REPÚBLICA': 'presidente',
         'DEPUTADO FEDERAL': 'deputado-federal', 'DEPUTADO ESTADUAL': 'deputado-estadual'}
VAGAS_SEN = {1954: 2, 1962: 2, 1970: 2}
GOV_1950 = {'ERNESTO DORNELLES', 'POMPILIO CYLON F. DA ROSA', 'EDGAR LUIZ SCHNEIDER'}
GOV_1954 = {'ILDO MENEGHETTI', 'ALBERTO PASQUALINI'}
PART = {'PC DO B': 'PC do B'}

por_ano = collections.defaultdict(set)  # ano → linhas (município, candidato, cargo, votos, partido)
for arq_ano in (1950, 1954, 1958, 1962, 1966, 1970, 1974, 1978):
    f = f'data/tre/fontes/rs/{arq_ano}.csv'
    if not os.path.exists(f): continue
    rows = [r for r in list(csv.reader(open(f, encoding='latin1'), delimiter=';'))[1:] if len(r) >= 7 and r[3] in CARGO]
    ano_mun = {}
    if arq_ano == 1950:
        for r in rows:
            if r[3] == 'GOVERNADOR DO ESTADO':
                if r[1].strip() in GOV_1950: ano_mun[r[0]] = 1950
                elif r[1].strip() in GOV_1954: ano_mun[r[0]] = 1954
    for r in rows:
        ano = ano_mun.get(r[0], arq_ano)
        por_ano[ano].add((r[0].strip(), r[1].strip(), CARGO[r[3]], int(r[4] or 0), PART.get(r[-1].strip() or r[-2].strip(), r[-1].strip() or r[-2].strip())))

# 1950: o arquivo vem por junta apuradora ("JUNTA 12 - 1950"), não por município: não dá para pôr no mapa
por_ano.pop(1950, None)
for ano, linhas_brutas in sorted(por_ano.items()):
    linhas, eleitos = [], {}
    tem_cand = collections.defaultdict(set)  # (cargo) → municípios com voto em candidato
    for mun, nome, cargo, v, part in linhas_brutas:
        if part not in ('BRANCO', 'NULO') and not nome.startswith('VOTOS'): tem_cand[cargo].add(mun)
    if ano in (1966, 1970): tem_cand.pop('deputado-estadual', None)
    soma, partido_de = collections.Counter(), {}
    for mun, nome, cargo, v, part in sorted(linhas_brutas):
        if mun not in tem_cand.get(cargo, ()): continue
        if mun.startswith('AP. TRE') or mun.startswith('APURACAO'): continue  # apuração no TRE / em Brasília
        ib = achar(mun)
        if nome.startswith('VOTOS EM BRANCO') or nome == 'VOTOS BRANCOS' or part == 'BRANCO': linhas.append((cargo, 1, ib, '#brancos', '', '', v)); continue
        if nome == 'VOTOS NULOS' or part == 'NULO': linhas.append((cargo, 1, ib, '#nulos', '', '', v)); continue
        if nome.startswith('LEGENDA') and cargo.startswith('deputado'):
            linhas.append((cargo, 1, ib, '#legenda', '', part, v)); continue
        cid = '_' + chave(nome)
        linhas.append((cargo, 1, ib, cid, nome, part, v))
        if ib: soma[(cargo, cid)] += v; partido_de[(cargo, cid)] = part
    for cargo in ('governador', 'senador', 'presidente'):
        cs = sorted(((v, cid) for (c, cid), v in soma.items() if c == cargo), reverse=True)
        if not cs: continue
        if cargo == 'senador' and 1966 <= ano <= 1978:
            por_part = collections.Counter()
            for v, cid in cs: por_part[partido_de[(cargo, cid)]] += v
            vencedor = por_part.most_common(1)[0][0]
            vagas = VAGAS_SEN.get(ano, 1)
            for v, cid in [x for x in cs if partido_de[(cargo, x[1])] == vencedor][:vagas]: eleitos[(cargo, cid)] = 'S'
        else:
            for v, cid in cs[:VAGAS_SEN.get(ano, 1) if cargo == 'senador' else 1]: eleitos[(cargo, cid)] = 'S'
    os.makedirs(f'data/tre/{ano}', exist_ok=True)
    gravar(f'data/tre/{ano}/rs.csv', linhas, eleitos, fonte=f'TRE-RS, resultado das eleições de {ano} por município')
