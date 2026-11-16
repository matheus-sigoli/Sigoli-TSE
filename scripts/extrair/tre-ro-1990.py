#!/usr/bin/env python3
"""
TRE-RO, 1990, 1º turno: "Relatório: Resultados por Município" (PDF com texto, 82 páginas) →
data/tre/1990/ro.csv. Cada município traz Governador, Senador, Deputado Federal e Deputado Estadual com
número, nome, sigla, votos e situação (Eleito, 2o. Turno, Suplente…); 95 = brancos, 96 = nulos.
Uso: python3 scripts/extrair/tre-ro-1990.py
"""
import os, re, subprocess, sys
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar

PDF = 'data/tre/fontes/ro-1990/1990-1t.pdf'
txt = subprocess.run(['pdftotext', '-layout', PDF, '-'], capture_output=True, text=True).stdout
achar = ibge_por_nome('ro')
CARGO = {'Governador': 'governador', 'Senador': 'senador', 'Deputado Federal': 'deputado-federal', 'Deputado Estadual': 'deputado-estadual'}
LINHA = re.compile(r'^\s+(\d+)\s+(.+?)\s{2,}(?:([A-Z][A-Za-z ]{1,8}?)\s+)?(\d+)\s+(Eleito|Não Eleito|2o\. Turno|Suplente|\S.*)?\s*$')
linhas, eleitos = [], {}
ib = cargo = None
for l in txt.splitlines():
    s = l.strip()
    if not s or s.startswith(('Tribunal', 'Eleições de', 'Relatório', 'Número Candidato')) or 'Página' in s: continue
    if s in CARGO: cargo = CARGO[s]; continue
    m = LINHA.match(l)
    if not m:
        if s.isupper() and not any(c.isdigit() for c in s): ib = achar(s); cargo = None
        continue
    num, nome, sgl, votos, sit = m.groups()
    if not cargo or not ib: continue
    v = int(votos)
    if num == '95': linhas.append((cargo, 1, ib, '#brancos', '', '', v)); continue
    if num == '96': linhas.append((cargo, 1, ib, '#nulos', '', '', v)); continue
    linhas.append((cargo, 1, ib, num, nome.strip(), (sgl or '').strip(), v))
    if sit and sit.startswith('Eleito'): eleitos[(cargo, num)] = 'S'
    elif sit and sit.startswith('2o'): eleitos[(cargo, num)] = '2'
gravar('data/tre/1990/ro.csv', linhas, eleitos, fonte='TRE-RO, relatório de resultados por município, 1º turno de 1990')
