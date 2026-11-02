# ADR 0013 — Zonas desenhadas à mão (DF)

- Status: Aceita (complementa a ADR 0008)
- Data: 02/11/2026

## Contexto
No DF, as áreas de zona aproximadas pelos locais de votação (Voronoi, ADR 0008) ficavam parciais. O usuário enviou
`DF.svg` (Inkscape, 19 caminhos sem nome, um por zona) com a malha correta. O DF é um município só (Brasília).

## Decisão
1. `data/zonas/DF.svg` é a fonte. `scripts/zonas-svg.mjs` lê os caminhos (só retas), encaixa o desenho na caixa do DF
   (proporção do SVG 1,709 × 1,716 da UF em km: escala linear basta) e identifica cada caminho pela zona com mais
   eleitores nos locais de votação dentro dele (18 de 19 com 100%; o script para se dois caminhos caírem na mesma zona).
   Grava `data/zonas/df.geojson` e as malhas `public/geo/zonas/df.json` e `public/geo/zonas-cidade/df.json`.
2. `scripts/zonas-locais.mjs` usa `data/zonas/{uf}.geojson` quando existe, no lugar do Voronoi (só recorta por cidade).
3. No site, o DF abre direto na visão da cidade (Zonas | Bairros | Locais), com "Distrito Federal" no título e sem
   "Voltar ao estado". Locais usa as áreas do Atlas (ADR 0012).

## Consequências
- Para outra UF com desenho próprio: salvar `data/zonas/{UF}.svg` e rodar `node scripts/zonas-svg.mjs --uf {uf}`.
