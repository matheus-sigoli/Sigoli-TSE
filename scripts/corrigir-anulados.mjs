#!/usr/bin/env node
/**
 * Sigoli.TSE — corrige os arquivos já gerados em `public/data/2026/` sem recoletar os municípios.
 *
 * Lê só o arquivo de cada abrangência no TSE (UF, 'br', 'zz': ~170 requisições) e:
 *   - marca candidatos com votos não válidos (`anulado`, ex.: "Anulado sub judice");
 *   - acrescenta vice/suplentes e coligação;
 *   - nos proporcionais, tira os votos desses candidatos dos votos do partido em cada município
 *     e usa o total oficial do partido (que já exclui anulados);
 *   - refaz o resumo nacional dos cargos estaduais.
 *
 * Educado com o servidor: 2 requisições por vez e espera longa em HTTP 429.
 * Uso: node scripts/corrigir-anulados.mjs [--de oficiais.json]
 *   --de: usa um arquivo já baixado ({ "cargo/turno/abr": { candidatos, partidos } }),
 *         útil quando o TSE limita as requisições (HTTP 429) da máquina que processa.
 */
import { readFile, writeFile } from 'node:fs/promises';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import {
  CARGOS, ELEICOES, codigoCargo, urlConfigMunicipios, urlResultado, normalizar, montarResumoBrasil,
} from './lib/nucleo.mjs';

const DADOS = 'public/data/2026';
const iDe = process.argv.indexOf('--de');
const PRONTOS = iDe > 0 ? JSON.parse(await readFile(process.argv[iDe + 1], 'utf8')) : null;
const espera = (ms) => new Promise((r) => setTimeout(r, ms));

async function baixar(url) {
  for (let tentativa = 1; tentativa <= 10; tentativa++) {
    try {
      const r = await fetch(url, { headers: { 'user-agent': 'Sigoli.TSE (coleta de resultados públicos)' } });
      if (r.status === 404) return null;
      if (r.status === 429 || r.status >= 500) {
        const ra = Number(r.headers.get('retry-after')) || 10 * tentativa;
        console.warn(`  HTTP ${r.status}, esperando ${ra}s: ${url.split('/').pop()}`);
        await espera(ra * 1000);
        continue;
      }
      if (!r.ok) throw new Error(`HTTP ${r.status}`);
      return await r.json();
    } catch (e) {
      if (tentativa === 10) throw new Error(`falhou ${url}: ${e.message}`);
      await espera(2000 * tentativa);
    }
  }
  throw new Error(`desisti de ${url}`);
}

const lerJson = async (rel) => JSON.parse(await readFile(join(DADOS, rel), 'utf8'));
const gravar = (rel, obj) => writeFile(join(DADOS, rel), JSON.stringify(obj));

/** Aplica os dados oficiais da abrangência sobre um arquivo montado. */
function corrigir(arq, oficial) {
  const porId = new Map(oficial.candidatos.map((c) => [c.id, c]));
  const anulados = new Set();
  arq.cands.forEach((c, i) => {
    const o = porId.get(c.id);
    if (!o) return;
    delete c.anulado; delete c.vices; delete c.col; delete c.comp;
    if (o.vices?.length) c.vices = o.vices;
    if (o.anulado) { c.anulado = o.anulado; anulados.add(i); }
    if (o.col) { c.col = o.col; c.comp = o.comp; }
  });
  let mudados = 0;
  if (arq.tipo === 'prop' && anulados.size) {
    const idxP = new Map(arq.partidos.map((p, i) => [p.sg, i]));
    for (const reg of Object.values(arq.mun)) {
      for (let k = 0; k < reg.c.length; k += 2) {
        if (!anulados.has(reg.c[k])) continue;
        const ip = idxP.get(arq.cands[reg.c[k]].partido);
        if (ip !== undefined) { reg.p[ip] = Math.max(0, reg.p[ip] - reg.c[k + 1]); mudados++; }
      }
    }
    const oficialP = new Map(oficial.partidos.map((p) => [p.sg, p.votos]));
    arq.total.p = arq.partidos.map((p, i) => oficialP.get(p.sg) ?? arq.total.p[i]);
  }
  return { anulados: anulados.size, mudados };
}

const resumoAnulados = [];
for (const cargo of CARGOS) {
  for (const turno of cargo.turnos) {
    const eleicao = ELEICOES[cargo.eleicao][turno];
    let ufs;
    if (PRONTOS) {
      const pre = `${cargo.slug}/${turno}/`;
      ufs = Object.keys(PRONTOS).filter((k) => k.startsWith(pre)).map((k) => k.slice(pre.length)).filter((a) => a !== 'br');
    } else {
      const cfg = await baixar(urlConfigMunicipios(eleicao));
      if (!cfg) continue;
      ufs = cfg.abr.map((a) => a.cd).filter((u) => u !== 'zz' || cargo.slug === 'presidente');
    }
    const arquivosUf = [];
    // 2 por vez
    const fila = [...ufs];
    if (cargo.slug === 'presidente') fila.push('br');
    await Promise.all([0, 1].map(async () => {
      while (fila.length) {
        const abr = fila.shift();
        const rel = `${cargo.slug}/${turno}/${abr}.json`;
        if (!existsSync(join(DADOS, rel))) continue;
        let oficial;
        if (PRONTOS) oficial = PRONTOS[`${cargo.slug}/${turno}/${abr}`];
        else {
          const cd = abr === 'br' ? cargo.cd : codigoCargo(cargo, abr);
          const raw = await baixar(urlResultado(eleicao, cd, abr));
          oficial = raw && normalizar(raw);
        }
        if (!oficial) { console.warn(`  sem arquivo oficial: ${rel}`); continue; }
        const arq = await lerJson(rel);
        const r = corrigir(arq, oficial);
        await gravar(rel, arq);
        if (abr !== 'br' && abr !== 'zz') arquivosUf.push(arq);
        if (r.anulados) resumoAnulados.push(`${rel}: ${r.anulados} candidatos com votos anulados, ${r.mudados} ajustes`);
      }
    }));
    if (cargo.slug !== 'presidente' && arquivosUf.length) {
      arquivosUf.sort((a, b) => a.abr.localeCompare(b.abr));
      await gravar(`${cargo.slug}/${turno}/br.json`, montarResumoBrasil(cargo, turno, arquivosUf));
    }
    console.log(`${cargo.slug} ${turno}º turno: ${ufs.length} abrangências`);
  }
}
console.log(resumoAnulados.join('\n') || 'nenhum candidato com votos anulados');
