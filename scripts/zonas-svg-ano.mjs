#!/usr/bin/env node
/**
 * Sigoli.TSE — zonas do DF desenhadas à mão, um SVG por ano (ADR 0013).
 *
 * O usuário desenhou as zonas do DF de cada período (data/zonas/df/{ano}.svg; 1994/1998, 2002, 2006, 2010–2018;
 * 2022 vem do ZMBRA_2022 e 2026 de data/zonas/DF.svg). Cada forma tem `inkscape:label="Zona N"`: a zona vem do rótulo.
 *
 *   - lê <polygon>, <polyline> e <path> (M L H V C S Q T Z, absolutos e relativos; curvas viram retas em 8 passos)
 *     e aplica o translate() de cada forma;
 *   - encaixa o desenho na caixa do DF (public/geo/uf/df.json), escala linear como em zonas-svg.mjs;
 *   - grava data/zonas/df-{ano}.geojson (scripts/zonas-locais.mjs e zonas-de-outro-ano.mjs usam no lugar do Voronoi).
 *
 * Uso: node scripts/zonas-svg-ano.mjs [--uf df]   (todos os data/zonas/{uf}/*.svg)
 */
import { existsSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';

const argv = process.argv.slice(2);
const UF = (argv.includes('--uf') ? argv[argv.indexOf('--uf') + 1] : 'df').toLowerCase();
const DIR = `data/zonas/${UF}`;

function lerCaminho(d) {
  const toks = d.match(/[MmLlHhVvCcSsQqTtZzAa]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) ?? [];
  const aneis = [];
  let i = 0, x = 0, y = 0, sx = 0, sy = 0, cmd = null, atual = [], cx = 0, cy = 0;
  const n = () => Number(toks[i++]);
  const bez = (pts) => { // de (x,y) pelos pontos de controle; 8 passos
    const [p0, ...ps] = [[x, y], ...pts];
    for (let k = 1; k <= 8; k++) {
      const t = k / 8;
      const lerp = (a, b) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
      let camada = [p0, ...ps];
      while (camada.length > 1) camada = camada.slice(1).map((p, j) => lerp(camada[j], p));
      atual.push(camada[0]);
    }
  };
  while (i < toks.length) {
    if (/^[A-Za-z]$/.test(toks[i])) cmd = toks[i++];
    const rel = cmd === cmd.toLowerCase();
    const ox = rel ? x : 0, oy = rel ? y : 0;
    switch (cmd.toUpperCase()) {
      case 'Z': if (atual.length) aneis.push(atual); atual = []; x = sx; y = sy; cmd = rel ? 'm' : 'M'; continue;
      case 'M': { x = ox + n(); y = oy + n(); if (atual.length) aneis.push(atual); atual = [[x, y]]; sx = x; sy = y; cmd = rel ? 'l' : 'L'; continue; }
      case 'L': x = ox + n(); y = oy + n(); break;
      case 'H': x = (rel ? x : 0) + n(); break;
      case 'V': y = (rel ? y : 0) + n(); break;
      case 'C': { const c1 = [ox + n(), oy + n()], c2 = [ox + n(), oy + n()], p = [ox + n(), oy + n()]; bez([c1, c2, p]); [cx, cy] = c2; [x, y] = p; continue; }
      case 'S': { const c1 = [2 * x - cx, 2 * y - cy], c2 = [ox + n(), oy + n()], p = [ox + n(), oy + n()]; bez([c1, c2, p]); [cx, cy] = c2; [x, y] = p; continue; }
      case 'Q': { const c1 = [ox + n(), oy + n()], p = [ox + n(), oy + n()]; bez([c1, p]); [cx, cy] = c1; [x, y] = p; continue; }
      case 'T': { const c1 = [2 * x - cx, 2 * y - cy], p = [ox + n(), oy + n()]; bez([c1, p]); [cx, cy] = c1; [x, y] = p; continue; }
      case 'A': { n(); n(); n(); n(); n(); x = ox + n(); y = oy + n(); break; } // arco: só o ponto final
      default: throw new Error(`comando ${cmd}`);
    }
    atual.push([x, y]); cx = x; cy = y;
  }
  if (atual.length) aneis.push(atual);
  return aneis;
}
const pontos = (s) => { const v = s.trim().split(/[\s,]+/).map(Number); const r = []; for (let k = 0; k + 1 < v.length; k += 2) r.push([v[k], v[k + 1]]); return [r]; };

const bb = JSON.parse(readFileSync(`public/geo/uf/${UF}.json`, 'utf8')).bbox;
const dentro = ([x, y], r) => { let d = false; for (let i = 0, j = r.length - 1; i < r.length; j = i++) { const [xi, yi] = r[i], [xj, yj] = r[j]; if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) d = !d; } return d; };
// zonas de 2022 (ZMBRA_2022, já certas) como referência
let ref2022 = [];
if (existsSync(`public/geo/2022/zonas/${UF}.json`)) {
  const { toGeoJSON } = await import('../src/lib/topojson.ts');
  const t = JSON.parse(readFileSync(`public/geo/2022/zonas/${UF}.json`, 'utf8'));
  ref2022 = toGeoJSON(t, Object.keys(t.objects)[0]).features.map((f) => ({ id: String(f.id), polys: f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates, fonte: 'zonas de 2022' }));
}
let anterior = [];
const fechar = (r) => (r[0][0] === r.at(-1)[0] && r[0][1] === r.at(-1)[1] ? r : [...r, r[0]]);
for (const arq of readdirSync(DIR).filter((n) => /^\d{4}\.svg$/.test(n)).sort()) {
  const ano = arq.slice(0, 4);
  const svg = readFileSync(`${DIR}/${arq}`, 'utf8');
  const formas = [];
  for (const m of svg.matchAll(/<(polygon|polyline|path)\b([\s\S]*?)\/?>/g)) {
    const at = m[2];
    const rotulo = at.match(/inkscape:label="([^"]*)"/)?.[1] ?? '';
    const z = rotulo.match(/zona\s*(\d+)/i)?.[1];
    if (!z) continue;
    let aneis = m[1] === 'path' ? lerCaminho(at.match(/\sd="([^"]*)"/)[1]) : pontos(at.match(/points="([^"]*)"/)[1]);
    const tr = at.match(/transform="translate\(\s*([-\d.e]+)[\s,]+([-\d.e]+)\s*\)"/);
    if (/transform="(?!translate)/.test(at)) throw new Error(`${arq} zona ${z}: transform que não é translate`);
    if (tr) aneis = aneis.map((r) => r.map(([x, y]) => [x + Number(tr[1]), y + Number(tr[2])]));
    formas.push({ zona: String(Number(z)), parteDe: rotulo.match(/parte da zona\s*(\d+)/i)?.[1], aneis: aneis.filter((r) => r.length >= 3) });
  }
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const f of formas) for (const r of f.aneis) for (const [x, y] of r) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
  const geo = ([x, y]) => [+(bb[0] + ((x - x0) / (x1 - x0)) * (bb[2] - bb[0])).toFixed(6), +(bb[3] - ((y - y0) / (y1 - y0)) * (bb[3] - bb[1])).toFixed(6)];
  // zonas do ano nos resultados: zona do desenho que não existe no ano e é "Atual parte da zona N" entra na N
  const pDados = `public/data/${ano}/governador/1/zonas/${UF}.json`;
  const doAno = existsSync(pDados) ? new Set(Object.keys(JSON.parse(readFileSync(pDados, 'utf8')).mun)) : null;
  const referencias = [anterior, ref2022];
  const porZona = new Map();
  for (const f of formas) {
    let z = f.zona;
    if (doAno && !doAno.has(z) && f.parteDe && doAno.has(String(Number(f.parteDe)))) { console.log(`  ${ano}: zona ${z} do desenho entra na ${f.parteDe} (não existe no ano)`); z = String(Number(f.parteDe)); }
    porZona.set(z, [...(porZona.get(z) ?? []), ...f.aneis.map((r) => [fechar(r.map(geo))])]);
  }
  // zona do desenho que ainda não existe (ou já não existe) no ano: entra na zona do ano onde cai o centro dela,
  // pelo desenho do ano anterior ou pelas zonas de 2022 (ZMBRA_2022)
  if (doAno) for (const z of [...porZona.keys()].filter((x) => !doAno.has(x))) {
    const polys = porZona.get(z);
    const anel = polys.map((p) => p[0]).sort((a, b) => b.length - a.length)[0];
    let cx = 0, cy = 0; for (const [x, y] of anel) { cx += x; cy += y; } cx /= anel.length; cy /= anel.length;
    for (const ref of referencias) {
      const alvo = ref.find((f) => doAno.has(f.id) && f.polys.some((p) => dentro([cx, cy], p[0])));
      if (!alvo) continue;
      console.log(`  ${ano}: zona ${z} do desenho entra na ${alvo.id} (não existe no ano; centro dentro da ${alvo.id} em ${alvo.fonte})`);
      porZona.set(alvo.id, [...(porZona.get(alvo.id) ?? []), ...polys]);
      porZona.delete(z);
      break;
    }
  }
  anterior = [...porZona].map(([id, polys]) => ({ id, polys, fonte: `desenho de ${ano}` }));
  if (doAno) {
    const sobra = [...porZona.keys()].filter((z) => !doAno.has(z)), falta = [...doAno].filter((z) => !porZona.has(z));
    if (sobra.length || falta.length) console.warn(`  ${ano}: zonas só no desenho ${sobra.join(',') || '-'}; só nos resultados ${falta.join(',') || '-'}`);
  }
  const fc = {
    type: 'FeatureCollection',
    fonte: `${DIR}/${arq} (desenho do usuário, encaixado na caixa da UF; zona pelo rótulo)`,
    features: [...porZona].sort((a, b) => Number(a[0]) - Number(b[0])).map(([z, polys]) => ({ type: 'Feature', id: z, properties: { id: z, zona: z }, geometry: { type: 'MultiPolygon', coordinates: polys } })),
  };
  writeFileSync(`data/zonas/${UF}-${ano}.geojson`, JSON.stringify(fc));
  console.log(`${UF} ${ano}: zonas ${[...porZona.keys()].sort((a, b) => a - b).join(', ')}`);
}
