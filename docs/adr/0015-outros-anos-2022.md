# ADR 0015 — Outros anos: 2022 com a mesma estrutura de 2026

- Status: Aceita
- Data: 02/11/2026

## Contexto
O usuário pediu as eleições de 2022 com tudo o que 2026 tem: municípios, zonas, bairros, locais de votação (com as
áreas do Atlas), regras de cores, busca. A API de divulgação usada em 2026 (`resultados.tse.jus.br/oficial/ele2022`)
não existe mais para 2022 (404).

## Decisão
1. **Fonte**: Portal de Dados Abertos do TSE. Por município: `votacao_candidato_munzona`, `votacao_partido_munzona`,
   `detalhe_votacao_munzona` (totais oficiais: aptos, comparecimento, válidos, brancos, nulos) e `consulta_cand`
   (vices e suplentes). Por seção: `votacao_secao` e `eleitorado_local_votacao`, como em 2026.
   `scripts/ano-tse.mjs --ano 2022` gera os arquivos por município no mesmo formato de 2026 (ADR 0007).
2. **Pipeline**: workflow "Dados de outro ano" — ano-tse, `zonas-locais.mjs --ano`, `areas-ano.mjs`, `pintam.mjs --ano`.
3. **Arquivos**: resultados em `public/data/{ano}/`; malhas que dependem do cadastro de locais do ano em
   `public/geo/{ano}/` (zonas, zonas-cidade, locais, correspondência das áreas). Malhas dos municípios, UFs, bairros
   do IBGE e regiões são as mesmas.
4. **Áreas dos locais** (escolha do usuário): as áreas do Atlas Eleitoral 2026 são reaproveitadas. Cada área vai para
   o local do ano com o mesmo código e nome; senão, o mesmo nome; senão, o local cujo ponto está dentro. Locais do ano
   sem área entram na área que contém o ponto (`inclui`). Só a correspondência é gravada (um JSON por UF) e o site
   troca os ids — os ~5.600 desenhos não são duplicados.
5. **Zonas desenhadas** (DF.svg, ADR 0013): só valem no ano se as zonas forem as mesmas do desenho.
6. **Site**: rotas `/{ano}/{abr}/{cargo}` (anos de `src/lib/anos.ts` com `disponivel`); seletor de ano no mapa que
   mantém cargo, lugar, turno (quando existe) e nível. UFs com 2º turno de governador por ano (`UFS_2T_GOVERNADOR`).
7. **Cores**: mesma paleta e regras (ADR 0014). Partidos que só existiam em 2022, cores do usuário: PTB #2AD4FF,
   PATRIOTA #009200, PSC #006F41, PROS #F48C24 (10 faixas geradas como as demais, marcados `ano: 2022`);
   reserva do PTB #624C4C.
   PMN e PMB usam as cores de MOBILIZA e DEMOCRATA (mesmos partidos, renomeados): apelidos em `cores.ts`.

## Consequências
- Para outro ano (2018…): cadastrar os códigos das eleições em `zonas-locais.mjs` e `UFS_2T_GOVERNADOR`, rodar o
  workflow com o ano e marcar `disponivel` em `src/lib/anos.ts`.
- Os totais vêm do detalhe oficial; os votos por candidato, da totalização por município — os mesmos do TSE.

## Adendo — 2018 (02/11/2026)
- Cores dos partidos de 2018 pela tabela "Degradê Sigoli" do usuário (página 3), com as 10 faixas como estão nela:
  PSL #203B78 (extra #34C934), DEM #8CC63E, PHS #841619, PRP #00A0E3 (extra #263A2C), PPL #006E3C (extra #FFEC30).
  PTB passa a ter #624C4C como cor extra (era reserva). Marcados `ano: 2018`.
- Mesmos partidos com outro nome usam a cor de hoje: PR → PL, PRB → REPUBLICANOS, PPS → CIDADANIA, PTC → AGIR,
  PATRI → PATRIOTA (apelidos em `cores.ts`).
- O ano do workflow vem de `.github/ano-dados` (cada branch de ano grava o seu) ou da aba Actions.
