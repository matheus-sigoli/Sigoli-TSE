# ADR 0016 — Ponto dos locais de votação sem coordenadas

- Status: Aceita
- Data: 02/11/2026

## Contexto
O usuário notou que em Manaus (2014) apareciam só 3 zonas e 3 locais, embora a cidade tenha 440 locais. O cadastro
do TSE (`eleitorado_local_votacao`) dos anos anteriores tem muitos locais sem latitude/longitude: 2014, 22% do
eleitorado (MG 99%, ES 97%, SE 96%, AM 57%, BA 41%); 2018, 18%; 2022, 5%; 2026, 0,3%. Sem ponto, o local não entra
no desenho das zonas (Voronoi, ADR 0008) nem casa com as áreas do Atlas (ADR 0015), e a cidade vira poucas manchas.

## Decisão
`scripts/lib/geocodificar.mjs`, chamado por `zonas-locais.mjs` antes dos bairros, dá um ponto a cada local sem
coordenadas, nesta ordem: mesmo código e nome em outro ano; mesmo nome na cidade; mesmo nome sem palavras genéricas
(se único); mesmo código com nome parecido; centro do bairro (nome do TSE); centro da zona na cidade. Os quatro
primeiros são o ponto real do prédio; os dois últimos ficam marcados `aprox` no cadastro (`public/geo/…/locais`) e não
servem de referência para outros anos. Ponto aproximado não decide o bairro do IBGE quando o nome do bairro casa.

## Consequências
- Eleitorado sem ponto: 2014 de 21,9% para 0,02% (4,4% aproximado); 2018 de 18% para 0,01%; 2022 de 5,3% para 0,01%.
- 2014, 2018 e 2022 refeitos. 2026 entra na próxima vez que o workflow de 2026 rodar.
