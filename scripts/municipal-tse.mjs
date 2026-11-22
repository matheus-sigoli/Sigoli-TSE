#!/usr/bin/env node
/**
 * Sigoli.TSE — eleições municipais (Prefeito e Vereador) a partir dos dados abertos do TSE.
 *
 * Fontes (Portal de Dados Abertos, como em scripts/ano-tse.mjs):
 *   - votacao_candidato_munzona_{ANO}.zip   votos de cada candidato por município e zona (+ situação, coligação)
 *   - votacao_partido_munzona_{ANO}.zip     nominais + legenda de cada partido (Vereador)
 *   - detalhe_votacao_munzona_{ANO}.zip     aptos, comparecimento, abstenção, válidos, brancos e nulos
 *   - consulta_cand_{ANO}.zip               vice-prefeitos
 *
 * Cada cidade tem a sua própria disputa. No arquivo da UF (nível município) os candidatos de todas as cidades ficam
 * numa lista só, cada um com o código IBGE da cidade (`mun`), e o arquivo é do tipo proporcional: o município pinta
 * com o partido mais votado (em Prefeito, o partido do prefeito mais votado). Na visão da cidade o site carrega o
 * arquivo da cidade (scripts/zonas-locais.mjs, modo municipal), com os candidatos só dela.
 *
 * Saída em public/data/{ANO}/:
 *   municipios.json
 *   prefeito/{t}/{uf}.json, vereador/1/{uf}.json   UF por município (Vereador: candidatos só os eleitos, para o arquivo
 *                                                  não ficar enorme; a cidade tem todos)
 *   prefeito/{t}/br.json, vereador/1/br.json       resumo do Brasil (partido mais votado por município e bancadas)
 *   segundo-turno.json                             cidades com 2º turno de Prefeito
 * e em .cache/municipal/{ANO}/{cargo}/{t}/{uf}.json o arquivo da UF com todos os candidatos (base do zonas-locais).
 *
 * Uso: node scripts/municipal-tse.mjs --ano 2024 [--baixar]
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CARGOS_MUNICIPAIS, ehEleito, montarArquivo, votoValido, vencedor } from './lib/nucleo.mjs';
import { CDN, baixar, lerCsvDoZip, num, pad5, texto } from './lib/dadosabertos.mjs';

const argv = process.argv.slice(2);
const ANO = Number(argv[argv.indexOf('--ano') + 1]);
if (!argv.includes('--ano') || !ANO || ANO % 4 !== 0) throw new Error('uso: node scripts/municipal-tse.mjs --ano 2024 [--baixar]');
const CACHE = '.cache/dadosabertos';
const SAIDA = `public/data/${ANO}`;
const BASE = `.cache/municipal/${ANO}`;
const ARQ = {
  cand: ['votacao_candidato_munzona', `votacao_candidato_munzona_${ANO}.zip`],
  part: ['votacao_partido_munzona', `votacao_partido_munzona_${ANO}.zip`],
  det: ['detalhe_votacao_munzona', `detalhe_votacao_munzona_${ANO}.zip`],
  cons: ['consulta_cand', `consulta_cand_${ANO}.zip`],
};
const zip = (k) => join(CACHE, ARQ[k][1]);
if (argv.includes('--baixar')) for (const k of Object.keys(ARQ)) await baixar(`${CDN}/${ARQ[k][0]}/${ARQ[k][1]}`, zip(k));

/** só a eleição ordinária de outubro (os arquivos trazem as suplementares do mandato) */
const ordinaria = (dt) => new RegExp(`^\\d{2}/10/${ANO}$`).test(String(dt).trim());
const porUf = (n) => /_[A-Z]{2}\.csv$/i.test(n) && !/_BR\.csv$/i.test(n);
const SLUG = { 11: 'prefeito', 13: 'vereador' };
const CARGO = Object.fromEntries(CARGOS_MUNICIPAIS.map((c) => [c.slug, c]));

