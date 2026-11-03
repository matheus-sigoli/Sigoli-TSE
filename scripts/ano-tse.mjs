#!/usr/bin/env node
/**
 * Sigoli.TSE — resultados por município de uma eleição anterior, a partir dos dados abertos do TSE (ADR 0015).
 *
 * Para 2026 os resultados vieram da API de divulgação (scripts/coletar-tse.mjs + processar-tse.mjs). A API dos anos
 * anteriores saiu do ar; os mesmos números estão nos arquivos oficiais de totalização do Portal de Dados Abertos:
 *   - votacao_candidato_munzona_{ANO}.zip   votos de cada candidato por município e zona (+ situação, coligação)
 *   - votacao_partido_munzona_{ANO}.zip     votos de legenda e nominais válidos de cada partido
 *   - detalhe_votacao_munzona_{ANO}.zip     aptos, comparecimento, abstenção, válidos, brancos e nulos
 *   - consulta_cand_{ANO}.zip               vices e suplentes (não aparecem na votação)
 * Lê os arquivos por UF (BR = Presidente, com o exterior em SG_UF "ZZ"); o _BRASIL repete tudo e fica de fora.
 *
 * Saída em public/data/{ANO}/, no mesmo formato de 2026 (ADR 0007, scripts/lib/nucleo.mjs):
 *   municipios.json, {cargo}/{turno}/{uf}.json, presidente/{turno}/br.json e zz.json, {cargo}/{turno}/br.json (resumo)
 *
 * Uso: node scripts/ano-tse.mjs --ano 2022 [--baixar]
 */
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { CARGOS, ehEleito, montarArquivo, montarResumoBrasil, votoValido } from './lib/nucleo.mjs';
import { CDN, baixar, lerCsvDoZip, num, pad5, texto } from './lib/dadosabertos.mjs';

const argv = process.argv.slice(2);
const ANO = Number(argv[argv.indexOf('--ano') + 1]);
if (!argv.includes('--ano') || !ANO || ANO === 2026) throw new Error('uso: node scripts/ano-tse.mjs --ano 2022 [--baixar]');
const CACHE = '.cache/dadosabertos';
const SAIDA = `public/data/${ANO}`;
const ARQ = {
  cand: ['votacao_candidato_munzona', `votacao_candidato_munzona_${ANO}.zip`],
  part: ['votacao_partido_munzona', `votacao_partido_munzona_${ANO}.zip`],
  det: ['detalhe_votacao_munzona', `detalhe_votacao_munzona_${ANO}.zip`],
  cons: ['consulta_cand', `consulta_cand_${ANO}.zip`],
};
const zip = (k) => join(CACHE, ARQ[k][1]);
if (argv.includes('--baixar')) for (const k of Object.keys(ARQ)) await baixar(`${CDN}/${ARQ[k][0]}/${ARQ[k][1]}`, zip(k));

/**
 * Só a eleição geral de outubro do ano. Os arquivos de um ano trazem também as eleições suplementares do mesmo
 * mandato (ex.: no de 2014, governador do AM em 2017 e do TO em 2018; no de 2018, senador do MT em 2020).
 */
const ordinaria = (dt) => new RegExp(`^\\d{2}/10/${ANO}$`).test(String(dt).trim());

/** entradas por UF (e BR); o _BRASIL repete tudo */
const porUf = (n) => /_[A-Z]{2}\.csv$/i.test(n);

// código TSE do cargo → slug (8 = deputado distrital, no DF)
const SLUG = { 1: 'presidente', 3: 'governador', 5: 'senador', 6: 'deputado-federal', 7: 'deputado-estadual', 8: 'deputado-estadual' };
const CARGO = Object.fromEntries(CARGOS.map((c) => [c.slug, c]));

const SITUACAO = {
  'ELEITO': 'Eleito', 'ELEITO POR QP': 'Eleito por QP', 'ELEITO POR MÉDIA': 'Eleito por média', 'ELEITO POR MEDIA': 'Eleito por média',
  '2º TURNO': '2º turno', 'NÃO ELEITO': 'Não eleito', 'NAO ELEITO': 'Não eleito', 'SUPLENTE': 'Suplente',
  // 2010: eleito pela média aparece só como "MÉDIA"
  'MÉDIA': 'Eleito por média', 'MEDIA': 'Eleito por média',
};
const situacao = (s) => SITUACAO[texto(s).toUpperCase()] ?? (texto(s) ? texto(s)[0] + texto(s).slice(1).toLowerCase() : '');

