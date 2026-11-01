#!/usr/bin/env node
/**
 * Sigoli.TSE — processa o cache do TSE (`.cache/tse/`) e gera os dados do site
 * em `public/data/2026/`. Rode depois de `coletar-tse.mjs`.
 *
 * Saída:
 *   municipios.json                       índice de municípios (TSE, IBGE, nome, UF, capital)
 *   {cargo}/{turno}/{uf}.json             resultado por UF, com todos os municípios
 *   presidente/{turno}/br.json            Presidente: Brasil inteiro, por município
 *   presidente/{turno}/zz.json            Presidente: exterior, por cidade
 *   {cargo}/{turno}/br.json               cargos estaduais: resumo nacional (vencedor por município + eleitos)
 *   meta.json                             o que foi gerado e quando
 *
 * Uso: node scripts/processar-tse.mjs [--saida public/data/2026]
 */
import { mkdir, readFile, writeFile, access } from 'node:fs/promises';
import { join } from 'node:path';
import {
  CARGOS, ELEICOES, BASE_TSE, codigoCargo, urlConfigMunicipios, urlResultado,
  normalizar, montarArquivo, montarResumoBrasil,
} from './lib/nucleo.mjs';

const CACHE = '.cache/tse';
const argv = process.argv.slice(2);
const SAIDA = argv[argv.indexOf('--saida') + 1] && argv.includes('--saida') ? argv[argv.indexOf('--saida') + 1] : 'public/data/2026';

const caminho = (url) => join(CACHE, url.replace(`${BASE_TSE}/`, ''));
const ler = async (url) => {
  try { await access(caminho(url)); } catch { return null; }
  return JSON.parse(await readFile(caminho(url), 'utf8'));
};
const gravar = async (rel, obj) => {
  const p = join(SAIDA, rel);
  await mkdir(join(p, '..'), { recursive: true });
  await writeFile(p, JSON.stringify(obj));
  return (JSON.stringify(obj).length / 1024).toFixed(0);
};

// ---- índice de municípios (Brasil + exterior com país)
const cfgFederal = await ler(urlConfigMunicipios(ELEICOES.federal[1]));
if (!cfgFederal) throw new Error('Cache vazio. Rode antes: node scripts/coletar-tse.mjs');
const paises = new Map(
  (await readFile('data/exterior/cidades-pais.csv', 'utf8'))
    .split(/\r?\n/).slice(1).filter(Boolean)
    .map((l) => l.split(';'))
    .map(([tse, , iso, pais, num]) => [tse, { iso, pais, num }]),
);
const municipios = cfgFederal.abr.flatMap((a) => a.mu.map((m) => {
  const base = { tse: m.cd, ibge: m.cdi, nome: m.nm, uf: a.cd, ...(m.c === 's' ? { capital: true } : {}) };
  if (a.cd !== 'zz') return base;
  const p = paises.get(m.cd);
  if (!p) throw new Error(`Cidade do exterior sem país em data/exterior/cidades-pais.csv: ${m.cd} ${m.nm}`);
  return { ...base, pais: p.iso, paisNum: p.num, nomePais: p.pais };
}));
await gravar('municipios.json', municipios);
console.log(`municipios.json  ${municipios.length} registros`);

const gerados = [];
for (const cargo of CARGOS) {
  for (const turno of cargo.turnos) {
    const eleicao = ELEICOES[cargo.eleicao][turno];
    const cfg = await ler(urlConfigMunicipios(eleicao));
    if (!cfg) continue;
    const porUf = [];
    for (const a of cfg.abr) {
      if (a.cd === 'zz' && cargo.slug !== 'presidente') continue;
      const cd = codigoCargo(cargo, a.cd);
      const rawTotal = await ler(urlResultado(eleicao, cd, a.cd));
      if (!rawTotal) { console.warn(`  sem total: ${cargo.slug} ${turno} ${a.cd}`); continue; }
      const regs = new Map();
      for (const m of a.mu) {
        const raw = await ler(urlResultado(eleicao, cd, a.cd, m.cd));
        if (raw) regs.set(a.cd === 'zz' ? m.cd : m.cdi, normalizar(raw));
      }
      if (regs.size < a.mu.length) console.warn(`  ${cargo.slug} ${turno} ${a.cd}: ${a.mu.length - regs.size} municípios faltando no cache`);
      const arq = montarArquivo(cargo, turno, a.cd, normalizar(rawTotal), regs);
      porUf.push({ uf: a.cd, arq, regs });
      if (cargo.slug !== 'presidente' || a.cd === 'zz') {
        const kb = await gravar(`${cargo.slug}/${turno}/${a.cd}.json`, arq);
        gerados.push(`${cargo.slug}/${turno}/${a.cd}`);
        console.log(`${cargo.slug}/${turno}/${a.cd}.json  ${regs.size} mun  ${kb} KB`);
      }
    }
    if (cargo.slug === 'presidente') {
      // arquivo nacional único, com todos os municípios do Brasil
      const rawBr = await ler(urlResultado(eleicao, cargo.cd, 'br'));
      const todos = new Map(porUf.filter((u) => u.uf !== 'zz').flatMap((u) => [...u.regs]));
      const arq = montarArquivo(cargo, turno, 'br', normalizar(rawBr), todos);
      const kb = await gravar(`${cargo.slug}/${turno}/br.json`, arq);
      gerados.push(`${cargo.slug}/${turno}/br`);
      console.log(`${cargo.slug}/${turno}/br.json  ${todos.size} mun  ${kb} KB`);
    } else if (porUf.length) {
      const resumo = montarResumoBrasil(cargo, turno, porUf.map((u) => u.arq));
      const kb = await gravar(`${cargo.slug}/${turno}/br.json`, resumo);
      gerados.push(`${cargo.slug}/${turno}/br`);
      console.log(`${cargo.slug}/${turno}/br.json (resumo)  ${kb} KB`);
    }
  }
}

await gravar('meta.json', { geradoEm: new Date().toISOString(), fonte: `${BASE_TSE}/ele2026`, arquivos: gerados });
console.log(`\n${gerados.length} arquivos de resultado em ${SAIDA}/`);
