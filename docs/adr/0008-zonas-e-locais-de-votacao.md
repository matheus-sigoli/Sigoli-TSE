# 0008 — Zonas eleitorais e locais de votação

Data: 01/11/2026 · Situação: aceita

## Contexto
O usuário pediu, como o electomaps, ver o mapa por zona eleitoral e por local de votação.
A divulgação do TSE (`resultados.tse.jus.br`) só desce até o município. Abaixo disso, a fonte é o
Portal de Dados Abertos:
- `votacao_secao/votacao_secao_2026_{UF}.zip` (cargos estaduais) e `votacao_secao_2026_BR.zip` (Presidente):
  votos por seção, candidato/legenda, brancos (95) e nulos (96/97).
- `eleitorado_locais_votacao/eleitorado_local_votacao_2026.zip`: cada seção com zona, local, nome,
  bairro, latitude/longitude e eleitorado.

O TSE não publica o contorno das zonas.

## Decisão
1. **Script próprio** (`scripts/zonas-locais.mjs`, `npm run zonas`) soma as seções por zona e por local e grava
   `public/data/2026/{cargo}/{turno}/{zonas|locais}/{uf}.json`, no mesmo formato do ADR 0007, mais `nivel`
   e `porPartido`.
2. **Deputados por partido** nesses níveis: o arquivo traz só `p` (partido, nominal + legenda), com `c` vazio.
   Os votos por candidato continuam no nível municipal. Isso mantém os arquivos pequenos.
3. **Zonas como áreas**: município com uma zona vira inteiro dessa zona. Município com várias zonas é
   dividido pelo diagrama de Voronoi dos locais, recortado pelo contorno do município, e as células da
   mesma zona são unidas. O resultado é uma aproximação, e o mapa diz isso no rodapé.
   Arquivo: `public/geo/zonas/{uf}.json` (TopoJSON, objeto `zonas`, id = número da zona).
4. **Locais como círculos** com área proporcional ao eleitorado, cor do vencedor e borda branca,
   sobre os municípios em cinza. Arquivo: `public/geo/locais/{uf}.json` (`campos` + linhas).
5. Regras de soma:
   - seção agregada soma o eleitorado na seção principal;
   - votos anulados (`Anulado sub judice`) não entram nos válidos nem nos votos do partido;
   - comparecimento = votos totais ÷ vagas (no Senado 2026 cada eleitor votou duas vezes).
6. A interface ganha o seletor **Ver por: Municípios | Zonas | Locais**, só dentro de uma UF.
   O filtro de região fica desligado fora do nível municipal.

7. **Onde roda**: no GitHub Actions (`.github/workflows/dados-zonas-locais.yml`), que baixa os ~3 GB do TSE,
   roda `corrigir-anulados` e `zonas-locais` e grava os arquivos gerados no próprio branch. Assim a Vercel
   continua publicando a partir do git, e o processamento pode ser repetido por qualquer pessoa.
   `corrigir-anulados` é idempotente (marca `anuladosAplicados` no arquivo) e aceita `--de arquivo.json`
   quando o TSE limita as requisições (HTTP 429) da máquina que processa.

## Consequências
- Mais ~2 arquivos de dados por cargo/turno/UF; o processamento precisa de uma máquina com 8 GB
  (o arquivo BR de Presidente tem dezenas de milhões de linhas).
- A forma das zonas em capitais é aproximada; os totais por zona são exatos.
- Conferência: somar as zonas de uma UF bate com o total oficial da UF (válidos e comparecimento).
