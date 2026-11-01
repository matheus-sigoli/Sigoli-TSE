/**
 * Sigoli.TSE — núcleo do processamento dos resultados do TSE.
 *
 * Código puro (sem fs/rede): transforma os JSONs oficiais do TSE
 * (`resultados.tse.jus.br/oficial/ele2026/...-u.json`) nos arquivos compactos
 * que o site consome. Usado por `scripts/processar-tse.mjs`.
 *
 * Formato de saída — ver docs/adr/0007-formato-dos-dados.md.
 */

export const CICLO = 'ele2026';
export const BASE_TSE = 'https://resultados.tse.jus.br/oficial';

/** Eleições de 2026: código TSE por turno. */
export const ELEICOES = {
  federal: { 1: 6257, 2: 6258 },
  estadual: { 1: 6259, 2: 6260 },
};

/**
 * Cargos do site. `cd` = código TSE; `cdDF` = código no DF quando difere.
 * `tipo`: 'maj' (majoritário) ou 'prop' (proporcional).
 */
export const CARGOS = [
  { slug: 'presidente', nome: 'Presidente', cd: 1, eleicao: 'federal', tipo: 'maj', turnos: [1, 2] },
  { slug: 'governador', nome: 'Governador', cd: 3, eleicao: 'estadual', tipo: 'maj', turnos: [1, 2] },
  { slug: 'senador', nome: 'Senador', cd: 5, eleicao: 'estadual', tipo: 'maj', turnos: [1] },
  { slug: 'deputado-federal', nome: 'Deputado Federal', cd: 6, eleicao: 'estadual', tipo: 'prop', turnos: [1] },
  { slug: 'deputado-estadual', nome: 'Deputado Estadual', cd: 7, cdDF: 8, eleicao: 'estadual', tipo: 'prop', turnos: [1] },
];

export const UFS = [
  'ac', 'al', 'ap', 'am', 'ba', 'ce', 'df', 'es', 'go', 'ma', 'mt', 'ms', 'mg', 'pa',
  'pb', 'pr', 'pe', 'pi', 'rj', 'rn', 'rs', 'ro', 'rr', 'sc', 'sp', 'se', 'to',
];

const pad = (n, w) => String(n).padStart(w, '0');

export function codigoCargo(cargo, uf) {
  return uf === 'df' && cargo.cdDF ? cargo.cdDF : cargo.cd;
}

export function urlConfigMunicipios(eleicao) {
  return `${BASE_TSE}/${CICLO}/${eleicao}/config/mun-e${pad(eleicao, 6)}-cm.json`;
}

/** abr: 'br', uma UF ('sp') ou UF + município TSE ('sp71072'). */
export function urlResultado(eleicao, cdCargo, uf, munTse = '') {
  const pasta = uf;
  return `${BASE_TSE}/${CICLO}/${eleicao}/dados/${pasta}/${uf}${munTse}-c${pad(cdCargo, 4)}-e${pad(eleicao, 6)}-u.json`;
}

// ------------------------------------------------------------------ leitura
const int = (s) => (s === undefined || s === null || s === '' ? 0 : parseInt(String(s), 10) || 0);

/**
 * Normaliza um arquivo `-u.json` do TSE.
 * Retorna totais, candidatos (com votos) e partidos (votos nominais + legenda).
 */
export function normalizar(raw) {
  const e = raw.e ?? {};
  const v = raw.v ?? {};
  const carg = raw.carg?.[0];
  if (!carg) throw new Error(`arquivo sem cargo (abr ${raw.cdabr})`);
  const federacoes = new Map((carg.fed ?? []).map((f) => [f.n, f.sg]));
  const candidatos = [];
  const partidos = [];
  for (const agr of carg.agr ?? []) {
    const coligacao = agr.tp === 'c' ? agr.nm : '';
    for (const par of agr.par ?? []) {
      let nominais = 0;
      for (const c of par.cand ?? []) {
        const votos = int(c.vap);
        nominais += votos;
        candidatos.push({
          id: c.sqcand,
          n: c.n,
          nome: c.nmu || c.nm,
          nomeCompleto: c.nm,
          partido: par.sg,
          eleito: c.e === 's',
          situacao: c.st ?? '',
          vice: c.vs?.[0]?.nmu ?? '',
          votos,
        });
      }
      partidos.push({
        sg: par.sg,
        n: par.n,
        fed: par.nfed ? federacoes.get(par.nfed) ?? '' : '',
        coligacao,
        votos: nominais + int(par.tval ?? par.tvtl),
      });
    }
  }
  return {
    eleicao: int(raw.ele),
    turno: int(raw.t),
    tipoAbr: raw.tpabr,
    abr: raw.cdabr,
    vagas: int(carg.nv),
    atualizado: `${raw.dg ?? ''} ${raw.hg ?? ''}`.trim(),
    totais: {
      eleitorado: int(e.te),
      comparecimento: int(e.c),
      abstencao: int(e.a),
      validos: int(v.vv),
      brancos: int(v.vb),
      nulos: int(v.tvn ?? v.vn),
    },
    candidatos,
    partidos,
  };
}

