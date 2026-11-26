#!/usr/bin/env python3
"""
Ceará 1950–1978: planilhas do TRE-CE (Seção de Estatísticas Eleitorais) da pasta Mapas/CE/Resultados do acervo,
convertidas de .xls para .xlsx (soffice --headless --convert-to xlsx) em $XLSX_CONVERTIDOS/CE/{ano}/.

Dois formatos:
  - "transposto": uma linha por candidato (BRANCOS, NULOS) e uma coluna por município (1950, 1966, 1974, 1978);
    a linha de cabeçalho começa com CANDIDATO(S)/SENADOR e pode ter colunas SUPLENTE e PARTIDO;
  - "por zona": uma linha por zona/município, colunas dos candidatos, brancos, nulos (1954, 1958).
Linhas do mesmo município (zonas de Fortaleza, "01 -FORTALEZA*") somam. Municípios da época pelo nome (comum.py).
Saída: data/tre/{ano}/ce.csv. Uso: python3 scripts/extrair/tre-ce-historico.py
"""
import collections, os, re, sys, openpyxl
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar, chave

PASTA = os.path.join(os.environ.get('XLSX_CONVERTIDOS', '/tmp/claude-0/-home-claude/49e12fad-3ad5-5fd2-8d63-4cfafb1b1765/scratchpad/xls'), 'CE')
achar = ibge_por_nome('ce')
FONTE = 'TRE-CE, Seção de Estatísticas Eleitorais (resultado por município)'
NAO = set()

def linhas(arq):
    wb = openpyxl.load_workbook(os.path.join(PASTA, arq), data_only=True)
    for ws in wb:
        for r in ws.iter_rows(values_only=True):
            yield ['' if c is None else str(c).strip() for c in r]

def num(x):
    x = str(x).replace('.', '').strip()
    try: return int(float(x))
    except ValueError: return None

ANTIGOS = {'LAVRAS': 'Lavras da Mangabeira', 'JUAZEIRO': 'Juazeiro do Norte', 'LIMOEIRO': 'Limoeiro do Norte', 'VICOSA': 'Viçosa do Ceará',
           'ANACETABA': 'São Gonçalo do Amarante', 'SAOGDOAMARANTE': 'São Gonçalo do Amarante', 'LICANIA': 'Santana do Acaraú',
           'SANTANOPOLE': 'Santana do Cariri', 'FRADE': 'Jaguaretama', 'INHUCU': 'Guaraciaba do Norte', 'QUIXARA': 'Farias Brito',
           'SANTACRUZDONORTE': 'Reriutaba', 'COCOCY': 'Parambu', 'MARANGUAPEEPALMACIA': 'Maranguape',
           'SANTANADOCARIRIENOVAOLINDA': 'Santana do Cariri', 'CARIRIACUEGRANJEIRO': 'Caririaçu', 'GENERALTIBURCIO': 'Viçosa do Ceará', 'BATOQUE': 'Hidrolândia'}

def municipio(nome):
    nome = re.sub(r'^\d+\s*-\s*', '', nome).strip(' *')
    if nome.upper() in ('DIFERENÇA', 'RESULTADO', 'BRASILIA - DISTRITO FEDERAL', 'TOTAL'): return None
    nome = ANTIGOS.get(chave(nome), nome)
    ib = achar(nome)
    if not ib: NAO.add(nome)
    return ib

TOTAIS = {'BRANCOS': '#brancos', 'BRANCO': '#brancos', 'VOTOS EM BRANCO': '#brancos', 'NULOS': '#nulos', 'VOTOS NULOS': '#nulos'}

