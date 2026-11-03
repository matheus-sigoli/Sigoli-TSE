# ADR 0018 — Bairros fora; zonas na cidade só no DF

- Status: Aceita (substitui as partes de bairros da ADR 0009 e da ADR 0011)
- Data: 02/11/2026

## Contexto
Ainda para reduzir o armazenamento de deployments na Vercel (ADR 0017). O nível Bairros (resultados por bairro,
cadastro dos bairros e malha do IBGE, ~117 MB) acrescentava pouca informação: fora das capitais quase tudo era o nome
de bairro do cadastro do TSE, em círculos. As zonas recortadas por cidade (zonas-cidade) também saíram, menos no DF,
que é uma cidade só e onde as zonas vêm do desenho do usuário (DF.svg / ZMBRA_2022).

## Decisão
- Visão da cidade: só **Locais** (áreas do Atlas). No DF: **Zonas | Locais**.
- O mapa das zonas do estado (Ver por: Zonas, no estado) continua.
- Mapa dos municípios de um estado: sem a linha externa (contorno do estado).
- `zonas-locais.mjs` não grava mais bairros nem zonas por cidade fora do DF.

## Consequências
- `public/` de ~570 MB para ~390 MB por deployment (com a ADR 0017, era ~900 MB).
- O bairro de cada local continua no cadastro dos locais (nome do TSE), na busca e no painel.
