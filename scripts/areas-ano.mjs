#!/usr/bin/env node
/**
 * Sigoli.TSE — áreas dos locais de votação de outro ano a partir das áreas do Atlas Eleitoral 2026 (ADRs 0012 e 0015).
 *
 * O Atlas desenha a região de cada local de votação de 2026. Em 2022 os locais são quase os mesmos, mas alguns
 * mudaram de número, abriram ou fecharam. Para cada cidade:
 *   1. a área de 2026 vai para o local do ano com o mesmo código (município-zona-local) e o mesmo nome;
 *   2. se não houver, para o local do ano com o mesmo nome na cidade (renumerado);
 *   3. se não houver, para o local do ano cujo ponto está dentro da área (ou o mais próximo dela);
 *      várias áreas podem ir para o mesmo local (o site as junta numa só);
 *   4. local do ano que ficou sem área entra na área que contém o ponto dele (ou na mais próxima), em `inclui`.
 * Assim o território da cidade continua coberto e cada área tem o id do local do ano (o mesmo dos resultados).
 *
 * Entrada: public/geo/locais-areas/{uf}/ (2026), public/geo/locais/{uf}.json (2026), public/geo/{ano}/locais/{uf}.json
 * Saída:   public/geo/{ano}/locais-areas/{uf}.json — só a correspondência, sem repetir os desenhos do Atlas
 *          (o site lê as áreas de 2026 e troca os ids; ~5.600 arquivos a menos no ar):
 *          { [ibge]: { a: { [área 2026]: local do ano }, i: { [local do ano]: [locais do ano incluídos] }, d: [locais divididos] } }
 *          public/geo/{ano}/locais-areas/{uf}-div.json — quando dois ou mais locais do ano caem na mesma área de 2026, a área
 *          é repartida entre eles pelos pontos (Voronoi recortado pela área); `d` lista os locais cuja área vem desse arquivo
 *
 * Uso: node scripts/areas-ano.mjs --ano 2022 [--uf ac]
 */
import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { feature } from 'topojson-client';
import { topology } from 'topojson-server';
import { Delaunay } from 'd3-delaunay';
import polygonClipping from 'polygon-clipping';
import { normalizar } from './lib/texto.mjs';
import { fusoesDoAno } from './lib/fusoes.mjs';

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : null; };
const ANO = Number(opt('ano'));
if (!ANO || ANO === 2026) throw new Error('uso: node scripts/areas-ano.mjs --ano 2022');
const SO_UF = opt('uf');
const UFS = ['ac', 'al', 'am', 'ap', 'ba', 'ce', 'df', 'es', 'go', 'ma', 'mg', 'ms', 'mt', 'pa', 'pb', 'pe', 'pi', 'pr', 'rj', 'rn', 'ro', 'rr', 'rs', 'sc', 'se', 'sp', 'to'];

const lerLocais = (p) => {
  const { campos, l } = JSON.parse(readFileSync(p, 'utf8'));
  const c = Object.fromEntries(campos.map((n, i) => [n, i]));
  return l.map((r) => ({ id: String(r[c.id]), ibge: String(r[c.ibge]), nome: String(r[c.nome]), chave: normalizar(String(r[c.nome])), lon: r[c.lon], lat: r[c.lat] }));
};
function dentro(x, y, anel) {
  let d = false;
  for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
    const [xi, yi] = anel[i], [xj, yj] = anel[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) d = !d;
  }
  return d;
}
const poligonos = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates);
const contem = (polys, x, y) => polys.some((p) => dentro(x, y, p[0]) && !p.slice(1).some((h) => dentro(x, y, h)));
const centro = (polys) => {
  let sx = 0, sy = 0, n = 0;
  for (const [x, y] of polys[0][0]) { sx += x; sy += y; n++; }
  return [sx / n, sy / n];
};
const d2 = (a, b) => (a[0] - b[0]) ** 2 + (a[1] - b[1]) ** 2;

