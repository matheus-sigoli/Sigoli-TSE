/**
 * Cores por partido (ADR 0004; regras de conflito no ADR 0014).
 * - Paleta oficial do projeto: config/paleta-partidos.json (10 faixas, 50% = cor-base).
 * - A tabela cobre os 30 partidos de 2026; um partido novo ganha uma cor derivada da sigla.
 * - Cor extra/reserva só quando dois concorrentes que PINTAM o mesmo mapa ficam parecidos demais.
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
  /** cores de reserva, na ordem da tabela (faixas geradas a partir da cor-base) */
  reservas: Faixas[];
}

const normaliza = (sg: string) =>
  sg.normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]/g, '');

const TABELA = new Map<string, EntradaPaleta>();
// as faixas das reservas são geradas mais abaixo (gerarFaixas), na primeira consulta
const RESERVAS_BASE = new Map<string, string[]>();
for (const p of paleta.partidos as { sigla: string; principal: Faixas; extra?: Faixas; reservas?: string[] }[]) {
  TABELA.set(normaliza(p.sigla), { principal: p.principal, extra: p.extra, reservas: [] });
  RESERVAS_BASE.set(normaliza(p.sigla), p.reservas ?? []);
}
// apelidos usados pelo TSE
// PMN e PMB (2022) são os mesmos partidos que MOBILIZA e DEMOCRATA (2026): mesma cor, pedido do usuário
const APELIDOS: Record<string, string> = { PODEMOS: 'PODE', UNIAOBRASIL: 'UNIAO', PROGRESSISTAS: 'PP', SD: 'SOLIDARIEDADE', PMN: 'MOBILIZA', PMB: 'DEMOCRATA' };


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
/** Sigla canônica (apelidos do TSE resolvidos): é o que identifica "o mesmo partido". */
export const chavePartido = (sigla: string) => { const k = normaliza(sigla); return APELIDOS[k] ?? k; };

export function paletaDoPartido(sigla: string): EntradaPaleta {
  const k = chavePartido(sigla);
  const direto = TABELA.get(k);
  if (direto) {
    const bases = RESERVAS_BASE.get(k);
    if (bases?.length && !direto.reservas.length) direto.reservas = bases.map(gerarFaixas);
    return direto;
  }
  let gerado = cacheGerado.get(k);
  if (!gerado) {
    // partido novo, fora da tabela: cor estável derivada da sigla
    gerado = { principal: gerarFaixas(hashHue(k)), reservas: [] };
    cacheGerado.set(k, gerado);
  }
  return gerado;
}

function toLab(hex: string) {
  const lin = (c: number) => { c /= 255; return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4; };
  const [r, g, b] = hexToRgb(hex).map(lin);
  const x = (r * 0.4124 + g * 0.3576 + b * 0.1805) / 0.95047;
  const y = r * 0.2126 + g * 0.7152 + b * 0.0722;
  const z = (r * 0.0193 + g * 0.1192 + b * 0.9505) / 1.08883;
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  return [116 * f(y) - 16, 500 * (f(x) - f(y)), 200 * (f(y) - f(z))];
}
/** Distância de cor CIE76 (Lab). */
export const deltaE = (a: string, b: string) => {
  const [l1, a1, b1] = toLab(a), [l2, a2, b2] = toLab(b);
  return Math.hypot(l1 - l2, a1 - a2, b1 - b2);
};

