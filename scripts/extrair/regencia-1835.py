#!/usr/bin/env python3
"""
Eleição do Regente do Império, 7 de abril de 1835 (Regência Una): planilha do acervo "Resultados sobre o Brasil geral/
Eleição Regencial de 1835.xlsx" (cópia em data/tre/fontes/1835/). Uma aba por província; linha "REGENTE" = os colégios
eleitorais (as vilas onde os eleitores votaram); cada linha = um nome e os votos dele em cada colégio (a última coluna, o
total, é ignorada: o total sai da soma). Cada eleitor votava em dois nomes, então a soma é de votos, não de eleitores.

- Nomes: a mesma pessoa aparece de vários jeitos ("Feijó", "Diogo Antônio Feijó", "D. A. Feijó"…): CANDIDATOS junta; quem
  não está lá vai para "Outros". Não havia partidos: o "partido" de cada um é o próprio nome (o site mostra só o nome e a
  cor é por candidato, src/lib/cores.ts).
- Sem comparecimento: cada eleitor votava em dois nomes e a planilha não diz quantos eleitores eram.
- Colégio → município de hoje onde fica a vila (COLEGIOS); colégio que não deu para identificar fica só no total da
  província. O município de hoje sem polígono na malha de 1950 soma no polígono de 1950 onde fica a sua sede.
- Províncias da época: o Paraná (Curitiba, Paranaguá, Castro) estava em São Paulo e o Amazonas no Pará; a cidade do Rio de
  Janeiro (Município Neutro, a Corte) vai à parte, como "df".
Saída: data/tre/1835/{uf}-regencia.csv (por município, a UF de hoje do código do IBGE) e data/oficial/1835.csv (total de
cada província e do Brasil, para o mapa por estado e o total). Depois: tre.py, presidente-br.py --cargo regente,
oficial.py, estados.py, malha-historica.mjs, estados-malha.py, pintam.mjs (todos com --ano 1835).
Uso: python3 scripts/extrair/regencia-1835.py [--xlsx data/tre/fontes/1835/Eleição\\ Regencial\\ de\\ 1835.xlsx]
"""
import argparse, collections, csv, glob, gzip, json, os, sys
import openpyxl
sys.path.insert(0, os.path.dirname(__file__))
from comum import gravar, chave, ibge_por_nome

ABA = {'São Pedro do Sul': 'rs', 'São Paulo': 'sp', 'Santa Catharina': 'sc', 'Minas Geraes': 'mg', 'Rio de Janeiro': 'rj',
       'Goyaz': 'go', 'Matto Grosso': 'mt', 'Espírito Santo': 'es', 'Alagôas': 'al', 'Rio Grande do Norte': 'rn', 'Sergipe': 'se',
       'Bahia': 'ba', 'Pernambuco': 'pe', 'Parahyba do Norte': 'pb', 'Piauhy': 'pi', 'Ceará': 'ce', 'Maranhão': 'ma', 'Pará': 'pa'}
