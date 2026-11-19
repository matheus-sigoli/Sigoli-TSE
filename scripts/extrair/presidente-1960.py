#!/usr/bin/env python3
"""Presidente e Vice-Presidente 1960 por município, todo o Brasil: planilha do acervo "Eleições Presidenciais - 1960"
(Resultados sobre o Brasil geral; mapas de apuração compilados por UF, com Total por município, zonas da capital somadas
na linha "(Total)"). Grava data/tre/1960/{uf}-presidente.csv; o Paraná fica com o TRE-PR (scripts/extrair/tre-pr-1960.py),
que bate com a planilha. Guanabara = cidade do Rio de Janeiro; Fernando de Noronha (176 votantes, apurados com a
Guanabara) fica de fora. Amapá e Rio Branco (Roraima) só têm o total do território. Brasília soma cidades-satélites
e juntas. Uso: python3 scripts/extrair/presidente-1960.py"""
import os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar, chave
import openpyxl
ARQ = '/mnt/user-data/uploads/Acervo de Mapas - Governador/Resultados sobre o Brasil geral/Eleições Presidenciais - 1960.xlsx'
UF = {'Amazonas': 'am', 'Pará': 'pa', 'Maranhão ()': 'ma', 'Piauí': 'pi', 'Ceará': 'ce', 'Rio Grande do Norte': 'rn', 'Paraíba': 'pb',
      'Pernambuco': 'pe', 'Alagoas': 'al', 'Sergipe': 'se', 'Bahia': 'ba', 'Goiás': 'go', 'Mato Grosso': 'mt', 'Espírito Santo': 'es',
      'Rio de Janeiro': 'rj', 'São Paulo': 'sp', 'Minas Gerais': 'mg', 'Santa Catarina': 'sc', 'Rio Grande do Sul': 'rs'}
