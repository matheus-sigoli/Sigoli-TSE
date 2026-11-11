#!/usr/bin/env node
/**
 * Sigoli.TSE — áreas dos locais de votação a partir da base nova do usuário ("locais novo": um GeoPackage por
 * município, malha corrigida pelos locais de votação de 2026) → TopoJSON por cidade.
 *
 * Passo 1 (Python, sem dependências): scripts/gpkg-locais.py PASTA_GPKG PASTA_JSON  → {uf}/{ibge}.json
 * Passo 2 (este): cada área é um endereço de votação; os locais dele (LOCAIS, "zona-local;…") viram uma área só:
 *   id = o 1º local que está no cadastro de 2026, os demais em `inclui` (o site soma os votos deles na área).
 *   Local de 2026 que não aparece em nenhuma área entra na área que contém o ponto dele (ou na mais próxima).
 *
 * Saída (mesmo formato de antes, o site não muda):
 *   public/geo/locais-areas/{uf}/{ibge}.json   TopoJSON da cidade, objeto `locais`, id = `{município TSE}-{zona}-{local}`
 *   public/geo/locais-areas/{uf}/cidades.json  { ibge: quantidade de áreas }
 * Depois: as áreas dos outros anos (scripts/areas-ano.mjs, workflow "Áreas de outro ano").
 *
 * Uso: node scripts/areas-gpkg.mjs --de PASTA_JSON [--tol 0.0001] [--uf ac]
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildTopology, encodeTopo } from './lib/shp.mjs';

const argv = process.argv.slice(2);
const opt = (k, padrao) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : padrao; };
const ENTRADA = opt('de', 'locais-json');
const SAIDA = 'public/geo/locais-areas';
const TOL = Number(opt('tol', 0.0001)); // ~11 m: a base nova vem sem simplificação; borda nítida na escala da cidade
const SO_UF = opt('uf', null);

const pad5 = (s) => String(parseInt(s, 10) || 0).padStart(5, '0');
// o Atlas só traz o código TSE na 1ª área de cada cidade: o casamento IBGE → TSE vem do nosso índice
const tseDe = new Map(JSON.parse(readFileSync('public/data/2026/municipios.json', 'utf8')).filter((m) => m.uf !== 'zz').map((m) => [m.ibge, m.tse]));
const inteiro = (s) => String(parseInt(String(s).replace(/^0+/, ''), 10) || 0);

/** Ponto dentro de anel plano [x0, y0, x1, y1, ...]. */
function dentro(x, y, r) {
  let d = false;
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    const xi = r[i], yi = r[i + 1], xj = r[j], yj = r[j + 1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) d = !d;
  }
  return d;
}
const centroide = (r) => {
  let sx = 0, sy = 0;
  for (let i = 0; i < r.length; i += 2) { sx += r[i]; sy += r[i + 1]; }
  return { lon: sx / (r.length / 2), lat: sy / (r.length / 2) };
};
const dist2 = (a, b) => (a.lon - b.lon) ** 2 + (a.lat - b.lat) ** 2;