const SITUACAO = {
  'ELEITO': 'Eleito', 'ELEITO POR QP': 'Eleito por QP', 'ELEITO POR MÉDIA': 'Eleito por média', 'ELEITO POR MEDIA': 'Eleito por média',
  '2º TURNO': '2º turno', 'NÃO ELEITO': 'Não eleito', 'NAO ELEITO': 'Não eleito', 'SUPLENTE': 'Suplente',
};
const situacao = (s) => SITUACAO[texto(s).toUpperCase()] ?? (texto(s) ? texto(s)[0] + texto(s).slice(1).toLowerCase() : '');

const mun2026 = JSON.parse(readFileSync('public/data/2026/municipios.json', 'utf8'));
const ibgeDe = new Map(mun2026.filter((m) => m.uf !== 'zz').map((m) => [m.tse, m.ibge]));
const naoMapeados = new Map();

// ------------------------------------------------------------------ acumuladores por cargo/turno/UF
const grupos = new Map();
function grupo(slug, turno, uf) {
  const k = `${slug}/${turno}/${uf}`;
  let g = grupos.get(k);
  if (!g) grupos.set(k, (g = { slug, turno, uf, cands: new Map(), partidos: new Map(), mun: new Map(), atualizado: '' }));
  return g;
}
function munDe(g, ibge) {
  let m = g.mun.get(ibge);
  if (!m) g.mun.set(ibge, (m = { t: [0, 0, 0, 0, 0, 0], c: new Map(), p: new Map() }));
  return m;
}

// 1) vice-prefeitos
const vices = new Map(); // `${ue}|${nr}` → [{tipo, nome, partido}]
const vistos = new Set();
await lerCsvDoZip(zip('cons'), porUf, (f, c) => {
  if (!ordinaria(f[c.DT_ELEICAO]) || num(f[c.CD_CARGO]) !== 12 || vistos.has(f[c.SQ_CANDIDATO])) return;
  vistos.add(f[c.SQ_CANDIDATO]);
  const k = `${pad5(f[c.SG_UE])}|${num(f[c.NR_CANDIDATO])}`;
  if (!vices.has(k)) vices.set(k, []);
  vices.get(k).push({ tipo: 'v', nome: texto(f[c.NM_URNA_CANDIDATO]) || texto(f[c.NM_CANDIDATO]), partido: texto(f[c.SG_PARTIDO]) });
});
console.log(`vice-prefeitos: ${vistos.size}`);

// 2) votos dos candidatos
await lerCsvDoZip(zip('cand'), porUf, (f, c) => {
  if (!ordinaria(f[c.DT_ELEICAO])) return;
  const cd = num(f[c.CD_CARGO]);
  const slug = SLUG[cd];
  if (!slug) return;
  const uf = f[c.SG_UF].toLowerCase();
  const tse = pad5(f[c.CD_MUNICIPIO]);
  const ibge = ibgeDe.get(tse);
  if (!ibge) return naoMapeados.set(`${uf}-${tse}`, f[c.NM_MUNICIPIO]);
  const turno = num(f[c.NR_TURNO]);
  const g = grupo(slug, turno, uf);
  g.atualizado ||= `${f[c.DT_GERACAO]} ${f[c.HH_GERACAO]}`;
  const id = f[c.SQ_CANDIDATO];
  let k = g.cands.get(id);
  if (!k) {
    const destino = texto(f[c.NM_TIPO_DESTINACAO_VOTOS]);
    const coligacao = /colig/i.test(f[c.TP_AGREMIACAO]);
    const nr = String(num(f[c.NR_CANDIDATO]));
    k = {
      id, n: nr, mun: ibge, tse,
      nome: texto(f[c.NM_URNA_CANDIDATO]) || texto(f[c.NM_CANDIDATO]),
      partido: texto(f[c.SG_PARTIDO]),
      situacao: situacao(f[c.DS_SIT_TOT_TURNO]),
      ...(destino && !votoValido(destino) ? { anulado: destino } : {}),
      vices: slug === 'prefeito' ? vices.get(`${tse}|${nr}`) ?? [] : [],
      col: coligacao ? texto(f[c.NM_COLIGACAO]) : '',
      comp: coligacao ? texto(f[c.DS_COMPOSICAO_COLIGACAO]) : '',
      votos: 0,
    };
    k.eleito = ehEleito(k.situacao);
    g.cands.set(id, k);
  }
  const v = Math.max(num(f[c.QT_VOTOS_NOMINAIS]), num(f[c.QT_VOTOS_NOMINAIS_VALIDOS]));
  k.votos += v;
  const m = munDe(g, ibge);
  m.c.set(id, (m.c.get(id) ?? 0) + v);
  // Prefeito: o partido soma os votos do candidato (o arquivo de partidos é para o Vereador)
  if (slug === 'prefeito' && !k.anulado) {
    let p = g.partidos.get(k.partido);
    if (!p) g.partidos.set(k.partido, (p = { sg: k.partido, n: String(num(f[c.NR_PARTIDO])), fed: texto(f[c.SG_FEDERACAO]), coligacao: '', votos: 0 }));
    p.votos += v;
    m.p.set(k.partido, (m.p.get(k.partido) ?? 0) + v);
  }
});
console.log(`candidatos lidos: ${[...grupos.values()].map((g) => `${g.slug}/${g.turno}/${g.uf} ${g.cands.size}`).join(', ')}`);

