#!/usr/bin/env python3
"""
Presidente e Vice-Presidente 1950, por município: acervo, "Resultados sobre o Brasil geral/1950 Presidente e Vice/".

- BANCODEDADOS1950.xlsx (abas Presidente e Vice: código IBGE, UF, município, votos por partido, nominais, brancos, nulos,
  comparecimento, eleitorado, observação): RN, CE, PB, PE, AL, SE (só Presidente), SC, RS, PR, MA, AM, MT, RJ, Distrito
  Federal e Território do Amapá.
  · Municípios que votaram juntos ("A votação inclui os votos do município de …") aparecem repetidos com os mesmos números:
    contam uma vez só, no polígono de 1950.
  · O antigo Distrito Federal (3099901, cidade do Rio de Janeiro) vai para o RJ como 3304557, como em 1955.
  · CE fica de fora: o site já tem o CE pelas planilhas do TRE-CE (scripts/extrair/tre-ce-1950-presidente.py).
- {UF} 1950.xlsx (abas Presidente e Vice-Presidente, por nome de município): ES (Presidente e Vice) e SE (Vice), que não
  estão no banco de dados.
- Município de hoje sem polígono na malha de 1950 (data/malhas-historicas/BR1950) soma no polígono de 1950 onde fica a sua sede.
Saída: data/tre/1950/{uf}-brasil.csv. Depois: scripts/tre.py --ano 1950 e node scripts/resumo-br.mjs --ano 1950 --cargo presidente
(e vice-presidente).
Uso: python3 scripts/extrair/presidente-1950.py --pasta "<acervo>/Resultados sobre o Brasil geral/1950 Presidente e Vice"
"""
import argparse, collections, glob, gzip, json, os, re, sys
import openpyxl
sys.path.insert(0, os.path.dirname(__file__))
from comum import gravar, chave, ibge_por_nome

a = argparse.ArgumentParser(); a.add_argument('--pasta', required=True); a = a.parse_args()
UF = {'11': 'ro', '12': 'ac', '13': 'am', '14': 'rr', '15': 'pa', '16': 'ap', '17': 'go', '21': 'ma', '22': 'pi', '23': 'ce', '24': 'rn',
      '25': 'pb', '26': 'pe', '27': 'al', '28': 'se', '29': 'ba', '31': 'mg', '32': 'es', '33': 'rj', '35': 'sp', '41': 'pr', '42': 'sc',
      '43': 'rs', '50': 'mt', '51': 'mt', '52': 'go', '53': 'go'}
CANDS = {
    'presidente': [('PTB', 'GETÚLIO VARGAS', 'PTB'), ('UDN', 'EDUARDO GOMES', 'UDN'), ('PSD', 'CRISTIANO MACHADO', 'PSD'), ('PSB', 'JOÃO MANGABEIRA', 'PSB')],
    'vice-presidente': [('PSP', 'CAFÉ FILHO', 'PSP'), ('UDN', 'ODILON BRAGA', 'UDN'), ('PSD', 'ALTINO ARANTES', 'PSD'), ('PST', 'VITORINO FREIRE', 'PST'),
                        ('PSB', 'ALÍPIO CORREIA NETO', 'PSB')],
}
ELEITOS = {'presidente': 'GETÚLIO VARGAS', 'vice-presidente': 'CAFÉ FILHO'}
FORA_DO_BANCO = {'ce'}

# malha de 1950: polígonos por UF, para achar onde fica a sede de quem não tem polígono
malha = {}
for f in glob.glob('data/malhas-historicas/BR1950/*.geojson.gz'):
    for ft in json.load(gzip.open(f))['features']: malha[ft['id']] = [r for pol in ft['geometry']['coordinates'] for r in pol[:1]]
def dentro(x, y, anel):
    c = False
    for (x0, y0), (x1, y1) in zip(anel, anel[1:] + anel[:1]):
        if (y0 > y) != (y1 > y) and x < (x1 - x0) * (y - y0) / (y1 - y0) + x0: c = not c
    return c
