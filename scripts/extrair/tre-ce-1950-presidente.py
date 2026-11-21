#!/usr/bin/env python3
"""Ceará, Presidente e Vice-Presidente 1950: planilhas do TRE-CE (Seção de Estatísticas Eleitorais) do acervo,
Mapas/CE/Resultados/1950/{Presidente,Vice-Presidente} - Resultado por Município no Ceará.xls, convertidas para .xlsx
(soffice --headless --convert-to xlsx) em $XLSX_CONVERTIDOS/CE/1950/. Uma linha por zona e município, com candidatos,
brancos, anulados e total de votantes; as zonas de Fortaleza somam. Eleitos: Getúlio Vargas e Café Filho (resultado nacional).
Saída: data/tre/1950/ce-presidente.csv. Uso: python3 scripts/extrair/tre-ce-1950-presidente.py"""
import collections, os, re, sys, openpyxl
sys.path.insert(0, os.path.dirname(__file__))
from comum import ibge_por_nome, gravar, chave
PASTA = os.path.join(os.environ.get('XLSX_CONVERTIDOS', '/tmp/claude-0/-home-claude/49e12fad-3ad5-5fd2-8d63-4cfafb1b1765/scratchpad/xls'), 'CE', '1950')
achar = ibge_por_nome('ce')
ANTIGOS = {'LAVRAS': 'Lavras da Mangabeira', 'JUAZEIRO': 'Juazeiro do Norte', 'LIMOEIRO': 'Limoeiro do Norte', 'VICOSA': 'Viçosa do Ceará',
           'ANACETABA': 'São Gonçalo do Amarante', 'SAOGDOAMARANTE': 'São Gonçalo do Amarante', 'LICANIA': 'Santana do Acaraú',
           'SANTANOPOLE': 'Santana do Cariri', 'FRADE': 'Jaguaretama', 'INHUCU': 'Guaraciaba do Norte', 'QUIXARA': 'Farias Brito',
           'SANTACRUZDONORTE': 'Reriutaba', 'COCOCY': 'Parambu', 'GENERALTIBURCIO': 'Viçosa do Ceará', 'BATOQUE': 'Hidrolândia', 'SOLONOPOLIS': 'Solonópole', 'BRABALHA': 'Barbalha', 'LICENIA': 'Santana do Acaraú'}
ARQ = {'presidente': ('Presidente - Resultado por Município no Ceará.xlsx',
                      [('EDUARDO GOMES', 'UDN'), ('CRISTIANO MACHADO', 'PSD'), ('GETÚLIO VARGAS', 'PTB'), ('JOÃO MANGABEIRA', 'PSB')], 'GETÚLIO VARGAS'),
       'vice-presidente': ('Vice-Presidente - Resultado por Município no Ceará.xlsx',
                      [('ODILON BRAGA', 'UDN'), ('ALTINO ARANTES', 'PSD'), ('CAFÉ FILHO', 'PSP'), ('VITORINO FREIRE', 'PST'), ('ALÍPIO CORREIA NETO', 'PSB')], 'CAFÉ FILHO')}
linhas, el, fora = [], {}, set()
for cargo, (arq, cands, eleito) in ARQ.items():
    soma = collections.defaultdict(lambda: [0] * (len(cands) + 3))
    for r in openpyxl.load_workbook(os.path.join(PASTA, arq), data_only=True).active.iter_rows(values_only=True):
        if not isinstance(r[0], (int, float)) or not r[1]: continue
        nome = ANTIGOS.get(chave(r[1]), r[1]); ib = achar(nome)
        if not ib: fora.add(r[1]); continue
        v = [int(x or 0) for x in r[2:2 + len(cands) + 3]]
        assert sum(v[:-1]) == v[-1], (cargo, r)
        soma[ib] = [a + b for a, b in zip(soma[ib], v)]
    for ib, v in soma.items():
        linhas += [(cargo, 1, ib, '_' + chave(n), n, p, x) for (n, p), x in zip(cands, v)]
        linhas += [(cargo, 1, ib, '#brancos', '', '', v[-3]), (cargo, 1, ib, '#nulos', '', '', v[-2]), (cargo, 1, ib, '#comparecimento', '', '', v[-1])]
    el[(cargo, '_' + chave(eleito))] = 'S'
    print(cargo, len(soma), [sum(v[i] for v in soma.values()) for i in range(len(cands) + 3)])
gravar('data/tre/1950/ce-presidente.csv', linhas, el, fonte='TRE-CE, Seção de Estatísticas Eleitorais (resultado por zona e município)')
print('fora:', fora)