const tot = { areas: 0, codigo: 0, nome: 0, ponto: 0, inclui: 0, div: 0, cidades: 0 };
for (const uf of UFS) {
  if (SO_UF && uf !== SO_UF) continue;
  const dir26 = `public/geo/locais-areas/${uf}`;
  const p22 = `public/geo/${ANO}/locais/${uf}.json`;
  if (!existsSync(join(dir26, 'cidades.json')) || !existsSync(p22)) { console.warn(`${uf}: sem áreas de 2026 ou sem locais de ${ANO}`); continue; }
  const cidades = JSON.parse(readFileSync(join(dir26, 'cidades.json'), 'utf8'));
  const nomes26 = new Map(lerLocais(`public/geo/locais/${uf}.json`).map((l) => [l.id, l.chave]));
  const porCidade = new Map();
  for (const l of lerLocais(p22)) {
    if (!porCidade.has(l.ibge)) porCidade.set(l.ibge, []);
    porCidade.get(l.ibge).push(l);
  }
  const indice = {};
  const c = { areas: 0, codigo: 0, nome: 0, ponto: 0, inclui: 0, div: 0 };
  const divFeat = [];
  // município criado depois do ano: as áreas dele vão para a cidade de origem (o site lê os dois arquivos)
  const anexas = new Map();
  for (const f of fusoesDoAno(ANO).filter((x) => x.uf === uf && x.novo in cidades)) anexas.set(f.origem, [...(anexas.get(f.origem) ?? []), f.novo]);
  for (const ibge of Object.keys(cidades)) {
    const locais = porCidade.get(ibge) ?? [];
    if (!locais.length) continue;
    const feicoes = [ibge, ...(anexas.get(ibge) ?? [])].flatMap((cod) => {
      const topo = JSON.parse(readFileSync(join(dir26, `${cod}.json`), 'utf8'));
      return feature(topo, topo.objects.locais).features;
    });
    const areas = feicoes.map((f) => {
      const polys = poligonos(f.geometry);
      return { id: String(f.id), polys, centro: centro(polys) };
    });
    const porId = new Map(locais.map((l) => [l.id, l]));
    const porNome = new Map();
    for (const l of locais) if (!porNome.has(l.chave)) porNome.set(l.chave, l);
    const comPonto = locais.filter((l) => l.lon !== null && l.lat !== null);
    const a2l = {};
    const polysDe = new Map(); // local do ano → polígonos das áreas que recebeu
    for (const a of areas) {
      const nome26 = nomes26.get(a.id);
      const mesmo = porId.get(a.id);
      let l = null;
      if (mesmo && (!nome26 || mesmo.chave === nome26)) { l = mesmo; c.codigo++; }
      else if (nome26 && porNome.has(nome26)) { l = porNome.get(nome26); c.nome++; }
      else {
        l = comPonto.find((x) => contem(a.polys, x.lon, x.lat))
          ?? comPonto.reduce((m, x) => (!m || d2([x.lon, x.lat], a.centro) < d2([m.lon, m.lat], a.centro) ? x : m), null)
          ?? locais[0];
        c.ponto++;
      }
      a2l[a.id] = l.id;
      if (!polysDe.has(l.id)) polysDe.set(l.id, []);
      polysDe.get(l.id).push(...a.polys);
    }
    // locais do ano sem área: entram na área que contém o ponto (ou na mais próxima)
    const alvos = [...polysDe].map(([id, polys]) => ({ id, polys, centro: centro(polys) }));
    const inclui = {};
    for (const l of locais) {
      if (polysDe.has(l.id)) continue;
      let a = null;
      if (l.lon !== null && l.lat !== null) {
        a = alvos.find((x) => contem(x.polys, l.lon, l.lat)) ?? alvos.reduce((m, x) => (!m || d2(x.centro, [l.lon, l.lat]) < d2(m.centro, [l.lon, l.lat]) ? x : m), null);
      } else a = alvos[0];
      if (!a) continue;
      (inclui[a.id] ??= []).push(l.id);
      c.inclui++;
    }
    // área com mais de um local do ano: reparte pelos pontos (Voronoi dentro da área); quem não ganha pedaço segue incluído
    const divididos = [];
    for (const [alvoId, ids] of Object.entries(inclui)) {
      const membros = [porId.get(alvoId), ...ids.map((x) => porId.get(x))].filter((l) => l && l.lon !== null && l.lat !== null);
      const distintos = new Map();
      for (const l of membros) { const k = `${l.lon.toFixed(5)},${l.lat.toFixed(5)}`; if (!distintos.has(k)) distintos.set(k, l); }
      if (distintos.size < 2) continue;
      const pts = [...distintos.values()];
      const polys = polysDe.get(alvoId);
      let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
      for (const p of polys) for (const [x, y] of p[0]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
      for (const l of pts) { x0 = Math.min(x0, l.lon); y0 = Math.min(y0, l.lat); x1 = Math.max(x1, l.lon); y1 = Math.max(y1, l.lat); }
      const vor = Delaunay.from(pts.map((l) => [l.lon, l.lat])).voronoi([x0 - 0.01, y0 - 0.01, x1 + 0.01, y1 + 0.01]);
      const pedacos = [];
      try {
        const area = polygonClipping.union(...polys.map((p) => [p]));
        pts.forEach((l, k) => {
          const cel = vor.cellPolygon(k);
          if (!cel) return;
          const r = polygonClipping.intersection(area, [[cel]]);
          if (r.length) pedacos.push({ id: l.id, r });
        });
      } catch (e) { continue; }
      if (pedacos.length < 2) continue;
      for (const pc of pedacos) divFeat.push({ type: 'Feature', id: pc.id, properties: { id: pc.id, cidade: ibge }, geometry: { type: 'MultiPolygon', coordinates: pc.r } });
      const comPedaco = new Set(pedacos.map((pc) => pc.id));
      divididos.push(...comPedaco);
      const resto = ids.filter((x) => !comPedaco.has(x));
      if (resto.length) inclui[alvoId] = resto; else delete inclui[alvoId];
      c.div += comPedaco.size;
    }
    indice[ibge] = { a: a2l, ...(Object.keys(inclui).length ? { i: inclui } : {}), ...(anexas.has(ibge) ? { f: anexas.get(ibge) } : {}), ...(divididos.length ? { d: divididos } : {}) };
    c.areas += alvos.length;
  }
  mkdirSync(`public/geo/${ANO}/locais-areas`, { recursive: true });
  writeFileSync(`public/geo/${ANO}/locais-areas/${uf}.json`, JSON.stringify(indice));
  const pDiv = `public/geo/${ANO}/locais-areas/${uf}-div.json`;
  if (divFeat.length) writeFileSync(pDiv, JSON.stringify(topology({ locais: { type: 'FeatureCollection', features: divFeat } }, 1e5)));
  else if (existsSync(pDiv)) rmSync(pDiv);
  console.log(`${uf}: ${Object.keys(indice).length} cidades, ${c.areas} locais com área (código ${c.codigo}, nome ${c.nome}, ponto ${c.ponto}), ${c.inclui} locais incluídos em outra área, ${c.div} com a área repartida`);
  for (const k of Object.keys(c)) tot[k] += c[k];
  tot.cidades += Object.keys(indice).length;
}
console.log(`\n${tot.cidades} cidades, ${tot.areas} áreas; casadas por código ${tot.codigo}, por nome ${tot.nome}, por ponto ${tot.ponto}; ${tot.inclui} locais incluídos; ${tot.div} com a área repartida`);
