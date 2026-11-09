#!/usr/bin/env node
/**
 * Sigoli.TSE — resultados por ZONA ELEITORAL e por BAIRRO (ADRs 0008 e 0009).
 *
 * Fontes (Portal de Dados Abertos do TSE, baixadas para .cache/dadosabertos/):
 *   - votacao_secao/votacao_secao_2026_{UF}.zip              votos por seção, todos os cargos
 *   - eleitorado_locais_votacao/eleitorado_local_votacao_2026.zip   locais, endereço, lat/lon, eleitorado por seção
 * Malha: public/geo/uf/{uf}.json (scripts/malha.mjs) e public/geo/bairros/{uf}/{ibge}.json (scripts/bairros.mjs).
 *
 * Bairro de cada local de votação:
 *   1. cidade com malha do IBGE: o polígono que contém o ponto do local;
 *   2. sem ponto ou fora dos polígonos: bairro do IBGE com o mesmo nome do cadastro do TSE;
 *   3. cidade sem malha (ou nada casou): o nome de bairro do cadastro do TSE (id `{ibge}-t-{nome}`).
 *
 * Saída:
 *   public/data/2026/{cargo}/{turno}/zonas/{uf}.json   resultado por zona (mesmo formato dos arquivos por UF)
 *   public/data/2026/{cargo}/{turno}/bairros/{uf}.json resultado por bairro
 *   public/data/2026/bairros/{uf}.json                 cadastro dos bairros (nome, cidade, origem, centro, eleitorado)
 *   public/geo/locais/{uf}.json                        cadastro dos locais (ponto, nome, bairro, eleitorado)
 *   public/geo/zonas/{uf}.json                         TopoJSON das áreas das zonas
 *
 * Deputados ficam por partido (nominais + legenda) nesses níveis; por candidato só no nível município.
 *
 * Outros anos (ADR 0015): --ano 2022 lê os arquivos daquele ano e grava em public/data/{ano}/ e public/geo/{ano}/
 * (os arquivos por município do ano vêm antes, de scripts/ano-tse.mjs).
 *
 * Uso: node scripts/zonas-locais.mjs [--ano 2022] [--uf sp --uf rj] [--baixar]
 */
import { createWriteStream, existsSync, mkdirSync, readFileSync, renameSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createInterface } from 'node:readline';
import yauzl from 'yauzl';
import { Delaunay } from 'd3-delaunay';
import polygonClipping from 'polygon-clipping';
import { topology } from 'topojson-server';
import { feature } from 'topojson-client';
import { normalizar as semAcento } from './lib/texto.mjs';
import { geocodificar } from './lib/geocodificar.mjs';
const argv = process.argv.slice(2);
const opt = (k) => argv.flatMap((a, i) => (a === `--${k}` ? [argv[i + 1]] : []));
const CACHE = '.cache/dadosabertos';
const ANO = Number(opt('ano')[0] ?? 2026);
const DADOS = `public/data/${ANO}`;
/** malhas que dependem do cadastro de locais do ano: public/geo/{nome} em 2026, public/geo/{ano}/{nome} nos outros */
const GEO = (nome) => (ANO === 2026 ? `public/geo/${nome}` : `public/geo/${ANO}/${nome}`);
const CDN = 'https://cdn.tse.jus.br/estatistica/sead/odsele';
const TODAS = ['ac', 'al', 'am', 'ap', 'ba', 'ce', 'df', 'es', 'go', 'ma', 'mg', 'ms', 'mt', 'pa', 'pb', 'pe', 'pi', 'pr', 'rj', 'rn', 'ro', 'rr', 'rs', 'sc', 'se', 'sp', 'to'];
const UFS = opt('uf').length ? opt('uf').map((u) => u.toLowerCase()) : TODAS;

// zonas desenhadas por cidade para um ano (ZMBRA_{ano}.json, enviado pelo usuário: cada feição = zona × município,
// nas cidades com mais de uma zona). Onde cobre todas as zonas da cidade, substitui o Voronoi.
const ZMBRA = (() => {
  const p = `data/zonas/ZMBRA_${ANO}.json`;
  if (!existsSync(p)) return null;
  const m = new Map(); // ibge → [{zona, coords}]
  for (const f of JSON.parse(readFileSync(p, 'utf8')).features) {
    const ibge = String(f.properties.CD_MUN_I);
    if (!m.has(ibge)) m.set(ibge, []);
    m.get(ibge).push({ zona: Number(f.properties.ZE_NUM), uf: String(f.properties.SG_UF).toLowerCase(), coords: f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates });
  }
  console.log(`${p}: zonas desenhadas em ${m.size} cidades`);
  return m;
})();

/** só a eleição geral de outubro do ano (os arquivos trazem também as suplementares do mesmo mandato) */
const ordinaria = (dt) => new RegExp(`^\\d{2}/${ANO === 1994 ? "1[01]" : "10"}/${ANO}$`).test(String(dt).trim()); // 1994: 2º turno em 15/11


// código do cargo + turno → [slug, turno] (vale para qualquer ano: não depende do código da eleição)
function cargoDe(cdCargo, turno) {
  const c = { 1: 'presidente', 3: 'governador', 5: 'senador', 6: 'deputado-federal', 7: 'deputado-estadual', 8: 'deputado-estadual' }[cdCargo];
  return c && (turno === 1 || turno === 2) ? [c, turno] : null;
}

