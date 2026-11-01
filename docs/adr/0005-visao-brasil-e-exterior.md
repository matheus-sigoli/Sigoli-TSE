# ADR 0005 — Visão Brasil municipal para todos os cargos e exterior por país

- Status: Aceita
- Data: 31/10/2026

## Decisão
1. **Visão Brasil** existe para todos os cargos. Para cargos estaduais (Governador, Senador, Deputados),
   o mapa nacional mostra os **5.571 municípios** juntos, cada um com o vencedor local daquele cargo,
   e o painel lista os **eleitos por UF**.
2. **Exterior** (só Presidente): mapa-múndi com **países pintados pelo vencedor**, somando as cidades
   de cada país. As cidades aparecem só como lista no painel do país.

## Contexto do exterior
O TSE publica o exterior como a abrangência `zz`, com **186 cidades** (ex.: ABIDJÃ, ABU DHABI, AMSTERDÃ),
sem código de país nem coordenadas (`cdi` vazio).

## Consequências
- Visão Brasil municipal: o arquivo nacional por cargo junta os 27 estados; TopoJSON do Brasil
  municipal precisa ser bem simplificado (alvo: < 3 MB gzip). Carregar sob demanda.
- Exterior exige uma **tabela curada** `data/exterior/cidades-pais.csv` (código TSE da cidade → país ISO 3166-1 alfa-3),
  revisada manualmente; o build falha se aparecer cidade sem país.
- Exterior exige malha de países (Natural Earth 1:50m, domínio público), convertida para TopoJSON.
