# ADR 0009 — Bairros no lugar dos locais de votação

- Status: Aceita (substitui o nível "Locais" da ADR 0008)
- Data: 01/11/2026

## Contexto
O usuário pediu para agrupar os locais de votação em bairros, usando os SHP de bairros do IBGE
(Censo 2022, `{UF}_bairros_CD2022.zip`, campos `CD_MUN`, `CD_BAIRRO`, `NM_BAIRRO`) que ele colocou no projeto.
O IBGE só tem bairros das cidades que os definem oficialmente: 895 cidades em 25 UFs (DF e TO sem arquivo;
a capital paulista também não tem). O cadastro de locais do TSE traz o nome do bairro de cada local (`NM_BAIRRO`).

## Decisão
1. `scripts/bairros.mjs` converte os SHP em um TopoJSON por cidade (`public/geo/bairros/{uf}/{ibge}.json`,
   objeto `bairros`, ~9 m de tolerância) e um índice `public/geo/bairros/{uf}/cidades.json`.
   Os zips ficam em `shp/bairros/` (fora do git, como os de municípios).
2. Cada local de votação vai para um bairro, nesta ordem:
   1. cidade com malha do IBGE: o polígono que contém o ponto do local;
   2. sem ponto, ou fora de todos os polígonos: o bairro do IBGE com o mesmo nome (sem acento, maiúsculas);
   3. senão: o nome de bairro do TSE, id `{ibge}-t-{NOME}` (a grafia exibida é a mais comum).
3. `scripts/zonas-locais.mjs` soma as seções por **zona** e por **bairro** (mesmas regras da ADR 0008) e grava
   `public/data/2026/{cargo}/{turno}/bairros/{uf}.json` e o cadastro `public/data/2026/bairros/{uf}.json`
   (`id, ibge, nome, origem 'i'|'t', lon, lat, eleitorado, locais`; o ponto é o centro dos locais pesado pelo eleitorado).
   O resultado por local deixou de ser gerado; o cadastro `public/geo/locais/{uf}.json` ganhou `idBairro`.
4. Interface: **Ver por: Municípios | Zonas | Bairros**. No nível Bairros o estado aparece por município;
   clicar numa cidade (`?nivel=bairros&cid={ibge}`) abre os bairros dela: áreas do IBGE pintadas pelo vencedor,
   a cidade em cinza por baixo, e os bairros só do TSE como círculos (área ∝ eleitorado).
   O painel mostra o bairro e a lista dos seus locais de votação.

## Consequências
- Em cidades sem malha do IBGE o "bairro" é o que o cartório cadastrou; grafias diferentes do mesmo bairro
  viram bairros diferentes se a normalização não as unir.
- Os limites de bairro são do Censo 2022; locais em bairros criados depois caem pelo nome ou pelo TSE.
