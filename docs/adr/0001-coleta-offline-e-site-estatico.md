# ADR 0001 — Coleta offline do TSE e site estático

- Status: Aceita
- Data: 31/10/2026

## Contexto
Os resultados de 2026 estão publicados em `resultados.tse.jus.br/oficial/ele2026/`, em JSONs por
eleição/cargo/abrangência. O servidor do TSE **não envia cabeçalho CORS**: um site hospedado em outro
domínio não consegue ler esses arquivos pelo navegador (testado em 31/10/2026).
A eleição de 2026 já está totalmente apurada (1º turno 04/10, 2º turno 25/10), então os dados não mudam mais.

## Decisão
Um **script de coleta (ETL) em Node** roda fora do navegador, baixa os arquivos oficiais do TSE,
normaliza e gera **arquivos estáticos** (JSON por cargo/turno/UF) que o site consome.
O site é **estático**, sem banco de dados e sem servidor de aplicação.

## Alternativas consideradas
- **Backend com banco (Supabase/Postgres)**: consultas flexíveis, mas custo e manutenção sem ganho para dados imutáveis.
- **Proxy serverless ao vivo**: só se justifica para apuração em tempo real; fica como possibilidade para eleições futuras.

## Consequências
- Hospedagem barata (CDN), carregamento rápido, nada a proteger em servidor.
- Os dados ficam "congelados" na data da coleta; recolher = rodar o script de novo.
- O script precisa ser educado com o TSE (limite de concorrência, retentativas, cache local).
- Os arquivos brutos baixados do TSE ficam em cache local (fora do bundle publicado).
