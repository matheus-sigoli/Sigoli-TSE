"""Funções comuns dos extratores de PDF/planilha de TRE para o formato data/tre/{ano}/{uf}.csv."""
import csv, json, unicodedata, re

def chave(s):
    s = ''.join(c for c in unicodedata.normalize('NFD', str(s)) if unicodedata.category(c) != 'Mn').upper()
    return re.sub(r'[^A-Z0-9]', '', s.replace("D'", 'D'))

# nomes antigos ou grafias de época → nome de hoje
APELIDOS = {'JUTY': 'JUTI', 'BATAIPORA': 'BATAYPORA'}

def ibge_por_nome(uf):
    lista = [m for m in json.load(open('public/data/2026/municipios.json', encoding='utf8')) if m['uf'] == uf]
    idx = {chave(m['nome']): m['ibge'] for m in lista}
    def achar(nome):
        k = chave(nome); k = chave(APELIDOS.get(k, k))
        if k in idx: return idx[k]
        raise KeyError(f'{uf}: município não encontrado: {nome}')
    return achar

def gravar(caminho, linhas, eleitos, fonte):
    """linhas: (cargo, turno, ibge, numero, nome, partido, votos); numero '#brancos', '#nulos', '#comparecimento',
    '#abstencao', '#eleitorado' para os totais. eleitos: {(cargo, numero)}."""
    with open(caminho, 'w', newline='', encoding='utf8') as f:
        w = csv.writer(f, delimiter=';', lineterminator='\n')
        w.writerow(['cargo', 'turno', 'ibge', 'numero', 'nome', 'partido', 'votos', 'eleito'])
        for c, t, ib, n, nome, p, v in linhas:
            w.writerow([c, t, ib, n, nome, p, v, (eleitos.get((c, n), '') if isinstance(eleitos, dict) else ('S' if (c, n) in eleitos else ''))])
    with open(caminho.replace('.csv', '.fonte.txt'), 'w', encoding='utf8') as f: f.write(fonte + '\n')
    print(f'{caminho}: {len(linhas)} linhas, {len(eleitos)} eleitos')
