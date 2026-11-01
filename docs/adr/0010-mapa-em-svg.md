# ADR 0010 — Mapa em SVG

- Status: Aceita (substitui a parte de mapa da ADR 0003)
- Data: 01/11/2026

## Contexto
O usuário pediu os mapas de resultado em SVG. O MapLibre GL desenhava em WebGL (canvas), pesava ~800 KB de
JavaScript e travava a versão em 5.x por causa do worker na exportação estática.

## Decisão
- Componente `src/components/Mapa.tsx` desenha a malha em `<svg>`, sem biblioteca:
  projeção de Mercator ajustada à caixa da malha (`src/lib/projecao.ts`), caminhos calculados uma vez por malha.
- Zoom e arraste são uma transformação no `<g>` de cima (roda do mouse no ponto do cursor, pinça, arrastar,
  botões + − e "ver tudo", teclado + − 0 e setas, Esc limpa a seleção). Bordas com `vector-effect: non-scaling-stroke`.
- Cor por área via atributo `fill`; a camada de áreas é memorizada, então hover e zoom não redesenham milhares de caminhos.
- Mesmas camadas de antes: áreas, divisas, contorno de hover e seleção; mais o fundo (cidade) e círculos (bairros sem área).

## Consequências
- Sai a dependência `maplibre-gl`; o mapa fica nítido em qualquer zoom e pode ser estilizado por CSS.
- A visão Brasil tem ~5.570 caminhos no DOM: o arraste é fluido nos computadores comuns; em celulares antigos o
  zoom do Brasil inteiro é menos suave que no WebGL.
