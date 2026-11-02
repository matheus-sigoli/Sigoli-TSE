#!/usr/bin/env node
/**
 * Sigoli.TSE — áreas dos locais de votação (Atlas Eleitoral 2026, @mroctoz, uso autorizado) → TopoJSON por cidade.
 *
 * Entrada: a pasta `saida_sigoli/` gerada pelo `converter_areas.py` no computador do usuário
 * ({UF}.json com `campos` = cd_mun, zona, local, cd_mun_tse, poligonos). Os arquivos originais têm ~5 GB;
 * o conversor já simplifica as bordas (~9 m) e aqui elas viram topologia (borda comum gravada uma vez).
 *
 * Saída:
 *   public/geo/locais-areas/{uf}/{ibge}.json   TopoJSON da cidade, objeto `locais`,
 *                                              id = `{município TSE 5 dígitos}-{zona}-{local}` (o mesmo dos resultados)
 *   public/geo/locais-areas/{uf}/cidades.json  { ibge: quantidade de áreas }
 *
 * Uso: node scripts/areas-locais.mjs --de caminho/saida_sigoli [--tol 0.00012] [--uf ac]
 */
import { mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { buildTopology, encodeTopo } from './lib/shp.mjs';

const argv = process.argv.slice(2);
const opt = (k, padrao) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : padrao; };
const ENTRADA = opt('de', 'saida_sigoli');
const SAIDA = 'public/geo/locais-areas';
const TOL = Number(opt('tol', 0.0002)); // ~22 m: arquivo leve, borda nítida na escala da cidade
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
for (const arq of readdirSync(ENTRADA).filter((n) => /^[A-Z]{2}\.json$/.test(n)).sort()) {
  const uf = arq.slice(0, 2).toLowerCase();
  if (SO_UF && uf !== SO_UF) continue;
  const { campos, f } = JSON.parse(readFileSync(join(ENTRADA, arq), 'utf8'));
  const c = Object.fromEntries(campos.map((n, i) => [n, i]));
  // cadastro dos locais (ponto de cada um), para encaixar os que o Atlas não desenhou
  const cad = JSON.parse(readFileSync(`public/geo/locais/${uf}.json`, 'utf8'));
  const ci = Object.fromEntries(cad.campos.map((n, i) => [n, i]));
  const locaisDaCidade = new Map();
  for (const l of cad.l) {
    const ib = String(l[ci.ibge]);
    if (!locaisDaCidade.has(ib)) locaisDaCidade.set(ib, []);
    locaisDaCidade.get(ib).push({ id: String(l[ci.id]), lon: l[ci.lon], lat: l[ci.lat] });
  }
  let encaixados = 0, semPonto = 0;

  // agrupa por cidade e junta áreas do mesmo local (vira MultiPolygon)
  const porCidade = new Map();
  for (const linha of f) {
    const ibge = String(linha[c.cd_mun]).padStart(7, '0');
    const tse = tseDe.get(ibge) ?? linha[c.cd_mun_tse];
    if (!tse) continue; // sem o código do TSE não há como casar com os resultados
    const id = `${pad5(tse)}-${inteiro(linha[c.zona])}-${inteiro(linha[c.local])}`;
    if (!porCidade.has(ibge)) porCidade.set(ibge, new Map());
    const locais = porCidade.get(ibge);
    if (!locais.has(id)) locais.set(id, []);
    locais.get(id).push(...linha[c.poligonos]);
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
    const inclui = new Map();
    const comArea = new Set(features.map((ft) => ft.id));
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
  totalKb += kbUf;
  console.log(`${uf}: ${porCidade.size} cidades, ${Object.values(indice).reduce((a, b) => a + b, 0)} locais com área, ${encaixados} encaixados em outra área, ${semPonto} sem ponto, ${(kbUf / 1024).toFixed(1)} MB`);
}
console.log(`\n${totalCidades} cidades, ${totalAreas} locais com área, ${(totalKb / 1024).toFixed(1)} MB`);
