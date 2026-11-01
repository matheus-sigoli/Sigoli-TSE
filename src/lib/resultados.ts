/**
 * Cálculo do que a tela mostra: totais do recorte, lista de concorrentes,
 * cor de cada município (modo vencedor ou modo calor) e legenda.
 * Funções puras — fáceis de testar e de memorizar.
 */
import { atribuirCores, corDaFaixa, NEUTRO, SEM_DADOS, type Faixas } from './cores';
import type { Arquivo, ArquivoResultado, ArquivoResumo, Municipio, Totais } from './dominio';

export const CODIGO_UF: Record<string, string> = {
  '11': 'ro', '12': 'ac', '13': 'am', '14': 'rr', '15': 'pa', '16': 'ap', '17': 'to', '21': 'ma',
  '22': 'pi', '23': 'ce', '24': 'rn', '25': 'pb', '26': 'pe', '27': 'al', '28': 'se', '29': 'ba',
  '31': 'mg', '32': 'es', '33': 'rj', '35': 'sp', '41': 'pr', '42': 'sc', '43': 'rs', '50': 'ms',
  '51': 'mt', '52': 'go', '53': 'df',
};
export const ufDoIbge = (ibge: string) => CODIGO_UF[ibge.slice(0, 2)];

/** Concorrente exibido no painel. */
export interface Linha {
  chave: string; // 'c:3' ou 'p:5'
  numero: string;
  nome: string;
  partido: string;
  votos: number;
  pct: number; // sobre válidos
  eleito?: boolean;
  segundoTurno?: boolean;
  vices?: { tipo: string; nome: string; partido: string }[];
  anulado?: string;
  coligacao?: string;
  composicao?: string;
  /** federação do partido (proporcional) */
  federacao?: string;
  faixas: Faixas;
}

export type Foco = { tipo: 'c' | 'p'; idx: number } | null;

export interface Recorte {
  /** abrangência da tela */
  abr: string;
  /** municípios (chaves do arquivo) que compõem o recorte; null = abrangência inteira */
  municipios: Set<string> | null;
}

export interface Visao {
  tipo: 'maj' | 'prop' | 'resumo';
  totais: Totais;
  candidatos: Linha[];
  partidos: Linha[];
  /** chave do município (ou país, no exterior) → cor */
  cores: Map<string, string>;
  /** faixas usadas na legenda */
  legenda: { rotulo: string; faixas: Faixas }[];
  eleitosPorUf?: ArquivoResumo['eleitos'];
  partidosResumo?: string[];
}

const zero = (): Totais => [0, 0, 0, 0, 0, 0];
const somaT = (a: Totais, b: Totais) => { for (let i = 0; i < 6; i++) a[i] += b[i]; };

/** Municípios do arquivo que pertencem à abrangência da tela. */
export function chavesDaAbrangencia(arq: ArquivoResultado, abr: string): string[] {
  const todas = Object.keys(arq.mun);
  if (abr === 'br' || abr === 'exterior' || arq.abr === abr) return todas;
  return todas.filter((k) => ufDoIbge(k) === abr);
}

export function calcularVisao(
  arq: Arquivo,
  recorte: Recorte,
  opcoes: { daltonico: boolean; foco: Foco; municipios?: Municipio[] },
): Visao {
  if (arq.resumo) return visaoResumo(arq, recorte, opcoes.daltonico);
  return visaoCompleta(arq, recorte, opcoes);
}