centros = {}
for arq in glob.glob('public/geo/uf/*.json'):
    t = json.load(open(arq)); tr = t.get('transform')
    for g in t['objects']['municipios']['geometries']:
        arcs = g['arcs'] if g['type'] == 'MultiPolygon' else [g['arcs']]
        anel = max((p[0] for p in arcs), key=lambda r: sum(len(t['arcs'][~i if i < 0 else i]) for i in r))
        xs, ys = [], []
        for i in anel:
            x = y = 0
            for dx, dy in t['arcs'][~i if i < 0 else i]:
                x += dx; y += dy; xs.append(x * tr['scale'][0] + tr['translate'][0]); ys.append(y * tr['scale'][1] + tr['translate'][1])
        centros[str(g['id'])] = (sum(xs) / len(xs), sum(ys) / len(ys))
def poligono_de(cod):
    if cod in malha: return cod
    if cod not in centros: return None
    x, y = centros[cod]
    return next((k for k, aneis in malha.items() if k[:2] == cod[:2] and any(dentro(x, y, r) for r in aneis)), None)

achar_ms = ibge_por_nome('ms')
_ms = {chave(m['nome']): m['ibge'] for m in json.load(open('public/data/2026/municipios.json', encoding='utf8')) if m['uf'] == 'ms'}
achar_ms_quieto = lambda nome: _ms.get(chave({'AQUIDAUNA': 'Aquidauana'}.get(chave(nome), nome)))
TOT = (('Votos Brancos', '#brancos'), ('Votos Nulos', '#nulos'), ('Comparecimento', '#comparecimento'), ('Eleitorado', '#eleitorado'))
soma = {c: collections.defaultdict(collections.Counter) for c in CANDS}
movidos, sem = [], []
ufs_banco = collections.defaultdict(set)

# ---- banco de dados
wb = openpyxl.load_workbook(os.path.join(a.pasta, 'BANCODEDADOS1950.xlsx'), data_only=True)
for aba, cargo in (('Presidente', 'presidente'), ('Vice', 'vice-presidente')):
    rows = [list(r) for r in wb[aba].iter_rows(values_only=True)]
    col = {h: i for i, h in enumerate(rows[0]) if h}
    vistos = set()
    for r in rows[1:]:
        if r[0] is None: continue
        cod = str(int(r[0])); cod = '3304557' if cod == '3099901' else cod
        uf = UF[cod[:2]]
        if uf in FORA_DO_BANCO: continue
        num = lambda h: int(r[col[h]]) if isinstance(r[col[h]], (int, float)) else 0
        votos = tuple(num(sg) for sg, _, _ in CANDS[cargo])
        obs = str(r[col['Obs']] or '')
        if 'inclui os votos' in obs:
            k = (uf, votos)
            if k in vistos: continue  # o mesmo resultado repetido nos municípios que votaram juntos
            vistos.add(k)
        alvo = poligono_de(cod)
        # MS no banco com o código antigo do MT (510…): pelo nome, entre os municípios de MS de hoje
        if not alvo and uf == 'mt': alvo = poligono_de(achar_ms(r[2]) or '')
        if not alvo: sem.append(f'{r[2]}-{r[1]}'); continue
        if alvo != cod: movidos.append(f'{r[2]}-{r[1]} → {alvo}')
        ufs_banco[cargo].add(uf)
        s = soma[cargo][alvo]
        for (sg, _, _), v in zip(CANDS[cargo], votos): s[sg] += v
        for h, _ in TOT: s[h] += num(h)

# ---- planilhas por UF: ES e o Vice de SE (fora do banco) e, nas UFs do banco, os municípios que faltam nele
#      (ex.: Aracaju, Resende, Parintins); linhas de zona ("Maceió (1° Zona)") e de total ficam de fora
ABA_ARQ = {'presidente': 'Presidente', 'vice-presidente': 'Vice-Presidente'}
ANTIGOS = {'CDEITAPEMIRIM': 'Cachoeiro de Itapemirim', 'BARRADESFRANCISCO': 'Barra de São Francisco', 'IBIRASSU': 'Ibiraçu',
           'MAROIM': 'Maruim', 'NSDASDORES': 'Nossa Senhora das Dores', 'RIACHODOSDANTAS': 'Riachão do Dantas', 'PARATINS': 'Parintins',
           'REZENDE': 'Resende', 'ITAVERA': 'Rio Claro', 'CASEMIROABREU': 'Casimiro de Abreu', 'MARQUESDEVALENCA': 'Valença',
           'SMARIAMADALENA': 'Santa Maria Madalena', 'NATIVIDADEDOCARANGOLA': 'Natividade', 'CAMPOS': 'Campos dos Goytacazes',
           'LEVERGER': 'Santo Antônio do Leverger', 'POROXEU': 'Poxoréu', 'BAIXAVERDE': 'João Câmara', 'ACU': 'Assú'}