// ------------------------------------------------------------------ utilidades de arquivo
/** Baixa para `.parcial` e só renomeia no fim: um download interrompido nunca passa por arquivo completo. */
async function baixar(url, destino) {
  if (existsSync(destino)) return;
  mkdirSync(join(destino, '..'), { recursive: true });
  const parcial = `${destino}.parcial`;
  for (let tentativa = 1; ; tentativa++) {
    try {
      // limite por arquivo: uma conexão parada vira nova tentativa em vez de travar o processo
      const r = await fetch(url, { signal: AbortSignal.timeout(15 * 60 * 1000) });
      if (!r.ok) throw new Error(`HTTP ${r.status} em ${url}`);
      await pipeline(Readable.fromWeb(r.body), createWriteStream(parcial));
      console.log(`  baixado ${url.split('/').pop()}`);
      renameSync(parcial, destino);
      return;
    } catch (e) {
      rmSync(parcial, { force: true });
      if (tentativa >= 6) throw e;
      const espera = 15 * tentativa;
      console.warn(`  falha ao baixar ${url.split('/').pop()} (${e.message}); nova tentativa em ${espera}s`);
      await new Promise((ok) => setTimeout(ok, espera * 1000));
    }
  }
}

/** Lê uma entrada (CSV latin1) de um zip, linha a linha, entregando campos já separados. */
function lerCsvDoZip(zip, filtroNome, aoLinha) {
  return new Promise((resolve, reject) => {
    yauzl.open(zip, { lazyEntries: true }, (err, z) => {
      if (err) return reject(err);
      let achou = false;
      z.on('entry', (e) => {
        if (!filtroNome(e.fileName)) return z.readEntry();
        achou = true;
        z.openReadStream(e, (err2, s) => {
          if (err2) return reject(err2);
          s.setEncoding('latin1');
          const rl = createInterface({ input: s, crlfDelay: Infinity });
          let cab = null;
          rl.on('line', (l) => {
            const f = separar(l);
            if (!cab) { cab = Object.fromEntries(f.map((n, i) => [n, i])); return; }
            aoLinha(f, cab);
          });
          rl.on('close', () => z.readEntry());
        });
      });
      z.on('end', () => (achou ? resolve() : reject(new Error(`nada em ${zip} casou com o filtro`))));
      z.readEntry();
    });
  });
}

/** Separa uma linha CSV do TSE (campos entre aspas, separador ;). */
function separar(l) {
  const out = [];
  let i = 0;
  while (i <= l.length) {
    if (l[i] === '"') {
      let j = i + 1, v = '';
      while (j < l.length) {
        if (l[j] === '"' && l[j + 1] === '"') { v += '"'; j += 2; continue; }
        if (l[j] === '"') break;
        v += l[j++];
      }
      out.push(v);
      i = j + 2; // pula aspas e ;
    } else {
      const j = l.indexOf(';', i);
      const fim = j === -1 ? l.length : j;
      out.push(l.slice(i, fim));
      i = fim + 1;
    }
    if (i > l.length) break;
  }
  return out;
}

const num = (s) => { const n = parseInt(s, 10); return Number.isFinite(n) ? n : 0; };
const coord = (s) => { const n = parseFloat(String(s).replace(',', '.')); return Number.isFinite(n) && n !== 0 && n !== -1 ? n : null; };
const pad5 = (s) => String(num(s)).padStart(5, '0');

// ------------------------------------------------------------------ principal
const municipios = JSON.parse(readFileSync(join(DADOS, 'municipios.json'), 'utf8'));
const ibgeDe = new Map(municipios.filter((m) => m.uf !== 'zz').map((m) => [m.tse, m.ibge]));

// 2006: o TSE não publica o cadastro de locais (eleitorado_local_votacao começa em 2010); as seções e os
// locais vêm do detalhe da votação por seção (QT_APTOS, NR_LOCAL_VOTACAO) e o nome/ponto do mesmo código em 2010+
const SEM_CADASTRO = ANO < 2010;
const zipLocais = SEM_CADASTRO ? join(CACHE, `detalhe_votacao_secao_${ANO}.zip`) : join(CACHE, `eleitorado_local_votacao_${ANO}.zip`);
const zipVotos = (UF) => join(CACHE, `votacao_secao_${ANO}_${UF}.zip`);
if (argv.includes('--baixar')) {
  await baixar(SEM_CADASTRO ? `${CDN}/detalhe_votacao_secao/detalhe_votacao_secao_${ANO}.zip` : `${CDN}/eleitorado_locais_votacao/eleitorado_local_votacao_${ANO}.zip`, zipLocais);
  // BR = Presidente (todas as UFs); cada UF = cargos estaduais
  for (const UF of ['BR', ...UFS.map((u) => u.toUpperCase())]) await baixar(`${CDN}/votacao_secao/votacao_secao_${ANO}_${UF}.zip`, zipVotos(UF));
}
// locais geocodificados de 2006 a 2024 (Hidalgo et al., github.com/fdhidalgo/geocode_br_polling_stations, v0.16):
// nome, endereço e ponto de cada local por eleição — ponto do TSE quando há, senão o do modelo (conf_dist_km = erro)
const GEOCODE = join(CACHE, 'geocoded_polling_stations_v0.16.csv.gz');
if (argv.includes('--baixar') && ANO >= 2002 && ANO <= 2024) await baixar('https://github.com/fdhidalgo/geocode_br_polling_stations/releases/download/v0.16/geocoded_polling_stations.csv.gz', GEOCODE);

