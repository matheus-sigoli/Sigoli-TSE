# Leitura dos relatórios do plebiscito de 1993

Os PDFs do acervo ("Resultados sobre o Brasil geral/ARQUIVOS - PLEBISCITO 1993") são digitalizações dos relatórios
"RESULTADO DO MUNICIPIO" do TSE, impressos em impressora de agulha. O OCR comum erra muito nessa fonte, então a leitura é própria:

1. `pdftoppm -r 150 -png <uf>.pdf img/<uf>/p` (uma imagem por página).
2. `python3 leitor.py res_<uf>.json img/<uf>/*.png`
   - `grid.py`: tira as faixas pretas da digitalização, endireita a página e põe a letra na altura de 17 px; o texto é monoespaçado (15 px por caractere).
   - cada caractere é classificado por uma SVM (`clf.pkl`: dígitos, pontuação e "L" para letra); o nome do município sai de outra SVM (`clfn.pkl`).
   - a página só vale se fechar as contas do próprio relatório: Monarquia + República + brancos + nulos = comparecimento =
     Parlamentarismo + Presidencialismo + brancos + nulos, e eleitorado − não compareceram = comparecimento.
     Dígito ilegível só é preenchido quando a soma deixa uma única possibilidade (e os percentuais impressos batem).
3. `casar.py` liga o nome lido ao código do IBGE (tolerando as trocas O/G/D/C/U da impressora) e grava
   `data/tre/fontes/plebiscito-1993/<uf>.json`, conferindo a soma com o total oficial do estado.
4. `python3 scripts/extrair/plebiscito-1993.py` gera `data/tre/1993/<uf>.csv`.