# (nome no site, nome curto) ← grafias da planilha
CANDIDATOS = [
    ('Diogo Antônio Feijó', 'Feijó', ['Diogo Antônio Feijó', 'Feijó', 'D. A. Feijó', 'A. D. Feijó', 'Antônio Diogo Feijó']),
    ('Antônio Francisco de Paula Holanda Cavalcanti', 'Holanda Cavalcanti',
     ['Hollanda Cavalcanti', 'Antônio Francisco de Paula de Holanda', 'Hollanda', 'Antônio de Hollanda Cavalcanti']),
    ('Pedro de Araújo Lima', 'Araújo Lima', ['Pedro de Araújo Lima', 'Araújo Lima']),
    ('José da Costa Carvalho', 'Costa Carvalho', ['José da Costa Carvalho', 'Costa Carvalho', 'J. da Costa Carvalho']),
    ('Manuel de Carvalho Pais de Andrade', 'Pais de Andrade',
     ['Manuel de Carvalho Pais de Andrade', 'Paes de Andrade', 'Manoel de Carvalho Paes de Andrade', 'Manoel de Carvalho']),
    ('Francisco de Lima e Silva', 'Lima e Silva', ['Francisco de Lima e Silva', 'Lima e Silva']),
    ('Bernardo Pereira de Vasconcelos', 'Vasconcelos', ['Bernardo Pereira de Vasconcellos', 'Vasconcellos']),
    ('Arcebispo da Bahia (D. Romualdo de Seixas)', 'Arcebispo da Bahia', ['Arcebispo da Bahia', 'Arcebispo de Bahia']),
    ('Cipriano Barata', 'Barata', ['Barata', 'Cypriano José Barata de Almeida', 'Cypriano José de Almeida Barata']),
    ('Marquês de Caravelas', 'Caravelas', ['Marquês de Caravellas']),
    ('José Joaquim Rodrigues Torres', 'Rodrigues Torres', ['José Joaquim Rodrigues Torres']),
    ('José Bonifácio de Andrada e Silva', 'José Bonifácio', ['José Bonifácio', 'José Bonifácio de Andrada']),
    ('José Martiniano de Alencar', 'Alencar', ['Alencar', 'José Martiniano Alencar', 'José Martiniano de Alencar', 'J. Martiniano de Alencar']),
]
GRAFIA = {chave(g): i for i, (_, _, gs) in enumerate(CANDIDATOS) for g in gs}
OUTROS = len(CANDIDATOS)

