# Sigoli.TSE — Contexto e Glossário

Site de resultados eleitorais das Eleições Gerais 2026 (Brasil), mapeados por município,
com dados oficiais do TSE. Referência de produto: electomaps.com.br.

> Documento vivo: atualizado a cada decisão da entrevista de design.
> Decisões difíceis de reverter ficam em `docs/adr/`.

## Escopo atual (v1)
- Ano: **2026** (Eleições Gerais).
- Cargos: **Presidente, Governador, Senador, Deputado Federal, Deputado Estadual** (e Distrital no DF).
- Granularidade geográfica: **Brasil → UF → Município**, mais **Exterior por país** (Presidente).
- Dentro de uma UF, o mapa também mostra **zonas eleitorais** (áreas) e **locais de votação** (círculos) (ADR 0008).
- Página inicial (`/`) explica a eleição e leva ao mapa.
- Turnos: 1º e 2º (Presidente e Governador nas UFs que tiveram 2º turno).

### Fora da v1 (decidido em 31/10/2026)
- Comparação/swing com 2022 ou outros anos.
- Seções eleitorais individuais (abaixo do local de votação).
- Fotos de candidatos (decidido em 01/11/2026: o card usa iniciais na cor do partido).
- Camadas demográficas do Censo.
- Simulador de 2º turno.

### Pendências abertas
- [x] Shapefiles em `shp/` conferidos: malha IBGE 2025 com `CD_MUN` (ADR 0002).
- [x] Paleta transcrita para `config/paleta-partidos.json` (ADR 0004).
- [x] Logo do pavão = Republicanos (10).
- [ ] Montar a tabela `data/exterior/cidades-pais.csv` (186 cidades → país) e revisar (ADR 0005).

## Decisões (ADRs)
| # | Decisão |
|---|---|
| 0001 | Coleta offline do TSE (script Node) e site estático |
| 0002 | Malha IBGE 2025 (SHP do projeto) → TopoJSON por UF |
| 0003 | Next.js (export estático) + TypeScript + MapLibre GL, deploy Vercel |
| 0004 | Paleta própria por partido, 10 faixas de intensidade, cor extra em caso de conflito |
| 0005 | Visão Brasil municipal para todos os cargos; exterior pintado por país |
| 0006 | Layout 3 colunas + gaveta no celular; painel por município; tema escuro/claro + daltônico |
| 0007 | Formato compacto dos dados (`public/data/2026/`) |
| 0008 | Zonas (áreas Voronoi) e locais (círculos) a partir dos dados abertos por seção |

## Glossário

**Ciclo** — Agrupador do TSE para um ano eleitoral. 2026 = `ele2026`.

**Eleição (código TSE)** — Identificador de uma eleição dentro do ciclo. Em 2026:
| Código | Eleição | Turno | Cargos |
|---|---|---|---|
| 6257 | Federal | 1º | Presidente (cargo 1) |
| 6258 | Federal | 2º | Presidente (cargo 1) |
| 6259 | Estadual | 1º | Governador (3), Senador (5), Dep. Federal (6), Dep. Estadual (7), Dep. Distrital (8) |
| 6260 | Estadual | 2º | Governador (3) |

**Cargo** — Posto em disputa. Código TSE: 1 Presidente, 3 Governador, 5 Senador, 6 Dep. Federal,
7 Dep. Estadual, 8 Dep. Distrital. Tipo `1` = majoritário, tipo `2` = proporcional.

**Cargo majoritário** — Vence quem tem mais votos (Presidente, Governador, Senador). Pode ter 2º turno
(Presidente, Governador). No mapa: cor do candidato vencedor no município.

**Cargo proporcional** — Vagas distribuídas por quociente eleitoral entre partidos/federações
(Deputados). "Vencedor no município" é menos significativo; o mapa usa as leituras abaixo.

**Leitura do mapa** — O que a cor de cada município representa. Duas leituras:
- **Modo vencedor** — cor de quem teve mais votos no município. Majoritários: o candidato.
  Proporcionais: o **partido/federação** mais votado (votos nominais + de legenda somados).
