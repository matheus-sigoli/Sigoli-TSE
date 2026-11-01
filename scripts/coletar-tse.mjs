#!/usr/bin/env node
/**
 * Sigoli.TSE — coleta dos resultados oficiais do TSE (Eleições 2026).
 *
 * Baixa os arquivos `-u.json` de cada município/cargo/turno para `.cache/tse/`
 * (espelho fiel do servidor do TSE). Pode ser interrompido e retomado: arquivos
 * já baixados não são buscados de novo.
 *
 * Uso:
 *   node scripts/coletar-tse.mjs                       # tudo
 *   node scripts/coletar-tse.mjs --cargo presidente    # um cargo
 *   node scripts/coletar-tse.mjs --uf sp --uf rj       # só algumas UFs
 *   node scripts/coletar-tse.mjs --concorrencia 8
 *
 * Requer Node 18+ (fetch nativo). Sem dependências.
 */
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { CARGOS, ELEICOES, BASE_TSE, codigoCargo, urlConfigMunicipios, urlResultado } from './lib/nucleo.mjs';

const CACHE = '.cache/tse';
const argv = process.argv.slice(2);
const opt = (k) => argv.flatMap((a, i) => (a === `--${k}` ? [argv[i + 1]] : []));
const filtroCargo = opt('cargo');
const filtroUf = opt('uf').map((u) => u.toLowerCase());
const CONC = Number(opt('concorrencia')[0] ?? 12);

const caminho = (url) => join(CACHE, url.replace(`${BASE_TSE}/`, ''));
const existe = (p) => access(p).then(() => true, () => false);
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

let baixados = 0, emCache = 0, falhas = 0;

async function baixar(url) {
  const destino = caminho(url);
  if (await existe(destino)) { emCache++; return JSON.parse(await readFile(destino, 'utf8')); }
  for (let tentativa = 1; tentativa <= 5; tentativa++) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': 'Sigoli.TSE (coleta de resultados públicos)' } });
      if (r.status === 404) return null;
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      const texto = await r.text();
      const json = JSON.parse(texto); // valida antes de gravar
      await mkdir(dirname(destino), { recursive: true });
      await writeFile(destino, texto);
      baixados++;
      return json;
    } catch (e) {
      if (tentativa === 5) { falhas++; console.error(`\nfalhou: ${url} (${e.message})`); return null; }
      await espera(800 * tentativa ** 2);
    }
  }
}

async function emLotes(itens, fn) {
  let i = 0;
  const total = itens.length;
  const t0 = Date.now();
  await Promise.all(Array.from({ length: CONC }, async () => {
    while (i < total) {
      const k = i++;
      await fn(itens[k]);
      if (k % 50 === 0) {
        const s = ((Date.now() - t0) / 1000).toFixed(0);
        process.stdout.write(`\r  ${k + 1}/${total}  (${baixados} novos, ${emCache} em cache, ${falhas} falhas, ${s}s)   `);
      }
    }
  }));
  process.stdout.write('\n');
}

const cargos = CARGOS.filter((c) => !filtroCargo.length || filtroCargo.includes(c.slug));
for (const cargo of cargos) {
  for (const turno of cargo.turnos) {
    const eleicao = ELEICOES[cargo.eleicao][turno];
    const cfg = await baixar(urlConfigMunicipios(eleicao));
    if (!cfg) { console.warn(`sem configuração para ${cargo.slug} ${turno}º turno`); continue; }
    const abrs = cfg.abr.filter((a) => (cargo.slug === 'presidente' || a.cd !== 'zz') && (!filtroUf.length || filtroUf.includes(a.cd)));
    const urls = [];
    if (cargo.slug === 'presidente') urls.push(urlResultado(eleicao, cargo.cd, 'br'));
    for (const a of abrs) {
      urls.push(urlResultado(eleicao, codigoCargo(cargo, a.cd), a.cd));
      for (const m of a.mu) urls.push(urlResultado(eleicao, codigoCargo(cargo, a.cd), a.cd, m.cd));
    }
    console.log(`${cargo.nome} — ${turno}º turno: ${urls.length} arquivos`);
    await emLotes(urls, baixar);
  }
}
console.log(`\nConcluído: ${baixados} baixados, ${emCache} já em cache, ${falhas} falhas.`);
if (falhas) { console.log('Rode de novo para tentar os que falharam.'); process.exitCode = 1; }
