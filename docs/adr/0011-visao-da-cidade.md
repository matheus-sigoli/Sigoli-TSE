# ADR 0011 — Visão da cidade: zonas, bairros e locais de votação

- Status: Aceita (muda a navegação das ADRs 0008 e 0009)
- Data: 01/11/2026

## Contexto
O usuário pediu que, ao entrar numa cidade, desse para ver o resultado dela por **zona**, **bairro** e **local de votação**,
clicando em cada unidade para ver o detalhe no painel; e que o duplo clique num município abrisse esse detalhamento
(um clique continua só selecionando).

## Decisão
1. **Estado**: Ver por *Municípios | Zonas*. Um clique seleciona o município; **dois cliques** (ou o botão
   "Abrir detalhamento da cidade" no painel, para telas de toque) abrem a cidade: `?cid={IBGE}&nivel=zonas|bairros|locais`.
2. **Cidade**: Ver por *Zonas | Bairros | Locais*; `mun` é a unidade selecionada. "Voltar ao estado" fecha a cidade.
   - Zonas: a parte de cada zona dentro da cidade (`public/geo/zonas-cidade/{uf}.json`, id `{ibge}-{zona}`) com o
     resultado só dos locais daquela cidade (`{cargo}/{turno}/zonas-cidade/{uf}.json`).
   - Bairros: como na ADR 0009.
   - Locais: círculos por local de votação (área ∝ eleitorado) sobre os bairros do IBGE (`{cargo}/{turno}/locais/{uf}.json`).
3. No painel, a zona e o bairro listam seus locais de votação; clicar num local abre ele no nível Locais.

## Consequências
- Quatro arquivos de resultado por cargo/turno/UF (zonas, zonas-cidade, bairros, locais), gerados pelo workflow.
- Os locais de votação aparecem como pontos. Se houver uma malha de áreas por local (ex.: o zip enviado pelo usuário),
  ela pode substituir os círculos sem mudar o formato dos resultados, que já é por local.
