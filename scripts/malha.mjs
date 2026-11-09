#!/usr/bin/env node
/**
 * Sigoli.TSE — Conversor de malha (SHP do IBGE → TopoJSON)
 *
 * Sem dependências: lê os .zip de `shp/` (um por UF, ex.: SP_Municipios_2025.zip),
 * monta a topologia (vizinhos compartilham a mesma borda), simplifica as bordas
 * com Douglas-Peucker de forma determinística e grava TopoJSON quantizado em
 * `public/geo/`:
 *   - uf/{uf}.json   → municípios do estado (detalhe fino)
 *   - br.json        → municípios do Brasil + divisas estaduais (detalhe grosso)
 *
 * Uso: node scripts/malha.mjs [--shp shp] [--out public/geo]
 *
 * Por que é determinístico: as junções são calculadas também entre estados e
 * cada borda é orientada de forma canônica antes de simplificar. Assim a divisa
 * SP|MG simplificada no arquivo de SP é idêntica à do arquivo de MG e à do Brasil.
 */
import { readFileSync, writeFileSync, mkdirSync, readdirSync } from 'node:fs';
import { join } from 'node:path';
import {
  GRID, QUANT, buildTopology, douglasPeucker, encodeTopo, groupPolygons, keyOf, pointInRing, readDbf, readShp, reversePairs, sigOf, signedArea, simplifyArc, unzip,
} from './lib/shp.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => (a.startsWith('--') ? [...acc, [a.slice(2), arr[i + 1]]] : acc), []),
);
const SHP_DIR = args.shp ?? 'shp';
const OUT_DIR = args.out ?? 'public/geo';

// Tolerâncias em graus (≈ 111 km por grau).
const TOL_UF = Number(args['tol-uf'] ?? 0.0001); // ~11 m (fiel ao SHP do IBGE na visão do estado)
const TOL_BR = Number(args['tol-br'] ?? 0.01); // ~1,1 km (visão Brasil; o detalhe fica nos arquivos por UF)
// ---------------------------------------------------------------- principal
const zips = readdirSync(SHP_DIR).filter((f) => /_Municipios_\d{4}\.zip$/i.test(f)).sort();
if (!zips.length) throw new Error(`Nenhum *_Municipios_AAAA.zip em ${SHP_DIR}/`);
mkdirSync(join(OUT_DIR, 'uf'), { recursive: true });

const ufs = [];
for (const z of zips) {
  const files = unzip(readFileSync(join(SHP_DIR, z)));
  const shpName = [...files.keys()].find((n) => n.toLowerCase().endsWith('.shp'));
  const dbfName = [...files.keys()].find((n) => n.toLowerCase().endsWith('.dbf'));
  const rows = readDbf(files.get(dbfName));
  const recs = readShp(files.get(shpName));
  const features = rows.map((row, i) => ({
    id: row.CD_MUN,
    props: { n: row.NM_MUN, rgi: row.CD_RGI, rgint: row.CD_RGINT },
    rings: recs[i],
  }));
  ufs.push({ uf: rows[0].SIGLA_UF.toLowerCase(), nomeUf: rows[0].NM_UF, features, rgiNomes: rows });
  process.stdout.write(`lido ${z} (${features.length} municípios)\n`);
}

// Passo 1: junções locais que caem na borda externa de cada UF.
const globalJ = new Set();
for (const u of ufs) {
  const { arcs, arcUse, neigh } = buildTopology(u.features, null);
  for (let i = 0; i < arcs.length; i++) {
    if (arcUse[i] !== 1) continue; // borda usada por um município só = borda do estado
    const ks = arcs[i].keys;
    globalJ.add(ks[0]);
    globalJ.add(ks[ks.length - 1]);
  }
  void neigh;
}
// Uma junção de borda vira junção global; só importa nos pontos compartilhados entre UFs.
process.stdout.write(`junções de borda: ${globalJ.size}\n`);

// Passo 2: topologia final por UF (com junções globais) e coleta para o Brasil.
const brArcs = [];
const brArcIndex = new Map();
const brMun = [];
const ufBorderArcs = []; // arcos de divisa (usados 1x dentro da UF)
const regioes = {};

for (const u of ufs) {
  for (const f of u.features) f.ringArcs = undefined;
  const { arcs, arcUse } = buildTopology(u.features, globalJ);
  const used = arcs.map((_, i) => i);
  const geometries = u.features.map((f) => {
    const polys = groupPolygons(f);
    return polys.length === 1
      ? { type: 'Polygon', id: f.id, properties: f.props, arcs: polys[0] }
      : { type: 'MultiPolygon', id: f.id, properties: f.props, arcs: polys };
  });
  const borders = arcs.map((_, i) => i).filter((i) => arcUse[i] === 1);
  const topoUf = encodeTopo(
    {
      municipios: { geometries },
      contorno: { geometries: [{ type: 'MultiLineString', arcs: borders.map((i) => [i]) }] },
    },
    arcs,
    TOL_UF,
    used,
  );
  writeFileSync(join(OUT_DIR, 'uf', `${u.uf}.json`), JSON.stringify(topoUf));

  // remapeia arcos desta UF no conjunto nacional (dedup por assinatura)
  const local2br = arcs.map((a) => {
    const sig = sigOf(a.keys);
    let idx = brArcIndex.get(sig);
    if (idx === undefined) {
      idx = brArcs.length;
      // guarda já simplificado no nível Brasil (determinístico) para poupar memória
      brArcs.push({ pts: simplifyArc(a.pts, TOL_BR), presimplified: true });
      brArcIndex.set(sig, idx);
    }
    return idx;
  });
  const toBr = (r) => (r < 0 ? ~local2br[~r] : local2br[r]);
  for (const g of geometries) {
    brMun.push({
      ...g,
      properties: { n: g.properties.n, uf: u.uf },
      arcs: g.type === 'Polygon' ? g.arcs.map((ring) => ring.map(toBr)) : g.arcs.map((p) => p.map((ring) => ring.map(toBr))),
    });
  }
  ufBorderArcs.push({ uf: u.uf, arcs: borders.map((i) => local2br[i]) });
  for (const row of u.rgiNomes) {
    regioes[row.CD_RGI] ??= { tipo: 'imediata', nome: row.NM_RGI, uf: u.uf, pai: row.CD_RGINT };
    regioes[row.CD_RGINT] ??= { tipo: 'intermediaria', nome: row.NM_RGINT, uf: u.uf };
  }
  const kb = (JSON.stringify(topoUf).length / 1024).toFixed(0);
  process.stdout.write(`uf/${u.uf}.json  ${u.features.length} mun  ${kb} KB\n`);
  for (const f of u.features) { f.rings = null; f.ringArcs = null; }
}

// Brasil: divisas = arcos de borda que aparecem em 2 UFs; costa/fronteira = 1 UF.
const borderCount = new Map();
for (const b of ufBorderArcs) for (const a of b.arcs) borderCount.set(a, (borderCount.get(a) ?? 0) + 1);
const divisas = [...borderCount.keys()];
const topoBr = encodeTopo(
  {
    municipios: { geometries: brMun },
    divisas: { geometries: [{ type: 'MultiLineString', arcs: divisas.map((i) => [i]) }] },
  },
  brArcs,
  TOL_BR,
  brArcs.map((_, i) => i),
);
writeFileSync(join(OUT_DIR, 'br.json'), JSON.stringify(topoBr));
writeFileSync(join(OUT_DIR, 'regioes.json'), JSON.stringify(regioes));
process.stdout.write(`br.json  ${brMun.length} mun  ${(JSON.stringify(topoBr).length / 1024).toFixed(0)} KB\n`);