/** Distância de cor CIEDE2000 — a que mais se aproxima do olho; é a usada nas regras de conflito (ADR 0014). */
export function deltaE2000(h1: string, h2: string) {
  const [L1, a1, b1] = toLab(h1), [L2, a2, b2] = toLab(h2);
  const rad = Math.PI / 180;
  const C1 = Math.hypot(a1, b1), C2 = Math.hypot(a2, b2), Cm = (C1 + C2) / 2;
  const G = 0.5 * (1 - Math.sqrt(Cm ** 7 / (Cm ** 7 + 25 ** 7)));
  const a1p = (1 + G) * a1, a2p = (1 + G) * a2;
  const C1p = Math.hypot(a1p, b1), C2p = Math.hypot(a2p, b2);
  const h1p = (Math.atan2(b1, a1p) / rad + 360) % 360, h2p = (Math.atan2(b2, a2p) / rad + 360) % 360;
  const dL = L2 - L1, dC = C2p - C1p;
  let dh = h2p - h1p;
  if (C1p * C2p === 0) dh = 0; else if (dh > 180) dh -= 360; else if (dh < -180) dh += 360;
  const dH = 2 * Math.sqrt(C1p * C2p) * Math.sin((dh * rad) / 2);
  const Lm = (L1 + L2) / 2, Cmp = (C1p + C2p) / 2;
  let hm = h1p + h2p;
  if (C1p * C2p !== 0) { if (Math.abs(h1p - h2p) > 180) hm += hm < 360 ? 360 : -360; hm /= 2; }
  const T = 1 - 0.17 * Math.cos((hm - 30) * rad) + 0.24 * Math.cos(2 * hm * rad) + 0.32 * Math.cos((3 * hm + 6) * rad) - 0.2 * Math.cos((4 * hm - 63) * rad);
  const SL = 1 + (0.015 * (Lm - 50) ** 2) / Math.sqrt(20 + (Lm - 50) ** 2), SC = 1 + 0.045 * Cmp, SH = 1 + 0.015 * Cmp * T;
  const dT = 30 * Math.exp(-(((hm - 275) / 25) ** 2));
  const RT = -2 * Math.sqrt(Cmp ** 7 / (Cmp ** 7 + 25 ** 7)) * Math.sin(2 * dT * rad);
  return Math.sqrt((dL / SL) ** 2 + (dC / SC) ** 2 + (dH / SH) ** 2 + RT * (dC / SC) * (dH / SH));
}

// ------------------------------------------------------------------ regras de conflito (ADR 0014)
const LIMITE = paleta.conflito.limite_ciede2000;
/** pares de partidos que convivem com as cores principais, mesmo abaixo do limite (decisão do usuário) */
/** partidos que nunca trocam de cor: no conflito, quem troca é o outro (decisão do usuário) */
const FIXOS = new Set(paleta.conflito.fixos.map(chavePartido));
const COMPATIVEIS = new Set(paleta.conflito.compativeis.flatMap(([a, b]) => [`${chavePartido(a)}|${chavePartido(b)}`, `${chavePartido(b)}|${chavePartido(a)}`]));

// Okabe-Ito (seguro para daltonismo), sem o preto — também é a paleta neutra do último recurso
const DALTONICO = ['#E69F00', '#0072B2', '#009E73', '#CC79A7', '#56B4E9', '#D55E00', '#F0E442', '#999999'];
const NEUTRAS = DALTONICO.map(gerarFaixas);

/**
 * Mesmo partido de novo no mapa (ex.: dois do PL no Senado): o mais votado fica com a cor do partido e o
 * segundo ganha uma cor de fora da paleta dos partidos — roxo, depois amarelo (pedido do usuário).
 */
const EXTERNAS = ['#7B2CBF', '#F5C400'].map(gerarFaixas);

/**
 * Atribui faixas de cor a uma lista de concorrentes (em ordem de votos no estado/país).
 * Concorrentes podem ser candidatos (cor do partido) ou partidos.
 *
 * Regras (ADR 0014, definidas com o usuário a partir dos confrontos reais de 2026):
 *  - só disputam cor os que pintam o mapa (`pinta[i]`); os demais ficam com a cor principal;
 *  - conflito = CIEDE2000 < limite entre as cores-base, salvo pares compatíveis (PP × PL, PP × PSDB);
 *  - no conflito, troca quem tem alternativa — mesmo o mais votado. Ordem: extra de i, extra de j,
 *    reservas de i, reservas de j (a extra é a 2ª cor oficial da tabela; as reservas, o último recurso do partido);
 *    se nenhum dos dois tem, troca o menos votado;
 *  - PL, PT e MISSÃO (`conflito.fixos`) ficam sempre com a cor principal: no conflito, troca o outro,
 *    mesmo sendo o mais votado (extra, reservas ou paleta neutra);
 *  - mesmo partido duas vezes: o mais votado com a cor do partido; o outro, cor externa (roxo, depois amarelo);
 *  - sem alternativa: paleta neutra (até o usuário preencher as reservas do partido).
 */