// 3) Vereador: votos dos partidos (legenda + nominais válidos)
await lerCsvDoZip(zip('part'), porUf, (f, c) => {
  if (!ordinaria(f[c.DT_ELEICAO]) || num(f[c.CD_CARGO]) !== 13) return;
  const uf = f[c.SG_UF].toLowerCase();
  const g = grupos.get(`vereador/${num(f[c.NR_TURNO])}/${uf}`);
  const ibge = ibgeDe.get(pad5(f[c.CD_MUNICIPIO]));
  if (!g || !ibge) return;
  const sg = texto(f[c.SG_PARTIDO]);
  let p = g.partidos.get(sg);
  if (!p) g.partidos.set(sg, (p = { sg, n: String(num(f[c.NR_PARTIDO])), fed: texto(f[c.SG_FEDERACAO]), coligacao: '', votos: 0 }));
  const v = (num(f[c.QT_TOTAL_VOTOS_LEG_VALIDOS]) + num(f[c.QT_VOTOS_NOMINAIS_VALIDOS])) || (num(f[c.QT_VOTOS_NOMINAIS]) + num(f[c.QT_VOTOS_LEGENDA]));
  p.votos += v;
  const m = munDe(g, ibge);
  m.p.set(sg, (m.p.get(sg) ?? 0) + v);
});

// 4) totais
await lerCsvDoZip(zip('det'), porUf, (f, c) => {
  if (!ordinaria(f[c.DT_ELEICAO])) return;
  const slug = SLUG[num(f[c.CD_CARGO])];
  if (!slug) return;
  const uf = f[c.SG_UF].toLowerCase();
  const g = grupos.get(`${slug}/${num(f[c.NR_TURNO])}/${uf}`);
  const ibge = ibgeDe.get(pad5(f[c.CD_MUNICIPIO]));
  if (!g || !ibge) return;
  const t = munDe(g, ibge).t;
  const nulos = num(f[c.QT_TOTAL_VOTOS_NULOS]) || num(f[c.QT_VOTOS_NULOS]);
  const leg = num(f[c.QT_TOTAL_VOTOS_LEG_VALIDOS]), tot = num(f[c.QT_TOTAL_VOTOS_VALIDOS]);
  t[0] += num(f[c.QT_APTOS]); t[1] += num(f[c.QT_COMPARECIMENTO]); t[2] += num(f[c.QT_ABSTENCOES]);
  t[3] += Math.max(tot, num(f[c.QT_VOTOS_NOMINAIS_VALIDOS]) + leg);
  t[4] += num(f[c.QT_VOTOS_BRANCOS]); t[5] += nulos;
});
if (naoMapeados.size) console.warn(`municípios sem código IBGE (fora dos mapas): ${[...naoMapeados].slice(0, 20).map(([k, n]) => `${k} ${n}`).join(', ')}`);

