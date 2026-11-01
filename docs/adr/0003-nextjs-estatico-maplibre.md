# ADR 0003 — Next.js (exportação estática) + TypeScript + MapLibre GL

- Status: Aceita
- Data: 31/10/2026

## Decisão
- **Next.js** com `output: 'export'` (site 100% estático, coerente com a ADR 0001), **TypeScript**.
- **MapLibre GL** para o mapa, lendo TopoJSON convertido para GeoJSON no cliente.
- Rotas com URL própria e compartilhável: `/2026/{abrangencia}/{cargo}` e `?turno=1|2`
  (ex.: `/2026/br/presidente`, `/2026/sp/governador?turno=2`).
- Deploy na **Vercel**.

## Alternativas consideradas
- Vite + React (SPA): mais simples, mas sem páginas por estado/cargo pré-geradas.
- HTML/JS puro + D3 (modelo do electomaps): mais código manual de roteamento e estado.

## Consequências
- Páginas pré-geradas no build para cada combinação UF × cargo (27 UFs × 5 cargos + Brasil/Presidente).
- O mapa e o painel de resultados são componentes de cliente; os dados vêm de `/data/...` estático.
