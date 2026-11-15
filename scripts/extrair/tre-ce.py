#!/usr/bin/env python3
"""
TRE-CE, eleições de 1986 e 1990: planilhas do TRE (convertidas de .xls para .xlsx com o LibreOffice) em
data/tre/fontes/ce-{ano}/ → data/tre/{ano}/ce.csv.
"Resultado por Município": uma linha por candidato (número, nome, partido ou coligação) e uma coluna por município.
1986: brancos e nulos nas últimas linhas de cada planilha; eleitorado e votantes só no total do estado.
1990: comparecimento e eleitorado por município e zona; brancos e nulos por município e zona; voto de legenda dos
deputados por município. Eleitos: planilhas "Eleitos".
Uso: python3 scripts/extrair/tre-ce.py
"""
import collections, os, re, sys
import openpyxl
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar, chave, PARTIDO_1990

achar = ibge_por_nome('ce')
CARGOS = {'Governador': 'governador', 'Senador': 'senador', 'Deputado Federal': 'deputado-federal', 'Deputado Estadual': 'deputado-estadual'}
linhas_ws = lambda f: list(openpyxl.load_workbook(f, read_only=True, data_only=True).active.iter_rows(values_only=True))
inteiro = lambda x: int(str(x).strip() or 0) if x not in (None, '') else 0

for ano in (1986, 1990):
    base = f'data/tre/fontes/ce-{ano}'
    if not os.path.isdir(base): continue
    linhas, eleitos = [], {}
    for rot, cargo in CARGOS.items():
        rs = linhas_ws(f'{base}/{rot} - Resultado por Município.xlsx')
        cab = rs[0]
        muns = [(i, achar(str(n))) for i, n in enumerate(cab) if i >= 3 and n]
        for r in rs[1:]:
            if not r or r[0] in (None, ''): continue
            rot0 = str(r[0]).strip().upper()
            if rot0 in ('BRANCOS', 'NULOS'):
                # nessas linhas os valores começam uma coluna antes (não há nome nem partido)
                for i, ib in muns:
                    v = r[i - 2] if i - 2 < len(r) else 0
                    linhas.append((cargo, 1, ib, '#' + rot0.lower(), '', '', inteiro(v)))
                continue
            num = str(r[0]).strip().split('.')[0]
            if ano == 1986: nome, partido = r[1], str(r[2]).split('-')[0].strip()
            else: nome, partido = r[2], PARTIDO_1990.get(num[:2], num[:2])
            for i, ib in muns:
                v = inteiro(r[i]) if i < len(r) else 0
                if v: linhas.append((cargo, 1, ib, num, str(nome).strip(), partido, v))
    if ano == 1990:
        comp = collections.Counter(); eleit = collections.Counter()
        for r in linhas_ws(f'{base}/Senador-Governador-Deputado Federal-Deputado Estadual - Comparecimento x Abstenção.xlsx')[1:]:
            if r[0]: ib = achar(str(r[0])); eleit[ib] += inteiro(r[2]); comp[ib] += inteiro(r[3])
        for cargo in CARGOS.values():
            for ib in comp: linhas += [(cargo, 1, ib, '#eleitorado', '', '', eleit[ib]), (cargo, 1, ib, '#comparecimento', '', '', comp[ib])]
        for r in linhas_ws(f'{base}/Senador-Governador-Deputado Federal-Deputado Estadual - Votos Brancos e Nulos por Município e Zona.xlsx')[1:]:
            if not r[0]: continue
            cargo = CARGOS[str(r[2]).title().replace('Deputado', 'Deputado')]
            ib = achar(str(r[0]))
            linhas += [(cargo, 1, ib, '#brancos', '', '', inteiro(r[3])), (cargo, 1, ib, '#nulos', '', '', inteiro(r[4]))]
        for r in linhas_ws(f'{base}/Senador-Governador-Deputado Federal-Deputado Estadual - Votos de Legenda por Município.xlsx')[1:]:
            if not r[0]: continue
            cargo = CARGOS.get(str(r[1]).title())
            if cargo: p = str(r[2]).split('.')[0]; linhas.append((cargo, 1, achar(str(r[0])), '#legenda', '', PARTIDO_1990.get(p, p), inteiro(r[3])))
        for r in linhas_ws(f'{base}/Senador-Governador-Deputado Federal-Deputado Estadual - Eleitos.xlsx')[4:]:
            c = CARGOS.get(str(r[0] or '').title())
            if c and r[1]: eleitos[(c, str(r[1]).split('.')[0])] = 'S'
    else:
        # 1986: eleitos pelas planilhas (nome) → número
        nomes = {(c, chave(l[4])): l[3] for l in linhas for c in [l[0]] if not l[3].startswith('#')}
        for rot, cargo in (('Deputado Federal', 'deputado-federal'), ('Deputado Estadual', 'deputado-estadual')):
            for r in linhas_ws(f'{base}/{rot} - Eleitos.xlsx')[4:]:
                for j in (0, 3):
                    if not (len(r) > j and r[j]): continue
                    k = (cargo, chave(r[j]))
                    if k not in nomes:
                        import difflib
                        m = difflib.get_close_matches(k[1], [n for c, n in nomes if c == cargo], n=1, cutoff=0.85)
                        if not m: print('  eleito não achado:', cargo, r[j]); continue
                        k = (cargo, m[0])
                    eleitos[(cargo, nomes[k])] = 'S'
        for rot, cargo, vagas in (('Governador', 'governador', 1), ('Senador', 'senador', 2)):
            tot = collections.Counter()
            for l in linhas:
                if l[0] == cargo and not l[3].startswith('#'): tot[l[3]] += l[6]
            for n, _ in tot.most_common(vagas): eleitos[(cargo, n)] = 'S'
    gravar(f'data/tre/{ano}/ce.csv', linhas, eleitos, fonte=f'TRE-CE, resultado das eleições de {ano} por município')