// ------------------------------------------------------------------ montagem
const gravarEm = (raiz, rel, obj) => {
  const p = join(raiz, rel);
  mkdirSync(join(p, '..'), { recursive: true });
  const txt = JSON.stringify(obj);
  writeFileSync(p, txt);
  return (txt.length / 1024).toFixed(0);
};
const PROP = { ...CARGO.vereador }; // o arquivo da UF é sempre por partido (cada cidade tem os seus candidatos)
function montar(g, soEleitos) {
  const cands = [...g.cands.values()].filter((k) => !soEleitos || k.eleito);
  const partidos = [...g.partidos.values()];
  const totais = (t) => ({ eleitorado: t[0], comparecimento: t[1], abstencao: t[2], validos: t[3], brancos: t[4], nulos: t[5] });
  const tTotal = [0, 0, 0, 0, 0, 0];
  const regs = new Map();
  for (const [ibge, m] of g.mun) {
    m.t.forEach((x, i) => (tTotal[i] += x));
    regs.set(ibge, {
      totais: totais(m.t),
      candidatos: cands.filter((k) => k.mun === ibge).map((k) => ({ id: k.id, votos: m.c.get(k.id) ?? 0 })),
      partidos: partidos.map((p) => ({ sg: p.sg, votos: m.p.get(p.sg) ?? 0 })),
    });
  }
  const arq = montarArquivo({ ...PROP, slug: g.slug }, g.turno, g.uf, {
    vagas: cands.filter((k) => k.eleito).length, atualizado: g.atualizado, totais: totais(tTotal), candidatos: cands, partidos,
  }, regs);
  // código IBGE (e TSE) da cidade de cada candidato
  const porId = new Map(cands.map((k) => [k.id, k]));
  arq.cands.forEach((c) => { const k = porId.get(c.id); c.mun = k.mun; c.tse = k.tse; });
  arq.municipal = true;
  return arq;
}

const segundoTurno = {};
for (const slug of ['prefeito', 'vereador']) for (const turno of [1, 2]) {
  const gs = [...grupos.values()].filter((g) => g.slug === slug && g.turno === turno).sort((a, b) => a.uf.localeCompare(b.uf));
  if (!gs.length) continue;
  const resumo = { v: 1, cargo: slug, turno, abr: 'br', tipo: 'prop', resumo: true, municipal: true, partidos: [], total: { t: [0, 0, 0, 0, 0, 0] }, eleitos: {}, bancadas: [], mun: {} };
  const idxL = new Map();
  const sigla = (sg) => { if (!idxL.has(sg)) { idxL.set(sg, resumo.partidos.length); resumo.partidos.push(sg); } return idxL.get(sg); };
  const bancadas = new Map();
  for (const g of gs) {
    const completo = montar(g, false);
    gravarEm(BASE, `${slug}/${turno}/${g.uf}.json`, completo);
    const arq = slug === 'vereador' ? montar(g, true) : completo;
    console.log(`${slug}/${turno}/${g.uf}.json  ${g.mun.size} mun, ${completo.cands.length} candidatos  ${gravarEm(SAIDA, `${slug}/${turno}/${g.uf}.json`, arq)} KB`);
    completo.total.t.forEach((x, i) => (resumo.total.t[i] += x));
    for (const c of completo.cands) if (c.eleito) bancadas.set(c.partido, (bancadas.get(c.partido) ?? 0) + 1);
    for (const [ibge, reg] of Object.entries(completo.mun)) {
      const w = vencedor(completo, reg);
      if (!w) continue;
      // Prefeito: o nome do mais votado da cidade
      const sg = completo.partidos[w.idx].sg;
      const nome = slug === 'prefeito' ? completo.cands.find((c) => c.mun === ibge && c.partido === sg)?.nome ?? '' : '';
      resumo.mun[ibge] = [sigla(sg), Math.round(w.pct * 1000), nome];
    }
    if (slug === 'prefeito' && turno === 2) segundoTurno[g.uf] = [...g.mun.keys()].sort();
  }
  resumo.bancadas = [...bancadas.entries()].sort((a, b) => b[1] - a[1]);
  gravarEm(SAIDA, `${slug}/${turno}/br.json`, resumo);
}
gravarEm(SAIDA, 'municipios.json', mun2026.filter((m) => m.uf !== 'zz'));
gravarEm(SAIDA, 'segundo-turno.json', segundoTurno);
gravarEm(SAIDA, 'meta.json', { geradoEm: new Date().toISOString(), fonte: `${CDN} (${Object.values(ARQ).map((a) => a[1]).join(', ')})` });
console.log(`2º turno de Prefeito: ${Object.values(segundoTurno).flat().length} cidades`);