// ------------------------------------------------------------------ municípios (IBGE) e exterior (país)
const mun2026 = JSON.parse(readFileSync('public/data/2026/municipios.json', 'utf8'));
const ibgeDe = new Map(mun2026.filter((m) => m.uf !== 'zz').map((m) => [m.tse, m.ibge]));
const paises = new Map(readFileSync('data/exterior/cidades-pais.csv', 'utf8').split(/\r?\n/).slice(1).filter(Boolean)
  .map((l) => l.split(';')).map(([tse, , iso, pais, n]) => [pad5(tse), { pais: iso, paisNum: n, nomePais: pais }]));
const cidadesExterior = new Map();
/**
 * Chave do município nos arquivos: IBGE no Brasil, código TSE no exterior. Voto em trânsito (2010: urnas nas
 * capitais, SG_UF "VT"): conta no total nacional de Presidente, mas não tem lugar no mapa.
 */
const chaveMun = (uf, cdTse, nome) => {
  const tse = pad5(cdTse);
  if (uf === 'vt') return `vt${tse}`;
  if (uf !== 'zz') return ibgeDe.get(tse) ?? null;
  if (!cidadesExterior.has(tse)) cidadesExterior.set(tse, nome);
  return tse;
};

// ------------------------------------------------------------------ acumuladores por cargo/turno/UF
const grupos = new Map(); // `${slug}/${turno}/${uf}` → grupo
function grupo(slug, turno, uf) {
  const k = `${slug}/${turno}/${uf}`;
  let g = grupos.get(k);
  if (!g) {
    g = { slug, turno, uf, cands: new Map(), partidos: new Map(), mun: new Map(), atualizado: '' };
    grupos.set(k, g);
  }
  return g;
}
function munDe(g, chave) {
  let m = g.mun.get(chave);
  if (!m) { m = { t: [0, 0, 0, 0, 0, 0], c: new Map(), p: new Map() }; g.mun.set(chave, m); }
  return m;
}
const naoMapeados = new Map();
const avisar = (uf, cd, nome) => naoMapeados.set(`${uf}-${pad5(cd)}`, nome);

// 1) vices e suplentes
const vices = new Map(); // `${ue}|${cargoTitular}|${numero}` → [{tipo, nome, partido}]
const vistosVice = new Set();
const TITULAR = { 2: [1, 'v'], 4: [3, 'v'], 9: [5, 's1'], 10: [5, 's2'] };
await lerCsvDoZip(zip('cons'), porUf, (f, c) => {
  if (!ordinaria(f[c.DT_ELEICAO])) return;
  const t = TITULAR[num(f[c.CD_CARGO])];
  if (!t || vistosVice.has(f[c.SQ_CANDIDATO])) return;
  vistosVice.add(f[c.SQ_CANDIDATO]);
  const k = `${f[c.SG_UE]}|${t[0]}|${num(f[c.NR_CANDIDATO])}`;
  if (!vices.has(k)) vices.set(k, []);
  vices.get(k).push({ tipo: t[1], nome: texto(f[c.NM_URNA_CANDIDATO]) || texto(f[c.NM_CANDIDATO]), partido: texto(f[c.SG_PARTIDO]) });
});
for (const l of vices.values()) l.sort((a, b) => a.tipo.localeCompare(b.tipo));
console.log(`vices e suplentes: ${vistosVice.size}`);

// 2) votos dos candidatos
await lerCsvDoZip(zip('cand'), porUf, (f, c) => {
  if (!ordinaria(f[c.DT_ELEICAO])) return;
  const cd = num(f[c.CD_CARGO]);
  const slug = SLUG[cd];
  if (!slug) return;
  const uf = f[c.SG_UF].toLowerCase();
  const turno = num(f[c.NR_TURNO]);
  const chave = chaveMun(uf, f[c.CD_MUNICIPIO], f[c.NM_MUNICIPIO]);
  if (!chave) return avisar(uf, f[c.CD_MUNICIPIO], f[c.NM_MUNICIPIO]);
  const g = grupo(slug, turno, uf);
  g.atualizado ||= `${f[c.DT_GERACAO]} ${f[c.HH_GERACAO]}`;
  const id = f[c.SQ_CANDIDATO];
  let k = g.cands.get(id);
  if (!k) {
    const destino = texto(f[c.NM_TIPO_DESTINACAO_VOTOS]);
    const coligacao = /colig/i.test(f[c.TP_AGREMIACAO]);
    const nr = String(num(f[c.NR_CANDIDATO]));
    k = {
      id, n: nr,
      nome: texto(f[c.NM_URNA_CANDIDATO]) || texto(f[c.NM_CANDIDATO]),
      partido: texto(f[c.SG_PARTIDO]),
      situacao: situacao(f[c.DS_SIT_TOT_TURNO]),
      ...(destino && !votoValido(destino) ? { anulado: destino } : {}),
      vices: vices.get(`${f[c.SG_UE]}|${cd === 8 ? 8 : cd}|${nr}`) ?? [],
      col: coligacao ? texto(f[c.NM_COLIGACAO]) : '',
      comp: coligacao ? texto(f[c.DS_COMPOSICAO_COLIGACAO]) : '',
      votos: 0,
    };
    k.eleito = ehEleito(k.situacao);
    g.cands.set(id, k);
  }
  const v = num(f[c.QT_VOTOS_NOMINAIS]);
  k.votos += v;
  const m = munDe(g, chave);
  m.c.set(id, (m.c.get(id) ?? 0) + v);
});
console.log(`candidatos lidos: ${grupos.size} cargos/turnos/UFs`);