function visaoCompleta(
  arq: ArquivoResultado,
  recorte: Recorte,
  { daltonico, foco, municipios }: { daltonico: boolean; foco: Foco; municipios?: Municipio[] },
): Visao {
  const prop = arq.tipo === 'prop';
  const chavesTela = chavesDaAbrangencia(arq, recorte.abr);
  const chavesRecorte = recorte.municipios ? chavesTela.filter((k) => recorte.municipios!.has(k)) : chavesTela;
  const usaTotalOficial = !recorte.municipios && (arq.abr === recorte.abr || (recorte.abr === 'exterior' && arq.abr === 'zz'));

  // ---- somas do recorte
  let totais: Totais;
  let votosC: number[];
  let votosP: number[];
  if (usaTotalOficial) {
    totais = [...arq.total.t] as Totais;
    votosC = arq.total.c;
    votosP = arq.total.p;
  } else {
    totais = zero();
    votosC = new Array(arq.cands.length).fill(0);
    votosP = new Array(arq.partidos.length).fill(0);
    for (const k of chavesRecorte) {
      const r = arq.mun[k];
      if (!r) continue;
      somaT(totais, r.t);
      if (prop) {
        for (let i = 0; i < r.c.length; i += 2) votosC[r.c[i]] += r.c[i + 1];
        r.p?.forEach((v, i) => (votosP[i] += v));
      } else r.c.forEach((v, i) => (votosC[i] += v));
    }
  }
  const validos = totais[3] || 1;

  // ---- cores: majoritário por candidato (cor do partido), proporcional por partido
  const ordemC = arq.cands.map((_, i) => i).sort((a, b) => votosC[b] - votosC[a]);
  const ordemP = arq.partidos.map((_, i) => i).sort((a, b) => votosP[b] - votosP[a]);
  const coresC: Faixas[] = new Array(arq.cands.length);
  const coresP: Faixas[] = new Array(arq.partidos.length);
  if (prop) {
    atribuirCores(ordemP.map((i) => arq.partidos[i].sg), daltonico).forEach((f, k) => (coresP[ordemP[k]] = f));
    // candidato herda a cor do partido
    const porSigla = new Map(arq.partidos.map((p, i) => [p.sg, coresP[i]]));
    arq.cands.forEach((c, i) => (coresC[i] = porSigla.get(c.partido) ?? NEUTRO));
  } else {
    atribuirCores(ordemC.map((i) => arq.cands[i].partido), daltonico).forEach((f, k) => (coresC[ordemC[k]] = f));
  }

  const candidatos: Linha[] = ordemC
    .filter((i) => votosC[i] > 0 || !prop)
    .map((i) => {
      const c = arq.cands[i];
      return {
        chave: `c:${i}`, numero: c.n, nome: c.nome, partido: c.partido, votos: votosC[i], pct: votosC[i] / validos,
        eleito: c.eleito, segundoTurno: /2º turno/i.test(c.situacao), vices: c.vices, anulado: c.anulado, coligacao: c.col, composicao: c.comp, faixas: coresC[i],
      };
    });
  const partidos: Linha[] = prop
    ? ordemP.filter((i) => votosP[i] > 0).map((i) => {
        const p = arq.partidos[i];
        return { chave: `p:${i}`, numero: p.n, nome: p.sg, partido: p.sg, federacao: p.fed, votos: votosP[i], pct: votosP[i] / validos, faixas: coresP[i] };
      })
    : [];

  // ---- cor de cada município da tela
  const cores = new Map<string, string>();
  const corDe = (r: (typeof arq.mun)[string]) => {
    const v = r.t[3];
    if (!v) return SEM_DADOS;
    if (foco) {
      const votos = foco.tipo === 'p'
        ? (r.p?.[foco.idx] ?? 0)
        : prop ? votosEsparso(r.c, foco.idx) : r.c[foco.idx];
      const faixas = foco.tipo === 'p' ? coresP[foco.idx] : coresC[foco.idx];
      return votos > 0 ? corDaFaixa(faixas, votos / v) : NEUTRO['10'];
    }
    const lista = prop ? r.p! : r.c;
    let idx = -1, max = 0;
    for (let i = 0; i < lista.length; i++) {
      if (!prop && arq.cands[i]?.anulado) continue; // votos anulados não vencem
      if (lista[i] > max) { max = lista[i]; idx = i; }
    }
    if (idx < 0) return SEM_DADOS;
    return corDaFaixa(prop ? coresP[idx] : coresC[idx], max / v);
  };

  if (recorte.abr === 'exterior' && municipios) {
    // agrega cidades por país (código ISO numérico da malha mundial)
    const porPais = new Map<string, (typeof arq.mun)[string]>();
    const paisDe = new Map(municipios.filter((m) => m.uf === 'zz').map((m) => [m.tse, m.paisNum!]));
    for (const k of chavesTela) {
      const pais = paisDe.get(k);
      const r = arq.mun[k];
      if (!pais || !r) continue;
      const acc = porPais.get(pais) ?? { t: zero(), c: new Array(r.c.length).fill(0) };
      somaT(acc.t, r.t);
      r.c.forEach((x, i) => (acc.c[i] += x));
      porPais.set(pais, acc);
    }
    for (const [pais, r] of porPais) cores.set(pais, corDe(r));
  } else {
    for (const k of chavesTela) cores.set(k, corDe(arq.mun[k]));
  }

  const lideres = (prop ? partidos : candidatos).slice(0, prop ? 6 : 4);
  return {
    tipo: arq.tipo,
    totais,
    candidatos,
    partidos,
    cores,
    legenda: lideres.map((l) => ({ rotulo: prop ? l.partido : `${l.nome} (${l.partido})`, faixas: l.faixas })),
  };
}

function votosEsparso(c: number[], idx: number) {
  for (let i = 0; i < c.length; i += 2) if (c[i] === idx) return c[i + 1];
  return 0;
}

function visaoResumo(arq: ArquivoResumo, recorte: Recorte, daltonico: boolean): Visao {
  // ordena partidos pela quantidade de municípios vencidos
  const vitorias = new Array(arq.partidos.length).fill(0);
  for (const m of Object.values(arq.mun)) vitorias[m[0]]++;
  const ordem = arq.partidos.map((_, i) => i).sort((a, b) => vitorias[b] - vitorias[a]);
  const faixas: Faixas[] = new Array(arq.partidos.length);
  atribuirCores(ordem.map((i) => arq.partidos[i]), daltonico).forEach((f, k) => (faixas[ordem[k]] = f));
  const cores = new Map<string, string>();
  for (const [ibge, [p, pct]] of Object.entries(arq.mun)) {
    if (recorte.municipios && !recorte.municipios.has(ibge)) continue;
    cores.set(ibge, corDaFaixa(faixas[p], pct / 1000));
  }
  return {
    tipo: 'resumo',
    totais: arq.total.t,
    candidatos: [],
    partidos: ordem.filter((i) => vitorias[i] > 0).map((i) => ({
      chave: `p:${i}`, numero: '', nome: arq.partidos[i], partido: arq.partidos[i], votos: vitorias[i], pct: vitorias[i] / Math.max(1, Object.keys(arq.mun).length), faixas: faixas[i],
    })),
    cores,
    legenda: ordem.slice(0, 6).map((i) => ({ rotulo: arq.partidos[i], faixas: faixas[i] })),
    eleitosPorUf: arq.eleitos,
    partidosResumo: arq.partidos,
  };
}

/** Bancada eleita por partido (soma dos eleitos de todas as UFs). */
export function bancada(eleitos: ArquivoResumo['eleitos']) {
  const cont = new Map<string, number>();
  for (const lista of Object.values(eleitos)) for (const e of lista) if (e.eleito) cont.set(e.partido, (cont.get(e.partido) ?? 0) + 1);
  return [...cont.entries()].sort((a, b) => b[1] - a[1]);
}
