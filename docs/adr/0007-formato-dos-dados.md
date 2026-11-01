# ADR 0007 — Formato dos arquivos de dados do site

- Status: Aceita
- Data: 31/10/2026

## Decisão
O ETL (`scripts/lib/nucleo.mjs`) gera JSONs compactos em `public/data/2026/`, um por cargo/turno/abrangência,
com vetores posicionais em vez de objetos por município (o arquivo nacional de Presidente, 5.571 municípios,
fica em ~500 KB, ~110 KB comprimido).

```
municipios.json                     [{tse, ibge, nome, uf, capital?, pais?, paisNum?, nomePais?}]
presidente/{t}/br.json              Brasil inteiro por município (chave = código IBGE)
presidente/{t}/zz.json              exterior por cidade (chave = código TSE)
{cargo}/{t}/{uf}.json               estado por município
{cargo}/{t}/br.json                 cargos estaduais: resumo nacional (Visão Brasil)
```

Arquivo de resultado:
```jsonc
{
  "cargo": "presidente", "turno": 1, "abr": "br", "tipo": "maj" | "prop", "vagas": 1,
  "cands":    [{ "id", "n", "nome", "partido", "eleito", "situacao", "vice?" }],   // ordenados por votos
  "partidos": [{ "sg", "n", "fed?", "col?" }],
  "total": { "t": [eleitorado, comparecimento, abstenção, válidos, brancos, nulos], "c": [...], "p": [...] },
  "mun": {
    "3550308": { "t": [...6], "c": [votos por candidato] }                         // majoritário (denso)
    "3550308": { "t": [...6], "c": [idx, votos, idx, votos...], "p": [por partido] } // proporcional (esparso)
  }
}
```
Resumo (Visão Brasil de cargo estadual): `mun: { ibge: [índice do partido, pct×1000, nome do vencedor] }`
e `eleitos: { uf: [...] }`.

## Regras
- Percentuais sempre sobre **votos válidos** (como o TSE).
- Votos de partido em proporcional = nominais dos candidatos + legenda.
- Totais da UF/Brasil vêm do arquivo oficial do TSE; recortes menores (região, município) somam municípios.
- O núcleo é JavaScript puro: roda igual no Node (ETL) e no navegador.