let totalAreas = 0, totalCidades = 0, totalKb = 0;
for (const uf of readdirSync(ENTRADA).filter((n) => /^[a-z]{2}$/.test(n)).sort()) {
  if (SO_UF && uf !== SO_UF) continue;
  // cadastro dos locais de 2026 (ponto de cada um), para encaixar os que não têm área
  const cad = JSON.parse(readFileSync(`public/geo/locais/${uf}.json`, 'utf8'));
  const ci = Object.fromEntries(cad.campos.map((n, i) => [n, i]));
  const locaisDaCidade = new Map();
  const noCadastro = new Set();
  for (const l of cad.l) {
    const ib = String(l[ci.ibge]);
    if (!locaisDaCidade.has(ib)) locaisDaCidade.set(ib, []);
    locaisDaCidade.get(ib).push({ id: String(l[ci.id]), lon: l[ci.lon], lat: l[ci.lat] });
    noCadastro.add(String(l[ci.id]));
  }
  let encaixados = 0, semPonto = 0;

  // por cidade: id da área → polígonos, e os outros locais do mesmo endereço
  const porCidade = new Map();
  const juntosDe = new Map();
  for (const arq of readdirSync(join(ENTRADA, uf)).filter((n) => n.endsWith('.json')).sort()) {
    const { ibge, tse: tseArq, f } = JSON.parse(readFileSync(join(ENTRADA, uf, arq), 'utf8'));
    const tse = tseDe.get(ibge) ?? tseArq;
    if (!tse) continue; // sem o código do TSE não há como casar com os resultados
    const locais = new Map();
    for (const area of f) {
      const ids = [...new Set(area.l.map((x) => { const [z, l] = x.split('-'); return `${pad5(tse)}-${inteiro(z)}-${inteiro(l)}`; }))];
      const id = ids.find((x) => noCadastro.has(x)) ?? ids[0];
      if (!locais.has(id)) locais.set(id, []);
      locais.get(id).push(...area.p);
      const outros = ids.filter((x) => x !== id);
      if (outros.length) juntosDe.set(id, [...(juntosDe.get(id) ?? []), ...outros]);
    }
    porCidade.set(ibge, locais);
  }

  const dir = join(SAIDA, uf);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  const indice = {};
  let kbUf = 0;
  for (const [ibge, locais] of [...porCidade].sort()) {
    // anéis planos para a topologia; guarda de qual polígono/local cada anel veio
    const features = [];
    const mapa = []; // por feature: lista de polígonos, cada um uma lista de índices de anel
    for (const [id, polys] of locais) {
      const rings = [];
      const estrutura = [];
      for (const p of polys) {
        const idx = [];
        for (const r of p) {
          if (r.length < 4) continue;
          const plano = new Float64Array(r.length * 2);
          r.forEach(([x, y], k) => { plano[k * 2] = x; plano[k * 2 + 1] = y; });
          idx.push(rings.length);
          rings.push(plano);
        }
        if (idx.length) estrutura.push(idx);
      }
      if (!rings.length) continue;
      features.push({ id, rings });
      mapa.push(estrutura);
    }
    // locais sem área no Atlas: entram na área que contém o ponto deles (ou na mais próxima)
    const inclui = new Map(features.filter((ft) => juntosDe.has(ft.id)).map((ft) => [ft.id, [...juntosDe.get(ft.id)]]));
    const comArea = new Set([...features.map((ft) => ft.id), ...[...inclui.values()].flat()]);
    const pts = features.map((ft, i) => ({ id: ft.id, polys: mapa[i].map((idx) => idx.map((ri) => ft.rings[ri])), centro: centroide(ft.rings[0]) }));
    for (const l of locaisDaCidade.get(ibge) ?? []) {
      if (comArea.has(l.id)) continue;
      if (l.lon === null || l.lat === null || !pts.length) { semPonto++; continue; }
      let alvo = pts.find((a) => a.polys.some((p) => dentro(l.lon, l.lat, p[0]) && !p.slice(1).some((h) => dentro(l.lon, l.lat, h))));
      if (!alvo) alvo = pts.reduce((m, a) => (dist2(a.centro, l) < dist2(m.centro, l) ? a : m));
      if (!inclui.has(alvo.id)) inclui.set(alvo.id, []);
      inclui.get(alvo.id).push(l.id);
      encaixados++;
    }
    const { arcs } = buildTopology(features, null);
    // o GeoJSON já diz qual anel é externo (o 1º de cada polígono): não depende da orientação
    const geometries = features.map((ft, i) => {
      const polys = mapa[i].map((idx) => idx.map((ri) => ft.ringArcs[ri]));
      const extra = inclui.has(ft.id) ? { properties: { inclui: inclui.get(ft.id) } } : {};
      return polys.length === 1
        ? { type: 'Polygon', id: ft.id, arcs: polys[0], ...extra }
        : { type: 'MultiPolygon', id: ft.id, arcs: polys, ...extra };
    });
    const topo = encodeTopo({ locais: { geometries } }, arcs, TOL, arcs.map((_, i) => i));
    const txt = JSON.stringify(topo);
    kbUf += txt.length / 1024;
    writeFileSync(join(dir, `${ibge}.json`), txt);
    indice[ibge] = geometries.length;
    totalAreas += geometries.length;
  }
  writeFileSync(join(dir, 'cidades.json'), JSON.stringify(indice));
  totalCidades += porCidade.size;
  // (cidades que não vieram na pasta ficam sem arquivo e o site mostra círculos nelas)
  totalKb += kbUf;
  console.log(`${uf}: ${porCidade.size} cidades, ${Object.values(indice).reduce((a, b) => a + b, 0)} locais com área, ${encaixados} encaixados em outra área, ${semPonto} sem ponto, ${(kbUf / 1024).toFixed(1)} MB`);
}
console.log(`\n${totalCidades} cidades, ${totalAreas} locais com área, ${(totalKb / 1024).toFixed(1)} MB`);
