/**
 * Microrregiões e mesorregiões do IBGE (divisão de 1989/1990) → public/geo/regioes.json.
 *
 * Fonte: data/ibge/micro-meso-2022.csv, tirado da Divisão Territorial Brasileira de 2022
 * (RELATORIO_DTB_BRASIL_MUNICIPIO, a última edição que ainda traz micro e mesorregiões).
 * Boa Esperança do Norte (MT, 2025) entra na microrregião de Sorriso, de onde saiu.
 *
 * Saída: { regioes: { código: { tipo: 'micro' | 'meso', nome, uf, pai? } }, municipios: { ibge: código da micro } }
 * (a mesorregião do município é o `pai` da micro). Uso: node scripts/regioes.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const SIGLA = {
  11: 'ro', 12: 'ac', 13: 'am', 14: 'rr', 15: 'pa', 16: 'ap', 17: 'to', 21: 'ma', 22: 'pi', 23: 'ce', 24: 'rn', 25: 'pb',
  26: 'pe', 27: 'al', 28: 'se', 29: 'ba', 31: 'mg', 32: 'es', 33: 'rj', 35: 'sp', 41: 'pr', 42: 'sc', 43: 'rs', 50: 'ms',
  51: 'mt', 52: 'go', 53: 'df',
};

const linhas = readFileSync('data/ibge/micro-meso-2022.csv', 'utf8').trim().split(/\r?\n/).slice(1);
const regioes = {}, municipios = {};
for (const l of linhas) {
  // os nomes não têm vírgula; se um dia tiverem, virão entre aspas
  const [ibge, micro, nomeMicro, meso, nomeMeso] = l.match(/("[^"]*"|[^,]+)/g).map((x) => x.replace(/^"|"$/g, ''));
  const uf = SIGLA[ibge.slice(0, 2)];
  regioes[meso] ??= { tipo: 'meso', nome: nomeMeso, uf };
  regioes[micro] ??= { tipo: 'micro', nome: nomeMicro, uf, pai: meso };
  municipios[ibge] = micro;
}
writeFileSync('public/geo/regioes.json', JSON.stringify({ regioes, municipios }));
const n = (t) => Object.values(regioes).filter((r) => r.tipo === t).length;
console.log(`regioes.json: ${n('micro')} microrregiões, ${n('meso')} mesorregiões, ${Object.keys(municipios).length} municípios`);
