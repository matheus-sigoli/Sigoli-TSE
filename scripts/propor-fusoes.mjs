#!/usr/bin/env node
/**
 * Sigoli.TSE — municípios do mapa atual sem resultado num ano antigo (criados depois) e a provável origem.
 * Origem = vizinho (fronteira em comum na malha IBGE) que, no ano, tinha votos na mesma zona eleitoral em que o
 * município novo vota no ano seguinte (zonas-cidade de --depois); entre eles, o de maior fronteira em comum.
 * Só imprime: a lista revisada vai para scripts/lib/fusoes.mjs.
 * Uso: node scripts/propor-fusoes.mjs --ano 1998 --depois 2002
 */
import { existsSync, readFileSync, readdirSync } from 'node:fs';
import { fusoesDoAno } from './lib/fusoes.mjs';

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : null; };
const ANO = Number(opt('ano')), DEPOIS = Number(opt('depois'));
const jaFundidos = new Set(fusoesDoAno(ANO).map((f) => f.novo));
const nomes = new Map(JSON.parse(readFileSync('public/data/2026/municipios.json', 'utf8')).map((m) => [m.ibge, m.nome]));
const saida = [];
const origem = new Map(); const pendentes = [];
for (const arq of readdirSync('public/geo/uf').filter((n) => /^[a-z]{2}\.json$/.test(n))) {
  const uf = arq.slice(0, 2);
  const p = `public/data/${ANO}/governador/1/${uf}.json`;
  if (!existsSync(p)) continue;
  const comResultado = new Set(Object.keys(JSON.parse(readFileSync(p, 'utf8')).mun));
  const zonasAno = new Map(); // ibge → zonas no ano
  const pz = `public/data/${ANO}/governador/1/zonas-cidade/${uf}.json`;
  // 1994: o TSE não publica a zona (NR_ZONA = -3) → vale a zona do vizinho no ano seguinte
  if (existsSync(pz)) for (const k of Object.keys(JSON.parse(readFileSync(pz, 'utf8')).mun)) { const [ib, z] = k.split(/-(?=-?\d+$)/); if (Number(z) > 0) (zonasAno.get(ib) ?? zonasAno.set(ib, new Set()).get(ib)).add(z); }
  const zonasDepois = new Map();
  const pd = `public/data/${DEPOIS}/governador/1/zonas-cidade/${uf}.json`;
  if (existsSync(pd)) for (const k of Object.keys(JSON.parse(readFileSync(pd, 'utf8')).mun)) { const [ib, z] = k.split('-'); (zonasDepois.get(ib) ?? zonasDepois.set(ib, new Set()).get(ib)).add(z); }
  if (!zonasAno.size) for (const [ib, zs] of zonasDepois) zonasAno.set(ib, zs);
  const topo = JSON.parse(readFileSync(`public/geo/uf/${arq}`, 'utf8'));
  const geoms = topo.objects.municipios.geometries;
  // comprimento (em pontos) de cada arco e quem usa
  const tam = topo.arcs.map((a) => a.length);
  const donos = new Map();
  for (const g of geoms) {
    const aneis = g.type === 'Polygon' ? g.arcs : g.arcs.flat();
    for (const r of aneis) for (const ref of r) { const a = ref < 0 ? ~ref : ref; (donos.get(a) ?? donos.set(a, new Set()).get(a)).add(String(g.id)); }
  }
  for (const g of geoms) {
    const ib = String(g.id);
    if (comResultado.has(ib) || jaFundidos.has(ib)) continue;
    const viz = new Map();
    for (const [a, ds] of donos) if (ds.has(ib)) for (const d of ds) if (d !== ib) viz.set(d, (viz.get(d) ?? 0) + tam[a]);
    const zd = zonasDepois.get(ib) ?? new Set();
    const cands = [...viz].filter(([d]) => comResultado.has(d)).map(([d, f]) => ({ d, f, zona: [...zd].some((z) => zonasAno.get(d)?.has(z)) }))
      .sort((a, b) => Number(b.zona) - Number(a.zona) || b.f - a.f);
    if (!cands.length) { pendentes.push({ uf, ib, viz, zd }); continue; }
    const o = cands[0];
    origem.set(ib, o.d);
    saida.push(`${uf};${ib};${nomes.get(ib)};${o?.d ?? '?'};${o ? nomes.get(o.d) : '?'};${o?.zona ? 'zona' : 'fronteira'};${cands.slice(1, 3).map((c) => `${nomes.get(c.d)}${c.zona ? '*' : ''}`).join('/')}`);
  }
}
// novos cujos vizinhos também são novos: herdam a origem do vizinho novo da mesma zona (ou de maior fronteira)
let resto = pendentes;
for (let mudou = true; mudou;) {
  mudou = false;
  resto = resto.filter(({ uf, ib, viz }) => {
    const c = [...viz].filter(([d]) => origem.has(d)).sort((x, y) => y[1] - x[1])[0];
    if (!c) return true;
    origem.set(ib, origem.get(c[0]));
    saida.push(`${uf};${ib};${nomes.get(ib)};${origem.get(ib)};${nomes.get(origem.get(ib))};via ${nomes.get(c[0])};`);
    mudou = true;
    return false;
  });
}
for (const { uf, ib } of resto) saida.push(`${uf};${ib};${nomes.get(ib)};?;?;sem vizinho;`);
console.log(`municípios sem resultado em ${ANO}: ${saida.length}\nuf;novo;nome;origem;nome;critério;outros vizinhos (* = mesma zona)`);
for (const l of saida) console.log(l);
