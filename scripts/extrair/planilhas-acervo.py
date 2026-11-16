#!/usr/bin/env python3
"""
Planilhas de resultado por município da pasta Mapas/{UF}/Resultados do acervo (TRE-MG, Arquivo Público de MT e do MA,
planilha do RN de 1965) → data/tre/{ano}/{uf}-planilha.csv (formato de scripts/tre.py).

Cada entrada de FONTES diz a aba, a linha do cabeçalho, as colunas dos candidatos e dos totais. Municípios da época
pelo nome (comum.py); antes de 1979 o MT inclui o MS, antes de 1989 o GO inclui o TO; linhas com o mesmo município
(zonas de Natal, distritos que hoje são municípios) somam no município de hoje. Eleito = mais votado (Senado de 1978 com
sublegendas: o mais votado do partido com mais votos).
Uso: python3 scripts/extrair/planilhas-acervo.py
"""
import collections, json, os, re, sys, openpyxl
sys.path.insert(0, os.path.dirname(__file__))
from comum import chave, gravar, APELIDOS

ACERVO = '/mnt/user-data/uploads/Acervo de Mapas - Governador/Mapas'
XLSX = os.environ.get('XLSX_CONVERTIDOS', '/tmp/claude-0/-home-claude/49e12fad-3ad5-5fd2-8d63-4cfafb1b1765/scratchpad/xls')
LISTA = [m for m in json.load(open('public/data/2026/municipios.json', encoding='utf8')) if m['uf'] != 'zz']
CODIGOS = {m['ibge'] for m in LISTA}

EXTRA = {'PIUI': 'PIUMHI', 'VASANTE': 'VAZANTE', 'POROXEU': 'POXOREU', 'CARCERES': 'CACERES', 'AMAMBI': 'AMAMBAI',
         'BARREIROGRANDE': 'TRES MARIAS', 'TAQUARACU': 'TAQUARACU DE MINAS',
         'EUGENIOBARROS': 'GOVERNADOR EUGENIO BARROS', 'SANTAQUITERIA': 'SANTA QUITERIA DO MARANHAO', 'SAOLUISGONZAGA': 'SAO LUIS GONZAGA DO MARANHAO',
         'SAOMATEUS': 'SAO MATEUS DO MARANHAO', 'TUNTUN': 'TUNTUM', 'BARRADEMAXARANGUAPE': 'MAXARANGUAPE', 'POXOREO': 'POXOREU', 'DENIZE': 'DENISE',
         'QUATROMARCOS': 'SAO JOSE DOS QUATRO MARCOS', 'JOAORIBEIRO': 'ENTRE RIOS DE MINAS', 'MONSANTO': 'MONTE SANTO DE MINAS',
         'PARREIRAS': 'CALDAS', 'POMBA': 'RIO POMBA', 'SILVESTREFERRAZ': 'CARMO DE MINAS'}

def achador(ufs, quieto=False):
    idx = {}
    for m in LISTA:
        if m['uf'] in ufs: idx.setdefault(chave(m['nome']), m['ibge'])
    import difflib
    faltou = set()
    def achar(nome):
        atual = re.search(r'\(atual ([^)]+)\)', str(nome))
        n = atual.group(1) if atual else re.sub(r'\(.*?\)', '', str(nome)).strip()
        k = chave(n)
        if k in idx: return idx[k]
        k = chave(EXTRA.get(k) or APELIDOS.get(k, k))
        if k in idx: return idx[k]
        mm = difflib.get_close_matches(k, idx, n=1, cutoff=0.86)
        if mm: return idx[mm[0]]
        if not quieto and n not in faltou: faltou.add(n); print(f'  ⚠ {"/".join(ufs)}: município não encontrado: {n}')
        return None
    return achar

