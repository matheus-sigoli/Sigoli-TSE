#!/usr/bin/env node
/**
 * Sigoli.TSE — resultados por ZONA ELEITORAL e por LOCAL DE VOTAÇÃO (ADR 0008).
 *
 * Fontes (Portal de Dados Abertos do TSE, baixadas para .cache/dadosabertos/):
 *   - votacao_secao/votacao_secao_2026_{UF}.zip              votos por seção, todos os cargos
 *   - eleitorado_locais_votacao/eleitorado_local_votacao_2026.zip   locais, endereço, lat/lon, eleitorado por seção
 * Malha: public/geo/uf/{uf}.json (gerada por scripts/malha.mjs).
 *
 * Saída:
 *   public/data/2026/{cargo}/{turno}/zonas/{uf}.json   resultado por zona (mesmo formato dos arquivos por UF)
 *   public/data/2026/{cargo}/{turno}/locais/{uf}.json  resultado por local de votação
 *   public/geo/locais/{uf}.json                        cadastro dos locais (ponto, nome, bairro, eleitorado)
 *   public/geo/zonas/{uf}.json                         TopoJSON das áreas das zonas
 *
 * Deputados ficam por partido (nominais + legenda) nesses níveis; por candidato só no nível município.
 *
 * Uso: node scripts/zonas-locais.mjs [--uf sp --uf rj] [--baixar]
 */
