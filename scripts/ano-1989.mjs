#!/usr/bin/env node
/**
 * Sigoli.TSE — Presidente 1989 por município (1º e 2º turno).
 *
 * O TSE só publica 1989 por UF (detalhe_votacao_uf / votacao_candidato_uf). O resultado por município vem do
 * Geografia do Voto (geografiadovoto.com), que montou a base a partir do IpeaData, corrigida com dados de TREs, da
 * Seade e das resoluções do TSE. Conferido com o TSE: no 1º turno os totais de cada UF batem; no 2º turno os votos
 * de cada candidato batem (os válidos do arquivo do TSE diferem em 7 UFs; aqui válidos = soma dos candidatos).
 * Exterior: no 2º turno, por país, transcrito do livro do TSE "Eleições 89 — Turno II" (data/exterior/1989/
 * presidente-2t-paises.csv; soma igual ao total do TSE para o exterior); no 1º turno só o total do TSE
 * (data/exterior/1989/presidente-tse-zz.csv), que entra no total do Brasil sem mapa por país.
 *
 * Entrada: data/geografiadovoto/1989/{resultado1989.1,resultado1989.2,cand1989}.json.gz, data/exterior/1989/
 * Saída:   public/data/1989/presidente/{1,2}/br.json, presidente/2/zz.json, public/data/1989/municipios.json e meta.json
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

const csv = (p) => {
  const [cab, ...linhas] = readFileSync(p, 'utf8').trim().split(/\r?\n/).map((l) => l.split(';'));
  return linhas.map((l) => Object.fromEntries(cab.map((k, i) => [k, l[i]])));
};
const paises = csv('data/exterior/1989/presidente-2t-paises.csv');
const zzTse = csv('data/exterior/1989/presidente-tse-zz.csv');
// cada país do livro vira uma unidade do exterior (as duas Alemanhas pintam a Alemanha de hoje, a URSS a Rússia etc.)
const codigoPais = (p, i) => `89${String(i + 1).padStart(3, '0')}`;
const unidadesExterior = paises.map((p, i) => ({ tse: codigoPais(p, i), ibge: '', nome: p.nome.toLocaleUpperCase('pt-BR'), uf: 'zz', pais: p.iso3, paisNum: p.iso_numerico, nomePais: p.pais_mapa }));

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
  // exterior: soma no total do Brasil; no 2º turno também o arquivo por país (zz.json)
  const tZz = [0, 0, 0, 0, 0, 0], cZz = new Array(nums.length).fill(0);
  const munZz = {};
  if (turno === 2) {
    paises.forEach((p, i) => {
      const c = nums.map((n) => (n === 20 ? Number(p.collor) : n === 13 ? Number(p.lula) : 0));
      const v = c.reduce((s, x) => s + x, 0);
      const t = [Number(p.eleitorado), Number(p.comparecimento), Number(p.abstencao), v, Number(p.brancos), Number(p.nulos)];
      if (t[1] !== v + t[4] + t[5] || t[0] !== t[1] + t[2]) throw new Error(`exterior ${p.pais_livro}: conta não fecha`);
      munZz[codigoPais(p, i)] = { t, c };
      t.forEach((x, k) => (tZz[k] += x));
      c.forEach((x, k) => (cZz[k] += x));
    });
  } else {
    const linhas = zzTse.filter((l) => Number(l.turno) === turno);
    const l0 = linhas[0];
    for (const l of linhas) if (idx.has(Number(l.numero))) cZz[idx.get(Number(l.numero))] += Number(l.votos);
    tZz.splice(0, 6, Number(l0.aptos), Number(l0.comparecimento), Number(l0.abstencao), cZz.reduce((s, x) => s + x, 0), Number(l0.brancos), Number(l0.nulos));
  }
  // conferência com o total do TSE para o exterior
  for (const l of zzTse.filter((x) => Number(x.turno) === turno)) {
    if (idx.has(Number(l.numero)) && cZz[idx.get(Number(l.numero))] !== Number(l.votos)) throw new Error(`exterior ${turno}º turno, ${l.numero}: ${cZz[idx.get(Number(l.numero))]} ≠ TSE ${l.votos}`);
  }
  const base = { v: 1, cargo: 'presidente', turno, tipo: 'maj', vagas: 1, atualizado: turno === 1 ? '15/11/1989' : '17/12/1989', cands, partidos: [] };
  const arq = { ...base, abr: 'br', total: { t: tTotal.map((x, k) => x + tZz[k]), c: cTotal.map((x, k) => x + cZz[k]), p: [] }, mun };
  mkdirSync(`${SAIDA}/presidente/${turno}`, { recursive: true });
  writeFileSync(`${SAIDA}/presidente/${turno}/br.json`, JSON.stringify(arq));
  if (turno === 2) writeFileSync(`${SAIDA}/presidente/${turno}/zz.json`, JSON.stringify({ ...base, abr: 'zz', total: { t: tZz, c: cZz, p: [] }, mun: munZz }));
  console.log(`presidente ${turno}º turno: ${Object.keys(mun).length} municípios · válidos ${tTotal[3]} · ` +
    cands.slice(0, 3).map((c, i) => `${c.nome} ${arq.total.c[i]} (${(100 * arq.total.c[i] / arq.total.t[3]).toFixed(2)}%)`).join(' | ') + ` · exterior ${tZz[1]} votantes`);
}
// mesma lista de municípios do site (os de 1989 têm todos código do IBGE de hoje)
// mais os países do exterior de 1989 (no lugar das cidades do exterior de hoje)
const lista = JSON.parse(readFileSync('public/data/2026/municipios.json', 'utf8')).filter((m) => m.uf !== 'zz');
writeFileSync(`${SAIDA}/municipios.json`, JSON.stringify([...lista, ...unidadesExterior]));
writeFileSync(`${SAIDA}/meta.json`, JSON.stringify({
  geradoEm: new Date().toISOString(),
  fonte: 'Geografia do Voto (geografiadovoto.com/fontes), a partir do IpeaData com correções; totais por UF conferidos com o TSE (detalhe_votacao_uf_1989, votacao_candidato_uf_1989); exterior do 2º turno por país: livro do TSE Eleições 89, Turno II',
}));