# (ano, uf, cargo, arquivo, aba, linha do cabeçalho (0-based), {coluna: (nome, partido)}, {coluna: '#total'}, fonte)
FONTES = [
    (1960, 'mg', 'governador', f'{XLSX}/1960 - MG - Governador e Vice.xlsx', 'Governador', 3,
     {1: ('JOSÉ DE MAGALHÃES PINTO', 'UDN'), 2: ('TANCREDO NEVES', 'PSD'), 3: ('RIBEIRO PENA', 'PSP')},
     {5: '#brancos', 6: '#nulos', 7: '#comparecimento', 8: '#abstencao', 9: '#eleitorado'}, 'TRE-MG, eleições de 1960 por município'),
    (1965, 'mg', 'governador', f'{XLSX}/1965 - MG - Governador.xlsx', 'governador', 2,
     {1: ('PEDRO GOMES DE OLIVEIRA', 'MTR'), 2: ('ISRAEL PINHEIRO', 'PSD'), 3: ('ROBERTO RESENDE', 'UDN')},
     {5: '#brancos', 6: '#nulos', 7: '#comparecimento', 8: '#abstencao', 9: '#eleitorado'}, 'TRE-MG, eleições de 1965 por município'),
    (1965, 'mt', 'governador', f'{ACERVO}/MT/Resultados/MT 1954-1990.xlsx', '1965', 1,
     {1: ('PEDRO PEDROSSIAN', 'PSD'), 2: ('LÚDIO MARTINS COELHO', 'UDN')}, {}, 'Planilha MT 1954-1990 do acervo (municípios-sede)'),
    (1978, 'mt', 'senador', f'{ACERVO}/MT/Resultados/MT 1954-1990.xlsx', '1978 - Chapa B', 1,
     {1: ('VICENTE VUOLO', 'ARENA'), 2: ('BENTO DE SOUZA PORTO', 'ARENA'), 3: ('JOAQUIM NUNES ROCHA', 'ARENA'),
      4: ('PE. RAIMUNDO POMBO', 'MDB'), 5: ('EDEGARD NOGUEIRA', 'MDB'), 6: ('JOSÉ DEL REY JÚNIOR', 'MDB')}, {}, 'Planilha MT 1954-1990 do acervo'),
    (1986, 'mt', 'governador', f'{ACERVO}/MT/Resultados/MT 1954-1990.xlsx', '1986', 1,
     {1: ('CARLOS BEZERRA', 'PMDB'), 2: ('FREDERICO CAMPOS', 'PMB'), 3: ('GILSON DE BARROS', 'PDT'), 4: ('VICENTE MACHADO', 'PT')}, {}, 'Planilha MT 1954-1990 do acervo'),
    (1990, 'mt', 'governador', f'{ACERVO}/MT/Resultados/MT 1954-1990.xlsx', '1990', 1,
     {1: ('JAYME CAMPOS', 'PFL'), 2: ('AGRIPINO BONILHA', 'PMDB'), 3: ('LUIZ SCALOPPE', 'PT'), 4: ('LUIZ SOARES', 'PSDB'), 5: ('MAFALDA PEDRA', 'PSD')}, {}, 'Planilha MT 1954-1990 do acervo'),
    (1982, 'ma', 'governador', f'{ACERVO}/MA/Resultados/Maranhão 1982-1990 Relatorio.xlsx', 'Governador do Estado - 1982', 1,
     {1: ('LUIZ ROCHA', 'PDS'), 2: ('RENATO ARCHER', 'PMDB'), 3: ('PT', 'PT'), 4: ('PDT', 'PDT'), 5: ('PTB', 'PTB')}, {}, 'Relatório do Maranhão 1982-1990 (acervo)'),
    (1986, 'ma', 'governador', f'{ACERVO}/MA/Resultados/Maranhão 1982-1990 Relatorio.xlsx', 'Governador do Estado - 1986', 1,
     {1: ('JOÃO CASTELO', 'PDS'), 2: ('EPITÁCIO CAFETEIRA', 'PMDB'), 3: ('PT', 'PT')}, {}, 'Relatório do Maranhão 1982-1990 (acervo)'),
    # BA: coluna 0 = código IBGE, coluna 1 = nome; candidatos sem nome na planilha ficam com a sigla do partido
    (1986, 'ba', 'governador', f'{ACERVO}/BA/Resultados/BA 1986.xlsx', None, 0,
     {2: ('WALDIR PIRES', 'PMDB'), 3: ('JOSAPHAT MARINHO', 'PFL'), 4: ('PMB', 'PMB'), 5: ('PH', 'PH')}, {}, 'Planilha BA 1986 do acervo'),
    (1990, 'ba', 'governador', f'{ACERVO}/BA/Resultados/BA 1990.xlsx', None, 0,
     {2: ('ANTÔNIO CARLOS MAGALHÃES', 'PFL'), 3: ('ROBERTO SANTOS', 'PMDB'), 4: ('LÍDICE DA MATA', 'PCdoB'), 5: ('PSC', 'PSC'),
      6: ('SÉRGIO GABRIELLI', 'PT'), 7: ('PMN', 'PMN')}, {}, 'Planilha BA 1990 do acervo'),
    (1965, 'rn', 'governador', f'{ACERVO}/RN/Resultados/RN 1965.xlsx', None, 2,
     {1: ('WALFREDO GURGEL', 'PSD'), 2: ('DINARTE MARIZ', 'UDN')}, {3: '#brancos', 4: '#nulos', 5: '#comparecimento'}, 'Planilha RN 1965 do acervo'),
]
# por zona eleitoral: a zona tem o nome do município-sede; no mapa, os municípios da zona aparecem juntos
# (data/malhas-historicas/agrupar/{ano}-{uf}.csv: ibge;sede, ou "*;vizinho" quando não há a lista da zona)
FONTES += [
    (1955, 'mg', 'governador', f'{XLSX}/1955 - MG - Governador e Vice - Por ZE.xlsx', 'GOVERNADOR', 5,
     {2: ('JOSÉ FRANCISCO BIAS FORTES', 'PSD'), 3: ('OLAVO BILAC PINTO', 'UDN'), 4: ('GENTIL NASCIMENTO', 'PTB')},
     {6: '#brancos', 7: '#nulos', 14: '#comparecimento', 15: '#abstencao', 16: '#eleitorado'}, 'TRE-MG, eleições de 1955 por zona eleitoral'),
    (1947, 'mg', 'governador', f'{XLSX}/1947 MG.xlsx', None, 3,
     {2: ('JOSÉ FRANCISCO BIAS FORTES', 'PSD'), 3: ('MILTON SOARES CAMPOS', 'UDN')},
     {5: '#nulos', 6: '#brancos', 7: '#comparecimento', 8: '#abstencao', 9: '#eleitorado'}, 'TRE-MG, eleições de 1947 por zona eleitoral'),
]
ZONA = {(1955, 'mg'): 'Município-ZE', (1947, 'mg'): '*'}
SUBLEGENDA = {(1978, 'senador')}
# planilhas com a sede da zona em maiúsculas e os municípios/distritos da zona embaixo, em minúsculas
DISTRITOS = {(1965, 'mg')}
PULAR = re.compile(r'^(TOTAL|CAPITAL|INTERIOR|URNAS DE BRAS|BRAS[IÍ]LIA|CANDIDATO|VOTA[CÇ][AÃ]O|\(|\*)', re.I)

