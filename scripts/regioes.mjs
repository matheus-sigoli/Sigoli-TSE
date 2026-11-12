/**
 * Regiões do IBGE dentro do estado → public/geo/regioes.json:
 *   microrregiões e mesorregiões (divisão de 1989/1990) e regiões geográficas imediatas e intermediárias (2017).
 *
 * Fonte: data/ibge/regioes-2022.csv, da Divisão Territorial Brasileira de 2022 (a última com as quatro divisões).
 * Boa Esperança do Norte (MT, 2025) entra nas regiões de Sorriso, de onde saiu.
 *
 * Códigos: micro (5 dígitos) e meso (4) como no IBGE; imediata e intermediária com prefixo (im350001, in3501), porque
 * o código da intermediária (4 dígitos) repete o de mesorregiões.
 * Saída: { regioes: { código: { tipo: 'micro' | 'meso' | 'imediata' | 'intermediaria', nome, uf, pai? } },
 *          municipios: { ibge: [micro, imediata] } }   (meso e intermediária são o `pai`)
 * Uso: node scripts/regioes.mjs
 */
import { readFileSync, writeFileSync } from 'node:fs';

const SIGLA = {
  11: 'ro', 12: 'ac', 13: 'am', 14: 'rr', 15: 'pa', 16: 'ap', 17: 'to', 21: 'ma', 22: 'pi', 23: 'ce', 24: 'rn', 25: 'pb',
  26: 'pe', 27: 'al', 28: 'se', 29: 'ba', 31: 'mg', 32: 'es', 33: 'rj', 35: 'sp', 41: 'pr', 42: 'sc', 43: 'rs', 50: 'ms',
  51: 'mt', 52: 'go', 53: 'df',
};

const linhas = readFileSync('data/ibge/regioes-2022.csv', 'utf8').trim().split(/\r?\n/).slice(1);
const regioes = {}, municipios = {};
for (const l of linhas) {
  // os nomes não têm vírgula; se um dia tiverem, virão entre aspas
  const [ibge, micro, nomeMicro, meso, nomeMeso, ime, nomeIme, int, nomeInt] = l.match(/("[^"]*"|[^,]+)/g).map((x) => x.replace(/^"|"$/g, ''));
  const uf = SIGLA[ibge.slice(0, 2)];
  regioes[meso] ??= { tipo: 'meso', nome: nomeMeso, uf };
  regioes[micro] ??= { tipo: 'micro', nome: nomeMicro, uf, pai: meso };
  regioes[`in${int}`] ??= { tipo: 'intermediaria', nome: nomeInt, uf };
  regioes[`im${ime}`] ??= { tipo: 'imediata', nome: nomeIme, uf, pai: `in${int}` };
  municipios[ibge] = [micro, `im${ime}`];
}
writeFileSync('public/geo/regioes.json', JSON.stringify({ regioes, municipios }));
const n = (t) => Object.values(regioes).filter((r) => r.tipo === t).length;
console.log(`regioes.json: ${n('micro')} micro, ${n('meso')} meso, ${n('imediata')} imediatas, ${n('intermediaria')} intermediárias, ${Object.keys(municipios).length} municípios`);