/** Estado de processamento de uma UF. */
function novaUf(uf) {
  return {
    uf, locais: new Map(), secaoLocal: new Map(), eleitoradoSecao: new Map(), base: new Map(), acc: new Map(), contadas: new Set(),
    bairroDoLocal: new Map(), bairros: new Map(),
  };
}

function lerBase(E, cargo, t) {
  const k = `${cargo}/${t}`;
  if (!E.base.has(k)) {
    const p = join(DADOS, cargo, String(t), cargo === 'presidente' ? 'br.json' : `${E.uf}.json`);
    E.base.set(k, existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null);
  }
  return E.base.get(k);
}

/** Soma uma linha de votação por seção nos acumuladores da UF. */
function somarLinha(E, f, c) {
  if (!ordinaria(f[c.DT_ELEICAO])) return;
  const cg = cargoDe(num(f[c.CD_CARGO]), num(f[c.NR_TURNO]));
  if (!cg) return;
  const [cargo, t] = cg;
  const chaveCargo = `${cargo}/${t}`;
  let a = E.acc.get(chaveCargo);
  if (!a) {
    const b = lerBase(E, cargo, t);
    if (!b) return;
    a = {
      b, zonas: new Map(), zonasCidade: new Map(), bairros: new Map(), locais: new Map(),
      idxC: new Map(b.cands.map((x, i) => [String(num(x.n)), i])),
      anulados: new Set(b.cands.filter((x) => x.anulado).map((x) => String(num(x.n)))),
      // candidatura indeferida retotalizada (2014 e antes): na totalização final os votos dele são nulos
      nulos: new Set(b.cands.filter((x) => x.anulado?.startsWith('Nulo')).map((x) => String(num(x.n)))),
      idxP: new Map(b.partidos.map((x, i) => [String(num(x.n)), i])),
      prop: b.tipo === 'prop', vagas: cargo === 'senador' ? Math.max(1, b.vagas || 1) : 1,
    };
    E.acc.set(chaveCargo, a);
  }
  const turno = num(f[c.NR_TURNO]);
  const mun = pad5(f[c.CD_MUNICIPIO]);
  const zona = num(f[c.NR_ZONA]);
  const secao = num(f[c.NR_SECAO]);
  const chaveSecao = `${turno}|${mun}-${zona}-${secao}`;
  const localId = E.secaoLocal.get(chaveSecao) ?? `${mun}-${zona}-${num(f[c.NR_LOCAL_VOTACAO])}`;
  const votavel = num(f[c.NR_VOTAVEL]);
  const votos = num(f[c.QT_VOTOS]);
  const bairroId = E.bairroDoLocal.get(localId) ?? `${ibgeDe.get(mun) ?? mun}-t-sem-bairro`;
  const ibgeMun = ibgeDe.get(mun) ?? mun;
  const unidades = [['z', a.zonas, String(zona)], ['zc', a.zonasCidade, `${ibgeMun}-${zona}`], ['b', a.bairros, bairroId], ['l', a.locais, localId]];
  for (const [sigla, mapa, id] of unidades) {
    let r = mapa.get(id);
    if (!r) {
      r = { t: [0, 0, 0, 0, 0, 0], c: a.prop ? null : new Array(a.b.cands.length).fill(0), p: a.prop ? new Array(a.b.partidos.length).fill(0) : null, votosTotais: 0 };
      mapa.set(id, r);
    }
    // o eleitorado de cada seção entra uma vez por cargo e unidade
    const marca = `${chaveCargo}|${sigla}|${chaveSecao}`;
    if (!E.contadas.has(marca)) { E.contadas.add(marca); r.t[0] += E.eleitoradoSecao.get(chaveSecao) ?? 0; }
    r.votosTotais += votos;
    if (votavel === 95) r.t[4] += votos;
    else if (votavel === 96 || votavel === 97) r.t[5] += votos;
    else if (!a.prop && a.nulos.has(String(votavel))) r.t[5] += votos;
    else if (a.prop) {
      // anulados (registro indeferido): o TSE os deixa fora de válidos e de nulos
      if (a.anulados.has(String(votavel))) continue;
      const partido = String(votavel).length <= 2 ? String(votavel) : String(votavel).slice(0, 2);
      const i = a.idxP.get(partido);
      if (i !== undefined) { r.p[i] += votos; r.t[3] += votos; }
      else r.t[5] += votos; // número que não está na disputa: nulo
    } else {
      const i = a.idxC.get(String(votavel));
      if (i === undefined) r.t[5] += votos; // candidatura cancelada antes da eleição: o TSE conta como nulo
      else {
        r.c[i] += votos;
        if (!a.anulados.has(String(votavel))) r.t[3] += votos; // anulados ficam fora de válidos e de nulos
      }
    }
  }
}

const estados = new Map(UFS.map((uf) => [uf, novaUf(uf)]));