def transposto(arq, cargo, partidos, saida):
    """partidos: {nome do candidato (chave): partido} quando a planilha não tem coluna PARTIDO."""
    cab = None
    for r in linhas(arq):
        if not any(r): continue
        p = r[0].upper()
        if p in ('CANDIDATO', 'CANDIDATOS', 'SENADOR'):
            cab = r; ip = next((i for i, c in enumerate(r) if c.upper() == 'PARTIDO'), None)
            ini = (ip + 1) if ip is not None else 1
            while ini < len(r) and r[ini].upper() == 'SUPLENTE': ini += 1
            continue
        if cab is None or not p or p.startswith(('COMPARECIMENTO', 'ELEITORADO', 'ABSTEN', '*', 'FONTE', 'CONFERIDO', 'DATA', 'OBSERV')):
            if p.startswith(('*', 'FONTE')): cab = None
            continue
        numero = TOTAIS.get(p)
        if not numero and ip is not None and (len(r) <= ip or not r[ip]): continue  # somatórios, títulos de página
        if p.startswith(('TOTAL', 'SUBTOTAL', 'SOMA')): continue
        if 'LEGENDA' in p: numero = '#legenda'
        partido = '' if numero and numero != '#legenda' else (r[ip] if ip is not None else partidos[chave(r[0])])
        if not numero: numero = '_' + chave(r[0])
        for i in range(ini, len(cab)):
            nome = cab[i]
            if not nome or nome.upper().startswith(('SOMA', 'OBSERV', 'TOTAL')) or i >= len(r): continue
            v = num(r[i]); ib = municipio(nome) if v is not None else None
            if ib: saida.append((cargo, 1, ib, numero, '' if numero.startswith('#') else r[0].title(), partido if numero == '#legenda' or not numero.startswith('#') else '', v))

def por_zona(arq, cargo, cands, saida):
    """cands: [(nome, partido)] na ordem das colunas depois de ZONA e MUNICÍPIO; depois vêm brancos e nulos."""
    for r in linhas(arq):
        if len(r) < 4 or not (re.fullmatch(r'\d+ª?', r[0]) or (not r[0] and r[1] and num(r[2]) is not None)): continue
        ib = municipio(r[1])
        if not ib: continue
        vs = [num(x) or 0 for x in r[2:2 + len(cands) + 2]]
        for (n, p), v in zip(cands, vs): saida.append((cargo, 1, ib, '_' + chave(n), n, p, v))
        saida += [(cargo, 1, ib, '#brancos', '', '', vs[-2]), (cargo, 1, ib, '#nulos', '', '', vs[-1])]

def eleitos_por_voto(saida, cargo, n):
    soma = collections.Counter()
    for l in saida:
        if l[0] == cargo and not l[3].startswith('#'): soma[l[3]] += l[6]
    return {(cargo, k): 'S' for k, _ in soma.most_common(n)}

