#!/usr/bin/env node
/**
 * Sigoli.TSE — Presidente de 1998 pelo SIG Eleição do TSE (ADR 0015).
 *
 * Os dados abertos de 1998 não têm o Presidente por candidato (nem por município, nem por partido). O SIG tem:
 * votos de cada candidato por município (nome do município, sem código) e por zona (UF + zona, a zona inteira).
 * Os totais (aptos, comparecimento, válidos, brancos, nulos) vêm do detalhe por município e zona dos dados abertos.
 *
 *   - município: casa o nome do SIG com o do detalhe (mesma UF); exterior (ZZ) pelo nome da cidade;
 *   - zona da cidade (zonas-cidade): o grafo município × zona de 1998 é uma floresta (cada ciclo exigiria duas cidades
 *     dividindo duas zonas); então os votos de cada par saem exatos, descascando: município com uma zona só leva o
 *     total dele para a zona; zona com um município só restante leva o que sobra da zona; e assim por diante.
 *
 * Uso: node scripts/sig-presidente.mjs --ano 1998   (depois de ano-tse.mjs; grava presidente/1/{br,zz}.json e as zonas)
 */
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import yauzl from 'yauzl';
import { CARGOS, ehEleito, montarArquivo } from './lib/nucleo.mjs';
import { CDN, baixar, lerCsvDoZip, num, pad5, texto } from './lib/dadosabertos.mjs';
import { normalizar } from './lib/texto.mjs';
import { fusoesDoAno } from './lib/fusoes.mjs';

const argv = process.argv.slice(2);
const ANO = Number(argv[argv.indexOf('--ano') + 1]);
const CACHE = '.cache/dadosabertos';
const SAIDA = `public/data/${ANO}`;
const sig = JSON.parse(readFileSync(`data/sig/${ANO}.json`, 'utf8'));
const zipMun = join(CACHE, `sig_presidente_municipio_${ANO}.zip`), zipZona = join(CACHE, `sig_presidente_zona_${ANO}.zip`);
await baixar(sig.municipio, zipMun);
await baixar(sig.zona, zipZona);
const zipDet = join(CACHE, `detalhe_votacao_munzona_${ANO}.zip`);
const zipCons = join(CACHE, `consulta_cand_${ANO}.zip`);
await baixar(`${CDN}/detalhe_votacao_munzona/detalhe_votacao_munzona_${ANO}.zip`, zipDet);
await baixar(`${CDN}/consulta_cand/consulta_cand_${ANO}.zip`, zipCons);
const cargo = CARGOS.find((c) => c.slug === 'presidente');
const ordinaria = (dt) => new RegExp(`^\\d{2}/${ANO === 1994 ? "1[01]" : "10"}/${ANO}$`).test(String(dt).trim()); // 1994: 2º turno em 15/11

/** CSV do SIG (latin1, ";", sem aspas; alguns nomes têm quebra de linha no meio): junta até ter todos os campos */
function lerSig(zip) {
  return new Promise((ok, erro) => yauzl.open(zip, { lazyEntries: true }, (e, z) => {
    if (e) return erro(e);
    z.on('entry', (en) => z.openReadStream(en, (e2, s) => {
      if (e2) return erro(e2);
      const partes = [];
      s.on('data', (b) => partes.push(b));
      s.on('end', () => {
        const linhas = Buffer.concat(partes).toString('latin1').split(/\n/);
        const cab = linhas.shift().replace(/\r$/, '').split(';');
        const n = cab.length, regs = [];
        let acc = '';
        for (const l of linhas) {
          acc = acc ? `${acc} ${l}` : l;
          const f = acc.replace(/\r/g, ' ').split(';');
          if (f.length < n) continue;
          regs.push(Object.fromEntries(cab.map((k, i) => [k, (f[i] ?? '').trim()])));
          acc = '';
        }
        ok(regs);
      });
    }));
    z.readEntry();
  }));
}

