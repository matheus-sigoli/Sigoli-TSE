#!/usr/bin/env python3
"""
TRE-RN, 1990, 1º turno: "Relatório da Votação dos Candidatos por Município" (PDF com texto) → data/tre/1990/rn.csv.
Governador, Senador, Deputado Federal e Estadual; "*" marca o eleito. Não traz brancos, nulos nem comparecimento.
Uso: python3 scripts/extrair/tre-rn-1990.py
"""
import os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar, partido_1990

achar = ibge_por_nome('rn')
CARGOS = {'GOVERNADOR': 'governador', 'SENADOR': 'senador', 'DEPUTADO FEDERAL': 'deputado-federal', 'DEPUTADO ESTADUAL': 'deputado-estadual'}
txt = subprocess.run(['pdftotext', '-layout', 'data/tre/fontes/rn-1990/votacao-1t.pdf', '-'], capture_output=True, text=True).stdout
linhas, eleitos, ib, cargo = [], {}, None, None
for l in txt.splitlines():
    m = re.match(r'Município\s+\d+\s*-\s*(.+?)\s*$', l)
    if m: ib = achar(m.group(1)); continue
    m = re.match(r'Cargo\s+(.+?)\s*$', l)
    if m: cargo = CARGOS[m.group(1)]; continue
    m = re.match(r'(\d{5})\s+(.+?)\s{2,}([\d.]+)\s*(\*)?\s*$', l)
    if m and cargo and ib:
        num = m.group(1).lstrip('0')
        linhas.append((cargo, 1, ib, num, m.group(2).strip(), partido_1990(num), int(m.group(3).replace('.', ''))))
        if m.group(4): eleitos[(cargo, num)] = 'S'
# Governador de 1990 no RN: 2º turno entre Agripino (11) e Lavoisier (12)
eleitos[('governador', '11')] = eleitos[('governador', '12')] = '2'
gravar('data/tre/1990/rn.csv', linhas, eleitos, fonte='TRE-RN, relatório da votação dos candidatos por município, 1º turno de 1990')