# nomes de 1960 → código do IBGE de hoje (preenchido com os que o nome de hoje não acha)
COD = {('am', 'Jumá'): '1302207',
       ('am', 'Ipixum'): '1301803',
       ('am', 'Elvira'): '1301506',
       ('am', 'Xapauá'): '1304104',
       ('am', 'Aripuanã'): '1303304',
       ('am', 'Walpés'): '1303809',
       ('pa', 'Ilha de Mosqueiro'): '1501402',
       ('pa', 'Tomé-Assu'): '1508001',
       ('pa', 'Igarapé-Assu'): '1503200',
       ('pa', 'Vizeu'): '1508308',
       ('pa', 'Juriti'): '1503903',
       ('pa', 'Santa Isabel'): '1506500',
       ('ma', 'Turiassu'): '2112407',
       ('ma', 'Ribamar'): '2111201',
       ('ce', 'Ameiroz'): '2301505',
       ('ce', 'Polengi'): '2311207',
       ('ce', 'Malungue'): '2309102',
       ('ce', 'Raruitaba'): '2311702',
       ('rn', 'Lages'): '2406700',
       ('rn', 'Ipanguassú'): '2404705',
       ('pb', 'Solenea'): '2516003',
       ('pe', 'Escador'): '2605202',
       ('pe', 'Jaboatão'): '2607901',
       ('al', 'Ipaci'): '2703106',
       ('al', 'Major Izidro'): '2704401',
       ('se', 'Maroim'): '2804003',
       ('se', 'Buquim'): '2800670',
       ('ba', 'Santo Luz'): '2928000',
       ('ba', 'Guanambé'): '2911709',
       ('ba', 'Irupiara'): '2914109',
       ('go', 'Arrais'): '1702406',
       ('go', 'Jucara'): '5212204',
       ('go', 'Jandóia'): '5211701',
       ('go', 'Maiporá'): '5213400',
       ('go', 'Nazaré'): '1714302',
       ('go', 'Pôrto Nacional'): '1718204',
       ('go', 'Gurupí'): '1709500',
       ('go', 'Novo Acôrdo'): '1715101',
       ('go', 'Miracema do Norte'): '1713205',
       ('go', 'Araguaina'): '1702109',
       ('go', 'Araguaçú'): '1702000',
       ('mt', 'Jaraguary'): '5004908',
       ('mt', 'Três Lagôas'): '5008305',
       ('mt', 'Nioáque'): '5005806',
       ('mt', 'Bataguassú'): '5001904',
       ('mt', 'Maracajú'): '5005400',
       ('mt', 'Ponta-Porã'): '5006606',
       ('mt', 'Carapó'): '5002407',
       ('es', 'Cachoeira do Itapmirim'): '3201209',
       ('es', '(Vitória) Cariacica'): '3201308',
       ('es', 'Espírito Santo'): '3205200',
       ('rj', 'Marquês de Valença'): '3306107',
       ('rj', 'Rezende'): '3304201',
       ('rj', 'Natividade de Carangola'): '3303104',
       ('sp', 'Embu'): '3515004',
       ('sp', 'Osasco (Distrito de S. Paulo)'): '3550308',
       ('sp', 'Osasco'): '3550308',
       ('sp', 'Brodosque'): '3507803',
       ('sp', 'Xavantes'): '3557204',
       ('sp', 'Mocatuba'): '3528007',
       ('sp', 'Pinhal'): '3515186',
       ('sp', 'Ipauçu'): '3520905',
       ('sp', 'Rubiáeca'): '3544400',
       ('sp', 'Guiambê'): '3517307',
       ('sp', 'Ribeirão Vermelho do Sul'): '3543501',
       ('sp', 'Borboleta'): '3504602',
       ('sp', 'Santa Bárbara do Rio Pardo'): '3500550',
       ('mg', 'Ilicínia'): '3130507',
       ('mg', 'Brasília'): '3108602',
       ('mg', 'Piuí'): '3151503',
       ('rs', 'Guarama'): '4308706',
       ('rs', 'Félix'): '4308102',
       ('rs', 'Ipuí'): '4310207',
       ('rs', 'Santo Antônio'): '4317608',
       ('rs', 'Erval do Sul'): '4307104',
       ('rs', 'São Sapé'): '4319604',
       ('ro', 'Guarajá-Mirim'): '1100106',
       ('pa', 'Anhangá'): '1507409',
       ('pa', 'Guamá'): '1507607',
       ('pa', 'Capim'): '1507201',
       ('pa', 'Araticu'): '1505205',
       ('ma', 'Ipixuna'): '2111409',
       ('ce', 'Batoque'): '2305209',
       ('ce', 'Cococí'): '2310100',
       ('rn', 'Caiada'): '2413102',
       ('rn', 'Barrêto'): '2401602',
       ('rn', 'Januário Cicco'): '2406601',
       ('rn', 'Augusto Severo'): '2414456',
       ('pb', 'Barra da Raiz'): '2515609',
       ('pb', 'Carnoió'): '2502508',
       ('pb', 'Antenor Navarro'): '2500700',
       ('pb', 'Ibiriá'): '2506608',
       ('pb', 'Miraúna'): '2516904',
       ('pe', 'Lageado'): '2608800',
       ('al', 'Guaribas'): '2705408',
       ('al', 'Salomé'): '2708808',
       ('se', 'Malhados'): '2803906',
       ('ba', 'Maracâni'): '2919702',
       ('go', 'Paranaíba de Goiás'): '5221304',
       ('go', "Olhos D'Água"): '5200308',
       ('go', 'Veadeiros'): '5200605',
       ('go', 'Piacá'): '1709005',
       ('go', 'Ponte Alta do Norte'): '1717909',
       ('go', 'São Gabriel de Goiás'): '5217609',
       ('go', 'Mateira'): '5216304',
       ('go', 'Galheiros'): '5208301',
       ('go', 'Amaro Leite'): '5212808',
       ('go', 'Brasilândia'): '1718402',
       ('go', 'Paranã'): '1716208',
       ('go', 'Tupiratins'): '1709302', ('go', 'Tupirama'): '1716505',
       ('go', 'Dianópolis'): '1707009',
       ('go', 'Rianópolis'): '5218706',
       ('mt', 'Paranaíba'): '5006309',
       ('mt', 'Mutum'): '5103601',
       ('mt', 'Mato Grosso'): '5105507',
       ('sp', 'Guapuã'): '3513207',
       ('sp', 'Pedreiras'): '3537107',
       ('mg', 'Guia Lopes'): '3164308',
       ('mg', 'Cana do Reino'): '3114709',
       ('mg', 'Presidente Soares'): '3153509'}
PRES = [('JÂNIO QUADROS', 'PTN'), ('HENRIQUE TEIXEIRA LOTT', 'PSD'), ('ADEMAR DE BARROS', 'PSP')]
VICE = [('JOÃO GOULART', 'PTB'), ('MILTON CAMPOS', 'UDN'), ('FERNANDO FERRARI', 'MTR')]
n = lambda x: 0 if x in (None, '-', '') else int(round(float(x)))
wb = openpyxl.load_workbook(ARQ, read_only=True, data_only=True)
saida = {}; fora = {}

