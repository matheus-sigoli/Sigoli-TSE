#!/usr/bin/env node
/**
 * Sigoli.TSE — zonas eleitorais desenhadas à mão (SVG) → malha das zonas (ADR 0013).
 *
 * Algumas UFs têm um desenho das zonas melhor que a aproximação pelos locais de votação (ADR 0008).
 * Hoje: o DF, a partir de `data/zonas/DF.svg` (enviado pelo usuário; 19 caminhos, um por zona).
 *
 * 1. Lê os caminhos do SVG (só retas: M L H V Z, absolutos ou relativos).
 * 2. Encaixa o desenho na caixa da UF (public/geo/uf/{uf}.json). O DF é pequeno: escala linear basta
 *    (a proporção do SVG bate com a da UF em km, 1,709 × 1,716).
 * 3. Cada caminho vira a zona que tem mais eleitores nos locais de votação dentro dele
 *    (public/geo/locais/{uf}.json). Para quando dois caminhos caem na mesma zona.
 *
 * Saída:
 *   data/zonas/{uf}.geojson               fonte permanente: scripts/zonas-locais.mjs usa no lugar do Voronoi
 *   public/geo/zonas/{uf}.json            malha das zonas do estado (objeto `zonas`, id = zona)
 *   public/geo/zonas-cidade/{uf}.json     zonas por cidade (id `{ibge}-{zona}`) — só para UF de uma cidade (DF)
 *
 * Uso: node scripts/zonas-svg.mjs [--uf df]
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { buildTopology, encodeTopo } from './lib/shp.mjs';

const argv = process.argv.slice(2);
const UF = (argv[argv.indexOf('--uf') + 1] && argv.includes('--uf') ? argv[argv.indexOf('--uf') + 1] : 'df').toLowerCase();
const SVG = `data/zonas/${UF.toUpperCase()}.svg`;
if (!existsSync(SVG)) throw new Error(`não achei ${SVG}`);

// ---------------------------------------------------------------- SVG → anéis
function lerCaminho(d) {
  const toks = d.match(/[MmLlHhVvZz]|[-+]?(?:\d+\.?\d*|\.\d+)(?:[eE][-+]?\d+)?/g) ?? [];
  const aneis = [];
  let i = 0, x = 0, y = 0, sx = 0, sy = 0, cmd = null, atual = [];
  const num = () => Number(toks[i++]);
  while (i < toks.length) {
    if (/^[MmLlHhVvZz]$/.test(toks[i])) cmd = toks[i++];
    if (cmd === 'Z' || cmd === 'z') {
      if (atual.length) aneis.push(atual);
      atual = []; x = sx; y = sy; cmd = null;
      continue;
    }
    if (cmd === 'M' || cmd === 'm') {
      const a = num(), b = num();
      if (cmd === 'm') { x += a; y += b; } else { x = a; y = b; }
      if (atual.length) aneis.push(atual);
      atual = [[x, y]]; sx = x; sy = y;
      cmd = cmd === 'm' ? 'l' : 'L'; // coordenadas seguintes são lineto implícito
      continue;
    }
    if (cmd === 'L') { x = num(); y = num(); }
    else if (cmd === 'l') { x += num(); y += num(); }
    else if (cmd === 'H') x = num();
    else if (cmd === 'h') x += num();
    else if (cmd === 'V') y = num();
    else if (cmd === 'v') y += num();
    else throw new Error(`comando de caminho não suportado: ${cmd} (só retas)`);
    atual.push([x, y]);
  }
  if (atual.length) aneis.push(atual);
  return aneis;
}
const svg = readFileSync(SVG, 'utf8');
const caminhos = [...svg.matchAll(/<path([\s\S]*?)\/>/g)].map((m) => ({
  id: m[1].match(/\sid="([^"]*)"/)?.[1] ?? '',
  aneis: lerCaminho(m[1].match(/\sd="([^"]*)"/)[1]),
}));
if (/transform=/.test(svg)) console.warn('atenção: o SVG tem transform; o encaixe ignora transformações');

// ---------------------------------------------------------------- encaixe na UF
const bb = JSON.parse(readFileSync(`public/geo/uf/${UF}.json`, 'utf8')).bbox;
let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
for (const c of caminhos) for (const r of c.aneis) for (const [x, y] of r) {
  x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y);
}
const geo = ([x, y]) => [
  +(bb[0] + ((x - x0) / (x1 - x0)) * (bb[2] - bb[0])).toFixed(6),
  +(bb[3] - ((y - y0) / (y1 - y0)) * (bb[3] - bb[1])).toFixed(6),
];
const fechar = (r) => (r[0][0] === r.at(-1)[0] && r[0][1] === r.at(-1)[1] ? r : [...r, r[0]]);
for (const c of caminhos) c.geo = c.aneis.filter((r) => r.length >= 3).map((r) => fechar(r.map(geo)));

// ---------------------------------------------------------------- caminho → zona
const dentro = (x, y, r) => {
  let d = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i], [xj, yj] = r[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) d = !d;
  }
  return d;
};
const cad = JSON.parse(readFileSync(`public/geo/locais/${UF}.json`, 'utf8'));
const ci = Object.fromEntries(cad.campos.map((n, i) => [n, i]));
const zonaDe = new Map();
for (const c of caminhos) {
  const votos = new Map();
  for (const l of cad.l) {
    const lon = l[ci.lon], lat = l[ci.lat];
    if (lon === null || lat === null) continue;
    // anel com dentro par/ímpar: buracos (anéis internos) contam certo
    let n = 0;
    for (const r of c.geo) if (dentro(lon, lat, r)) n++;
    if (n % 2) votos.set(String(l[ci.zona]), (votos.get(String(l[ci.zona])) ?? 0) + l[ci.eleitorado]);
  }
  const [z, v] = [...votos].sort((a, b) => b[1] - a[1])[0] ?? [];
  if (!z) throw new Error(`${c.id}: nenhum local de votação dentro; não sei que zona é`);
  if (zonaDe.has(z)) throw new Error(`${c.id} e ${zonaDe.get(z).id} caem na mesma zona ${z}`);
  const total = [...votos.values()].reduce((a, b) => a + b, 0);
  zonaDe.set(z, c);
  console.log(`${c.id} → zona ${z} (${((v / total) * 100).toFixed(0)}% dos eleitores dentro)`);
}
const zonasCadastro = new Set(cad.l.map((l) => String(l[ci.zona])));
const faltam = [...zonasCadastro].filter((z) => !zonaDe.has(z));
if (faltam.length) console.warn(`zonas sem desenho no SVG: ${faltam.join(', ')}`);

// ---------------------------------------------------------------- saídas
const ordenadas = [...zonaDe].sort((a, b) => Number(a[0]) - Number(b[0]));
const fc = {
  type: 'FeatureCollection',
  fonte: `${SVG} (encaixado na caixa da UF; zona pela maioria dos eleitores dos locais dentro)`,
  features: ordenadas.map(([z, c]) => ({
    type: 'Feature', id: z, properties: { id: z, zona: z },
    // cada anel do SVG é um polígono (o desenho não usa buracos)
    geometry: { type: 'MultiPolygon', coordinates: c.geo.map((r) => [r]) },
  })),
};
writeFileSync(`data/zonas/${UF}.geojson`, JSON.stringify(fc));

/** TopoJSON (sem dependências): bordas comuns gravadas uma vez. */
function topo(nomeObjeto, feats, bbox) {
  const fs = feats.map((f) => ({
    id: f.id, props: f.properties,
    rings: f.geometry.coordinates.flat().map((r) => Float64Array.from(r.flat())),
  }));
  const { arcs } = buildTopology(fs, null);
  const geometries = fs.map((f) => ({ type: 'MultiPolygon', id: f.id, properties: f.props, arcs: f.ringArcs.map((ra) => [ra]) }));
  const t = encodeTopo({ [nomeObjeto]: { geometries } }, arcs, 0.00005, arcs.map((_, i) => i));
  t.bbox = bbox;
  return t;
}
mkdirSync('public/geo/zonas', { recursive: true });
writeFileSync(`public/geo/zonas/${UF}.json`, JSON.stringify(topo('zonas', fc.features, bb)));

// UF de uma cidade só (DF): as zonas da cidade são as mesmas, com id `{ibge}-{zona}`
const uf = JSON.parse(readFileSync(`public/geo/uf/${UF}.json`, 'utf8'));
const cidades = uf.objects.municipios.geometries.map((g) => String(g.id));
if (cidades.length === 1) {
  const ibge = cidades[0];
  const porCidade = fc.features.map((f) => ({ ...f, id: `${ibge}-${f.id}`, properties: { id: `${ibge}-${f.id}`, ibge, zona: f.id } }));
  mkdirSync('public/geo/zonas-cidade', { recursive: true });
  writeFileSync(`public/geo/zonas-cidade/${UF}.json`, JSON.stringify(topo('zonas', porCidade, bb)));
}
console.log(`\n${UF}: ${zonaDe.size} zonas gravadas em data/zonas/${UF}.geojson e public/geo/zonas${cidades.length === 1 ? ' e zonas-cidade' : ''}`);
