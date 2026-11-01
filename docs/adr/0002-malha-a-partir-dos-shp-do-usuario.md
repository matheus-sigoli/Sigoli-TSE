# ADR 0002 — Malha a partir dos shapefiles (SHP) do projeto, convertida para TopoJSON

- Status: Aceita — SHP conferidos em 31/10/2026
- Data: 31/10/2026

## Contexto
O mapa precisa dos limites de estados e municípios. O dono do projeto já possui shapefiles (SHP)
dos estados/municípios. SHP não é lido diretamente pelo navegador e, sem simplificação, a malha
municipal do Brasil pesa dezenas de MB.

## Decisão
Os SHP fornecidos ficam em `shp/` (um `.zip` por UF, ex.: `SP_Municipios_2025.zip`) (fora do bundle publicado). Um passo do build os converte em
**TopoJSON simplificado**: um arquivo por UF (municípios) e um do Brasil (estados).
Cada município na malha é identificado pelo **código IBGE de 7 dígitos**, que é casado com os
resultados pelo campo `cdi` do arquivo de configuração de municípios do TSE.

## Alternativas consideradas
- **Baixar a malha oficial do IBGE**: descartada por ora, o projeto já tem os SHP. Fica como plano B
  se os SHP não tiverem o código IBGE ou estiverem desatualizados.
- **PMTiles (tiles vetoriais)**: melhor para zoom profundo/locais de votação; desnecessário no nível município.

## Consequências / verificações obrigatórias no build
- Os SHP precisam ter uma coluna com o código IBGE de 7 dígitos (ex.: `CD_MUN`). Se não tiverem, cair no plano B.
- O build deve relatar municípios do TSE sem geometria e geometrias sem resultado
  (municípios criados recentemente, ex.: Boa Esperança do Norte/MT).
- Projeção de saída: WGS84 (EPSG:4326); SHP em SIRGAS 2000 (EPSG:4674) é praticamente equivalente.

## Verificação (31/10/2026)
- 27 arquivos `shp/{UF}_Municipios_2025.zip` = **Malha Municipal Digital do IBGE, versão 2025**.
- Projeção: **SIRGAS 2000** (geográfica). Codificação UTF-8 (`.cpg`).
- Colunas: `CD_MUN` (código IBGE 7 dígitos ✔), `NM_MUN`, `CD_RGI`/`NM_RGI` (região imediata),
  `CD_RGINT`/`NM_RGINT` (região intermediária), `CD_UF`, `SIGLA_UF`, `CD_REGIAO`, `NM_REGIAO`, `AREA_KM2`.
- Ex.: DF = 1 registro (5300108 Brasília); RN = 167 municípios.
- As regiões imediatas/intermediárias alimentam o filtro "Região" da coluna esquerda (ADR 0006),
  sem malha extra: a geometria da região é a união dos municípios.
- Arquivos brutos pesam ~250 MB no total (AM, MG, SC e TO > 20 MB): ficam fora do Git (`.gitignore`)
  e fora do bundle; só o TopoJSON simplificado é publicado.
