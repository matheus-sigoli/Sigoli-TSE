#!/usr/bin/env node
/**
 * Sigoli.TSE — Presidente 1989 por município (1º e 2º turno).
 *
 * O TSE só publica 1989 por UF (detalhe_votacao_uf / votacao_candidato_uf). O resultado por município vem do
 * Geografia do Voto (geografiadovoto.com), que montou a base a partir do IpeaData, corrigida com dados de TREs, da
 * Seade e das resoluções do TSE. Conferido com o TSE: no 1º turno os totais de cada UF batem; no 2º turno os votos
 * de cada candidato batem (os válidos do arquivo do TSE diferem em 7 UFs; aqui válidos = soma dos candidatos).
 * O voto no exterior não tem município e fica de fora, como em 1994.
 *
 * Entrada: data/geografiadovoto/1989/{resultado1989.1,resultado1989.2,cand1989}.json.gz
 * Saída:   public/data/1989/presidente/{1,2}/br.json, public/data/1989/municipios.json e meta.json
 * Depois:  node scripts/malha-ano.mjs --ano 1989 && node scripts/pintam.mjs --ano 1989
 * Uso:     node scripts/ano-1989.mjs
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const ENTRADA = 'data/geografiadovoto/1989';
const SAIDA = 'public/data/1989';
const ler = (n) => JSON.parse(gunzipSync(readFileSync(`${ENTRADA}/${n}.json.gz`)).toString('utf8'));
const cand = ler('cand1989');

// nome na urna e partido como no TSE (votacao_candidato_uf_1989): em 1989 Roberto Freire era do PCB (o PPS é de 1992)
const URNA = {
  14: 'AFFONSO CAMARGO', 22: 'AFIF', 25: 'AURELIANO CHAVES', 12: 'BRIZOLA', 33: 'CELSO BRANT', 20: 'COLLOR', 26: 'CORREA',
  56: 'ENEAS', 55: 'EUDES MATTAR', 43: 'GABEIRA', 27: 'LIVIA MARIA', 13: 'LULA', 11: 'MALUF', 57: 'MANOEL HORTA',
  45: 'MARIO COVAS', 42: 'MARRONZINHO', 16: 'PEDREIRA', 54: 'P.G.', 23: 'ROBERTO FREIRE', 51: 'RONALDO CAIADO',
  15: 'ULYSSES GUIMARAES', 31: 'ZAMIR',
};
const PARTIDO = { 23: 'PCB' };
const maiusc = (s) => String(s ?? '').toLocaleUpperCase('pt-BR');

mkdirSync(SAIDA, { recursive: true });
for (const turno of [1, 2]) {
  const res = ler(`resultado1989.${turno}`);
  // candidatos com voto no turno, do mais votado ao menos
  const soma = new Map();
  for (const m of Object.values(res)) for (const x of m.list_cand) soma.set(x.numero, (soma.get(x.numero) ?? 0) + x.votos);
  const nums = [...soma].filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).map(([n]) => n);
  const idx = new Map(nums.map((n, i) => [n, i]));
  const cands = nums.map((n, i) => {
    const c = cand[String(n)];
    const eleito = turno === 2 ? i === 0 : false;
    const situacao = turno === 2 ? (eleito ? 'Eleito' : 'Não eleito') : i < 2 ? '2º turno' : 'Não eleito';
    const comp = c.composicao_coligacao && c.composicao_coligacao !== c.partido ? c.composicao_coligacao : '';
    return {
      id: String(n), n: String(n), nome: URNA[n] ?? maiusc(c.nome_urna), partido: PARTIDO[n] ?? c.partido, eleito, situacao,
      vices: [{ tipo: 'v', nome: maiusc(c.nome_vice_completo), partido: c.partido_vice === 'PPS' ? 'PCB' : c.partido_vice }],
      ...(comp ? { col: maiusc(c.nome_coligacao), comp } : {}),
    };
  });
  const mun = {};
  const tTotal = [0, 0, 0, 0, 0, 0], cTotal = new Array(nums.length).fill(0);
  for (const [ibge, m] of Object.entries(res).sort(([a], [b]) => a.localeCompare(b))) {
    const c = new Array(nums.length).fill(0);
    for (const x of m.list_cand) if (idx.has(x.numero)) c[idx.get(x.numero)] += x.votos;
    const validos = c.reduce((s, v) => s + v, 0);
    if (validos !== m.validos) throw new Error(`${ibge}: válidos ${m.validos} ≠ soma dos candidatos ${validos}`);
    const t = [m.eleitorado, m.comparecimento, m.abstencao, validos, m.brancos, m.nulos];
    t.forEach((v, i) => (tTotal[i] += v));
    c.forEach((v, i) => (cTotal[i] += v));
    mun[ibge] = { t, c };
  }
  const arq = {
    v: 1, cargo: 'presidente', turno, abr: 'br', tipo: 'maj', vagas: 1,
    atualizado: turno === 1 ? '15/11/1989' : '17/12/1989',
    cands, partidos: [], total: { t: tTotal, c: cTotal, p: [] }, mun,
  };
  mkdirSync(`${SAIDA}/presidente/${turno}`, { recursive: true });
  writeFileSync(`${SAIDA}/presidente/${turno}/br.json`, JSON.stringify(arq));
  console.log(`presidente ${turno}º turno: ${Object.keys(mun).length} municípios · válidos ${tTotal[3]} · ` +
    cands.slice(0, 3).map((c, i) => `${c.nome} ${(100 * cTotal[i] / tTotal[3]).toFixed(2)}%`).join(' | '));
}
// mesma lista de municípios do site (os de 1989 têm todos código do IBGE de hoje)
writeFileSync(`${SAIDA}/municipios.json`, readFileSync('public/data/2026/municipios.json'));
writeFileSync(`${SAIDA}/meta.json`, JSON.stringify({
  geradoEm: new Date().toISOString(),
  fonte: 'Geografia do Voto (geografiadovoto.com/fontes), a partir do IpeaData com correções; totais por UF conferidos com o TSE (detalhe_votacao_uf_1989, votacao_candidato_uf_1989)',
}));
