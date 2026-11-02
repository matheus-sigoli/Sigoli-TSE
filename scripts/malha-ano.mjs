#!/usr/bin/env node
/**
 * Sigoli.TSE — malha municipal de um ano anterior (ADR 0015).
 *
 * A malha do site é a do IBGE 2025. Municípios criados depois de uma eleição não existiam nela: no mapa daquele
 * ano, a área volta para o município de origem. A fusão é feita na topologia (topojson mergeArcs): as bordas
 * compartilhadas somem e o resto do arquivo fica igual.
 *
 * Saída: public/geo/{ano}/uf/{uf}.json e public/geo/{ano}/br.json (só quando o ano tem fusões)
 *        e public/geo/{ano}/malhas.json (lista dos arquivos trocados, lida pelo site).
 *
 * Uso: node scripts/malha-ano.mjs --ano 2022
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { mergeArcs } from 'topojson-client';

const argv = process.argv.slice(2);
const ANO = Number(argv[argv.indexOf('--ano') + 1]);
if (!argv.includes('--ano') || !ANO) throw new Error('uso: node scripts/malha-ano.mjs --ano 2022');

/** município criado depois → município de origem (IBGE), por ano em que ainda não existia */
const FUSOES = [
  // Boa Esperança do Norte (MT) foi desmembrado de Nova Ubiratã; instalado em 2025, vota separado a partir de 2026
  { uf: 'mt', novo: '5101837', origem: '5106240', ateAno: 2025 },
];

const fusoes = FUSOES.filter((f) => ANO <= f.ateAno);
const trocados = [];
function fundir(caminho, destino, objeto) {
  const topo = JSON.parse(readFileSync(caminho, 'utf8'));
  const geoms = topo.objects[objeto].geometries;
  let mudou = false;
  for (const f of fusoes) {
    const a = geoms.find((g) => String(g.id) === f.origem);
    const b = geoms.find((g) => String(g.id) === f.novo);
    if (!a || !b) continue;
    const unido = mergeArcs(topo, [a, b]);
    Object.assign(a, { type: unido.type, arcs: unido.arcs });
    geoms.splice(geoms.indexOf(b), 1);
    mudou = true;
  }
  if (!mudou) return;
  mkdirSync(destino.replace(/\/[^/]+$/, ''), { recursive: true });
  writeFileSync(destino, JSON.stringify(topo));
  trocados.push(destino.replace(`public/geo/${ANO}/`, ''));
  console.log(`${destino}: ${fusoes.length} fusão(ões)`);
}
for (const uf of new Set(fusoes.map((f) => f.uf))) fundir(`public/geo/uf/${uf}.json`, `public/geo/${ANO}/uf/${uf}.json`, 'municipios');
if (fusoes.length) fundir('public/geo/br.json', `public/geo/${ANO}/br.json`, 'municipios');
mkdirSync(`public/geo/${ANO}`, { recursive: true });
writeFileSync(`public/geo/${ANO}/malhas.json`, JSON.stringify(trocados));
console.log(`malhas de ${ANO}: ${trocados.length ? trocados.join(', ') : 'iguais às de 2025'}`);
