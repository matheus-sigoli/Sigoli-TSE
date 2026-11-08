#!/usr/bin/env node
/**
 * Sigoli.TSE — desenho das zonas de um ano sem locais de votação (1998) a partir do desenho de outro ano (2002).
 * As zonas do Brasil mudam pouco de um ano para o outro: usa as áreas de --de; as partes de municípios criados depois
 * de --ano passam para o município de origem (scripts/lib/fusoes.mjs). Zona que não existia em --de fica sem desenho
 * (o resultado da cidade soma todas as zonas do arquivo, ADR 0015).
 * Uso: node scripts/zonas-de-outro-ano.mjs --ano 1998 --de 2002
 */
import { existsSync, mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
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
    const dados = `public/data/${ANO}/governador/1/${nivel}/${uf}.json`;
    const ids = existsSync(dados) ? new Set(Object.keys(JSON.parse(readFileSync(dados, 'utf8')).mun)) : null;
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
