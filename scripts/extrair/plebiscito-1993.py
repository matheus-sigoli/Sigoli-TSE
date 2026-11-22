#!/usr/bin/env python3
"""
Plebiscito de 21 de abril de 1993 (forma e sistema de governo), por município.

Fonte: relatórios do TSE "Resultado do Município" (Coordenação Geral de Informática, impressora de agulha), digitalizados
pelos TREs e guardados no acervo (Resultados sobre o Brasil geral/ARQUIVOS - PLEBISCITO 1993/). A leitura das páginas
(scripts/extrair/plebiscito1993/, OCR próprio para a fonte da impressora) grava data/tre/fontes/plebiscito-1993/{uf}.json:
uma linha por município, com os números conferidos pelas contas do próprio relatório:
  Monarquia + República + brancos + nulos = comparecimento = Parlamentarismo + Presidencialismo + brancos + nulos
  eleitorado − não compareceram = comparecimento
e, quando dá, pelos percentuais impressos. Página que não fecha fica de fora (lista no fim) ou foi corrigida à mão
(campo "manual").

Saída: data/tre/1993/{uf}.csv (cargos "forma" e "sistema"). Depois: scripts/tre.py --ano 1993,
scripts/presidente-br.py --ano 1993 --cargo forma (e sistema) e scripts/oficial.py --ano 1993.
Uso: python3 scripts/extrair/plebiscito-1993.py
"""
import glob, json, os, sys
sys.path.insert(0, os.path.dirname(__file__))
from comum import gravar, chave

OPC = {
    'forma': [('mon', 'MONARQUIA'), ('rep', 'REPÚBLICA')],
    'sistema': [('parl', 'PARLAMENTARISMO'), ('pres', 'PRESIDENCIALISMO')],
}
TOT = {'forma': ('br1', 'nu1'), 'sistema': ('br2', 'nu2')}
NOME_UF = {'ac': 'Acre', 'al': 'Alagoas', 'am': 'Amazonas', 'ba': 'Bahia', 'df': 'Distrito Federal', 'go': 'Goiás',
           'ma': 'Maranhão', 'mg': 'Minas Gerais', 'ms': 'Mato Grosso do Sul', 'pb': 'Paraíba', 'pe': 'Pernambuco',
           'pi': 'Piauí', 'pr': 'Paraná', 'rj': 'Rio de Janeiro', 'rs': 'Rio Grande do Sul', 'sc': 'Santa Catarina',
           'se': 'Sergipe', 'sp': 'São Paulo'}
os.makedirs('data/tre/1993', exist_ok=True)
for arq in sorted(glob.glob('data/tre/fontes/plebiscito-1993/*.json')):
    uf = os.path.basename(arq)[:-5]
    regs = json.load(open(arq, encoding='utf8'))
    linhas = []
    for r in regs:
        for cargo, ops in OPC.items():
            for k, nome in ops:
                linhas.append((cargo, 1, r['ibge'], '_' + chave(nome), nome, nome, r[k]))
            br, nu = TOT[cargo]
            linhas += [(cargo, 1, r['ibge'], '#brancos', '', '', r[br]), (cargo, 1, r['ibge'], '#nulos', '', '', r[nu]),
                       (cargo, 1, r['ibge'], '#comparecimento', '', '', r['comp']),
                       (cargo, 1, r['ibge'], '#eleitorado', '', '', r['eleit'])]
    # no estado, quem venceu (não há eleito em plebiscito; a marca fica com a opção vencedora no Brasil)
    gravar(f'data/tre/1993/{uf}.csv', linhas, {('forma', '_' + chave('REPÚBLICA')): 'S', ('sistema', '_' + chave('PRESIDENCIALISMO')): 'S'},
           fonte=f'TSE, relatórios "Resultado do Município" do plebiscito de 21/04/1993 ({NOME_UF.get(uf, uf.upper())}), do acervo')
    print(uf, len(regs), 'municípios')
