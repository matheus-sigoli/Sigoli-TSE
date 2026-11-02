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
 * Uso: node scripts/zonas-locais.mjs [--uf sp --uf rj] [--baixar]
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
const argv = process.argv.slice(2);
const opt = (k) => argv.flatMap((a, i) => (a === `--${k}` ? [argv[i + 1]] : []));
const CACHE = '.cache/dadosabertos';
const DADOS = 'public/data/2026';
const CDN = 'https://cdn.tse.jus.br/estatistica/sead/odsele';
const TODAS = ['ac', 'al', 'am', 'ap', 'ba', 'ce', 'df', 'es', 'go', 'ma', 'mg', 'ms', 'mt', 'pa', 'pb', 'pe', 'pi', 'pr', 'rj', 'rn', 'ro', 'rr', 'rs', 'sc', 'se', 'sp', 'to'];
const UFS = opt('uf').length ? opt('uf').map((u) => u.toLowerCase()) : TODAS;

// eleição TSE + código do cargo → [slug, turno]
function cargoDe(eleicao, cdCargo) {
  if (eleicao === 6257) return ['presidente', 1];
  if (eleicao === 6258) return ['presidente', 2];
  const t = eleicao === 6260 ? 2 : 1;
  const c = { 3: 'governador', 5: 'senador', 6: 'deputado-federal', 7: 'deputado-estadual', 8: 'deputado-estadual' }[cdCargo];
  return c ? [c, t] : null;
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

const zipLocais = join(CACHE, 'eleitorado_local_votacao_2026.zip');
const zipVotos = (UF) => join(CACHE, `votacao_secao_2026_${UF}.zip`);
if (argv.includes('--baixar')) {
  await baixar(`${CDN}/eleitorado_locais_votacao/eleitorado_local_votacao_2026.zip`, zipLocais);
  // BR = Presidente (todas as UFs); cada UF = cargos estaduais
  for (const UF of ['BR', ...UFS.map((u) => u.toUpperCase())]) await baixar(`${CDN}/votacao_secao/votacao_secao_2026_${UF}.zip`, zipVotos(UF));
}

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
  const cg = cargoDe(num(f[c.CD_ELEICAO]), num(f[c.CD_CARGO]));
  if (!cg) return;
  const [cargo, t] = cg;
  const chaveCargo = `${cargo}/${t}`;
  let a = E.acc.get(chaveCargo);
  if (!a) {
    const b = lerBase(E, cargo, t);
    if (!b) return;
    a = {
      b, zonas: new Map(), bairros: new Map(),
      idxC: new Map(b.cands.map((x, i) => [String(num(x.n)), i])),
      anulados: new Set(b.cands.filter((x) => x.anulado).map((x) => String(num(x.n)))),
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
  for (const [mapa, id] of [[a.zonas, String(zona)], [a.bairros, bairroId]]) {
    let r = mapa.get(id);
    if (!r) {
      r = { t: [0, 0, 0, 0, 0, 0], c: a.prop ? null : new Array(a.b.cands.length).fill(0), p: a.prop ? new Array(a.b.partidos.length).fill(0) : null, votosTotais: 0 };
      mapa.set(id, r);
    }
    // o eleitorado de cada seção entra uma vez por cargo e unidade
    const marca = `${chaveCargo}|${mapa === a.zonas ? 'z' : 'b'}|${chaveSecao}`;
    if (!E.contadas.has(marca)) { E.contadas.add(marca); r.t[0] += E.eleitoradoSecao.get(chaveSecao) ?? 0; }
    r.votosTotais += votos;
    if (votavel === 95) r.t[4] += votos;
    else if (votavel === 96 || votavel === 97) r.t[5] += votos;
    else if (a.prop) {
      if (a.anulados.has(String(votavel))) { r.t[5] += votos; continue; } // anulados: o TSE soma nos nulos
      const partido = String(votavel).length <= 2 ? String(votavel) : String(votavel).slice(0, 2);
      const i = a.idxP.get(partido);
      if (i !== undefined) { r.p[i] += votos; r.t[3] += votos; }
    } else {
      const i = a.idxC.get(String(votavel));
      if (i !== undefined) {
        r.c[i] += votos;
        if (a.anulados.has(String(votavel))) r.t[5] += votos; // anulados: o TSE soma nos nulos
        else r.t[3] += votos;
      }
    }
  }
}

const estados = new Map(UFS.map((uf) => [uf, novaUf(uf)]));

// 1) cadastro de locais e seções de cada UF
for (const E of estados.values()) {
  const UF = E.uf.toUpperCase();
  await lerCsvDoZip(zipLocais, (n) => n.endsWith(`_${UF}.csv`), (f, c) => {
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
  });
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
} else console.warn('votacao_secao_2026_BR.zip ausente: Presidente fica sem zonas e locais');

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
    for (const nivel of ['zonas', 'bairros']) {
      const mun = {};
      const tot = { t: [0, 0, 0, 0, 0, 0], c: new Array(a.b.cands.length).fill(0), p: new Array(a.b.partidos.length).fill(0) };
      for (const [id, r] of a[nivel]) {
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
  mkdirSync('public/geo/locais', { recursive: true });
  writeFileSync(`public/geo/locais/${uf}.json`, JSON.stringify({
    campos: ['id', 'ibge', 'zona', 'nome', 'bairro', 'lon', 'lat', 'eleitorado', 'idBairro'],
    l: lista.map((l) => [l.id, l.ibge, l.zona, l.nome, l.bairro, l.lon === null ? null : +l.lon.toFixed(5), l.lat === null ? null : +l.lat.toFixed(5), l.eleitorado, E.bairroDoLocal.get(l.id) ?? '']),
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
      if (l.lon !== null && l.lat !== null) b = malha.find((m) => contem(m, l.lon, l.lat));
      if (!b && chaveNome) b = malha.find((m) => m.chave === chaveNome);
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
function desenharZonas(uf, lista) {
  const topoUf = JSON.parse(readFileSync(`public/geo/uf/${uf}.json`, 'utf8'));
  const muniFc = feature(topoUf, topoUf.objects.municipios);
  const porMunicipio = new Map();
  for (const l of lista) {
    if (!porMunicipio.has(l.ibge)) porMunicipio.set(l.ibge, []);
    porMunicipio.get(l.ibge).push(l);
  }
  const partesZona = new Map();
  const addParte = (zona, geom) => {
    if (!partesZona.has(zona)) partesZona.set(zona, []);
    partesZona.get(zona).push(geom);
  };
  for (const f of muniFc.features) {
    const ls = porMunicipio.get(String(f.id)) ?? [];
    const geom = f.geometry.type === 'Polygon' ? [f.geometry.coordinates] : f.geometry.coordinates;
    const zonas = [...new Set(ls.map((l) => l.zona))];
    if (!zonas.length) continue; // lagoas e afins
    if (zonas.length === 1) { addParte(zonas[0], geom); continue; }
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
    const mp = partes.length === 1 ? partes[0] : polygonClipping.union(...partes);
    zonasFc.features.push({ type: 'Feature', id: String(z), properties: { id: String(z) }, geometry: { type: 'MultiPolygon', coordinates: mp } });
  }
  const topoZ = topology({ zonas: zonasFc }, 1e5);
  topoZ.bbox = topoUf.bbox;
  mkdirSync('public/geo/zonas', { recursive: true });
  writeFileSync(`public/geo/zonas/${uf}.json`, JSON.stringify(topoZ));
  return partesZona.size;
}