// ------------------------------------------------------------------ montagem
const T = (t) => [t.eleitorado, t.comparecimento, t.abstencao, t.validos, t.brancos, t.nulos];

/**
 * Monta o arquivo de saída de uma abrangência (UF, 'br' ou 'zz').
 * @param {object} cargo        item de CARGOS
 * @param {number} turno
 * @param {string} abr          'br' | uf | 'zz'
 * @param {object} total        normalizar() do arquivo da abrangência
 * @param {Map<string, object>} municipios  chave do município (IBGE; TSE no exterior) → normalizar()
 */
export function montarArquivo(cargo, turno, abr, total, municipios) {
  // ordem final: por votos na abrangência
  const cands = [...total.candidatos].sort((a, b) => b.votos - a.votos);
  const idxC = new Map(cands.map((c, i) => [c.id, i]));
  const parts = [...total.partidos].sort((a, b) => b.votos - a.votos);
  const idxP = new Map(parts.map((p, i) => [p.sg, i]));
  const prop = cargo.tipo === 'prop';

  const mun = {};
  for (const [chave, m] of municipios) {
    const reg = { t: T(m.totais) };
    if (prop) {
      const c = [];
      for (const x of m.candidatos) {
        if (x.votos > 0 && idxC.has(x.id)) c.push(idxC.get(x.id), x.votos);
      }
      reg.c = c; // esparso: [índice, votos, índice, votos, ...]
      reg.p = new Array(parts.length).fill(0);
      for (const p of m.partidos) if (idxP.has(p.sg)) reg.p[idxP.get(p.sg)] = p.votos;
    } else {
      reg.c = new Array(cands.length).fill(0);
      for (const x of m.candidatos) if (idxC.has(x.id)) reg.c[idxC.get(x.id)] = x.votos;
    }
    mun[chave] = reg;
  }

  return {
    v: 1,
    cargo: cargo.slug,
    turno,
    abr,
    tipo: cargo.tipo,
    vagas: total.vagas,
    atualizado: total.atualizado,
    cands: cands.map((c) => ({
      id: c.id,
      n: c.n,
      nome: c.nome,
      partido: c.partido,
      eleito: c.eleito,
      situacao: c.situacao,
      ...(c.vice ? { vice: c.vice } : {}),
    })),
    partidos: parts.map((p) => ({ sg: p.sg, n: p.n, ...(p.fed ? { fed: p.fed } : {}), ...(p.coligacao ? { col: p.coligacao } : {}) })),
    total: { t: T(total.totais), c: cands.map((c) => c.votos), p: parts.map((p) => p.votos) },
    mun,
  };
}

/**
 * Vencedor de um município num arquivo montado.
 * Majoritário: candidato com mais votos. Proporcional: partido com mais votos.
 * Retorna { idx, votos, pct } com pct em 0..1 sobre válidos, ou null.
 */
export function vencedor(arquivo, reg) {
  const validos = reg.t[3];
  if (!validos) return null;
  const v = arquivo.tipo === 'prop' ? reg.p : reg.c;
  let idx = -1, max = -1;
  for (let i = 0; i < v.length; i++) if (v[i] > max) { max = v[i]; idx = i; }
  return idx < 0 || max <= 0 ? null : { idx, votos: max, pct: max / validos };
}

/**
 * Resumo nacional de um cargo estadual (Visão Brasil): vencedor por município
 * e eleitos por UF. Entrada: lista de arquivos montados por UF.
 */
export function montarResumoBrasil(cargo, turno, arquivosUf) {
  const legenda = []; // siglas de partido usadas
  const idxL = new Map();
  const sigla = (sg) => {
    if (!idxL.has(sg)) { idxL.set(sg, legenda.length); legenda.push(sg); }
    return idxL.get(sg);
  };
  const mun = {};
  const eleitos = {};
  const t = [0, 0, 0, 0, 0, 0];
  for (const a of arquivosUf) {
    a.total.t.forEach((x, i) => (t[i] += x));
    eleitos[a.abr] = a.cands
      .map((c, i) => ({ ...c, votos: a.total.c[i] }))
      .filter((c) => c.eleito || (cargo.tipo === 'maj' && /2º turno/i.test(c.situacao)))
      .map((c) => ({ nome: c.nome, partido: c.partido, n: c.n, votos: c.votos, eleito: c.eleito, situacao: c.situacao }));
    for (const [ibge, reg] of Object.entries(a.mun)) {
      const w = vencedor(a, reg);
      if (!w) continue;
      const partido = a.tipo === 'prop' ? a.partidos[w.idx].sg : a.cands[w.idx].partido;
      const nome = a.tipo === 'prop' ? '' : a.cands[w.idx].nome;
      mun[ibge] = [sigla(partido), Math.round(w.pct * 1000), nome];
    }
  }
  return { v: 1, cargo: cargo.slug, turno, abr: 'br', tipo: cargo.tipo, resumo: true, partidos: legenda, total: { t }, eleitos, mun };
}