por_arquivo = collections.defaultdict(lambda: ([], {}, set()))
for ano, uf, cargo, arq, aba, cab, cands, tots, fonte in FONTES:
    if not os.path.exists(arq): print(f'  ⚠ falta {arq}'); continue
    wb = openpyxl.load_workbook(arq, read_only=True, data_only=True)
    ws = wb[aba] if aba else wb.active
    ufs = [uf] + (['ms'] if uf == 'mt' and ano < 1979 else []) + (['to'] if uf == 'go' and ano < 1989 else [])
    achar = achador(ufs)
    achar_quieto = achador(ufs, quieto=True)
    linhas, eleitos, fontes = por_arquivo[(ano, uf)]
    fontes.add(fonte)
    soma = collections.Counter(); sede = None; distritos = (ano, uf) in DISTRITOS
    for r in list(ws.iter_rows(values_only=True))[cab + 1:]:
        nome = (r[1] if (ano, uf) in ZONA or (r and isinstance(r[0], (int, float))) else r[0]) if r else None
        if isinstance(nome, str) and distritos and nome.strip() and nome.strip() != nome.strip().upper():
            # município (minúsculas) da zona da sede acima; o que não é município hoje (distrito) vai para a sede
            if not achar_quieto(nome): nome = sede
        elif isinstance(nome, str): sede = nome
        if not isinstance(nome, str) or not nome.strip() or PULAR.match(nome.strip()): continue
        nome = re.sub(r'^\d+°\s*', '', nome.strip())
        ib = str(int(r[0])) if isinstance(r[0], (int, float)) and str(int(r[0])) in CODIGOS else achar(nome)
        if not ib: continue
        num = lambda c: int(r[c]) if c < len(r) and isinstance(r[c], (int, float)) else 0
        if not any(num(c) for c in cands): continue
        for c, (n, p) in cands.items():
            linhas.append((cargo, 1, ib, '_' + chave(n), n, p, num(c))); soma[c] += num(c)
        for c, t in tots.items(): linhas.append((cargo, 1, ib, t, '', '', num(c)))
    if (ano, uf) in ZONA:
        os.makedirs('data/malhas-historicas/agrupar', exist_ok=True)
        with open(f'data/malhas-historicas/agrupar/{ano}-{uf}.csv', 'w', encoding='utf8') as g:
            g.write('ibge;sede\n')
            if ZONA[(ano, uf)] == '*': g.write('*;vizinho\n')
            else:
                sede_z = None
                for zr in list(wb[ZONA[(ano, uf)]].iter_rows(values_only=True))[4:]:
                    if not zr or not isinstance(zr[1], str): continue
                    ib = achar(zr[1])
                    if zr[0]: sede_z = ib
                    elif ib and sede_z and ib != sede_z: g.write(f'{ib};{sede_z}\n')
    if (ano, cargo) in SUBLEGENDA:
        pp = collections.Counter()
        for c, (n, p) in cands.items(): pp[p] += soma[c]
        venc = pp.most_common(1)[0][0]
        c = max((c for c in cands if cands[c][1] == venc), key=lambda c: soma[c])
    else:
        c = max(cands, key=lambda c: soma[c])
    eleitos[(cargo, '_' + chave(cands[c][0]))] = 'S'
    print(f'{ano} {uf} {cargo}: ' + ' | '.join(f'{cands[c][0]} {soma[c]}' for c in cands))
for (ano, uf), (linhas, eleitos, fontes) in por_arquivo.items():
    # mesmo município em várias linhas (zonas, distritos): soma
    ag = collections.OrderedDict()
    for c, t, ib, n, nome, p, v in linhas:
        k = (c, t, ib, n, nome, p); ag[k] = ag.get(k, 0) + v
    os.makedirs(f'data/tre/{ano}', exist_ok=True)
    gravar(f'data/tre/{ano}/{uf}-planilha.csv', [(*k, v) for k, v in ag.items()], eleitos, fonte='; '.join(sorted(fontes)))
