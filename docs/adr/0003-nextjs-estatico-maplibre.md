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

## Atualização (31/10/2026) — versões
- Next.js **16.4.3**, React **19.3.1** (a 15.1.6 inicial tinha a vulnerabilidade CVE-2025-66478).
- MapLibre GL fixado na linha **5.x (5.24.0)**: a 6.x carrega o worker como módulo separado,
  e o Turbopack não emite esse arquivo na exportação estática (mapa em branco). A 5.x embute o worker.
  Reavaliar a 6.x quando o Next/Turbopack suportar o worker dela no `output: 'export'`.
