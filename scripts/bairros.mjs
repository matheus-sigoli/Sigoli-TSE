#!/usr/bin/env node
/**
 * Sigoli.TSE — malha de bairros (IBGE, Censo 2022) → TopoJSON por cidade.
 *
 * Lê `shp/bairros/{UF}_bairros_CD2022.zip` (campos CD_MUN, CD_BAIRRO, NM_BAIRRO) e grava:
 *   public/geo/bairros/{uf}/{ibge}.json   TopoJSON da cidade, objeto `bairros` (id = CD_BAIRRO, properties.n = nome)
 *   public/geo/bairros/{uf}/cidades.json  { ibge: quantidade de bairros } das cidades com malha
 *
 * O IBGE só publica bairros das cidades que os definem oficialmente; nas outras, os locais de
 * votação são agrupados pelo nome de bairro do cadastro do TSE (ver scripts/zonas-locais.mjs, ADR 0009).
 *
 * Uso: node scripts/bairros.mjs [--shp shp/bairros] [--out public/geo/bairros] [--tol 0.00008]
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildTopology, encodeTopo, groupPolygons, readDbf, readShp, unzip } from './lib/shp.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => (a.startsWith('--') ? [...acc, [a.slice(2), arr[i + 1]]] : acc), []),
);
const SHP_DIR = args.shp ?? 'shp/bairros';
const OUT_DIR = args.out ?? 'public/geo/bairros';
const TOL = Number(args.tol ?? 0.00008); // ~9 m: detalhe de rua, arquivo pequeno

const zips = readdirSync(SHP_DIR).filter((f) => /_bairros_CD\d{4}\.zip$/i.test(f)).sort();
if (!zips.length) throw new Error(`Nenhum {UF}_bairros_CD2022.zip em ${SHP_DIR}/`);

let totalCidades = 0, totalBairros = 0;
for (const z of zips) {
  const uf = z.slice(0, 2).toLowerCase();
  const files = unzip(readFileSync(join(SHP_DIR, z)));
  // o zip de uma UF pode trazer outro zip dentro (veio assim no AC): usa só o shp/dbf desta UF
  const nome = (ext) => [...files.keys()].find((n) => n.toLowerCase() === `${uf}_bairros_cd2022.${ext}`)
    ?? [...files.keys()].find((n) => n.toLowerCase().endsWith(`.${ext}`));
  const rows = readDbf(files.get(nome('dbf')));
  const recs = readShp(files.get(nome('shp')));

  const porCidade = new Map();
  rows.forEach((row, i) => {
    if (!recs[i]?.length) return;
    if (!porCidade.has(row.CD_MUN)) porCidade.set(row.CD_MUN, []);
    porCidade.get(row.CD_MUN).push({ id: row.CD_BAIRRO, props: { n: row.NM_BAIRRO }, rings: recs[i] });
  });

  const dir = join(OUT_DIR, uf);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const indice = {};
  let kb = 0;
  for (const [ibge, features] of [...porCidade].sort()) {
    const { arcs } = buildTopology(features, null);
    const geometries = features.map((f) => {
      const polys = groupPolygons(f);
      return polys.length === 1
        ? { type: 'Polygon', id: f.id, properties: f.props, arcs: polys[0] }
        : { type: 'MultiPolygon', id: f.id, properties: f.props, arcs: polys };
    });
    const topo = encodeTopo({ bairros: { geometries } }, arcs, TOL, arcs.map((_, i) => i));
    const txt = JSON.stringify(topo);
    kb += txt.length / 1024;
    writeFileSync(join(dir, `${ibge}.json`), txt);
    indice[ibge] = features.length;
  }
  writeFileSync(join(dir, 'cidades.json'), JSON.stringify(indice));
  totalCidades += porCidade.size;
  totalBairros += rows.length;
  console.log(`${uf}: ${porCidade.size} cidades, ${rows.length} bairros, ${kb.toFixed(0)} KB`);
}
console.log(`\n${totalCidades} cidades com malha de bairros, ${totalBairros} bairros`);
