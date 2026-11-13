#!/usr/bin/env node
/**
 * Sigoli.TSE — desenho das zonas de um ano sem locais de votação (1998) a partir do desenho de outro ano (2002).
 * As zonas do Brasil mudam pouco de um ano para o outro: usa as áreas de --de; as partes de municípios criados depois
 * de --ano passam para o município de origem (scripts/lib/fusoes.mjs). Zona que não existia em --de fica sem desenho
 * (o resultado da cidade soma todas as zonas do arquivo, ADR 0015).
 * Uso: node scripts/zonas-de-outro-ano.mjs --ano 1998 --de 2002  (1994: --ano 1994 --de 1998)
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import polygonClipping from 'polygon-clipping';
import { topology } from 'topojson-server';
import { feature } from 'topojson-client';
import { fusoesDoAno } from './lib/fusoes.mjs';

const argv = process.argv.slice(2);
const opt = (k) => { const i = argv.indexOf(`--${k}`); return i >= 0 ? argv[i + 1] : null; };
const ANO = Number(opt('ano')), DE = Number(opt('de'));
const origem = new Map(fusoesDoAno(ANO).map((f) => [f.novo, f.origem]));
for (const nivel of ['zonas', 'zonas-cidade']) {
  mkdirSync(`public/geo/${ANO}/${nivel}`, { recursive: true });
  for (const arq of readdirSync(`public/geo/${DE}/${nivel}`).filter((n) => n.endsWith('.json'))) {
    const uf = arq.slice(0, 2);
    const topo = JSON.parse(readFileSync(`public/geo/${DE}/${nivel}/${arq}`, 'utf8'));
    // zonas que existiam no ano: as do Governador; em 1994 só há zona no Presidente (votação por seção, 17 UFs)
    const dados = [`public/data/${ANO}/governador/1/${nivel}/${uf}.json`, `public/data/${ANO}/presidente/1/${nivel}/${uf}.json`].find(existsSync);
    if (!dados && ANO < 1998) continue; // sem dado de zona nesta UF: sem desenho
    const ids = dados ? new Set(Object.keys(JSON.parse(readFileSync(dados, 'utf8')).mun)) : null;
    let semDado = 0;
    for (const obj of Object.values(topo.objects)) {
      const porId = new Map();
      for (const g of obj.geometries) {
        if (nivel === 'zonas-cidade') {
          const ib = origem.get(String(g.properties?.ibge)) ?? String(g.properties?.ibge);
          const id = `${ib}-${g.properties.zona}`;
          g.id = id; g.properties = { ...g.properties, id, ibge: ib };
        }
        if (ids && !ids.has(String(g.id))) { semDado++; continue; } // zona que não existia no ano
        const x = porId.get(String(g.id));
        if (!x) { porId.set(String(g.id), g); continue; }
        // mesma zona em dois pedaços (cidade criada depois): um MultiPolygon só
        const polys = (h) => (h.type === 'Polygon' ? [h.arcs] : h.arcs);
        x.arcs = [...polys(x), ...polys(g)]; x.type = 'MultiPolygon';
      }
      obj.geometries = [...porId.values()];
    }
    writeFileSync(`public/geo/${ANO}/${nivel}/${arq}`, JSON.stringify(topo));
    console.log(`${nivel}/${uf}: ${Object.values(topo.objects)[0].geometries.length} áreas${semDado ? `, ${semDado} de ${DE} sem zona em ${ANO}` : ''}`);
  }
}

// UF com as zonas do ano desenhadas à mão (data/zonas/{uf}-{ano}.geojson, ex.: DF 1998): usa o desenho, recortado
// pelas cidades da malha do ano, no lugar das zonas copiadas
for (const arq of readdirSync('data/zonas').filter((n) => n.endsWith(`-${ANO}.geojson`))) {
  const uf = arq.slice(0, 2);
  const fc = JSON.parse(readFileSync(`data/zonas/${arq}`, 'utf8'));
  const pMalha = existsSync(`public/geo/${ANO}/uf/${uf}.json`) ? `public/geo/${ANO}/uf/${uf}.json` : `public/geo/uf/${uf}.json`;
  const topoUf = JSON.parse(readFileSync(pMalha, 'utf8'));
  const muni = feature(topoUf, topoUf.objects.municipios).features;
  const cidade = [], zonas = [];
  for (const z of fc.features) {
    const partes = [];
    for (const m of muni) {
      const gm = m.geometry.type === 'Polygon' ? [m.geometry.coordinates] : m.geometry.coordinates;
      let r = polygonClipping.intersection(z.geometry.coordinates, gm);
      if (!r.length) continue;
      try { r = polygonClipping.union(r); } catch { /* como está */ }
      const k = `${m.id}-${z.id}`;
      cidade.push({ type: 'Feature', id: k, properties: { id: k, ibge: String(m.id), zona: String(z.id) }, geometry: { type: 'MultiPolygon', coordinates: r } });
      partes.push(r);
    }
    if (!partes.length) continue;
    let g; try { g = polygonClipping.union(...partes); } catch { g = partes.flat(); }
    zonas.push({ type: 'Feature', id: String(z.id), properties: { id: String(z.id), zona: String(z.id) }, geometry: { type: 'MultiPolygon', coordinates: g } });
  }
  for (const [nivel, feats] of [['zonas', zonas], ['zonas-cidade', cidade]]) {
    const t = topology({ zonas: { type: 'FeatureCollection', features: feats } }, 1e5);
    t.bbox = topoUf.bbox;
    writeFileSync(`public/geo/${ANO}/${nivel}/${uf}.json`, JSON.stringify(t));
  }
  console.log(`${uf}: zonas de ${ANO} pelo desenho ${arq} (${zonas.length} zonas)`);
}