# colégio → (UF de hoje, município de hoje); None = não identificado (fica só no total da província)
COLEGIOS = {
    'rs': {'Santo Antônio da Patrulha': 'Santo Antônio da Patrulha', 'Porto Alegre': 'Porto Alegre', 'São José do Norte': 'São José do Norte',
           'Rio Pardo': 'Rio Pardo', 'Caçapava': 'Caçapava do Sul', 'São José do Triumpho': 'Triunfo', 'São João da Cachoeira': 'Cachoeira do Sul',
           'São Francisco de Paula': 'São Francisco de Paula', 'Rio Grande': 'Rio Grande', 'São Francisco de Borja das Missões': 'São Borja',
           'Alegrete': 'Alegrete', 'Piratinim': 'Piratini'},
    'sp': {'Arêas': 'Areias', 'Jacarehy': 'Jacareí', 'Guarantinguetá': 'Guaratinguetá', 'Taubaté': 'Taubaté', 'Sorocaba': 'Sorocaba',
           'Cidade': 'São Paulo', 'Villa Franca': 'Franca', 'Curytiba': ('pr', 'Curitiba'), 'Constituição': 'Piracicaba',
           'Paranaguá': ('pr', 'Paranaguá'), 'Itapetininga': 'Itapetininga', 'Iguape': 'Iguape', 'Santos': 'Santos', 'Itú': 'Itu',
           'São Sebastião': 'São Sebastião', 'Mogy-mirim': 'Mogi Mirim', 'Villa de Castro': ('pr', 'Castro'), 'Tibaia': 'Atibaia'},
    'sc': {'São Miguel': 'Biguaçu', 'Villa do Desterro': 'Florianópolis', 'São José': 'São José', 'Villa de Lages': 'Lages',
           'São Francisco Xavier do Sul': 'São Francisco do Sul', 'Laguna': 'Laguna'},
    'mg': {'Ouro Preto': 'Ouro Preto', 'Villa de Queluz': 'Conselheiro Lafaiete', 'Barbacena': 'Barbacena', 'Santa Bárbara': 'Santa Bárbara',
           'Marianna': 'Mariana', 'Pomba': 'Rio Pomba', 'Alfenas': 'Alfenas', 'Baependy': 'Baependi', 'Sabará': 'Sabará', 'Pitanguy': 'Pitangui',
           'Itamandóa': 'Itapecerica', 'Villa das Lavras': 'Lavras', 'Conceição do Serro': 'Conceição do Mato Dentro', 'Villa do Príncipe': 'Serro',
           'Minas Novas': 'Minas Novas', 'Araxá': 'Araxá', 'Itabira': 'Itabira', 'Villa Diamantina': 'Diamantina', 'Campanha': 'Campanha',
           'Jacuhy': 'Jacuí', 'Camandocaia': 'Camanducaia', 'Pouso Alegre': 'Pouso Alegre', "São João d'El-Rei": 'São João del Rei',
           'Santa Quitéria': 'Esmeraldas', 'Curvello': 'Curvelo', 'São José': 'Tiradentes', 'Rio das Velhas': 'Várzea da Palma',
           'Formigas': 'Montes Claros', 'Itacambira': 'Itacambira', 'São Domingos': None, 'Rio Pardo': 'Rio Pardo de Minas',
           'São Romão': 'São Romão', 'Paracatú': 'Paracatu', 'Uberaba': 'Uberaba', 'Salgado': 'Januária'},
    'rj': {'Rio de Janeiro': 'Rio de Janeiro', 'Iguassú': 'Nova Iguaçu', 'São João do Príncipe': 'Rio Claro', 'Itaborahy': 'Itaboraí',
           'Maricá': 'Maricá', 'Nictheroy': 'Niterói', 'Rezende': 'Resende', 'Paraty': 'Paraty', 'Ilha Grande': 'Angra dos Reis', 'Magé': 'Magé',
           'Vassouras': 'Vassouras', 'Campos': 'Campos dos Goytacazes', 'Macahé': 'Macaé', 'Cabo Frio': 'Cabo Frio', 'Cantagallo': 'Cantagalo'},
    'go': {'Santa Cruz': 'Santa Cruz de Goiás', 'Goyaz': 'Goiás', 'Boa Vista': ('to', 'Tocantinópolis'), 'Meia Ponte': 'Pirenópolis',
           'Nossa Senhora do Pilar': 'Pilar de Goiás', 'Cavalcanti': 'Cavalcante', 'Natividade': ('to', 'Natividade')},
    'mt': {'Cidade': 'Cuiabá', 'Poconé': 'Poconé', 'Diamantina do Alto Paraguahy': 'Diamantino', 'Matto Grosso': 'Vila Bela da Santíssima Trindade'},
    'es': {'Benevente': 'Anchieta', 'Victoria': 'Vitória'},
    'al': {'Anadia': 'Anadia', 'Alagôas': 'Marechal Deodoro', 'São Miguel': 'São Miguel dos Campos', 'Maceió': 'Maceió', 'Assembléa': 'Viçosa',
           'Penedo': 'Penedo', 'Itaipú': None, 'Atalaia': 'Atalaia'},
    'rn': {'Natal': 'Natal', 'Princeza': 'Assú', 'Porto Alegre': 'Portalegre'},
    'se': {'Itabayana': 'Itabaiana', 'Propriá': 'Propriá', 'São Christovão': 'São Cristóvão', 'Estância': 'Estância', 'Santo Amaro': 'Santo Amaro das Brotas',
           'Villa Nova do Rio de São Francisco': 'Neópolis', 'Lagarto': 'Lagarto'},
    'ba': {'Salvador': 'Salvador', 'Cachoeira': 'Cachoeira', 'Santo Amaro': 'Santo Amaro', 'São Francisco da Barra': 'São Francisco do Conde',
           'Caravellas': 'Caravelas', 'Inhambupe': 'Inhambupe', 'Jagoahy': 'Jaguaripe', 'Jacobina': 'Jacobina', 'Ilhéos': 'Ilhéus', 'Cayrú': 'Cairu',
           'Itapicurú de Cima': 'Itapicuru', 'Barra': 'Barra', 'Caethé': 'Caetité', 'São José de Carinhan': 'Carinhanha', 'Joazeiro': 'Juazeiro',
           'Rio das Contas': 'Rio de Contas', 'Constituição': None, 'Porto Seguro': 'Porto Seguro', 'Camamú': 'Camamu',
           'Villa Nova da Rainha': 'Senhor do Bonfim', 'Gravatá': None},
    'pe': {'Goyanna': 'Goiana', 'Santo Antão': 'Vitória de Santo Antão', 'Olinda': 'Olinda', 'Serinhaém': 'Sirinhaém', 'Recife': 'Recife',
           'Cabo': 'Cabo de Santo Agostinho', 'Pau do Alho': 'Paudalho', 'Limoeiro': 'Limoeiro', 'Garanhuns': 'Garanhuns', 'Cima': 'Pesqueira',
           'Igaraçú': 'Igarassu', 'Flores': 'Flores', 'Tacaratú': 'Tacaratu', 'Cabrobó': 'Cabrobó'},
    'pb': {'Cidade da Parahyba': 'João Pessoa', 'Arêas': 'Areia', 'Pombal': 'Pombal', 'Pilar': 'Pilar', 'Paranaguá': None, 'Campina Grande': 'Campina Grande'},
    'pi': {'Oeiras': 'Oeiras', 'Campo-Maior': 'Campo Maior', 'Parnahyba': 'Parnaíba', 'Paranaguá': 'Parnaguá'},
    'ce': {'Aracaty': 'Aracati', 'São João do Principe': 'Tauá', 'Granja': 'Granja', 'Sobral': 'Sobral', 'Monte-Mór Novo': 'Baturité',
           'Campo-Maior de Queixeramoby': 'Quixeramobim', 'Villa-Nova': 'Ipu', 'Fortaleza': 'Fortaleza', 'Riacho de Sangue': 'Jaguaretama',
           'São Bernardo': 'Russas', 'Aquiraz': 'Aquiraz', 'Jardim': 'Jardim', 'São Matheus': 'Jucás', 'Icó': 'Icó', 'Imperatriz': 'Itapipoca'},
    'ma': {'Caxias': 'Caxias', 'São Luiz': 'São Luís', 'Alcântara': 'Alcântara', 'Itapicurú-Mirim': 'Itapecuru Mirim', 'São Bernardo': 'São Bernardo'},
    'pa': {'Belém': 'Belém', 'Macapá': ('ap', 'Macapá'), 'Vigia': 'Vigia', 'Cametá': 'Cametá'},
}
FONTE = 'Planilha "Eleição Regencial de 1835" do acervo Sigoli.TSE (votos por colégio eleitoral)'

