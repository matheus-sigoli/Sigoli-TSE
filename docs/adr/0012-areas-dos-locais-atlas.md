# ADR 0012 — Áreas dos locais de votação (Atlas Eleitoral 2026)

- Status: Aceita (substitui os círculos do nível Locais da ADR 0011)
- Data: 02/11/2026

## Contexto
O usuário quis o nível Locais como um mapa de áreas, sem círculos, usando as áreas de influência dos locais
de votação do **Atlas Eleitoral 2026** (@mroctoz), com autorização do autor. Os arquivos originais são um GeoJSON
por município (5.570 arquivos, ~5 GB), com `cd_mun`, `nr_zona`, `nr_local` e o polígono de cada local.

## Decisão
1. No computador do usuário, `locais/converter_areas.py` (só Python padrão) lê a pasta extraída, simplifica as
   bordas (~9 m) e grava um arquivo por UF (`saida_sigoli/{UF}.json`, ~330 MB no total).
2. `scripts/areas-locais.mjs` (`npm run areas`) transforma isso em TopoJSON por cidade
   (`public/geo/locais-areas/{uf}/{ibge}.json`, objeto `locais`, bordas comuns gravadas uma vez, ~22 m de
   tolerância, ~85 MB no total) e o índice `cidades.json`.
   - id da área = id do local nos resultados (`{município TSE}-{zona}-{local}`). O Atlas só traz o código TSE na
     1ª área de cada cidade, então o casamento IBGE → TSE vem de `municipios.json`. 99,7% das áreas casam.
   - Locais que o Atlas não desenhou (~16 mil, 14% do eleitorado) entram na área que contém o ponto deles
     (ou na mais próxima): `properties.inclui`. Assim 99,8% do eleitorado aparece no mapa.
3. No site, o nível Locais pinta as áreas; a área soma os locais incluídos (`agruparLocais`), que saem do total
   para não contar duas vezes, e o painel lista os locais da área. Crédito no rodapé do mapa.

## Consequências
- As áreas são do Atlas; não são geradas pelo workflow. Se o cadastro de locais mudar, rodar `npm run areas` de novo.
- Cidade sem área no Atlas continuaria com círculos (hoje todas as 5.570 têm).
