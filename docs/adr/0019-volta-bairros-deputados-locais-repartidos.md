# ADR 0019 — Bairros e deputados de volta; áreas dos locais repartidas nos outros anos

- Status: Aceita (substitui a ADR 0017 e a ADR 0018)
- Data: 09/11/2026

## Contexto
O usuário resolveu o armazenamento na Vercel e pediu de volta os mapas por bairro e os deputados (federal e estadual),
em todos os anos. Pediu também a malha de locais completa: de 2002 a 2022 cada local do ano usa a área do local de 2026
onde ele cai (ADR 0015); quando dois ou mais locais do ano caíam na mesma área, eles viravam uma área só.

## Decisão
- Deputado Federal e Deputado Estadual (Distrital no DF) voltam: rotas, abas e dados de 1998 a 2026.
- Visão da cidade: **Zonas | Bairros | Locais** (1998, sem locais de votação: só Zonas).
- Áreas dos locais nos outros anos: quando mais de um local do ano cai na mesma área de 2026, a área é repartida entre
  eles por Voronoi dos pontos (base geocodificada da pasta "locais novo", ADR 0015), recortado pela área
  (`public/geo/{ano}/locais-areas/{uf}-div.json`). Só fica "incluído" quem não tem ponto próprio.

## Consequências
- `public/` volta a crescer (deputados e bairros em todos os anos).
