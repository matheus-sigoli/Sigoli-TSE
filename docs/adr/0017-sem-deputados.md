# ADR 0017 — Deputados fora do site

- Status: Substituída pela ADR 0019
- Data: 02/11/2026

## Contexto
O projeto passou de 17 GB de armazenamento de deployments na Vercel. Cada deployment guarda uma cópia inteira de
`public/` (~900 MB com os cinco anos), e os arquivos de deputado federal e estadual eram 330 MB (37%) — por estado,
zona, bairro e local, por partido. O usuário pediu para tirar os deputados de todos os anos.

## Decisão
- Saem do site os cargos Deputado Federal e Deputado Estadual (rotas, abas, dados de 2010 a 2026).
- A página inicial guarda só a composição da Câmara de 2026 em `public/data/2026/camara.json` (513 cadeiras por partido)
  e continua explicando os dois cargos, sem link para mapa.
- Os scripts deixam de gerar deputados (`ano-tse.mjs`, `zonas-locais.mjs`, `nucleo.mjs`).

## Consequências
- `public/` de ~900 MB para ~570 MB por deployment.
- O armazenamento total depende de quantos deployments antigos ficam guardados: apagar os antigos e ligar a retenção
  de deployments na Vercel é o que traz o total para menos de 10 GB.
- Para voltar com deputados: restaurar as entradas de cargo e rodar de novo os workflows de dados.
