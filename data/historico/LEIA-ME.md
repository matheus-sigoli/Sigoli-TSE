# Resultados antigos (acervo de planilhas)

Esta pasta guarda as eleições que o TSE não publica por município. O script `scripts/historico.py` converte as planilhas para o formato do site.

## Organização

```
data/historico/
  MODELO.xlsx              planilha-modelo (copie para começar um estado)
  governador/SP.xlsx       uma planilha por estado, dentro da pasta do cargo
  governador/MG.xlsx
  senador/RJ.xlsx
  presidente/BR.xlsx       (Presidente: uma planilha só, com todos os municípios)
```

Dentro de cada planilha:

- **Uma aba por eleição**, com o nome `ANO NT`: `1990 1T`, `1990 2T`. Uma aba só com o ano (`1958`) conta como 1º turno. Abas com outros nomes (BASE, Associação, Planilha1…) são ignoradas.
- **Colunas da aba**:
  - `CDG`: código do IBGE do município, o de hoje. Quando dois municípios da época viraram um só, repita o código e o script soma as linhas.
  - `MUN`: nome do município (só para você conferir).
  - `APTOS`, `COMPARECIMENTO`, `BRANCOS`, `NULOS`: opcionais. Sem elas, o site mostra só os votos dos candidatos.
  - **Uma coluna por candidato**, com a sigla do partido no cabeçalho (`PDS`, `PMDB`…).
  - Colunas que começam com `%` e a coluna `MAPA` são só para você: o script ignora.
- **Aba `CANDIDATOS`** (opcional, mas recomendada): `ANO`, `TURNO`, `PARTIDO` (o mesmo texto do cabeçalho da coluna), `NUMERO`, `NOME`, `VICE`, `PARTIDO VICE`, `COLIGACAO` e `ELEITO` (`SIM`, `2º TURNO` ou vazio). Sem ela, o candidato aparece pelo nome do partido.

## Gerar e conferir

```
python3 scripts/historico.py --conferir            # só confere e mostra o relatório
python3 scripts/historico.py --ano 1990            # grava public/data/1990/…
```

O relatório avisa:
- código fora da lista do IBGE ou de outro estado (erro de digitação);
- códigos repetidos (somados);
- municípios sem voto;
- o total de cada candidato, para conferir com a fonte.

Depois de gravar, o mapa do ano sai de `scripts/malha-ano.mjs` (municípios criados depois voltam ao de origem, `scripts/lib/fusoes.mjs`). O ano entra no site em `src/lib/anos.ts`.

## Até onde vai a malha

- **De 1989 em diante**, a malha de hoje com as fusões já cadastradas resolve.
- **Antes de 1989**, os municípios eram bem menos (SP: 382 em 1947, 572 em 1982). Para esses anos, o próximo passo é usar as malhas históricas do IBGE (1940 a 1991, já no acervo em `Malhas/shp`), ou ampliar as fusões com as Áreas Mínimas Comparáveis.
