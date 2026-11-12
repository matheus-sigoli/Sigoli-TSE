#!/usr/bin/env node
/**
 * Sigoli.TSE — resumo do Brasil (vencedor por município e eleitos por UF) para um cargo estadual de um ano do acervo.
 * Lê public/data/{ano}/{cargo}/{turno}/{uf}.json e grava public/data/{ano}/{cargo}/{turno}/br.json.
 * Uso: node scripts/resumo-br.mjs --ano 1982 --cargo governador [--turno 1]
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { montarResumoBrasil } from './lib/nucleo.mjs';

const argv = process.argv.slice(2);
const opt = (k, d) => (argv.includes(`--${k}`) ? argv[argv.indexOf(`--${k}`) + 1] : d);
const ano = opt('ano'), cargo = opt('cargo', 'governador');
for (const turno of opt('turno') ? [Number(opt('turno'))] : [1, 2]) {
  const dir = `public/data/${ano}/${cargo}/${turno}`;
  if (!existsSync(dir)) continue;
  const ufs = readdirSync(dir).filter((f) => /^[a-z]{2}\.json$/.test(f) && f !== 'br.json' && f !== 'zz.json');
  const arqs = ufs.map((f) => JSON.parse(readFileSync(`${dir}/${f}`, 'utf8')));
  const r = montarResumoBrasil({ slug: cargo, tipo: 'maj' }, turno, arqs);
  writeFileSync(`${dir}/br.json`, JSON.stringify(r));
  console.log(`${dir}/br.json: ${ufs.length} UFs, ${Object.keys(r.mun).length} municípios`);
}