# ---- malha de 1950 (polígono onde fica a sede do município de hoje)
malha = collections.defaultdict(dict)
for f in glob.glob('data/malhas-historicas/BR1950/*.geojson.gz'):
    for ft in json.load(gzip.open(f))['features']:
        g = ft['geometry']; malha[ft['id'][:2]][ft['id']] = [p[0] for p in g['coordinates']] if g['type'] == 'MultiPolygon' else [g['coordinates'][0]]
def dentro(x, y, anel):
    c = False
    for (x0, y0), (x1, y1) in zip(anel, anel[1:] + anel[:1]):
        if (y0 > y) != (y1 > y) and x < (x1 - x0) * (y - y0) / (y1 - y0) + x0: c = not c
    return c
centros = {}
def centro(cod):
    uf = next(m['uf'] for m in MUNS if m['ibge'] == cod)
    if uf not in centros:
        t = json.load(open(f'public/geo/uf/{uf}.json')); tr = t['transform']
        for g in t['objects']['municipios']['geometries']:
            arcs = g['arcs'] if g['type'] == 'MultiPolygon' else [g['arcs']]
            anel = max((p[0] for p in arcs), key=lambda r: sum(len(t['arcs'][~i if i < 0 else i]) for i in r))
            xs, ys = [], []
            for i in anel:
                x = y = 0
                for dx, dy in t['arcs'][~i if i < 0 else i]:
                    x += dx; y += dy; xs.append(x * tr['scale'][0] + tr['translate'][0]); ys.append(y * tr['scale'][1] + tr['translate'][1])
            centros[str(g['id'])] = (sum(xs) / len(xs), sum(ys) / len(ys))
        centros[uf] = True
    return centros.get(cod)
MUNS = json.load(open('public/data/2026/municipios.json', encoding='utf8'))
def poligono_de(cod):
    if cod in malha[cod[:2]]: return cod
    c = centro(cod)
    if not c: return None
    return next((k for k, aneis in malha[cod[:2]].items() if any(dentro(*c, r) for r in aneis)), None)