// municípios: IBGE pelo código TSE; nomes do detalhe (o SIG só tem o nome)
const mun2026 = JSON.parse(readFileSync('public/data/2026/municipios.json', 'utf8'));
const ibgeDe = new Map(mun2026.filter((m) => m.uf !== 'zz').map((m) => [m.tse, m.ibge]));
const origem = new Map(fusoesDoAno(ANO).map((f) => [f.novo, f.origem]));
const porNome = new Map(); // `${uf}|${nome}` → chave (IBGE no Brasil, código TSE no exterior)
const totMun = new Map(), totPar = new Map(); // chave → [6], `${ibge}-${zona}` → [6]
const ufDaChave = new Map();
let atualizado = '';
await lerCsvDoZip(zipDet, (n) => /_BR\.csv$/i.test(n), (f, c) => {
  if (!ordinaria(f[c.DT_ELEICAO]) || num(f[c.CD_CARGO]) !== 1 || num(f[c.NR_TURNO]) !== 1) return;
  atualizado ||= `${f[c.DT_GERACAO]} ${f[c.HH_GERACAO]}`;
  const uf = String(f[c.SG_UF]).toLowerCase();
  const tse = pad5(f[c.CD_MUNICIPIO]);
  const chave = uf === 'zz' ? tse : ibgeDe.get(tse);
  if (!chave) return;
  porNome.set(`${uf}|${normalizar(f[c.NM_MUNICIPIO])}`, chave);
  ufDaChave.set(chave, uf);
  const t = [num(f[c.QT_APTOS]), num(f[c.QT_COMPARECIMENTO]), num(f[c.QT_ABSTENCOES]), num(f[c.QT_TOTAL_VOTOS_VALIDOS]), num(f[c.QT_VOTOS_BRANCOS]), num(f[c.QT_TOTAL_VOTOS_NULOS])];
  const soma = (m, k) => { const a = m.get(k) ?? [0, 0, 0, 0, 0, 0]; t.forEach((x, i) => (a[i] += x)); m.set(k, a); };
  soma(totMun, chave);
  if (uf !== 'zz') soma(totPar, `${chave}-${num(f[c.NR_ZONA])}`);
});
console.log(`detalhe: ${totMun.size} municípios/cidades, ${totPar.size} pares município-zona`);

// vices
const vices = new Map();
await lerCsvDoZip(zipCons, (n) => /_BR\.csv$/i.test(n), (f, c) => {
  if (!ordinaria(f[c.DT_ELEICAO]) || num(f[c.CD_CARGO]) !== 2) return;
  vices.set(String(num(f[c.NR_CANDIDATO])).slice(0, 2), [{ tipo: 'v', nome: texto(f[c.NM_URNA_CANDIDATO]) || texto(f[c.NM_CANDIDATO]), partido: texto(f[c.SG_PARTIDO]) }]);
});

// candidatos e votos por município (SIG)
const situacao = (s) => ({ 'ELEITO': 'Eleito', 'NÃO ELEITO': 'Não eleito', 'NAO ELEITO': 'Não eleito', '2º TURNO': '2º turno', 'SEGUNDO TURNO': '2º turno' })[texto(s).toUpperCase()] ?? texto(s);
const cands = new Map();
const votosMun = new Map(); // chave → Map(nr → votos)
const semCasar = new Set();
for (const r of await lerSig(zipMun)) {
  const nr = String(num(r.nr_candidato));
  if (!cands.has(nr)) {
    const comp = texto(r.ds_composicao_coligacao);
    const coligacao = comp.includes('/');
    cands.set(nr, { id: nr, n: nr, nome: texto(r.nm_urna_candidato) || texto(r.nm_candidato), partido: texto(r.sg_partido), situacao: situacao(r.ds_sit_totalizacao), col: '', comp: coligacao ? comp : '', vices: vices.get(nr) ?? [], votos: 0 });
  }
  const uf = r.sg_uf.toLowerCase();
  const chave = porNome.get(`${uf}|${normalizar(r.nm_municipio)}`);
  if (!chave) { semCasar.add(`${r.sg_uf} ${r.nm_municipio}`); continue; }
  const v = num(r.qt_votos_nom_validos);
  cands.get(nr).votos += v;
  const m = votosMun.get(chave) ?? new Map();
  m.set(nr, (m.get(nr) ?? 0) + v);
  votosMun.set(chave, m);
}
if (semCasar.size) console.warn(`municípios do SIG sem par no detalhe: ${[...semCasar].join(', ')}`);
for (const k of cands.values()) k.eleito = ehEleito(k.situacao);
const lista = [...cands.values()];
console.log(`candidatos: ${lista.map((k) => `${k.nome} ${k.votos}`).join(' | ')}`);

const totais = (t) => ({ eleitorado: t[0], comparecimento: t[1], abstencao: t[2], validos: t[3], brancos: t[4], nulos: t[5] });
const somaT = (ts) => ts.reduce((a, t) => a.map((x, i) => x + t[i]), [0, 0, 0, 0, 0, 0]);
function arquivo(abr, regsTot, votos) {
  const regs = new Map();
  for (const [ch, t] of regsTot) regs.set(ch, { totais: totais(t), candidatos: lista.map((k) => ({ id: k.id, votos: votos.get(ch)?.get(k.n) ?? 0 })), partidos: [] });
  const doTotal = lista.map((k) => ({ ...k, votos: [...regs.values()].reduce((s, r) => s + r.candidatos.find((x) => x.id === k.id).votos, 0) }));
  return montarArquivo(cargo, 1, abr, { vagas: 1, atualizado, totais: totais(somaT([...regsTot.values()])), candidatos: doTotal, partidos: [] }, regs);
}
const gravar = (rel, obj) => { const p = join(SAIDA, rel); mkdirSync(join(p, '..'), { recursive: true }); writeFileSync(p, JSON.stringify(obj)); };