def bloco(rows, h, uf, achar, nomecol):
    cab = rows[h]; ix = {}
    for i, c in enumerate(cab):
        if isinstance(c, str): ix.setdefault(c.strip(), []).append(i)
    out = []
    for r in rows[h + 1:]:
        if r is None or not any(r): continue
        c0 = r[0] if isinstance(r[0], str) else ''
        nome = r[nomecol]
        if c0.startswith('Total') or (isinstance(nome, str) and nome.startswith('Total')): break
        if not isinstance(nome, str) or not nome.strip() or nome.strip() == '-': continue
        nome = nome.strip()
        if re.search(r'\(\d+ª ?ZE', nome): continue
        nome = re.sub(r'\s*\((Total|Sede)\)\s*$', '', nome).replace('*', '').strip()
        ib = COD.get((uf, nome)) or achar(nome)
        if not ib: fora.setdefault(uf, []).append(nome); continue
        g = lambda k, j=0: n(r[ix[k][j]]) if k in ix and len(ix[k]) > j else 0
        p = [g('Jânio'), g('Mal. Lott'), g('Adhemar'), g('Brancos'), g('Nulos'), g('Votantes')]
        v = [g('Jango'), g('Milton'), g('Ferrari'), g('Brancos', 1), g('Nulos', 1), g('Votantes', 1)] if 'Jango' in ix else None
        out.append((ib, nome, p, v))
    return out

for t, uf in UF.items():
    rows = [list(r) for r in wb[t].iter_rows(values_only=True)]
    h = next(i for i, r in enumerate(rows) if r and 'Municípios' in r)
    extra = {'mt': 'ms', 'go': 'to'}.get(uf)
    a1, a2 = ibge_por_nome(uf), ibge_por_nome(extra) if extra else (lambda x: None)
    saida.setdefault(uf, []).extend(bloco(rows, h, uf, lambda x: a1(x) if a1(x) else a2(x), 1))
# DF, Acre, Rondônia
rows = [list(r) for r in wb['Territórios & DF ()'].iter_rows(values_only=True)]
for i, r in enumerate(rows):
    if r and r[0] == 'Total' and i < 16:  # Brasília: o total do DF
        saida['df'] = [('5300108', 'Brasília', [n(r[3]), n(r[4]), n(r[5]), n(r[6]), n(r[7]), n(r[9])], [n(r[15]), n(r[16]), n(r[17]), n(r[18]), n(r[19]), n(r[21])])]
hs = [i for i, r in enumerate(rows) if r and r[0] == 'Municípios']
saida['ac'] = bloco(rows, hs[0], 'ac', ibge_por_nome('ac'), 0)
saida['ro'] = bloco(rows, hs[1], 'ro', ibge_por_nome('ro'), 0)
rows = [list(r) for r in wb['SP & GB ()'].iter_rows(values_only=True)]
h = max(i for i, r in enumerate(rows) if r and r[0] == 'Municípios')
for ib, nome, p, v in bloco(rows, h, 'rj', lambda x: {'Rio de Janeiro': '3304557', 'Fernando de Noronha': '2605459'}.get(x), 0):
    if ib == '3304557': saida['rj'].append((ib, nome, p, v))  # a Guanabara entra no mapa do RJ de hoje
os.makedirs('data/tre/1960', exist_ok=True)
el = {('presidente', '_' + chave('JÂNIO QUADROS')): 'S', ('vice-presidente', '_' + chave('JOÃO GOULART')): 'S'}
for uf, lst in sorted(saida.items()):
    if uf == 'pr': continue
    soma = {}
    for ib, nome, p, v in lst:
        for cargo, vals in (('presidente', p), ('vice-presidente', v)):
            if vals is None: continue
            a = soma.setdefault((cargo, ib), [0] * 6)
            soma[(cargo, ib)] = [x + y for x, y in zip(a, vals)]
    s = []
    for (cargo, ib), v in soma.items():
        cands = PRES if cargo == 'presidente' else VICE
        for (nm, pt), x in zip(cands, v): s.append((cargo, 1, ib, '_' + chave(nm), nm, pt, x))
        s += [(cargo, 1, ib, '#brancos', '', '', v[3]), (cargo, 1, ib, '#nulos', '', '', v[4])]
        if v[5]: s.append((cargo, 1, ib, '#comparecimento', '', '', v[5]))
    gravar(f'data/tre/1960/{uf}-presidente.csv', s, el,
           fonte='Acervo Sigoli.TSE, Eleições Presidenciais de 1960 (mapas de apuração por município)')
    tp = [sum(p[i] for _, _, p, _ in lst) for i in range(3)]
    print(uf, len(lst), 'mun · pres', tp)
print('sem código:', {k: v for k, v in fora.items()})