import { createWriteStream, existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createInterface } from 'node:readline';
import yauzl from 'yauzl';
import { Delaunay } from 'd3-delaunay';
import polygonClipping from 'polygon-clipping';
import { topology } from 'topojson-server';
import { feature } from 'topojson-client';
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
async function baixar(url, destino) {
  if (existsSync(destino)) return;
  mkdirSync(join(destino, '..'), { recursive: true });
  const r = await fetch(url);
  if (!r.ok) throw new Error(`HTTP ${r.status} em ${url}`);
  await pipeline(Readable.fromWeb(r.body), createWriteStream(destino));
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
if (argv.includes('--baixar')) {
  await baixar(`${CDN}/eleitorado_locais_votacao/eleitorado_local_votacao_2026.zip`, zipLocais);
  for (const uf of UFS) await baixar(`${CDN}/votacao_secao/votacao_secao_2026_${uf.toUpperCase()}.zip`, join(CACHE, `votacao_secao_2026_${uf.toUpperCase()}.zip`));
}

for (const uf of UFS) {
  const t0 = Date.now();
  const UF = uf.toUpperCase();

  // 1) locais e seções (1º turno define o cadastro; eleitorado por seção)
  const locais = new Map(); // id → {id, mun, ibge, zona, nr, nome, bairro, lon, lat, eleitorado}
  const secaoLocal = new Map(); // `${turno}|${mun}-${zona}-${secao}` → localId
  const eleitoradoSecao = new Map(); // mesma chave → eleitores
  await lerCsvDoZip(zipLocais, (n) => n.endsWith(`_${UF}.csv`), (f, c) => {
    const turno = num(f[c.NR_TURNO]);
    const mun = pad5(f[c.CD_MUNICIPIO]);
    const zona = num(f[c.NR_ZONA]);
    const secao = num(f[c.NR_SECAO]);
    const nr = num(f[c.NR_LOCAL_VOTACAO]);
    const id = `${mun}-${zona}-${nr}`;
    const chave = `${turno}|${mun}-${zona}-${secao}`;
    secaoLocal.set(chave, id);
    eleitoradoSecao.set(chave, num(f[c.QT_ELEITOR_SECAO]));
    if (turno !== 1 && locais.has(id)) return;
    let l = locais.get(id);
    if (!l) {
      l = { id, mun, ibge: ibgeDe.get(mun) ?? '', zona, nr, nome: f[c.NM_LOCAL_VOTACAO], bairro: f[c.NM_BAIRRO], lon: coord(f[c.NR_LONGITUDE]), lat: coord(f[c.NR_LATITUDE]), eleitorado: 0 };
      locais.set(id, l);
    }
    if (turno === 1) l.eleitorado += num(f[c.QT_ELEITOR_SECAO]);
  });

  // 2) votos por seção → acumuladores por (cargo, turno) × (zona | local)
  const base = new Map(); // `${cargo}/${t}` → arquivo base (candidatos/partidos)
  const lerBase = (cargo, t) => {
    const k = `${cargo}/${t}`;
    if (!base.has(k)) {
      const p = join(DADOS, cargo, String(t), cargo === 'presidente' ? 'br.json' : `${uf}.json`);
      base.set(k, existsSync(p) ? JSON.parse(readFileSync(p, 'utf8')) : null);
    }
    return base.get(k);
  };
  const acc = new Map(); // `${cargo}/${t}` → { zonas: Map, locais: Map, idxC: Map, idxP: Map, prop, vagas }
  const secoesContadas = new Map(); // eleitorado por unidade conta cada seção uma vez por cargo
  await lerCsvDoZip(join(CACHE, `votacao_secao_2026_${UF}.zip`), (n) => n.endsWith('.csv'), (f, c) => {
    const cg = cargoDe(num(f[c.CD_ELEICAO]), num(f[c.CD_CARGO]));
    if (!cg) return;
    const [cargo, t] = cg;
    const chaveCargo = `${cargo}/${t}`;
    let a = acc.get(chaveCargo);
    if (!a) {
      const b = lerBase(cargo, t);
      if (!b) return;
      a = {
        b, zonas: new Map(), locais: new Map(),
        idxC: new Map(b.cands.map((x, i) => [String(num(x.n)), i])),
        idxP: new Map(b.partidos.map((x, i) => [String(num(x.n)), i])),
        prop: b.tipo === 'prop', vagas: cargo === 'senador' ? Math.max(1, b.vagas || 1) : 1,
      };
      acc.set(chaveCargo, a);
    }
    const turno = num(f[c.NR_TURNO]);
    const mun = pad5(f[c.CD_MUNICIPIO]);
    const zona = num(f[c.NR_ZONA]);
    const secao = num(f[c.NR_SECAO]);
    const chaveSecao = `${turno}|${mun}-${zona}-${secao}`;
    const localId = secaoLocal.get(chaveSecao) ?? `${mun}-${zona}-${num(f[c.NR_LOCAL_VOTACAO])}`;
    const votavel = num(f[c.NR_VOTAVEL]);
    const votos = num(f[c.QT_VOTOS]);
    for (const [mapa, id] of [[a.zonas, String(zona)], [a.locais, localId]]) {
      let r = mapa.get(id);
      if (!r) {
        r = { t: [0, 0, 0, 0, 0, 0], c: a.prop ? null : new Array(a.b.cands.length).fill(0), p: a.prop ? new Array(a.b.partidos.length).fill(0) : null, votosTotais: 0 };
        mapa.set(id, r);
      }
      const marca = `${chaveCargo}|${id}|${chaveSecao}`;
      if (!secoesContadas.has(marca)) { secoesContadas.set(marca, 1); r.t[0] += eleitoradoSecao.get(chaveSecao) ?? 0; }
      r.votosTotais += votos;
      if (votavel === 95) r.t[4] += votos;
      else if (votavel === 96 || votavel === 97) r.t[5] += votos;
      else if (a.prop) {
        const partido = String(votavel).length <= 2 ? String(votavel) : String(votavel).slice(0, 2);
        const i = a.idxP.get(partido);
        if (i !== undefined) { r.p[i] += votos; r.t[3] += votos; }
      } else {
        const i = a.idxC.get(String(votavel));
        if (i !== undefined) { r.c[i] += votos; r.t[3] += votos; }
      }
    }
  });
  secoesContadas.clear();

  // 3) grava resultados
  const gravar = (rel, obj) => {
    const p = join(DADOS, rel);
    mkdirSync(join(p, '..'), { recursive: true });
    writeFileSync(p, JSON.stringify(obj));
  };
  for (const [chaveCargo, a] of acc) {
    for (const nivel of ['zonas', 'locais']) {
      const mun = {};
      const tot = { t: [0, 0, 0, 0, 0, 0], c: new Array(a.b.cands.length).fill(0), p: new Array(a.b.partidos.length).fill(0) };
      for (const [id, r] of a[nivel]) {
        r.t[1] = Math.round(r.votosTotais / a.vagas); // comparecimento
        r.t[2] = Math.max(0, r.t[0] - r.t[1]); // abstenção
        if (a.vagas > 1) { r.t[4] = Math.round(r.t[4] / a.vagas); r.t[5] = Math.round(r.t[5] / a.vagas); }
        const reg = { t: r.t, c: a.prop ? [] : r.c };
        if (a.prop) reg.p = r.p;
        mun[id] = reg;
        r.t.forEach((x, i) => (tot.t[i] += x));
        if (!a.prop) r.c.forEach((x, i) => (tot.c[i] += x));
        else r.p.forEach((x, i) => (tot.p[i] += x));
      }
      const { mun: _m, total: _t, ...cab } = a.b;
      void _m; void _t;
      gravar(`${chaveCargo}/${nivel}/${uf}.json`, { ...cab, abr: uf, nivel, porPartido: a.prop, total: tot, mun });
    }
  }

  // 4) cadastro dos locais (pontos)
  const lista = [...locais.values()].sort((x, y) => x.id.localeCompare(y.id));
  mkdirSync('public/geo/locais', { recursive: true });
  writeFileSync(`public/geo/locais/${uf}.json`, JSON.stringify({
    campos: ['id', 'ibge', 'zona', 'nome', 'bairro', 'lon', 'lat', 'eleitorado'],
    l: lista.map((l) => [l.id, l.ibge, l.zona, l.nome, l.bairro, l.lon === null ? null : +l.lon.toFixed(5), l.lat === null ? null : +l.lat.toFixed(5), l.eleitorado]),
  }));

  // 5) áreas das zonas: município inteiro quando tem uma zona; Voronoi dos locais recortado quando tem várias
  const topoUf = JSON.parse(readFileSync(`public/geo/uf/${uf}.json`, 'utf8'));
  const muniFc = feature(topoUf, topoUf.objects.municipios);
  const porMunicipio = new Map();
  for (const l of lista) {
    if (!porMunicipio.has(l.ibge)) porMunicipio.set(l.ibge, []);
    porMunicipio.get(l.ibge).push(l);
  }
  const partesZona = new Map(); // zona → array de polígonos (coords polygon-clipping)
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
    // eleitorado por zona no município (zona sem coordenada válida herda nada; recebe área só se tiver pontos)
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
    const zonasComPonto = new Set(zonaDoPonto);
    if (zonasComPonto.size <= 1) {
      // sem como separar: município vai para a zona com mais eleitores
      const elet = new Map();
      for (const l of ls) elet.set(l.zona, (elet.get(l.zona) ?? 0) + l.eleitorado);
      addParte([...elet.entries()].sort((a, b) => b[1] - a[1])[0][0], geom);
      continue;
    }
    let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
    for (const p of geom) for (const r of p) for (const [x, y] of r) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
    for (const [x, y] of pontos) { x0 = Math.min(x0, x); y0 = Math.min(y0, y); x1 = Math.max(x1, x); y1 = Math.max(y1, y); }
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

  console.log(`${uf}: ${locais.size} locais, ${partesZona.size} zonas, ${acc.size} cargos/turnos (${((Date.now() - t0) / 1000).toFixed(0)}s)`);
}
