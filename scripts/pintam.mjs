#!/usr/bin/env node
/**
 * Sigoli.TSE — quem pinta o mapa (ADR 0014).
 *
 * As cores de um mapa só disputam entre quem vence pelo menos uma área em algum nível
 * (município, zona, zona da cidade, bairro ou local de votação). Este script grava no arquivo
 * do estado (ou do país) a lista desses concorrentes:
 *
 *   pintam: { c: [índices em cands], p: [índices em partidos] }
 *
 * Majoritário: vencedor por candidato (c). Proporcional: vencedor por partido (p) — é o que o mapa pinta.
 * Os arquivos dos níveis são casados pelo id do candidato / sigla do partido, não pela posição.
 *
 * Uso: node scripts/pintam.mjs [--ano 2022]   (depois de scripts/zonas-locais.mjs; idempotente)
 */
import { existsSync, readdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const argv = process.argv.slice(2);
const ANO = argv.includes('--ano') ? Number(argv[argv.indexOf('--ano') + 1]) : 2026;
const BASE = `public/data/${ANO}`;
const NIVEIS = ['zonas', 'zonas-cidade', 'bairros', 'locais'];

/** Índice do maior valor; -1 se tudo zero. Aceita vetor denso. */
function maior(v) {
  let b = -1, m = 0;
  for (let i = 0; i < v.length; i++) if (v[i] > m) { m = v[i]; b = i; }
  return b;
}

/** Vencedores (chaves) de um arquivo de resultados. */
function vencedores(arq, prop) {
  const out = new Set();
  const chave = prop ? (i) => arq.partidos[i]?.sg : (i) => arq.cands[i]?.id;
  for (const u of Object.values(arq.mun ?? {})) {
    const v = prop ? u.p : u.c;
    if (!v?.length) continue;
    const b = maior(v);
    if (b >= 0) out.add(chave(b));
  }
  return out;
}

let gravados = 0;
for (const cargo of readdirSync(BASE).filter((n) => existsSync(join(BASE, n, '1')))) {
  for (const turno of ['1', '2']) {
    const dir = join(BASE, cargo, turno);
    if (!existsSync(dir)) continue;
    for (const nome of readdirSync(dir).filter((n) => /^[a-z]{2}\.json$/.test(n))) {
      const caminho = join(dir, nome);
      const arq = JSON.parse(readFileSync(caminho, 'utf8'));
      if (!arq.cands || !arq.partidos || !arq.mun) continue; // resumo (governador do país) não tem mapa próprio
      const prop = arq.tipo !== 'maj';
      const pintam = vencedores(arq, prop);
      for (const n of NIVEIS) {
        const f = join(dir, n, nome);
        if (existsSync(f)) for (const k of vencedores(JSON.parse(readFileSync(f, 'utf8')), prop)) pintam.add(k);
      }
      const idx = prop
        ? arq.partidos.map((p, i) => (pintam.has(p.sg) ? i : -1)).filter((i) => i >= 0)
        : arq.cands.map((c, i) => (pintam.has(c.id) ? i : -1)).filter((i) => i >= 0);
      arq.pintam = prop ? { c: [], p: idx } : { c: idx, p: [] };
      writeFileSync(caminho, JSON.stringify(arq));
      gravados++;
    }
  }
}
console.log(`pintam: ${gravados} arquivos atualizados`);