a = argparse.ArgumentParser(); a.add_argument('--xlsx', default='data/tre/fontes/1835/Eleição Regencial de 1835.xlsx'); a = a.parse_args()
wb = openpyxl.load_workbook(a.xlsx, data_only=True)
achar = {}
por_mun = collections.defaultdict(lambda: [0] * (OUTROS + 1))  # polígono de 1950 → votos
por_prov = collections.defaultdict(lambda: [0] * (OUTROS + 1))
outros_nomes = collections.Counter(); sem_mun = []; movidos = []
for ws in wb:
    prov = ABA[ws.title]
    rows = [list(r) for r in ws.iter_rows(values_only=True)]
    cab = next(r for r in rows if r[0] == 'REGENTE')
    cols = [(i, c.strip()) for i, c in enumerate(cab) if i > 0 and c]
    destino = {}
    for i, col in cols:
        m = COLEGIOS[prov][col]
        if m is None: sem_mun.append(f'{col} ({prov.upper()})'); continue
        uf, nome = m if isinstance(m, tuple) else (prov, m)
        if uf not in achar: achar[uf] = ibge_por_nome(uf)
        ib = achar[uf](nome)
        if not ib: sem_mun.append(f'{col} ({prov.upper()}): {nome}?'); continue
        alvo = poligono_de(ib) or ib
        if alvo != ib: movidos.append(f'{nome} → {alvo}')
        destino[i] = alvo
    ini = rows.index(cab) + 1
    for r in rows[ini:]:
        if not r[0] or not isinstance(r[0], str): continue
        k = GRAFIA.get(chave(r[0]), OUTROS)
        for i, col in cols:
            v = int(r[i]) if isinstance(r[i], (int, float)) else 0
            if not v: continue
            if k == OUTROS: outros_nomes[r[0].strip()] += v
            # a Corte (colégio "Rio de Janeiro") à parte: Município Neutro
            p = 'df' if (prov == 'rj' and col == 'Rio de Janeiro') else prov
            por_prov[p][k] += v
            if i in destino: por_mun[destino[i]][k] += v

nomes = [(n, n) for n, _, _ in CANDIDATOS] + [('Outros', 'Outros')]
br = [sum(v[k] for v in por_prov.values()) for k in range(OUTROS + 1)]
venc = max(range(OUTROS), key=lambda k: br[k])
eleitos = {('regente', '_' + chave(nomes[venc][0])): 'S'}
UF = {'11': 'ro', '12': 'ac', '13': 'am', '14': 'rr', '15': 'pa', '16': 'ap', '17': 'to', '21': 'ma', '22': 'pi', '23': 'ce', '24': 'rn',
      '25': 'pb', '26': 'pe', '27': 'al', '28': 'se', '29': 'ba', '31': 'mg', '32': 'es', '33': 'rj', '35': 'sp', '41': 'pr', '42': 'sc',
      '43': 'rs', '50': 'ms', '51': 'mt', '52': 'go', '53': 'df'}
linhas = collections.defaultdict(list)
for cod, v in sorted(por_mun.items()):
    for (n, p), x in zip(nomes, v):
        linhas[UF[cod[:2]]].append(('regente', 1, cod, '_' + chave(n), n, p, x))
os.makedirs('data/tre/1835', exist_ok=True)
for f in glob.glob('data/tre/1835/*-regencia.*'): os.remove(f)
for uf, ls in sorted(linhas.items()):
    gravar(f'data/tre/1835/{uf}-regencia.csv', ls, eleitos, fonte=FONTE)
with open('data/oficial/1835.csv', 'w', encoding='utf8', newline='') as f:
    w = csv.writer(f, delimiter=';', lineterminator='\n')
    w.writerow(['cargo', 'turno', 'uf', 'candidato', 'partido', 'votos', 'eleito', 'fonte'])
    for uf in sorted(por_prov) + ['br']:
        v = br if uf == 'br' else por_prov[uf]
        for k, (n, p) in enumerate(nomes):
            w.writerow(['regente', 1, uf, n, p, v[k], 'S' if (uf == 'br' and k == venc) else '', FONTE])
print('Brasil:', ' | '.join(f'{n} {x}' for (n, _), x in sorted(zip(nomes, br), key=lambda t: -t[1])), '· total', sum(br))
print(len(por_mun), 'municípios no mapa;', len(por_prov), 'províncias')
print('colégios sem município:', sem_mun)
print('somados no polígono de 1950:', movidos)
print('maiores em Outros:', outros_nomes.most_common(8))
