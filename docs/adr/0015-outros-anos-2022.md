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

## Adendo — 2014 (02/11/2026)
- Todos os partidos de 2014 já estão na paleta, alguns com outro nome: PMDB → MDB, PSDC → DC, PEN → PATRIOTA,
  PTN → PODE, PT do B → AVANTE (além dos de 2018). Apelidos em `cores.ts`.
- **Eleições suplementares**: os arquivos de um ano trazem também as suplementares do mesmo mandato (no de 2014,
  governador do AM em 2017 e do TO em 2018; no de 2018, senador do MT em 2020). `ano-tse.mjs` e `zonas-locais.mjs`
  ficam só com a eleição geral de outubro do ano (DT_ELEICAO); 2014 e 2018 foram refeitos.

## Adendo — 2010 (02/11/2026)
- Municípios instalados em 2013 voltam à origem no mapa de 2010 (`scripts/lib/fusoes.mjs`): Pescaria Brava → Laguna,
  Balneário Rincão → Içara (SC), Mojuí dos Campos → Santarém (PA), Pinto Bandeira → Bento Gonçalves (RS),
  Paraíso das Águas → Costa Rica (MS). As áreas do Atlas do município novo entram na cidade de origem (`f` na
  correspondência das áreas).
- Particularidades do arquivo de 2010: eleito pela média aparece como "MÉDIA"; Presidente sem situação (calculada
  pelo resultado nacional); voto em trânsito nas capitais (SG_UF "VT") entra no total nacional, sem lugar no mapa.
- Conferência: Dilma 47.651.434 / 55.752.529 e Serra 33.132.283 / 43.711.388 (1º/2º turno), iguais ao TSE.

## Adendo — 2006 (03/11/2026)
- Cores do usuário para os partidos que só existiram até 2006: PRONA #007F0E, PAN #FFFF1F. PFL usa a cor do DEM.
- Nazária (PI), instalada em 2009, volta para Teresina no mapa de 2006.
- O exterior de 2006 vem por país (o "município" é o país): casado pelo nome do país da tabela de cidades.
- Branches de dados (`ano-*`, `pontos-*`) não geram deployment na Vercel (`git.deploymentEnabled` no vercel.json).
- 2006 não tem cadastro de locais no TSE (`eleitorado_local_votacao` começa em 2010). As seções, o local de cada seção
  (NR_LOCAL_VOTACAO) e os aptos vêm do detalhe da votação por seção; o nome, o bairro e o ponto vêm do local com o
  mesmo código no cadastro mais próximo (2010, depois 2014…). Local sem código correspondente fica "LOCAL n (ZONA z)",
  com o ponto no centro da zona (aproximado).

## Adendo — 2002 (07/11/2026)
- Mesmo caminho de 2006: sem cadastro de locais no TSE; seções e locais pelo detalhe da votação por seção.
- Municípios instalados em 2005 voltam à origem no mapa: Aroeiras do Itaim → Picos (PI), Figueirão → Camapuã (MS),
  Ipiranga do Norte e Itanhangá → Tapurah (MT).
- PPB usa a cor do PP (mesmo partido, renomeado em 2003).
- Os arquivos do TSE de 2002 divergem por poucas centenas de votos entre si: a votação por município/zona dá Lula
  39.454.760 no 1º turno (oficial 39.455.233); a votação por seção soma o oficial de Lula e Serra, mas troca ~667
  votos entre Garotinho e Ciro. O site usa a votação por município/zona, como nos outros anos (diferença < 0,002%).
- Cores do usuário para partidos que só existiram até 2002: PGT #2EAA3F, PST #9370DB.

## Adendo — mesmo resultado em Municípios, Zonas e Locais (07/11/2026)
- Na visão da cidade, o total em Zonas soma todas as zonas da cidade no arquivo de resultados, inclusive as sem desenho
  (2002: zonas extintas depois, cujos locais não têm ponto conhecido — Cuiabá tinha 11 zonas e só 6 desenháveis).
- Candidatura INAPTO com 0 votos na totalização final (2014, sem coluna de destinação): os votos dele nas urnas viram
  nulos também nas zonas e nos locais (ex.: Antônio Gomide, GO 2014; o mesmo em MT, DF e no Senado de PR, RJ, RN, SP).
- Substituído com o mesmo número do substituto: o arquivo por município repete os votos nos dois; ficam só no
  substituto (RJ 2002 governador, RJ 2006 senador).
- 2006/2002: o cadastro montado pelo detalhe por seção também lê o Presidente (seções só do 2º turno).
