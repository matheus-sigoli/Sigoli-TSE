"""Funções comuns dos extratores de PDF/planilha de TRE para o formato data/tre/{ano}/{uf}.csv."""
import csv, json, unicodedata, re

def chave(s):
    s = ''.join(c for c in unicodedata.normalize('NFD', str(s)) if unicodedata.category(c) != 'Mn').upper()
    return re.sub(r'[^A-Z0-9]', '', s.replace("D'", 'D'))

# nomes antigos ou grafias de época → nome de hoje
APELIDOS = {'JUTY': 'JUTI', 'BATAIPORA': 'BATAYPORA', 'ITAPAGE': 'ITAPAJE', 'MOCAMBO': 'MUCAMBO', 'DEPIRAPUANPINHEIRO': 'DEPUTADO IRAPUAN PINHEIRO', 'EUZEBIO': 'EUSEBIO', 'TEJUSSUOCA': 'TEJUCUOCA', 'BROCHIERDOMARATA': 'BROCHIER', 'TRINDADE': 'TRINDADE DO SUL', 'ARES': 'AREZ', 'AUGUSTOSEVERO': 'CAMPO GRANDE', 'JANUARIOCICCO': 'BOA SAUDE', 'PRESIDENTEJUSCELINO': 'SERRA CAIADA',
            'GENERALVARGAS': 'SAO VICENTE DO SUL', 'BOMJESUSDOTRIUNFO': 'TRIUNFO', 'CAMPOREALNAOMETOQUE': 'NAO ME TOQUE',
            'IBIPETUBA': 'SANTA RITA DE CASSIA', 'LIVRAMENTODOBRUMADO': 'LIVRAMENTO DE NOSSA SENHORA', 'SANTOINACIO': 'GENTIO DO OURO',
            'PARATI': 'PARATY', 'CAMPOS': 'CAMPOS DOS GOYTACAZES',
            'NOVABRASILANDIA': "NOVA BRASILANDIA D'OESTE", 'VILANOVADOMAMORE': 'NOVA MAMORE'}
FALTANDO = set()

def ibge_por_nome(uf):
    lista = [m for m in json.load(open('public/data/2026/municipios.json', encoding='utf8')) if m['uf'] == uf]
    idx = {chave(m['nome']): m['ibge'] for m in lista}
    def achar(nome):
        k = chave(nome); k = chave(APELIDOS.get(k, k))
        if k in idx: return idx[k]
        import difflib
        m = difflib.get_close_matches(k, idx, n=1, cutoff=0.88)
        if m: return idx[m[0]]
        if nome not in FALTANDO: FALTANDO.add(nome); print(f'  ⚠ {uf}: município não encontrado: {nome}')
        return None
    return achar

def gravar(caminho, linhas, eleitos, fonte):
    """linhas: (cargo, turno, ibge, numero, nome, partido, votos); numero '#brancos', '#nulos', '#comparecimento',
    '#abstencao', '#eleitorado' para os totais. eleitos: {(cargo, numero)}."""
    with open(caminho, 'w', newline='', encoding='utf8') as f:
        w = csv.writer(f, delimiter=';', lineterminator='\n')
        w.writerow(['cargo', 'turno', 'ibge', 'numero', 'nome', 'partido', 'votos', 'eleito'])
        for c, t, ib, n, nome, p, v in linhas:
            if ib is None: continue
            w.writerow([c, t, ib, n, nome, p, v, (eleitos.get((c, n, t), eleitos.get((c, n), '')) if isinstance(eleitos, dict) else ('S' if (c, n) in eleitos else ''))])
    with open(caminho.replace('.csv', '.fonte.txt'), 'w', encoding='utf8') as f: f.write(fonte + '\n')
    print(f'{caminho}: {len(linhas)} linhas, {len(eleitos)} eleitos')

# números de partido em 1990 (prefixo do número do candidato); os que não sabemos ficam "P<número>"
PARTIDO_1990 = {'11': 'PDS', '12': 'PDT', '13': 'PT', '14': 'PTB', '15': 'PMDB', '17': 'PDC', '20': 'PSC', '22': 'PL', '23': 'PCB',
                '25': 'PFL', '28': 'PTR', '33': 'PMN', '36': 'PRN', '40': 'PSB', '41': 'PSD', '45': 'PSDB', '65': 'PC do B', '70': 'PT do B'}
partido_1990 = lambda num: PARTIDO_1990.get(num[:2], 'P' + num[:2])
