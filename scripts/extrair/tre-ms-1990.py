#!/usr/bin/env python3
"""
TRE-MS, Eleições Gerais 1990: um PDF por município (data/tre/fontes/ms-1990/) → data/tre/1990/ms.csv.
Os PDFs são do site do TRE-MS (resultados de eleições anteriores), com Governador, Senador, Deputado Federal e
Deputado Estadual, comparecimento, abstenção, brancos e nulos por município. O PDF "Resultado-Estadual" dá os eleitos.
Uso: python3 scripts/extrair/tre-ms-1990.py
"""
import csv, glob, os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar

CARGOS = {'GOVERNADOR': 'governador', 'SENADOR': 'senador', 'DEPUTADO FEDERAL': 'deputado-federal', 'DEPUTADO ESTADUAL': 'deputado-estadual'}
num = lambda s: int(s.replace('.', ''))
linhas, eleitos = [], set()
achar = ibge_por_nome('ms')
for pdf in sorted(glob.glob('data/tre/fontes/ms-1990/*.pdf')):
    txt = subprocess.run(['pdftotext', '-layout', pdf, '-'], capture_output=True, text=True).stdout
    estadual = 'Resultado-Estadual' in pdf
    if not estadual:
        nome = re.search(r'Município:\s*(.+)', txt).group(1).strip()
        ibge = achar(nome)
        comp = num(re.search(r'Comparecimento\s+([\d.]+)', txt).group(1))
        abst = num(re.search(r'Abstenções\s+([\d.]+)', txt).group(1))
    cargo, eleito_bloco = None, False
    for l in txt.splitlines():
        m = re.match(r'\s*CARGO:\s*(.+?)\s*$', l)
        if m: cargo = CARGOS[m.group(1)]; eleito_bloco = False
        if re.search(r'NÃO\s*-\s*ELEITOS', l): eleito_bloco = False; continue
        if re.search(r'^\s*ELEITOS\s*$', l): eleito_bloco = True; continue
        m = re.match(r'\s*(\d{2,5})\s+(.+?)\s{2,}(?:([A-Z][A-Za-z]*)\s+)?([\d.]+)\s*$', l)
        if not m or not cargo: continue
        n, nome_c, part, v = m.group(1), m.group(2).strip(), m.group(3) or '', num(m.group(4))
        if estadual:
            if '- Eleito' in nome_c or '-Eleito' in nome_c or eleito_bloco: eleitos.add((cargo, n))
            continue
        if n == '93': linhas.append((cargo, 1, ibge, '#brancos', '', '', v)); continue
        if n == '95': linhas.append((cargo, 1, ibge, '#nulos', '', '', v)); continue
        linhas.append((cargo, 1, ibge, n, nome_c, part, v))
    if not estadual:
        for c in CARGOS.values():
            linhas.append((c, 1, ibge, '#comparecimento', '', '', comp)); linhas.append((c, 1, ibge, '#abstencao', '', '', abst))
gravar('data/tre/1990/ms.csv', linhas, eleitos, fonte='TRE-MS, Eleições Gerais 1990 (resultado por município)')
