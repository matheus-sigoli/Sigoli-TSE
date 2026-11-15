#!/usr/bin/env node
/**
 * Sigoli.TSE — malha histórica (IBGE BR1950 … BR1985, preparada por scripts/malha-historica.py) → TopoJSON do ano.
 * Mesmo processo de scripts/malha.mjs (topologia, simplificação determinística), mas a entrada é
 * data/malhas-historicas/{BRxxxx}/{uf}.geojson.gz e a saída vai para public/geo/{ano}/ de cada eleição que usa
 * aquela malha (data/malhas-historicas/anos.json), com malhas.json listando todos os arquivos (o site troca todos).
 *
 * Para cada UF com resultado no ano, usa a malha do IBGE que melhor casa com os municípios que têm dado
 * (os criados depois da eleição voltam para a origem). Uso: node scripts/malha-historica.mjs [--ano 1982]
 *
 * (cabeçalho original do conversor:)
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
import { readFileSync, writeFileSync, mkdirSync, readdirSync, cpSync, rmSync, existsSync, statSync } from 'node:fs';
import { execSync } from 'node:child_process';
import { fundirGeometrias as mergeArcs } from './lib/fundir-topo.mjs';
import { fusoesDoAno } from './lib/fusoes.mjs';
import { gunzipSync } from 'node:zlib';
import { join } from 'node:path';
import {
  GRID, QUANT, buildTopology, douglasPeucker, encodeTopo, groupPolygons, keyOf, pointInRing, readDbf, readShp, reversePairs, sigOf, signedArea, simplifyArc, unzip,
} from './lib/shp.mjs';

const args = Object.fromEntries(
  process.argv.slice(2).reduce((acc, a, i, arr) => (a.startsWith('--') ? [...acc, [a.slice(2), arr[i + 1]]] : acc), []),
);
const ANOS = JSON.parse(readFileSync('data/malhas-historicas/anos.json', 'utf8'));
const TOL_UF = Number(args['tol-uf'] ?? 0.0004); // a grade da entrada já é de ~90 m
const TOL_BR = Number(args['tol-br'] ?? 0.01);
const ANOS_RODAR = args.ano ? [args.ano] : Object.keys(ANOS);

// todas as malhas do IBGE, lidas uma vez: {BRxxxx: {uf: [{id, n, rings}]}}
const TODAS = {};
for (const m of [...new Set(Object.values(ANOS))]) {
  TODAS[m] = {};
  const dir = `data/malhas-historicas/${m}`;
  for (const arq of readdirSync(dir).filter((f) => f.endsWith('.geojson.gz')).sort()) {
    const fc = JSON.parse(gunzipSync(readFileSync(join(dir, arq))).toString('utf8'));
    TODAS[m][arq.slice(0, 2)] = fc.features.map((f) => ({
      id: String(f.id), n: f.properties.n, coords: f.geometry.coordinates.flat(),
    }));
  }
}

// municípios com resultado no ano, por UF (todos os cargos e turnos)
function idsComDado(ano) {
  const r = {};
  const base = `public/data/${ano}`;
  if (!existsSync(base)) return r;
  for (const cargo of readdirSync(base)) {
    if (cargo.includes('.')) continue;
    for (const turno of readdirSync(join(base, cargo))) {
      const dir = join(base, cargo, turno);
      if (!statSync(dir).isDirectory()) continue;
      for (const f of readdirSync(dir)) {
        if (!f.endsWith('.json') || f.startsWith('br')) continue;
        const d = JSON.parse(readFileSync(join(dir, f), 'utf8'));
        const s = (r[f.slice(0, 2)] ??= new Set());
        for (const k of Object.keys(d.mun ?? {})) s.add(k);
      }
    }
  }
  return r;
}

// arestas (pares de pontos da grade) de cada polígono: vizinho com mais arestas em comum = maior divisa
const arestas = (coords) => {
  const s = new Set();
  for (const ring of coords) for (let i = 1; i < ring.length; i++) {
    const p = `${ring[i - 1][0]},${ring[i - 1][1]}`, q = `${ring[i][0]},${ring[i][1]}`;
    s.add(p < q ? `${p}|${q}` : `${q}|${p}`);
  }
  return s;
};

// polígonos sem resultado no ano (município criado depois da eleição) voltam para o de origem:
// pela genealogia de scripts/lib/fusoes.mjs, senão pelo vizinho com dado de maior divisa
function destinos(feats, comDado, ano) {
  const gen = new Map(fusoesDoAno(Number(ano)).map((f) => [f.novo, f.origem]));
  const dest = new Map(feats.map((f) => [f.id, comDado.has(f.id) ? f.id : null]));
  for (const f of feats) {
    if (dest.get(f.id)) continue;
    let o = gen.get(f.id);
    for (let i = 0; o && !comDado.has(o) && i < 10; i++) o = gen.get(o);
    if (o && comDado.has(o) && dest.has(o)) dest.set(f.id, o);
  }
  const ar = new Map(feats.map((f) => [f.id, arestas(f.coords)]));
  for (let volta = 0; volta < 6; volta++) {
    let falta = false;
    for (const f of feats) {
      if (dest.get(f.id)) continue;
      let melhor = null, mx = 0;
      for (const g of feats) {
        const dg = dest.get(g.id);
        if (!dg || g.id === f.id) continue;
        let c = 0;
        for (const e of ar.get(f.id)) if (ar.get(g.id).has(e)) c++;
        if (c > mx) { mx = c; melhor = dg; }
      }
      if (melhor) dest.set(f.id, melhor); else falta = true;
    }
    if (!falta) break;
  }
  return dest;
}

const antigo = (ano, uf) => {
  try { return execSync(`git show HEAD:public/geo/${ano}/uf/${uf}.json`, { maxBuffer: 1 << 28 }).toString(); } catch { return null; }
};

for (const ANO of ANOS_RODAR) {
const OUT_DIR = `data/malhas-historicas/_saida/${ANO}`; // pasta de trabalho (fora do site)
rmSync(OUT_DIR, { recursive: true, force: true });
mkdirSync(join(OUT_DIR, 'uf'), { recursive: true });
const PADRAO = ANOS[ANO];
const DADOS = idsComDado(ANO);
const manterAntigo = {}; // UF em que nenhuma malha do IBGE tem todos os municípios com dado: fica a malha anterior
const ufs = [];
const nomesUf = Object.keys(TODAS[PADRAO]).filter((uf) => !(Number(ANO) < 1979 && uf === 'ms'));
for (const uf of nomesUf) {
  const lerUf = (m) => [...(TODAS[m][uf] ?? []), ...(Number(ANO) < 1979 && uf === 'mt' ? TODAS[m].ms ?? [] : [])];
  const comDado = DADOS[uf];
  let escolha = PADRAO, feats = lerUf(PADRAO), fora = 0;
  if (comDado?.size) {
    let melhor = null;
    for (const m of Object.keys(TODAS)) {
      const fs = lerUf(m);
      if (!fs.length) continue;
      const ids = new Set(fs.map((f) => f.id));
      const fo = [...comDado].filter((k) => !ids.has(k)).length;
      const sem = fs.filter((f) => !comDado.has(f.id)).length;
      const nota = fo * 1000 + sem + (m === PADRAO ? -0.5 : 0);
      if (!melhor || nota < melhor.nota) melhor = { m, nota, fo, fs };
    }
    escolha = melhor.m; feats = melhor.fs; fora = melhor.fo;
    // município que já existia na eleição (está na malha do IBGE de antes dela) e ficou sem dado: fica no mapa, sem cor
    const anterior = Object.keys(TODAS).filter((m) => Number(m.slice(2)) <= Number(ANO)).sort().pop();
    const existia = new Set(anterior ? lerUf(anterior).map((f) => f.id) : []);
    const dest = destinos(feats, new Set([...comDado, ...feats.filter((f) => existia.has(f.id)).map((f) => f.id)]), ANO);
    const nomeDe = new Map(feats.map((f) => [f.id, f.n]));
    let juntos = 0;
    feats = feats.map((f) => {
      const d = dest.get(f.id) ?? f.id;
      if (d !== f.id) juntos++;
      return { ...f, id: d, n: nomeDe.get(d) ?? f.n };
    });
    if (fora) {
      const velho = antigo(ANO, uf);
      if (velho) {
        const ids = new Set(JSON.parse(velho).objects.municipios.geometries.map((g) => String(g.id)));
        if ([...comDado].every((k) => ids.has(k))) manterAntigo[uf] = velho;
      }
    }
    process.stdout.write(`${ANO} ${uf}: ${escolha}, ${juntos} polígono(s) juntado(s) à origem, ${fora} com dado fora da malha${manterAntigo[uf] ? ' → fica a malha anterior (atual + fusões)' : ''}\n`);
  }
  const features = feats.map((f) => ({ id: f.id, props: { n: f.n }, rings: f.coords.map((r) => Float64Array.from(r.flat())) }));
  ufs.push({ uf, features, rgiNomes: [] });
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
// regioes.json (micro e mesorregiões) agora sai de scripts/regioes.mjs
process.stdout.write(`br.json  ${brMun.length} mun  ${(JSON.stringify(topoBr).length / 1024).toFixed(0)} KB\n`);
// mesmo código em vários polígonos (município criado depois, devolvido à origem): funde na topologia
for (const arq of [...ufs.map((u) => `uf/${u.uf}.json`), 'br.json']) {
  const caminho = join(OUT_DIR, arq);
  const topo = JSON.parse(readFileSync(caminho, 'utf8'));
  const geoms = topo.objects.municipios.geometries;
  const grupos = new Map();
  for (const g of geoms) (grupos.get(String(g.id)) ?? grupos.set(String(g.id), []).get(String(g.id))).push(g);
  let mudou = false;
  for (const lista of grupos.values()) {
    if (lista.length < 2) continue;
    const unido = mergeArcs(topo, lista);
    Object.assign(lista[0], { type: unido.type, arcs: unido.arcs });
    for (const g of lista.slice(1)) geoms.splice(geoms.indexOf(g), 1);
    mudou = true;
  }
  if (mudou) writeFileSync(caminho, JSON.stringify(topo));
}
for (const [uf, txt] of Object.entries(manterAntigo)) writeFileSync(join(OUT_DIR, 'uf', `${uf}.json`), txt);
const destino = `public/geo/${ANO}`;
rmSync(destino, { recursive: true, force: true });
cpSync(OUT_DIR, destino, { recursive: true });
const lista = [...ufs.map((u) => `uf/${u.uf}.json`), 'br.json'];
writeFileSync(join(destino, 'malhas.json'), JSON.stringify(lista));
process.stdout.write(`${destino}: ${lista.length} arquivos\n`);
}