- **Modo calor** — ativado ao selecionar um candidato ou partido no painel: escala de intensidade
  pelo % de votos válidos dele em cada município. Clicar de novo volta ao modo vencedor.

**Senado 2026 (2 vagas)** — Cada eleitor votou em 2 senadores; os 2 mais votados no estado são eleitos.
No mapa, cada município recebe a cor do **mais votado ali**; o painel destaca os 2 eleitos do estado.

**Turno** — 1º turno (04/10/2026) ou 2º turno (25/10/2026).

**Abrangência** — Recorte territorial de um resultado: `br` (nacional), `uf` (estado), `mu` (município).

**Município (código TSE)** — Código de 5 dígitos usado pelo TSE (ex.: São Paulo = `71072`).
Não é o código do IBGE.

**Município (código IBGE)** — Código de 7 dígitos usado na malha geográfica (ex.: São Paulo = `3550308`).
O arquivo de configuração de municípios do TSE (`mun-e006257-cm.json`) traz os dois códigos
(`cd` = TSE, `cdi` = IBGE), então o casamento dado↔mapa vem da fonte oficial.

**Exterior (`zz`)** — Abrangência do TSE para votos no exterior (só Presidente). Tem 186 cidades,
sem país nem coordenadas; o Sigoli.TSE mapeia cidade → país por tabela própria e pinta **países**.
Total da configuração de 2026: 5.757 "municípios" = 5.571 no Brasil + 186 cidades no exterior.

**Visão Brasil** — Mapa nacional com os municípios das 27 UFs; existe para todos os cargos.

**Malha** — Geometria dos limites municipais/estaduais (IBGE), usada para desenhar o mapa.

**Federação** — União de partidos que atua como um partido único por 4 anos (ex.: PT/PCdoB/PV).

**Coligação** — União de partidos só para a eleição majoritária.

**Região imediata / intermediária** — Agrupamentos de municípios do IBGE (colunas `CD_RGI` e `CD_RGINT`
da malha), usados como filtro de região.

**Faixa de intensidade** — Um dos 10 tons (10%…100%) da cor do partido; o tom do município é a faixa
do % do vencedor. 50% = cor-base.

**Cor extra** — Segunda cor de alguns partidos, usada só quando o adversário no mesmo mapa tem cor parecida.

**Nível do mapa** — Unidade pintada dentro de uma UF: **Municípios** (padrão), **Zonas** ou **Locais**.
Na URL: `?nivel=zonas` ou `?nivel=locais`.

**Zona eleitoral** — Circunscrição do cartório eleitoral; numerada dentro de cada UF. Pode cobrir vários
municípios ou ser uma parte de um município grande. O TSE não publica o contorno: o Sigoli.TSE desenha
a área a partir dos locais de votação (ADR 0008).

**Local de votação** — Escola ou prédio onde ficam as seções. Tem coordenadas e eleitorado no cadastro
do TSE. Id no projeto: `{município TSE}-{zona}-{número do local}`.

**Votos anulados** — Votos dados a candidato com registro indeferido (destinação "Anulado sub judice" etc.).
Não entram nos válidos e o candidato não vence município.

**Vice / suplentes** — Vice de Presidente e Governador; 1º e 2º suplentes de Senador. Aparecem no card.

**Votos válidos** — Votos nominais + de legenda; excluem brancos e nulos. Percentuais oficiais
de candidatos são sobre válidos.

## Fonte de dados (fatos verificados em 31/10/2026)
- Base: `https://resultados.tse.jus.br/oficial/ele2026/`
- Config de eleições: `/oficial/comum/config/ele-c.json`
- Config de municípios: `/{eleicao}/config/mun-e{eleicao6}-cm.json`
- Resultado por UF: `/{eleicao}/dados/{uf}/{uf}-c{cargo4}-e{eleicao6}-u.json`
- Resultado por município: `/{eleicao}/dados/{uf}/{uf}{mun5}-c{cargo4}-e{eleicao6}-u.json`
- O TSE **não libera CORS**: o navegador de outro site não consegue ler esses arquivos diretamente.