// 1) cadastro de locais e seções de cada UF
function lerLocal(E, f, c) {
  if (c.DT_ELEICAO !== undefined && !ordinaria(f[c.DT_ELEICAO])) return;
  const turno = num(f[c.NR_TURNO]);
  const mun = pad5(f[c.CD_MUNICIPIO]);
  const zona = num(f[c.NR_ZONA]);
  const secao = num(f[c.NR_SECAO]);
  const nr = num(f[c.NR_LOCAL_VOTACAO]);
  const id = `${mun}-${zona}-${nr}`;
  const chave = `${turno}|${mun}-${zona}-${secao}`;
  E.secaoLocal.set(chave, id);
  // seção agregada vota junto com a principal: soma o eleitorado na principal
  const principal = num(f[c.NR_SECAO_PRINCIPAL]);
  const chaveVoto = principal > 0 ? `${turno}|${mun}-${zona}-${principal}` : chave;
  E.eleitoradoSecao.set(chaveVoto, (E.eleitoradoSecao.get(chaveVoto) ?? 0) + num(f[c.QT_ELEITOR_SECAO]));
  if (turno !== 1 && E.locais.has(id)) return;
  let l = E.locais.get(id);
  if (!l) {
    l = { id, mun, ibge: ibgeDe.get(mun) ?? '', zona, nr, nome: f[c.NM_LOCAL_VOTACAO], bairro: f[c.NM_BAIRRO], lon: coord(f[c.NR_LONGITUDE]), lat: coord(f[c.NR_LATITUDE]), eleitorado: 0 };
    E.locais.set(id, l);
  }
  if (turno === 1) l.eleitorado += num(f[c.QT_ELEITOR_SECAO]);
}
/** 2006 e 2002: uma linha por seção e cargo; Governador (arquivos das UFs) e Presidente (arquivo BR) dão a seção,
 * o local e os aptos — o Presidente cobre as seções que só funcionaram no 2º turno. */
const secoesContadas = new Set();
function lerSecaoSemCadastro(E, f, c) {
  const cargo = num(f[c.CD_CARGO]);
  if (!ordinaria(f[c.DT_ELEICAO]) || (cargo !== 3 && cargo !== 1)) return;
  const turno = num(f[c.NR_TURNO]);
  const mun = pad5(f[c.CD_MUNICIPIO]);
  const zona = num(f[c.NR_ZONA]);
  const secao = num(f[c.NR_SECAO]);
  const nr = num(f[c.NR_LOCAL_VOTACAO]);
  const id = `${mun}-${zona}-${nr}`;
  const chave = `${turno}|${mun}-${zona}-${secao}`;
  E.secaoLocal.set(chave, id);
  E.eleitoradoSecao.set(chave, num(f[c.QT_APTOS]));
  // 2º turno de Governador só em 10 UFs: as outras seções do 2º turno (Presidente) repetem o 1º
  if (turno === 1) E.secaoLocal.set(`2|${mun}-${zona}-${secao}`, id), E.eleitoradoSecao.set(`2|${mun}-${zona}-${secao}`, num(f[c.QT_APTOS]));
  let l = E.locais.get(id);
  if (!l) {
    l = { id, mun, ibge: ibgeDe.get(mun) ?? '', zona, nr, nome: '', bairro: '', lon: null, lat: null, eleitorado: 0 };
    E.locais.set(id, l);
  }
  if (turno === 1 && !secoesContadas.has(chave)) { secoesContadas.add(chave); l.eleitorado += num(f[c.QT_APTOS]); }
}
if (SEM_CADASTRO) {
  await lerCsvDoZip(zipLocais, (n) => /_[A-Z]{2}\.csv$/i.test(n) && !/_(ZZ|VT)\.csv$/i.test(n), (f, c) => {
    const E = estados.get(String(f[c.SG_UF]).toLowerCase());
    if (E) lerSecaoSemCadastro(E, f, c);
  });
  // nome, bairro e ponto: o local com o mesmo código no cadastro mais próximo (2010, depois 2014…)
  for (const E of estados.values()) {
    const conta = { codigo: 0, sem: 0 };
    for (const y of [2010, 2014, 2018, 2022, 2026]) {
      const p = y === 2026 ? `public/geo/locais/${E.uf}.json` : `public/geo/${y}/locais/${E.uf}.json`;
      if (!existsSync(p)) continue;
      const { campos, l: linhas } = JSON.parse(readFileSync(p, 'utf8'));
      const ci = Object.fromEntries(campos.map((n, i) => [n, i]));
      for (const r of linhas) {
        const l = E.locais.get(String(r[ci.id]));
        if (!l || l.nome) continue;
        l.nome = r[ci.nome]; l.bairro = r[ci.bairro] ?? '';
        if (r[ci.lon] !== null && r[ci.lat] !== null) { l.lon = r[ci.lon]; l.lat = r[ci.lat]; l.aprox = ci.aprox !== undefined && r[ci.aprox] === 1; }
        conta.codigo++;
      }
    }
    for (const l of E.locais.values()) if (!l.nome) { l.nome = `LOCAL ${l.nr} (ZONA ${l.zona})`; conta.sem++; }
    console.log(`${E.uf}: ${E.locais.size} locais de ${ANO}; ${conta.codigo} com nome e ponto do mesmo código em outro ano, ${conta.sem} sem`);
  }
} else if (ANO === 2026) {
  // 2026: um CSV por UF
  for (const E of estados.values()) await lerCsvDoZip(zipLocais, (n) => n.endsWith(`_${E.uf.toUpperCase()}.csv`), (f, c) => lerLocal(E, f, c));
} else {
  // anos anteriores: um CSV só, lido uma vez e distribuído por SG_UF
  await lerCsvDoZip(zipLocais, (n) => n.endsWith('.csv'), (f, c) => {
    const E = estados.get(String(f[c.SG_UF]).toLowerCase());
    if (E) lerLocal(E, f, c);
  });
}