ANOS = {}
# 1950: Raul Barbosa (PSD) × Edgar de Arruda (UDN); Senado: Onofre Muniz Gomes de Lima (PSD) × Fernandes Távora (UDN)
s = []
transposto('1950/Governador - Resultado por Município.xlsx', 'governador', {chave('RAUL BARBOSA'): 'PSD', chave('EDGAR CAVALCANTE DE ARRUDA'): 'UDN'}, s)
transposto('1950/Senador - Resultado por Município.xlsx', 'senador', {chave('ONOFRE MUNIZ GOMES DE LIMA'): 'PSD', chave('MANUEL DO NASCIMENTO FERNANDES TAVORA'): 'UDN'}, s)
# Vice-Governador (eleito à parte): Stênio Gomes (PSD) × Fausto Cabral (UDN)
transposto('1950/Vice-Governador - Resultado por Município.xlsx', 'vice-governador', {chave('STENIO GOMES DA SILVA'): 'PSD', chave('FAUSTO AUGUSTO GOMES CABRAL'): 'UDN'}, s)
ANOS[1950] = (s, 1)
# 1954 e 1958: por zona
s = []
por_zona('1954/Governador - Resultado por Município e Zona.xlsx', 'governador', [('Paulo Sarasate', 'UDN'), ('Armando Falcão', 'PSD')], s)
por_zona('1954/Senador - Resultado por Município e Zona.xlsx', 'senador', [('Fernandes Távora', 'UDN'), ('Parsifal Barroso', 'PTB'), ('Olavo Oliveira', 'PSP'), ('Raul Barbosa', 'PSD')], s)
# Vice: Flávio Marcílio (PTB) × Raimundo Ivan Barroso de Oliveira (partido não confirmado)
por_zona('1954/Vice-Governador - Resultado por Município e Zona.xlsx', 'vice-governador', [('Flávio Portela Marcílio', 'PTB'), ('Raimundo Ivan Barroso de Oliveira', 'N/I')], s)
ANOS[1954] = (s, 2)
s = []
por_zona('1958/Governador - Resultado por Município e Zona.xlsx', 'governador', [('Parsifal Barroso', 'PTB'), ('Virgílio Távora', 'UDN')], s)
por_zona('1958/Senador - Resultado por Município e Zona.xlsx', 'senador', [('Menezes Pimentel', 'PSD'), ('Olavo Oliveira', 'PSP')], s)
por_zona('1958/Vice-Governador - Resultado por Município e Zona.xlsx', 'vice-governador', [('Wilson Gonçalves', 'PSD'), ('Acrísio Moreira da Rocha', 'N/I')], s)
ANOS[1958] = (s, 1)
# 1966: Senado com duas eleições (vaga de 8 e de 4 anos), aqui somadas como dois votos por eleitor
s = []
transposto('1966/Senador-Mandato 8 anos - Resultado por Município.xlsx', 'senador', None, s)
transposto('1966/Senador-Mandato 4 anos - Resultado por Município.xlsx', 'senador', None, s)
ANOS[1966] = (s, 2)
s = []
transposto('1974/Senador - Resultado por Município.xlsx', 'senador', None, s)
ANOS[1974] = (s, 1)
s = []
transposto('1978/Senador - Resultado por Município.xlsx', 'senador', None, s)
ANOS[1978] = (s, 1)
# Deputados: eleitos = os N mais votados de cada partido, N pelas listas de eleitos do TRE-CE
# (1966: Eleitos por Partido; 1978: Resultado ARENA/MDB). 1974 fica de fora: a planilha por município do TRE-CE
# só traz cerca de metade dos municípios.
DEP = {1966: {'deputado-federal': {'ARENA': 16, 'MDB': 5}, 'deputado-estadual': {'ARENA': 49, 'MDB': 16}},
       1978: {'deputado-federal': {'ARENA': 15, 'MDB': 5}, 'deputado-estadual': {'ARENA': 33, 'MDB': 11}}}
for ano, cargos in DEP.items():
    for cargo in cargos:
        nome = 'Deputado Federal' if cargo == 'deputado-federal' else 'Deputado Estadual'
        transposto(f'{ano}/{nome} - Resultado por Município.xlsx', cargo, None, ANOS[ano][0])

for ano, (s, nsen) in ANOS.items():
    if not s: continue
    el = {}
    if any(l[0] == 'governador' for l in s): el.update(eleitos_por_voto(s, 'governador', 1))
    if any(l[0] == 'vice-governador' for l in s): el.update(eleitos_por_voto(s, 'vice-governador', 1))
    if any(l[0] == 'senador' for l in s): el.update(eleitos_por_voto(s, 'senador', nsen))
    for cargo, por_partido in DEP.get(ano, {}).items():
        soma = collections.Counter(); part = {}
        for l in s:
            if l[0] == cargo and not l[3].startswith('#'): soma[l[3]] += l[6]; part[l[3]] = l[5]
        for sg, n in por_partido.items():
            for k, _ in sorted(((k, v) for k, v in soma.items() if part[k] == sg), key=lambda x: -x[1])[:n]: el[(cargo, k)] = 'S'
    os.makedirs(f'data/tre/{ano}', exist_ok=True)
    gravar(f'data/tre/{ano}/ce.csv', s, el, fonte=FONTE)
    print(ano, len(s), 'linhas; eleitos', sorted(k[1] for k in el))
print('municípios não achados:', sorted(NAO))
