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
 * Antes de 1989 o Tocantins era o norte de Goiás: a malha de GO do ano junta os municípios de GO e de TO.
 *
 * Uso: node scripts/malha-ano.mjs --ano 2022
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { feature, mergeArcs, meshArcs } from 'topojson-client';
import { topology } from 'topojson-server';
import { fusoesDoAno } from './lib/fusoes.mjs';

const argv = process.argv.slice(2);
const ANO = Number(argv[argv.indexOf('--ano') + 1]);
if (!argv.includes('--ano') || !ANO) throw new Error('uso: node scripts/malha-ano.mjs --ano 2022');

const fusoes = fusoesDoAno(ANO);
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
// GO com TO (antes de 1989): nova topologia com os municípios dos dois e o contorno de tudo
const GO_COM_TO = ANO < 1989;
if (GO_COM_TO) {
  const ler = (uf) => JSON.parse(readFileSync(`public/geo/uf/${uf}.json`, 'utf8'));
  const go = ler('go'), to = ler('to');
  const fc = { type: 'FeatureCollection', features: [...feature(go, go.objects.municipios).features, ...feature(to, to.objects.municipios).features] };
  const t = topology({ municipios: fc }, 1e5);
  t.objects.contorno = { type: 'GeometryCollection', geometries: [meshArcs(t, t.objects.municipios, (a, b) => a === b)] };
  mkdirSync(`public/geo/${ANO}/uf`, { recursive: true });
  writeFileSync(`public/geo/${ANO}/uf/go.json`, JSON.stringify(t));
}
const ufDaMalha = (uf) => (GO_COM_TO && uf === 'to' ? 'go' : uf);
for (const uf of new Set(fusoes.map((f) => ufDaMalha(f.uf)))) {
  const origem = GO_COM_TO && uf === 'go' ? `public/geo/${ANO}/uf/go.json` : `public/geo/uf/${uf}.json`;
  fundir(origem, `public/geo/${ANO}/uf/${uf}.json`, 'municipios');
}
if (GO_COM_TO && !trocados.includes('uf/go.json')) trocados.push('uf/go.json');
if (fusoes.length) fundir('public/geo/br.json', `public/geo/${ANO}/br.json`, 'municipios');
mkdirSync(`public/geo/${ANO}`, { recursive: true });
writeFileSync(`public/geo/${ANO}/malhas.json`, JSON.stringify(trocados));
console.log(`malhas de ${ANO}: ${trocados.length ? trocados.join(', ') : 'iguais às de 2025'}`);