// 3) votos dos partidos (legenda + nominais válidos)
await lerCsvDoZip(zip('part'), porUf, (f, c) => {
  if (!ordinaria(f[c.DT_ELEICAO])) return;
  const slug = SLUG[num(f[c.CD_CARGO])];
  if (!slug) return;
  const uf = f[c.SG_UF].toLowerCase();
  const g = grupos.get(`${slug}/${num(f[c.NR_TURNO])}/${uf}`);
  if (!g) return;
  const chave = chaveMun(uf, f[c.CD_MUNICIPIO], f[c.NM_MUNICIPIO]);
  if (!chave) return;
  const sg = texto(f[c.SG_PARTIDO]);
  let p = g.partidos.get(sg);
  if (!p) {
    p = { sg, n: String(num(f[c.NR_PARTIDO])), fed: texto(f[c.SG_FEDERACAO]), coligacao: /colig/i.test(f[c.TP_AGREMIACAO]) ? texto(f[c.NM_COLIGACAO]) : '', votos: 0 };
    g.partidos.set(sg, p);
  }
  const v = num(f[c.QT_TOTAL_VOTOS_LEG_VALIDOS]) + num(f[c.QT_VOTOS_NOMINAIS_VALIDOS]);
  p.votos += v;
  const m = munDe(g, chave);
  m.p.set(sg, (m.p.get(sg) ?? 0) + v);
});

// 4) totais: [aptos, comparecimento, abstenção, válidos, brancos, nulos]
await lerCsvDoZip(zip('det'), porUf, (f, c) => {
  if (!ordinaria(f[c.DT_ELEICAO])) return;
  const slug = SLUG[num(f[c.CD_CARGO])];
  if (!slug) return;
  const uf = f[c.SG_UF].toLowerCase();
  const g = grupos.get(`${slug}/${num(f[c.NR_TURNO])}/${uf}`);
  if (!g) return;
  const chave = chaveMun(uf, f[c.CD_MUNICIPIO], f[c.NM_MUNICIPIO]);
  if (!chave) return;
  const t = munDe(g, chave).t;
  t[0] += num(f[c.QT_APTOS]); t[1] += num(f[c.QT_COMPARECIMENTO]); t[2] += num(f[c.QT_ABSTENCOES]);
  t[3] += num(f[c.QT_TOTAL_VOTOS_VALIDOS]); t[4] += num(f[c.QT_VOTOS_BRANCOS]); t[5] += num(f[c.QT_TOTAL_VOTOS_NULOS]);
});
if (naoMapeados.size) console.warn(`municípios sem código IBGE (fora dos mapas): ${[...naoMapeados].slice(0, 20).map(([k, n]) => `${k} ${n}`).join(', ')}`);

// ------------------------------------------------------------------ montagem (mesmo formato de 2026)
/** grupo → { total, regs } no formato de normalizar() (scripts/lib/nucleo.mjs) */
function normalizado(g) {
  const prop = CARGO[g.slug].tipo === 'prop';
  const cands = [...g.cands.values()];
  const partidos = [...g.partidos.values()];
  const totais = (t) => ({ eleitorado: t[0], comparecimento: t[1], abstencao: t[2], validos: t[3], brancos: t[4], nulos: t[5] });
  const tTotal = [0, 0, 0, 0, 0, 0];
  const regs = new Map();
  for (const [chave, m] of g.mun) {
    m.t.forEach((x, i) => (tTotal[i] += x));
    regs.set(chave, {
      totais: totais(m.t),
      candidatos: cands.map((k) => ({ id: k.id, votos: m.c.get(k.id) ?? 0 })),
      partidos: partidos.map((p) => ({ sg: p.sg, votos: m.p.get(p.sg) ?? 0 })),
    });
  }
  const vagas = prop ? cands.filter((k) => k.eleito).length : g.slug === 'senador' ? Math.max(1, cands.filter((k) => k.eleito).length) : 1;
  return { total: { vagas, atualizado: g.atualizado, totais: totais(tTotal), candidatos: cands, partidos }, regs };
}
const gravar = (rel, obj) => {
  const p = join(SAIDA, rel);
  mkdirSync(join(p, '..'), { recursive: true });
  const txt = JSON.stringify(obj);
  writeFileSync(p, txt);
  return (txt.length / 1024).toFixed(0);
};