acrescentados = []
for uf in ('al', 'am', 'es', 'mt', 'rj', 'rn', 'se'):
    achar_uf = ibge_por_nome(uf)
    # MT de 1950 inclui o MS de hoje
    achar = (lambda nome: achar_ms_quieto(nome) or achar_uf(nome)) if uf == 'mt' else achar_uf
    wb = openpyxl.load_workbook(os.path.join(a.pasta, f'{uf.upper()} 1950.xlsx'), data_only=True)
    for cargo, aba in ABA_ARQ.items():
        n = len(CANDS[cargo])
        do_banco = uf in ufs_banco[cargo]
        ja = set(soma[cargo])
        for r in list(wb[aba].iter_rows(values_only=True))[2:]:
            nome = r[0]
            if not isinstance(nome, str) or not nome.strip() or re.search(r'zona|^total|^munic', nome.strip(), re.I): continue
            v = [int(x) if isinstance(x, (int, float)) else 0 for x in r[1:1 + n]]
            if not any(v): continue
            # "Lagarto e Salgado", "Itabaiana & Campo do Brito": votaram juntos; ficam no primeiro
            nome = re.split(r'\s+(?:e|&)\s+', nome.strip())[0]
            nome = ANTIGOS.get(chave(nome), nome)
            ib = achar(nome)
            if not ib: sem.append(f'{nome}-{uf}'); continue
            alvo = poligono_de(ib) or ib
            if do_banco and alvo in ja: continue
            if alvo != ib: movidos.append(f'{nome}-{uf} → {alvo}')
            if do_banco: acrescentados.append(f'{nome}-{uf} ({cargo}, {v[0]})')
            s = soma[cargo][alvo]
            for (sg, _, _), x in zip(CANDS[cargo], v): s[sg] += x

linhas = collections.defaultdict(list)
for cargo, por in soma.items():
    tot = collections.Counter()
    for cod, s in por.items():
        uf = UF[cod[:2]]
        for sg, nome, part in CANDS[cargo]:
            linhas[uf].append((cargo, 1, cod, '_' + chave(nome), nome, part, s[sg])); tot[nome] += s[sg]
        for h, n in TOT:
            if s[h]: linhas[uf].append((cargo, 1, cod, n, '', '', s[h]))
    print(cargo, dict(tot))
os.makedirs('data/tre/1950', exist_ok=True)
eleitos = {(c, '_' + chave(n)): 'S' for c, n in ELEITOS.items()}
FONTE = {'es': 'Acervo Sigoli.TSE, planilha do Espírito Santo da eleição de 1950 para Presidente e Vice-Presidente (por município)'}
NOME_UF = {'al': 'Alagoas', 'am': 'Amazonas', 'mt': 'Mato Grosso', 'rj': 'Rio de Janeiro', 'rn': 'Rio Grande do Norte', 'se': 'Sergipe'}
for uf, ls in sorted(linhas.items()):
    fonte = FONTE.get(uf, 'Acervo Sigoli.TSE, banco de dados da eleição de 1950 para Presidente e Vice-Presidente (por município)'
                      + (f' e planilha de {NOME_UF[uf]} do acervo' if uf in NOME_UF else ''))
    gravar(f'data/tre/1950/{uf}-brasil.csv', ls, eleitos, fonte=fonte)
print(len(movidos), 'somados no polígono de 1950 da sua sede:', '; '.join(sorted(set(movidos))))
print('sem polígono/código:', sem)
print(len(acrescentados), 'municípios das planilhas por UF que faltavam no banco:', '; '.join(acrescentados))
