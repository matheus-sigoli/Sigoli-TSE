/**
 * Cores por partido (ADR 0004).
 * - Paleta oficial do projeto: config/paleta-partidos.json (10 faixas, 50% = cor-base).
 * - A tabela cobre os 30 partidos de 2026; um partido novo ganha uma cor derivada da sigla.
 * - Cor extra só quando dois concorrentes do mesmo mapa ficam parecidos demais.
 * - Modo daltônico: paleta categórica Okabe-Ito por ordem de votos.
 */
import paleta from '@config/paleta-partidos.json';

export type Faixas = Record<string, string>; // "10".."100" → hex
const CHAVES = ['10', '20', '30', '40', '50', '60', '70', '80', '90', '100'] as const;

export const FUNDO_MAPA = paleta.mapa.fundo; // #666666
export const BORDA_MUNICIPIO = paleta.mapa.borda_municipio; // #FFFFFF
export const SEM_DADOS = '#7E7E7E';
export const NEUTRO: Faixas = paleta.neutro;

interface EntradaPaleta {
  principal: Faixas;
  extra?: Faixas;
}

const normaliza = (sg: string) =>
  sg.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const TABELA = new Map<string, EntradaPaleta>();
for (const p of paleta.partidos) TABELA.set(normaliza(p.sigla), { principal: p.principal, extra: p.extra });
// apelidos usados pelo TSE
const APELIDOS: Record<string, string> = { PODEMOS: 'PODE', UNIAOBRASIL: 'UNIAO', PROGRESSISTAS: 'PP', SD: 'SOLIDARIEDADE' };


// ------------------------------------------------------------------ utilidades de cor
const hexToRgb = (h: string) => {
  const n = parseInt(h.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255] as const;
};
const rgbToHex = (r: number, g: number, b: number) =>
  '#' + [r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('').toUpperCase();
const mix = (a: string, b: string, t: number) => {
  const [r1, g1, b1] = hexToRgb(a), [r2, g2, b2] = hexToRgb(b);
  return rgbToHex(r1 + (r2 - r1) * t, g1 + (g2 - g1) * t, b1 + (b2 - b1) * t);
};

/** Gera 10 faixas a partir de uma cor-base, seguindo o desenho da tabela oficial. */
export function gerarFaixas(base: string): Faixas {
  const out: Faixas = {};
  CHAVES.forEach((k, i) => {
    if (i < 4) out[k] = mix(base, '#FFFFFF', (4 - i) * 0.2); // 10%..40%: 80%..20% de branco
    else out[k] = mix(base, '#000000', (i - 4) * 0.15 + (i === 9 ? 0.05 : 0)); // 50%..100%
  });
  return out;
}

function hashHue(s: string) {
  let h = 0;
  for (const ch of s) h = (h * 31 + ch.charCodeAt(0)) >>> 0;
  const hue = h % 360;
  // HSL → RGB simples (s=55%, l=45%)
  const s1 = 0.55, l = 0.45;
  const k = (n: number) => (n + hue / 30) % 12;
  const a = s1 * Math.min(l, 1 - l);
  const f = (n: number) => l - a * Math.max(-1, Math.min(k(n) - 3, Math.min(9 - k(n), 1)));
  return rgbToHex(f(0) * 255, f(8) * 255, f(4) * 255);
}

const cacheGerado = new Map<string, EntradaPaleta>();
export function paletaDoPartido(sigla: string): EntradaPaleta {
  const k = normaliza(sigla);
  const direto = TABELA.get(APELIDOS[k] ?? k);
  if (direto) return direto;
  let gerado = cacheGerado.get(k);
  if (!gerado) {
    // partido novo, fora da tabela: cor estável derivada da sigla
    gerado = { principal: gerarFaixas(hashHue(k)) };
    cacheGerado.set(k, gerado);
  }
  return gerado;
}

// distância perceptual aproximada (CIE76 sobre Lab)
function toLab(hex: string) {
  const lin = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const [r, g, b] = hexToRgb(hex).map(lin);
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}
export const deltaE = (a: string, b: string) => {
  const [l1, a1, b1] = toLab(a), [l2, a2, b2] = toLab(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
};
const LIMITE_PARECIDO = 22;

// Okabe-Ito (seguro para daltonismo), sem o preto
const DALTONICO = ['#E69F00', '#0072B2', '#009E73', '#CC79A7', '#56B4E9', '#D55E00', '#F0E442', '#999999'];

/**
 * Atribui faixas de cor a uma lista de concorrentes (em ordem de votos no estado/país).
 * Concorrentes podem ser candidatos (cor do partido) ou partidos.
 *
 * Conflito (cores parecidas demais), pela tabela do usuário (ADR 0004):
 *   1. quem tem cor extra troca para ela — mesmo que seja o mais votado (ex.: no Pará, PODE vira roxo
 *      e o MDB, que não tem extra, fica com o verde);
 *   2. sem cor extra dos dois lados, o menos votado recebe uma cor livre da paleta segura.
 */
export function atribuirCores(partidosEmOrdem: string[], daltonico = false): Faixas[] {
  if (daltonico) return partidosEmOrdem.map((_, i) => gerarFaixas(DALTONICO[i % DALTONICO.length]));
  const pals = partidosEmOrdem.map(paletaDoPartido);
  const escolha: Faixas[] = [];
  const conflitaCom = (f: Faixas, ignorar: number, ate: number) => {
    for (let k = 0; k < ate; k++) if (k !== ignorar && deltaE(escolha[k]['50'], f['50']) < LIMITE_PARECIDO) return k;
    return -1;
  };
  for (let i = 0; i < pals.length; i++) {
    escolha[i] = pals[i].principal;
    const j = conflitaCom(escolha[i], i, i);
    if (j < 0) continue;
    const extraI = pals[i].extra;
    const extraJ = pals[j].extra;
    if (extraI && conflitaCom(extraI, i, i) < 0) escolha[i] = extraI;
    else if (extraJ && escolha[j] === pals[j].principal && conflitaCom(extraJ, j, i) < 0 && conflitaCom(escolha[i], j, i) < 0) escolha[j] = extraJ;
    else {
      const livre = DALTONICO.map(gerarFaixas).find((f) => conflitaCom(f, i, i) < 0);
      if (livre) escolha[i] = livre;
    }
  }
  return escolha;
}

/** Faixa pela regra da tabela: floor(pct × 10) × 10, entre 10 e 100. */
export function corDaFaixa(faixas: Faixas, pct: number) {
  const k = Math.min(10, Math.max(1, Math.floor(pct * 10 + 1e-9))) * 10;
  return faixas[String(k)];
}

/** Cor do texto sobre um fundo (contraste). */
export function textoSobre(hex: string) {
  const [r, g, b] = hexToRgb(hex);
  return (r * 299 + g * 587 + b * 114) / 1000 > 150 ? '#17191C' : '#FFFFFF';
}

export const FAIXAS_LEGENDA = CHAVES;