// 1·) locais geocodificados (2006–2024): ponto de quem não tem o do TSE; em 2006 (sem cadastro do TSE) também o nome
// e o bairro. 2002: o local de mesmo código em 2006 (nome e ponto), como faz o cadastro de outros anos
if (existsSync(GEOCODE)) {
  const anoGeo = ANO === 2002 ? 2006 : ANO;
  const { createGunzip } = await import('node:zlib');
  const { createReadStream } = await import('node:fs');
  const csv = (l) => { const o = []; let v = '', q = false; for (let i = 0; i < l.length; i++) { const ch = l[i]; if (q) { if (ch === '"' && l[i + 1] === '"') { v += '"'; i++; } else if (ch === '"') q = false; else v += ch; } else if (ch === '"') q = true; else if (ch === ',') { o.push(v); v = ''; } else v += ch; } o.push(v); return o; };
  const geo = new Map();
  let cab = null;
  for await (const l of createInterface({ input: createReadStream(GEOCODE).pipe(createGunzip()), crlfDelay: Infinity })) {
    const f = csv(l);
    if (!cab) { cab = Object.fromEntries(f.map((n, i) => [n, i])); continue; }
    if (Number(f[cab.ano]) !== anoGeo) continue;
    const lon = Number(f[cab.long]), lat = Number(f[cab.lat]);
    geo.set(`${pad5(f[cab.cd_localidade_tse])}-${num(f[cab.nr_zona])}-${num(f[cab.nr_locvot])}`, {
      nome: f[cab.nm_locvot], bairro: f[cab.ds_bairro], lon: Number.isFinite(lon) && f[cab.long] !== '' ? lon : null, lat: Number.isFinite(lat) && f[cab.lat] !== '' ? lat : null,
      conf: Number(f[cab.conf_dist_km]) || 0,
    });
  }
  const tot = { locais: 0, casados: 0, ponto: 0, nome: 0 };
  for (const E of estados.values()) for (const l of E.locais.values()) {
    tot.locais++;
    const g = geo.get(l.id);
    if (!g) continue;
    tot.casados++;
    if (SEM_CADASTRO && g.nome) { l.nome = g.nome; if (g.bairro) l.bairro = g.bairro; tot.nome++; }
    const semPontoProprio = l.lon === null || l.lat === null || l.aprox;
    if (semPontoProprio && g.lon !== null && g.lat !== null) { l.lon = g.lon; l.lat = g.lat; l.aprox = g.conf > 2; tot.ponto++; }
  }
  console.log(`locais geocodificados (${anoGeo}): ${geo.size} no arquivo; ${tot.casados} de ${tot.locais} locais casados; ${tot.ponto} ganharam ponto, ${tot.nome} nome`);
}

// 1a) locais sem latitude/longitude: ponto pelo cadastro de outros anos ou pelo centro do bairro/zona (ADR 0016)
for (const E of estados.values()) {
  const refs = [2026, 2022, 2018, 2014, 2010].filter((y) => y !== ANO)
    .map((y) => (y === 2026 ? `public/geo/locais/${E.uf}.json` : `public/geo/${y}/locais/${E.uf}.json`))
    .filter((p) => existsSync(p))
    .map((p) => {
      const { campos, l } = JSON.parse(readFileSync(p, 'utf8'));
      const c = Object.fromEntries(campos.map((n, i) => [n, i]));
      return l.map((r) => ({ id: String(r[c.id]), ibge: String(r[c.ibge]), zona: r[c.zona], nome: r[c.nome], bairro: r[c.bairro], lon: r[c.lon], lat: r[c.lat], aprox: c.aprox !== undefined && r[c.aprox] === 1 }));
    });
  const lista = [...E.locais.values()];
  const antes = lista.filter((l) => l.lon === null || l.lat === null).length;
  if (!antes) continue;
  const conta = geocodificar(lista, refs);
  console.log(`${E.uf}: ${antes} locais sem ponto → ${Object.entries(conta).filter(([, n]) => n).map(([k, n]) => `${k} ${n}`).join(', ')}`);
}

// 1b) bairro de cada local
for (const E of estados.values()) atribuirBairros(E);

// 2) cargos estaduais: um arquivo por UF
for (const E of estados.values()) {
  await lerCsvDoZip(zipVotos(E.uf.toUpperCase()), (n) => n.endsWith('.csv'), (f, c) => somarLinha(E, f, c));
}

// 3) Presidente: arquivo nacional, lido uma vez e distribuído por UF
if (existsSync(zipVotos('BR'))) {
  await lerCsvDoZip(zipVotos('BR'), (n) => n.endsWith('.csv'), (f, c) => {
    const E = estados.get(String(f[c.SG_UF]).toLowerCase());
    if (E) somarLinha(E, f, c);
  });
} else console.warn(`votacao_secao_${ANO}_BR.zip ausente: Presidente fica sem zonas e locais`);

