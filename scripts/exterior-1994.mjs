#!/usr/bin/env node
/**
 * Sigoli.TSE — Presidente 1994, exterior por país.
 *
 * O TSE não publica o exterior de 1994 nos dados abertos (votacao_candidato_munzona_1994 não tem a UF ZZ). Os votos
 * por país vêm do relatório do TSE "Eleições 1994 — Exterior" (totalização de 12/10/1994), transcritos em
 * data/exterior/1994/presidente-1t-paises.csv (66 países; conferidos com o total do relatório). Hong Kong pinta a
 * China no mapa; no agrupamento por continente vale o país (iso3).
 *
 * Saída: public/data/1994/presidente/1/zz.json; soma o exterior no total do Brasil (br.json, marcado com
 * `exteriorSomado`, para poder rodar de novo) e põe os países em public/data/1994/municipios.json.
 * Rodar depois de scripts/ano-tse.mjs --ano 1994 (que refaz br.json sem o exterior).
 * Uso: node scripts/exterior-1994.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const DIR = 'public/data/1994';
const [cab, ...linhas] = readFileSync('data/exterior/1994/presidente-1t-paises.csv', 'utf8').trim().split(/\r?\n/).map((l) => l.split(';'));
const paises = linhas.map((l) => Object.fromEntries(cab.map((k, i) => [k, l[i]])));
const codigo = (i) => `94${String(i + 1).padStart(3, '0')}`;

const br = JSON.parse(readFileSync(`${DIR}/presidente/1/br.json`, 'utf8'));
const nums = br.cands.map((c) => c.n);
const tZz = [0, 0, 0, 0, 0, 0], cZz = new Array(nums.length).fill(0), mun = {};
paises.forEach((p, i) => {
  const c = nums.map((n) => Number(p[`n${n}`] ?? 0));
  const v = c.reduce((s, x) => s + x, 0);
  const t = [Number(p.eleitorado), Number(p.comparecimento), Number(p.abstencao), v, Number(p.brancos), Number(p.nulos)];
  if (t[1] !== v + t[4] + t[5] || t[0] !== t[1] + t[2]) throw new Error(`exterior ${p.pais_livro}: conta não fecha`);
  mun[codigo(i)] = { t, c };
  t.forEach((x, k) => (tZz[k] += x));
  c.forEach((x, k) => (cZz[k] += x));
});
const { mun: _m, total: _t, pintam: _p, exteriorSomado: _e, ...base } = br;
writeFileSync(`${DIR}/presidente/1/zz.json`, JSON.stringify({ ...base, abr: 'zz', total: { t: tZz, c: cZz, p: [] }, mun }));

// total do Brasil com o exterior (tira o que já estava somado, se o script já rodou)
const antes = br.exteriorSomado ?? { t: [0, 0, 0, 0, 0, 0], c: nums.map(() => 0) };
br.total.t = br.total.t.map((x, k) => x - antes.t[k] + tZz[k]);
br.total.c = br.total.c.map((x, k) => x - (antes.c[k] ?? 0) + cZz[k]);
br.exteriorSomado = { t: tZz, c: cZz };
writeFileSync(`${DIR}/presidente/1/br.json`, JSON.stringify(br));

const lista = JSON.parse(readFileSync(`${DIR}/municipios.json`, 'utf8')).filter((m) => m.uf !== 'zz');
const unidades = paises.map((p, i) => ({ tse: codigo(i), ibge: '', nome: p.nome.toLocaleUpperCase('pt-BR'), uf: 'zz', pais: p.iso3, paisNum: p.iso_numerico, nomePais: p.pais_mapa }));
writeFileSync(`${DIR}/municipios.json`, JSON.stringify([...lista, ...unidades]));
console.log(`exterior 1994: ${paises.length} países · ${tZz[1]} votantes · ` + br.cands.slice(0, 3).map((c, i) => `${c.nome} ${cZz[i]}`).join(' | '));