export function atribuirCores(partidosEmOrdem: string[], daltonico = false, pinta?: boolean[]): Faixas[] {
  if (daltonico) return partidosEmOrdem.map((_, i) => gerarFaixas(DALTONICO[i % DALTONICO.length]));
  const chaves = partidosEmOrdem.map(chavePartido);
  const pals = partidosEmOrdem.map(paletaDoPartido);
  const escolha: Faixas[] = pals.map((p) => p.principal);
  const ativos: number[] = []; // já decididos e que pintam o mapa

  const parecidas = (fa: Faixas, a: number, fb: Faixas, b: number) => {
    if (fa === pals[a].principal && fb === pals[b].principal && COMPATIVEIS.has(`${chaves[a]}|${chaves[b]}`)) return false;
    return deltaE2000(fa['50'], fb['50']) < LIMITE;
  };
  /** primeiro concorrente (≠ ignorar) que fica parecido com a cor f, se o concorrente `quem` a usar */
  const conflito = (f: Faixas, quem: number, ignorar = -1) => ativos.find((k) => k !== quem && k !== ignorar && parecidas(f, quem, escolha[k], k)) ?? -1;

  /** j (já decidido) troca para a extra, uma reserva ou a paleta neutra, sem bater com ninguém; false se não há cor livre */
  const tirarDoCaminho = (j: number) => {
    const pj = pals[j];
    const livre = (f: Faixas) => f !== escolha[j] && conflito(f, j) < 0;
    const nova = [...(pj.extra ? [pj.extra] : []), ...pj.reservas, ...NEUTRAS].find(livre);
    if (nova) escolha[j] = nova;
    return !!nova;
  };

  for (let i = 0; i < pals.length; i++) {
    if (pinta && !pinta[i]) continue;
    if (ativos.some((k) => chaves[k] === chaves[i])) {
      // o partido já está no mapa com um candidato mais votado: este ganha uma cor externa
      escolha[i] = [...EXTERNAS, ...NEUTRAS].find((f) => conflito(f, i) < 0) ?? EXTERNAS[0];
      ativos.push(i);
      continue;
    }
    if (FIXOS.has(chaves[i])) {
      // partido fixo: quem está no caminho sai (cada um uma vez)
      ativos.push(i);
      const tentados = new Set<number>();
      for (let j = conflito(escolha[i], i); j >= 0 && !tentados.has(j); j = conflito(escolha[i], i)) {
        tentados.add(j);
        if (FIXOS.has(chaves[j])) break; // dois fixos parecidos: não acontece com a paleta atual
        tirarDoCaminho(j);
      }
      continue;
    }
    const j = conflito(escolha[i], i);
    if (j >= 0) {
      const mesmo = chaves[i] === chaves[j];
      const livreI = (f: Faixas) => f !== escolha[j] && conflito(f, i) < 0;
      // j troca só se ainda está na principal e a nova cor não bate com ninguém (nem com i)
      const livreJ = (f: Faixas) => !mesmo && !FIXOS.has(chaves[j]) && escolha[j] === pals[j].principal && conflito(f, j) < 0 && !parecidas(f, j, escolha[i], i) && conflito(escolha[i], i, j) < 0;
      // a cor extra (2ª cor oficial da tabela) vem antes das reservas, dos dois lados:
      // no Pará, PODE vira roxo e o MDB segue verde, mesmo o MDB tendo reservas
      const exI = pals[i].extra, exJ = pals[j].extra;
      const extraI = exI && livreI(exI) ? exI : null;
      const extraJ = !extraI && exJ && livreJ(exJ) ? exJ : null;
      const resI = !extraI && !extraJ ? pals[i].reservas.find(livreI) : undefined;
      const resJ = !extraI && !extraJ && !resI ? pals[j].reservas.find(livreJ) : undefined;
      if (extraI) escolha[i] = extraI;
      else if (extraJ) escolha[j] = extraJ;
      else if (resI) escolha[i] = resI;
      else if (resJ) escolha[j] = resJ;
      else escolha[i] = NEUTRAS.find((f) => conflito(f, i) < 0) ?? escolha[i]; // paleta neutra
    }
    ativos.push(i);
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