// municipios.json: os do Brasil (mesmos de 2026) + as cidades do exterior desta eleição
const exterior = [...cidadesExterior].sort((a, b) => a[1].localeCompare(b[1], 'pt-BR')).map(([tse, nome]) => {
  const p = paises.get(tse);
  if (!p) console.warn(`cidade do exterior sem país em data/exterior/cidades-pais.csv: ${tse} ${nome}`);
  return { tse, ibge: '', nome, uf: 'zz', ...(p ?? {}) };
});
gravar('municipios.json', [...mun2026.filter((m) => m.uf !== 'zz'), ...exterior]);
console.log(`municipios.json: ${mun2026.filter((m) => m.uf !== 'zz').length} + ${exterior.length} no exterior`);

const ordem = [...grupos.values()].sort((a, b) => a.slug.localeCompare(b.slug) || a.turno - b.turno || a.uf.localeCompare(b.uf));
for (const slug of [...new Set(ordem.map((g) => g.slug))]) {
  const cargo = CARGO[slug];
  for (const turno of [1, 2]) {
    const gs = ordem.filter((g) => g.slug === slug && g.turno === turno);
    if (!gs.length) continue;
    if (slug === 'presidente') {
      // um grupo só (UF "BR" na entrada, separada aqui por SG_UF): junta o Brasil e o exterior
      const brasil = { slug, turno, uf: 'br', cands: new Map(), partidos: new Map(), mun: new Map(), atualizado: gs[0].atualizado };
      const zz = gs.find((g) => g.uf === 'zz');
      const vt = gs.find((g) => g.uf === 'vt');
      for (const g of gs) {
        for (const [id, k] of g.cands) { const x = brasil.cands.get(id); if (x) x.votos += k.votos; else brasil.cands.set(id, { ...k }); }
        for (const [sg, p] of g.partidos) { const x = brasil.partidos.get(sg); if (x) x.votos += p.votos; else brasil.partidos.set(sg, { ...p }); }
        if (g !== zz && g !== vt) for (const [ch, m] of g.mun) brasil.mun.set(ch, m);
      }
      // sem situação no arquivo (2010): calcula pelo resultado nacional — 1º turno: maioria absoluta ou os dois
      // primeiros vão ao 2º turno; 2º turno: o mais votado é eleito
      const lista = [...brasil.cands.values()].sort((a, b) => b.votos - a.votos);
      if (lista.every((k) => !k.situacao)) {
        const validos = lista.filter((k) => !k.anulado).reduce((t, k) => t + k.votos, 0);
        lista.forEach((k, i) => {
          k.situacao = turno === 2 ? (i === 0 ? 'Eleito' : 'Não eleito')
            : lista[0].votos > validos / 2 ? (i === 0 ? 'Eleito' : 'Não eleito') : i < 2 ? '2º turno' : 'Não eleito';
          k.eleito = k.situacao === 'Eleito';
        });
        for (const g of gs) for (const [id, k] of g.cands) Object.assign(k, { situacao: brasil.cands.get(id).situacao, eleito: brasil.cands.get(id).eleito });
      }
      // total nacional com o exterior e o voto em trânsito (como o TSE); o mapa do Brasil só tem os municípios
      const nBr = normalizado(brasil);
      if (vt) {
        const nVt = normalizado(vt);
        for (const k of Object.keys(nBr.total.totais)) nBr.total.totais[k] += nVt.total.totais[k];
      }
      if (zz) {
        const nZz = normalizado(zz);
        for (const k of Object.keys(nBr.total.totais)) nBr.total.totais[k] += nZz.total.totais[k];
        console.log(`presidente/${turno}/zz.json  ${nZz.regs.size} cidades  ${gravar(`presidente/${turno}/zz.json`, montarArquivo(cargo, turno, 'zz', nZz.total, nZz.regs))} KB`);
      }
      console.log(`presidente/${turno}/br.json  ${nBr.regs.size} mun  ${gravar(`presidente/${turno}/br.json`, montarArquivo(cargo, turno, 'br', nBr.total, nBr.regs))} KB`);
      continue;
    }
    const arquivos = [];
    for (const g of gs) {
      const n = normalizado(g);
      const arq = montarArquivo(cargo, turno, g.uf, n.total, n.regs);
      arquivos.push(arq);
      console.log(`${slug}/${turno}/${g.uf}.json  ${n.regs.size} mun  ${gravar(`${slug}/${turno}/${g.uf}.json`, arq)} KB`);
    }
    gravar(`${slug}/${turno}/br.json`, montarResumoBrasil(cargo, turno, arquivos));
  }
}
gravar('meta.json', { geradoEm: new Date().toISOString(), fonte: `${CDN} (${Object.values(ARQ).map((a) => a[1]).join(', ')})` });
