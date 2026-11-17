#!/usr/bin/env python3
"""Mato Grosso 1954, Senador (2 vagas), por junta apuradora (zona eleitoral): acervo, Mapas/MT/Resultados/
"MT 1954-1990.xlsx", aba 1954. As juntas são as mesmas da eleição de governador de 1955 (mesma aba-irmã "1955"), cuja
sede de cada uma já está no acervo (data/historico/governador/MT.xlsx, aba 1955): junta → município-sede.
Uso: python3 scripts/extrair/mt-1954-senador.py --xlsx "<acervo>/Mapas/MT/Resultados/MT 1954-1990.xlsx" """
import argparse, os, re, sys
import openpyxl
sys.path.insert(0, os.path.dirname(__file__))
from comum import gravar, chave
a = argparse.ArgumentParser(); a.add_argument('--xlsx', required=True); a = a.parse_args()
SEDE = {1: '5103403', 2: '5101704', 3: '5003207', 4: '5001102', 5: '5005400', 6: '5002100', 7: '5006606', 8: '5002704', 9: '5003108',
        10: '5006309', 11: '5008305', 12: '5103502', 13: '5003702', 14: '5005608', 15: '5006903', 16: '5007109', 17: '5107701',
        18: '5102504', 19: '5107008', 20: '5101605', 21: '5100300', 22: '5100508', 23: '5101803', 24: '5001003'}
CANDS = [('FILINTO MÜLLER', 'PSD'), ('JOÃO VILLAS-BOAS', 'UDN'), ('DOLOR FERREIRA DE ANDRADE', 'UDN'), ('JÚLIO MÜLLER', 'PTB'),
         ('LEÔNIDAS PEREIRA MENDES', 'PSP'), ('PONCE FILHO', 'PR')]
ws = openpyxl.load_workbook(a.xlsx, read_only=True, data_only=True)['1954']
saida = []
for r in ws.iter_rows(min_row=3, max_row=26, values_only=True):
    j = int(re.match(r'(\d+)', str(r[0])).group(1))
    for (n, p), v in zip(CANDS, r[1:7]): saida.append(('senador', 1, SEDE[j], '_' + chave(n), n, p, int(float(v or 0))))
gravar('data/tre/1954/mt.csv', saida, {('senador', '_' + chave('FILINTO MÜLLER')): 'S', ('senador', '_' + chave('JOÃO VILLAS-BOAS')): 'S'},
       fonte='Acervo Sigoli.TSE, planilha MT 1954-1990 (resultado por junta apuradora, cada uma no município-sede)')
