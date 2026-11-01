# Sigoli.TSE

Resultados das **Eleições 2026** (Presidente, Governador, Senador, Deputados) **município por município**,
com dados oficiais do TSE e a malha municipal do IBGE.

- Site estático em Next.js + MapLibre GL, publicado na Vercel.
- Sem banco e sem servidor: os dados são baixados do TSE por um script e viram JSON em `public/data/`.
- Decisões de projeto em [`docs/adr/`](docs/adr), vocabulário em [`CONTEXT.md`](CONTEXT.md), design em [`DESIGN.md`](DESIGN.md).

## Rodar localmente
```bash
npm install
npm run dev          # http://localhost:3000
```

## Atualizar os dados
```bash
npm run coletar      # baixa os arquivos oficiais do TSE para .cache/tse (retomável)
npm run processar    # gera public/data/2026/
# ou os dois: npm run dados
# só um cargo / UF: node scripts/coletar-tse.mjs --cargo governador --uf sp
```

## Regerar a malha (só se trocar os shapefiles)
Coloque os `{UF}_Municipios_AAAA.zip` do IBGE em `shp/` e rode:
```bash
npm run malha        # gera public/geo/br.json, public/geo/uf/*.json e public/geo/regioes.json
```

## Publicar
`git push` na branch principal: a Vercel faz o build (`next build` → `out/`) e publica.
Cabeçalhos de segurança e cache estão em `vercel.json`.

## Fontes
- Resultados: [TSE — resultados.tse.jus.br](https://resultados.tse.jus.br) (ciclo `ele2026`).
- Malha: [IBGE — Malha Municipal Digital 2025](https://www.ibge.gov.br/geociencias/organizacao-do-territorio/malhas-territoriais.html).
- Países (exterior): [world-atlas](https://github.com/topojson/world-atlas) / Natural Earth (domínio público).
