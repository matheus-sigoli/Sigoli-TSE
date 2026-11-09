# ADR 0018 — Bairros fora da visão da cidade

- Status: Substituída pela ADR 0019
- Data: 02/11/2026

## Contexto
Ainda para reduzir o armazenamento de deployments na Vercel (ADR 0017). O nível Bairros (resultados por bairro,
cadastro dos bairros e malha do IBGE, ~117 MB) acrescentava pouca informação: fora das capitais quase tudo era o nome
de bairro do cadastro do TSE, em círculos.

## Decisão
- Visão da cidade: **Zonas | Locais** (sem Bairros). O mapa das zonas do estado continua.
- Mapa dos municípios de um estado: sem a linha externa (contorno do estado).
- `zonas-locais.mjs` não grava mais bairros.

## Consequências
- `public/` de ~570 MB para ~410 MB por deployment (com a ADR 0017, era ~900 MB).
- O bairro de cada local continua no cadastro dos locais (nome do TSE), na busca e no painel.