// Brasil (sem o exterior no mapa; o total nacional soma o exterior, como o TSE)
const brTot = new Map([...totMun].filter(([ch]) => ufDaChave.get(ch) !== 'zz'));
const zzTot = new Map([...totMun].filter(([ch]) => ufDaChave.get(ch) === 'zz'));
const br = arquivo('br', brTot, votosMun);
if (zzTot.size) {
  const zz = arquivo('zz', zzTot, votosMun);
  gravar('presidente/1/zz.json', zz);
  br.total.t = br.total.t.map((x, i) => x + zz.total.t[i]);
  br.total.c = br.total.c.map((x, i) => x + (zz.total.c[zz.cands.findIndex((k) => k.id === br.cands[i].id)] ?? 0));
}
gravar('presidente/1/br.json', br);
console.log(`presidente/1/br.json: válidos ${br.total.t[3]}; ${br.cands.slice(0, 4).map((k, i) => `${k.nome} ${br.total.c[i]}`).join(' | ')}`);

// zonas: SIG por UF + zona; pares município-zona pelo detalhe; descasca a floresta
const votosZona = new Map(); // `${uf}|${zona}` → Map(nr → votos)
for (const r of await lerSig(zipZona)) {
  const uf = r.sg_uf.toLowerCase();
  if (uf === 'zz') continue;
  const k = `${uf}|${num(r.nr_zona)}`;
  const m = votosZona.get(k) ?? new Map();
  m.set(String(num(r.nr_candidato)), (m.get(String(num(r.nr_candidato))) ?? 0) + num(r.qt_votos_nom_validos));
  votosZona.set(k, m);
}
const porUf = new Map();
for (const par of totPar.keys()) { const uf = ufDaChave.get(par.split('-')[0]); (porUf.get(uf) ?? porUf.set(uf, []).get(uf)).push(par); }
let ciclos = 0, divergencias = 0;
for (const [uf, pares] of porUf) {
  const resto = new Map(); // nó (m:ibge | z:zona) → Map(nr → votos que faltam distribuir)
  const copia = (m) => new Map(m ?? []);
  const arestas = new Map(); // nó → Set(pares ainda sem valor)
  for (const par of pares) {
    const [ib, z] = par.split('-');
    resto.set(`m:${ib}`, resto.get(`m:${ib}`) ?? copia(votosMun.get(ib)));
    resto.set(`z:${z}`, resto.get(`z:${z}`) ?? copia(votosZona.get(`${uf}|${z}`)));
    for (const no of [`m:${ib}`, `z:${z}`]) (arestas.get(no) ?? arestas.set(no, new Set()).get(no)).add(par);
  }
  const valor = new Map();
  let mudou = true;
  while (mudou) {
    mudou = false;
    for (const [no, s] of arestas) {
      if (s.size !== 1) continue;
      const [par] = s;
      const [ib, z] = par.split('-');
      const v = new Map(resto.get(no));
      valor.set(par, v);
      for (const outro of [`m:${ib}`, `z:${z}`]) {
        arestas.get(outro).delete(par);
        if (outro !== no) for (const [nr, x] of v) resto.get(outro).set(nr, (resto.get(outro).get(nr) ?? 0) - x);
      }
      mudou = true;
    }
  }
  // sobra (ciclo): divide pelo total de válidos do detalhe
  for (const [no, s] of arestas) for (const par of s) {
    if (valor.has(par)) continue;
    ciclos++;
    const pesos = [...s].map((p) => totPar.get(p)[3]); const soma = pesos.reduce((a, b) => a + b, 0) || 1;
    const v = new Map([...resto.get(no)].map(([nr, x]) => [nr, Math.round((x * totPar.get(par)[3]) / soma)]));
    valor.set(par, v);
  }
  for (const [par, v] of valor) { const s = [...v.values()].reduce((a, b) => a + b, 0); if (s !== totPar.get(par)[3]) divergencias++; }
  const regsTot = new Map(pares.map((p) => [p, totPar.get(p)]));
  const arq = arquivo(uf, regsTot, valor);
  gravar(`presidente/1/zonas-cidade/${uf}.json`, arq);
  // zona inteira
  const zt = new Map();
  for (const p of pares) { const z = p.split('-')[1]; zt.set(z, somaT([zt.get(z) ?? [0, 0, 0, 0, 0, 0], totPar.get(p)])); }
  const zv = new Map([...zt.keys()].map((z) => [z, votosZona.get(`${uf}|${z}`) ?? new Map()]));
  gravar(`presidente/1/zonas/${uf}.json`, arquivo(uf, zt, zv));
}
console.log(`zonas: ${totPar.size} pares; ${ciclos} em ciclo (divididos pelos válidos); ${divergencias} pares com soma diferente dos válidos do detalhe`);