// 4) grava tudo por UF
for (const E of estados.values()) {
  const t0 = Date.now();
  const uf = E.uf;
  E.contadas.clear();
  const gravar = (rel, obj) => {
    const p = join(DADOS, rel);
    mkdirSync(join(p, '..'), { recursive: true });
    writeFileSync(p, JSON.stringify(obj));
  };
  for (const [chaveCargo, a] of E.acc) {
    for (const [nivel, chaveAcc] of [['zonas', 'zonas'], ['zonas-cidade', 'zonasCidade'], ['bairros', 'bairros'], ['locais', 'locais']]) {
      const mun = {};
      const tot = { t: [0, 0, 0, 0, 0, 0], c: new Array(a.b.cands.length).fill(0), p: new Array(a.b.partidos.length).fill(0) };
      for (const [id, r] of a[chaveAcc]) {
        const t = [...r.t];
        t[1] = Math.round(r.votosTotais / a.vagas); // comparecimento (Senado 2026: 2 votos por eleitor)
        t[2] = Math.max(0, t[0] - t[1]);
        const reg = { t, c: a.prop ? [] : r.c };
        if (a.prop) reg.p = r.p;
        mun[id] = reg;
        t.forEach((x, i) => (tot.t[i] += x));
        if (!a.prop) r.c.forEach((x, i) => (tot.c[i] += x));
        else r.p.forEach((x, i) => (tot.p[i] += x));
      }
      const { mun: _m, total: _t, ...cab } = a.b;
      void _m; void _t;
      gravar(`${chaveCargo}/${nivel}/${uf}.json`, { ...cab, abr: uf, nivel, porPartido: a.prop, total: tot, mun });
    }
  }

  // cadastro dos locais (pontos)
  const lista = [...E.locais.values()].sort((x, y) => x.id.localeCompare(y.id));
  mkdirSync(GEO('locais'), { recursive: true });
  writeFileSync(`${GEO('locais')}/${uf}.json`, JSON.stringify({
    // aprox = 1: ponto estimado (centro do bairro ou da zona), não o do prédio (ADR 0016)
    campos: ['id', 'ibge', 'zona', 'nome', 'bairro', 'lon', 'lat', 'eleitorado', 'idBairro', 'aprox'],
    l: lista.map((l) => [l.id, l.ibge, l.zona, l.nome, l.bairro, l.lon === null ? null : +l.lon.toFixed(5), l.lat === null ? null : +l.lat.toFixed(5), l.eleitorado, E.bairroDoLocal.get(l.id) ?? '', l.aprox ? 1 : 0]),
  }));

  // cadastro dos bairros: origem 'i' (polígono do IBGE) ou 't' (nome do TSE, sem área), centro ponderado pelo eleitorado
  const bairros = [...E.bairros.values()].sort((x, y) => x.id.localeCompare(y.id));
  gravar(`bairros/${uf}.json`, {
    campos: ['id', 'ibge', 'nome', 'origem', 'lon', 'lat', 'eleitorado', 'locais'],
    b: bairros.map((b) => [b.id, b.ibge, b.nome, b.origem, b.w ? +(b.sx / b.w).toFixed(5) : null, b.w ? +(b.sy / b.w).toFixed(5) : null, b.eleitorado, b.locais]),
  });

  // áreas das zonas
  const nZonas = desenharZonas(uf, lista);
  const nIbge = bairros.filter((b) => b.origem === 'i').length;
  console.log(`${uf}: ${E.locais.size} locais, ${nZonas} zonas, ${bairros.length} bairros (${nIbge} com área do IBGE), ${E.acc.size} cargos/turnos (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
  E.locais.clear(); E.secaoLocal.clear(); E.eleitoradoSecao.clear(); E.acc.clear(); E.bairroDoLocal.clear(); E.bairros.clear();
}

/**
 * Atribui cada local de votação a um bairro (ver cabeçalho). Preenche E.bairroDoLocal e E.bairros.
 */
function atribuirBairros(E) {
  const dir = join('public/geo/bairros', E.uf);
  const comMalha = existsSync(join(dir, 'cidades.json')) ? JSON.parse(readFileSync(join(dir, 'cidades.json'), 'utf8')) : {};
  const malhas = new Map(); // ibge → [{id, nome, chave, bbox, polys}]
  const malhaDe = (ibge) => {
    if (!(ibge in comMalha)) return null;
    if (!malhas.has(ibge)) {
      const topo = JSON.parse(readFileSync(join(dir, `${ibge}.json`), 'utf8'));
      const fc = feature(topo, topo.objects.bairros);
      malhas.set(ibge, fc.features.map((f) => {
        const polys = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
        let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
        for (const p of polys) for (const [x, y] of p[0]) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
        return { id: String(f.id), nome: f.properties.n, chave: semAcento(f.properties.n), bbox: [x0, y0, x1, y1], polys };
      }));
    }
    return malhas.get(ibge);
  };
  const dentro = (x, y, anel) => {
    let d = false;
    for (let i = 0, j = anel.length - 1; i < anel.length; j = i++) {
      const [xi, yi] = anel[i], [xj, yj] = anel[j];
      if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) d = !d;
    }
    return d;
  };
  const contem = (b, x, y) => x >= b.bbox[0] && x <= b.bbox[2] && y >= b.bbox[1] && y <= b.bbox[3]
    && b.polys.some((p) => dentro(x, y, p[0]) && !p.slice(1).some((h) => dentro(x, y, h)));

  const nomesTse = new Map(); // id → contagem de grafias, para escolher a mais comum
  for (const l of E.locais.values()) {
    const ibge = l.ibge || l.mun;
    const malha = malhaDe(ibge);
    const chaveNome = semAcento(l.bairro);
    let b = null;
    if (malha) {
      // ponto estimado (ADR 0016): o nome do bairro vale mais que o ponto
      if (l.lon !== null && l.lat !== null && !l.aprox) b = malha.find((m) => contem(m, l.lon, l.lat));
      if (!b && chaveNome) b = malha.find((m) => m.chave === chaveNome);
      if (!b && l.aprox) b = malha.find((m) => contem(m, l.lon, l.lat));
    }
    let id, nome, origem;
    if (b) { id = b.id; nome = b.nome; origem = 'i'; }
    else {
      id = `${ibge}-t-${chaveNome.replace(/\s+/g, '-') || 'sem-bairro'}`;
      origem = 't';
      const g = nomesTse.get(id) ?? new Map();
      const grafia = l.bairro?.trim() || 'Sem bairro informado';
      g.set(grafia, (g.get(grafia) ?? 0) + 1);
      nomesTse.set(id, g);
    }
    E.bairroDoLocal.set(l.id, id);
    let r = E.bairros.get(id);
    if (!r) { r = { id, ibge, nome, origem, sx: 0, sy: 0, w: 0, eleitorado: 0, locais: 0 }; E.bairros.set(id, r); }
    r.eleitorado += l.eleitorado;
    r.locais++;
    if (l.lon !== null && l.lat !== null) {
      const w = Math.max(1, l.eleitorado);
      r.sx += l.lon * w; r.sy += l.lat * w; r.w += w;
    }
  }
  for (const [id, g] of nomesTse) E.bairros.get(id).nome = [...g.entries()].sort((a, b) => b[1] - a[1])[0][0];
}

/** Município inteiro quando tem uma zona; Voronoi dos locais recortado pelo município quando tem várias. */
/**
 * Recorte do desenho pela cidade. O polygon-clipping às vezes falha com vértices quase coincidentes (desenhos de
 * fontes diferentes); tenta de novo com as coordenadas arredondadas (~1 cm) e, se ainda falhar, usa o desenho inteiro.
 */
function recortar(a, b) {
  try { return polygonClipping.intersection(a, b); } catch { /* tenta arredondado */ }
  const r = (g) => g.map((p) => p.map((anel) => anel.map(([x, y]) => [Math.round(x * 1e7) / 1e7, Math.round(y * 1e7) / 1e7])));
  try { return polygonClipping.intersection(r(a), r(b)); } catch (e) {
    console.warn(`  recorte falhou (${e.message.slice(0, 60)}…); usa o desenho sem recortar`);
    return a;
  }
}

/** União das partes de uma zona; se o polygon-clipping falhar, arredonda e tenta de novo, senão só junta os polígonos. */
function unir(partes) {
  try { return polygonClipping.union(...partes); } catch { /* tenta arredondado */ }
  const r = (g) => g.map((p) => p.map((anel) => anel.map(([x, y]) => [Math.round(x * 1e7) / 1e7, Math.round(y * 1e7) / 1e7])));
  try { return polygonClipping.union(...partes.map(r)); } catch { return partes.flat(); }
}

function desenharZonas(uf, lista) {
  // malha do ano quando difere da de 2025 (scripts/malha-ano.mjs: municípios criados depois voltam à origem)
  const malhaAno = `public/geo/${ANO}/uf/${uf}.json`;
  const topoUf = JSON.parse(readFileSync(ANO !== 2026 && existsSync(malhaAno) ? malhaAno : `public/geo/uf/${uf}.json`, 'utf8'));
  const muniFc = feature(topoUf, topoUf.objects.municipios);

  // zonas desenhadas à mão (ADR 0013, ex.: DF a partir de DF.svg): usa o desenho e só recorta por cidade.
  // Em outro ano, só se as zonas forem as mesmas do desenho.
  // desenho do ano (data/zonas/{uf}-{ano}.geojson, scripts/zonas-svg-ano.mjs) vale como está; o geral, só se as zonas forem as mesmas
  const doAno = `data/zonas/${uf}-${ANO}.geojson`;
  const fixo = ANO !== 2026 && existsSync(doAno) ? doAno : `data/zonas/${uf}.geojson`;
  const zonasFixas = existsSync(fixo) ? JSON.parse(readFileSync(fixo, 'utf8')) : null;
  const mesmasZonas = zonasFixas && (fixo === doAno || [...new Set(lista.map((l) => String(l.zona)))].sort().join() === zonasFixas.features.map((z) => String(z.id)).sort().join());
  if (zonasFixas && !mesmasZonas) console.warn(`${uf}: as zonas de ${ANO} não são as do desenho em ${fixo}; usa as áreas pelos locais`);
  const zmbraNaUf = ZMBRA && [...ZMBRA.values()].some((l) => l[0].uf === uf);
  if (zonasFixas && mesmasZonas && !zmbraNaUf) {
    const zonasFc = zonasFixas;
    const cidadeFc = { type: 'FeatureCollection', features: [] };
    for (const z of zonasFc.features) {
      for (const m of muniFc.features) {
        const geomM = m.geometry.type === 'Polygon' ? [m.geometry.coordinates] : m.geometry.coordinates;
        let recorte = polygonClipping.intersection(z.geometry.coordinates, geomM);
        try { recorte = polygonClipping.union(recorte); } catch { /* fica como está */ }
        if (!recorte.length) continue;
        const k = `${m.id}-${z.id}`;
        cidadeFc.features.push({ type: 'Feature', id: k, properties: { id: k, ibge: String(m.id), zona: String(z.id) }, geometry: { type: 'MultiPolygon', coordinates: recorte } });
      }
    }
    // a zona do estado é a soma dos recortes por cidade (o desenho pode passar da divisa)
    const zonasRecortadas = zonasFc.features.map((z) => {
      const partes = cidadeFc.features.filter((c) => c.properties.zona === String(z.id)).map((c) => c.geometry.coordinates);
      if (!partes.length) return null;
      let geom; try { geom = polygonClipping.union(...partes); } catch { geom = partes.flat(); }
      return { type: 'Feature', id: z.id, properties: { id: String(z.id), zona: String(z.id) }, geometry: { type: 'MultiPolygon', coordinates: geom } };
    }).filter(Boolean);
    const topoZ = topology({ zonas: { type: 'FeatureCollection', features: zonasRecortadas } }, 1e5);
    topoZ.bbox = topoUf.bbox;
    const topoC = topology({ zonas: cidadeFc }, 1e5);
    topoC.bbox = topoUf.bbox;
    mkdirSync(GEO('zonas'), { recursive: true });
    mkdirSync(GEO('zonas-cidade'), { recursive: true });
    writeFileSync(`${GEO('zonas')}/${uf}.json`, JSON.stringify(topoZ));
    writeFileSync(`${GEO('zonas-cidade')}/${uf}.json`, JSON.stringify(topoC));
    return zonasFc.features.length;
  }
  const porMunicipio = new Map();
  for (const l of lista) {
    if (!porMunicipio.has(l.ibge)) porMunicipio.set(l.ibge, []);
    porMunicipio.get(l.ibge).push(l);
  }
  let usouZmbra = 0;
  const partesZona = new Map();
  const partesCidade = new Map(); // `${ibge}-${zona}` → partes (a zona recortada pela cidade)
  let ibgeAtual = '';
  const addParte = (zona, geom) => {
    if (!partesZona.has(zona)) partesZona.set(zona, []);
    partesZona.get(zona).push(geom);
    const k = `${ibgeAtual}-${zona}`;
    if (!partesCidade.has(k)) partesCidade.set(k, []);
    partesCidade.get(k).push(geom);
  };
  for (const f of muniFc.features) {
    ibgeAtual = String(f.id);
    const ls = porMunicipio.get(ibgeAtual) ?? [];
    const geom = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    const zonas = [...new Set(ls.map((l) => l.zona))];
    if (!zonas.length) continue; // lagoas e afins
    if (zonas.length === 1) { addParte(zonas[0], geom); continue; }
    const desenho = ZMBRA?.get(ibgeAtual);
    if (desenho && zonas.every((z) => desenho.some((d) => d.zona === z))) {
      for (const d of desenho) {
        if (!zonas.includes(d.zona)) continue;
        const recorte = recortar(d.coords, geom);
        if (recorte.length) addParte(d.zona, recorte);
      }
      usouZmbra++;
      continue;
    }
    if (desenho) console.warn(`${uf} ${ibgeAtual}: o desenho de ${ANO} não tem todas as zonas da cidade (${zonas.join(',')}); usa as áreas pelos locais`);
    const pontos = [], zonaDoPonto = [];
    const vistos = new Set();
    for (const l of ls) {
      if (l.lon === null || l.lat === null) continue;
      const k = `${l.lon.toFixed(5)},${l.lat.toFixed(5)}`;
      if (vistos.has(k)) continue;
      vistos.add(k);
      pontos.push([l.lon, l.lat]);
      zonaDoPonto.push(l.zona);
    }
    if (new Set(zonaDoPonto).size <= 1) {
      // sem como separar: o município vai para a zona com mais eleitores
      const elet = new Map();
      for (const l of ls) elet.set(l.zona, (elet.get(l.zona) ?? 0) + l.eleitorado);
      addParte([...elet.entries()].sort((a, b) => b[1] - a[1])[0][0], geom);
      continue;
    }
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    const estica = ([x, y]) => { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); };
    for (const p of geom) for (const r of p) r.forEach(estica);
    pontos.forEach(estica);
    const vor = Delaunay.from(pontos).voronoi([x0 - 0.01, y0 - 0.01, x1 + 0.01, y1 + 0.01]);
    const celulasPorZona = new Map();
    pontos.forEach((_, i) => {
      const cel = vor.cellPolygon(i);
      if (!cel) return;
      const z = zonaDoPonto[i];
      if (!celulasPorZona.has(z)) celulasPorZona.set(z, []);
      celulasPorZona.get(z).push([cel]);
    });
    for (const [z, cels] of celulasPorZona) {
      const uniao = polygonClipping.union(...cels);
      const recorte = polygonClipping.intersection(uniao, geom);
      if (recorte.length) addParte(z, recorte);
    }
  }
  const zonasFc = { type: 'FeatureCollection', features: [] };
  for (const [z, partes] of partesZona) {
    const mp = partes.length === 1 ? partes[0] : unir(partes);
    zonasFc.features.push({ type: 'Feature', id: String(z), properties: { id: String(z) }, geometry: { type: 'MultiPolygon', coordinates: mp } });
  }
  const topoZ = topology({ zonas: zonasFc }, 1e5);
  topoZ.bbox = topoUf.bbox;
  mkdirSync(GEO('zonas'), { recursive: true });
  writeFileSync(`${GEO('zonas')}/${uf}.json`, JSON.stringify(topoZ));

  // zonas dentro de cada cidade (visão da cidade): id `${ibge}-${zona}`
  const cidadeFc = { type: 'FeatureCollection', features: [] };
  for (const [k, partes] of partesCidade) {
    const mp = partes.length === 1 ? partes[0] : unir(partes);
    const [ibge, zona] = k.split('-');
    cidadeFc.features.push({ type: 'Feature', id: k, properties: { id: k, ibge, zona }, geometry: { type: 'MultiPolygon', coordinates: mp } });
  }
  const topoC = topology({ zonas: cidadeFc }, 1e5);
  topoC.bbox = topoUf.bbox;
  mkdirSync(GEO('zonas-cidade'), { recursive: true });
  writeFileSync(`${GEO('zonas-cidade')}/${uf}.json`, JSON.stringify(topoC));
  if (usouZmbra) console.log(`${uf}: ${usouZmbra} cidades com as zonas desenhadas de ${ANO}`);
  return partesZona.size;
}
