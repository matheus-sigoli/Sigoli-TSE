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
export const SEM_DADOS = '#BDBDBD'; // sem informação
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
// 2018: PR, PRB, PPS, PTC e PATRI são os partidos que hoje se chamam PL, REPUBLICANOS, CIDADANIA, AGIR e PATRIOTA
const APELIDOS: Record<string, string> = {
  PODEMOS: 'PODE', UNIAOBRASIL: 'UNIAO', PROGRESSISTAS: 'PP', SD: 'SOLIDARIEDADE', PMN: 'MOBILIZA', PMB: 'DEMOCRATA',
  PR: 'PL', PRB: 'REPUBLICANOS', PPS: 'CIDADANIA', PTC: 'AGIR', PATRI: 'PATRIOTA',
  // 2014: PMDB, PSDC, PEN, PTN e PT do B são os partidos que hoje se chamam MDB, DC, PATRIOTA, PODE e AVANTE
  PMDB: 'MDB', PSDC: 'DC', PEN: 'PATRIOTA', PTN: 'PODE', PTDOB: 'AVANTE',
  // 2006: o PFL é o partido que em 2007 passou a se chamar DEM
  PFL: 'DEM',
  // 2002: o PPB é o partido que em 2003 passou a se chamar PP
  PPB: 'PP',
  // 1994: PTRB e PDC com as cores de PRTB e DC (pedido do usuário); PPR, PRN, PTR e o PSD antigo têm cor própria
  PTRB: 'PRTB', PDC: 'DC',
  // 1989: o PDS (Maluf) é o partido que em 1993 virou PPR: mesma cor cinza
  PDS: 'PPR',
};

// O PSD de antes de 2011 (número 41, incorporado ao PTB em 2003) não é o PSD de hoje (55): cor própria.
let anoCores = 2026;
/**
 * República de 1946 (1945–1965): paleta "Brasil – República Populista" do acervo de Matheus Sigoli (10% a 100%).
 * Partido com duas cores na tabela: a 1ª é a principal; a 2ª, a extra (usada quando dois concorrentes ficam parecidos).
 */
const POPULISTA_FAIXAS: Record<string, string[][]> = {
  PSD45: [['#CFF2FA', '#9FE5F5', '#6FD9F0', '#3FCCEB', '#0FC0E6', '#0CA3C3', '#0A86A0', '#08697E', '#064C5C', '#03262E']],
  UDN45: [['#D0D4E3', '#A2AAC8', '#747FAD', '#465592', '#182B77', '#142465', '#101E53', '#0D1741', '#09112F', '#040817']],
  PSP45: [['#DCD8D8', '#BAB1B2', '#978B8C', '#756466', '#533E40', '#463436', '#392B2C', '#2D2223', '#211819', '#100C0C']],
  PDC45: [['#FFFFCC', '#FFFF99', '#FFFF66', '#FFFF33', '#FFFF00', '#D9D900', '#B2B200', '#8C8C00', '#666600', '#333300'], ['#CCD2EA', '#99A5D6', '#6678C2', '#334BAE', '#001E9A', '#001983', '#00146B', '#001054', '#000C3D', '#00061E']],
  PL45: [['#CCCEDF', '#999DC0', '#666DA0', '#333C81', '#000C62', '#000A53', '#000844', '#000635', '#000427', '#000213'], ['#FFCCCC', '#FF999A', '#FF6667', '#FF3335', '#FF0003', '#D90002', '#B20002', '#8C0001', '#660001', '#330000']],
  PR45: [['#CCE4DC', '#99C9B9', '#66AE96', '#339373', '#007850', '#006644', '#005337', '#00412B', '#003020', '#001810']],
  MTR45: [['#FEF5CC', '#FEEB99', '#FEE266', '#FED833', '#FECF01', '#D8B000', '#B19000', '#8B7100', '#655200', '#322900'], ['#CCECF7', '#99DAF0', '#66C8E9', '#33B6E2', '#00A4DB', '#008BBA', '#007298', '#005A78', '#004157', '#00202B']],
  PTN45: [['#D5EEDA', '#ABDEB5', '#82CE91', '#58BE6C', '#2FAE48', '#27943D', '#207932', '#195F27', '#12451C', '#09220E']],
  PTB45: [['#F5CCCC', '#EB9999', '#E16666', '#D73333', '#CD0000', '#AE0000', '#8F0000', '#700000', '#520000', '#290000']],
  PRP45: [['#CCE5D7', '#99CCAF', '#66B287', '#33995F', '#008037', '#006C2E', '#005926', '#00461E', '#003316', '#00190B']],
  PST45: [['#DDFFCC', '#BBFF99', '#99FF66', '#77FF33', '#55FF00', '#48D900', '#3BB200', '#2E8C00', '#226600', '#113300']],
  PRT45: [['#EEDDCC', '#DEBC99', '#CD9A66', '#BD7933', '#AD5800', '#934A00', '#783D00', '#5E3000', '#452300', '#221100']],
  PCB45: [['#F7D3D1', '#F0A7A4', '#E87C76', '#E15049', '#DA251C', '#B91F17', '#981913', '#77140F', '#570E0B', '#2B0705']],
  PSB45: [['#FEF5CC', '#FEEB99', '#FEE166', '#FED733', '#FECD00', '#D8AE00', '#B18F00', '#8B7000', '#655200', '#322900'], ['#F9D1D2', '#F3A3A6', '#EE7579', '#E8474D', '#E31921', '#C1151C', '#9E1117', '#7C0D12', '#5A0A0D', '#2D0506']],
};
const POPULISTA_BASE = POPULISTA_FAIXAS; // siglas da época (chavePartido)
const POPULISTA_CACHE = new Map<string, EntradaPaleta>();
const paraFaixas = (cores: string[]) => Object.fromEntries(CHAVES.map((k, i) => [k, cores[i]])) as Faixas;
const populista = (k: string): EntradaPaleta | undefined => {
  const cores = POPULISTA_FAIXAS[k];
  if (!cores) return undefined;
  let e = POPULISTA_CACHE.get(k);
  if (!e) POPULISTA_CACHE.set(k, (e = { principal: paraFaixas(cores[0]), extra: cores[1] ? paraFaixas(cores[1]) : undefined, reservas: [] }));
  return e;
};
/** Ano da eleição exibida (as siglas que mudaram de partido com o tempo dependem dele). */
export const definirAnoCores = (ano: number) => { anoCores = ano; };


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
export const chavePartido = (sigla: string) => {
  const k = normaliza(sigla);
  // República de 1946 (até 1965): partidos da época com a paleta própria (POPULISTA_FAIXAS, acima)
  if (anoCores < 1966 && POPULISTA_BASE[`${k}45`]) return `${k}45`;
  if (k === 'PSD' && anoCores < 2011) return 'PSD41';
  // 1989: PP, PPB e PMB eram outros partidos (sem relação com os de hoje); o PCB de 1989 é o que virou PPS e Cidadania
  if (anoCores < 1990 && (k === 'PP' || k === 'PPB' || k === 'PMB')) return `${k}89`;
  if (anoCores < 1990 && k === 'PCB') return 'CIDADANIA';
  // bipartidarismo (1966–1979): MDB e ARENA têm cores próprias, uma por sublegenda (DITADURA, abaixo)
  if (anoCores < 1980 && k === 'MDB') return 'MDB66';
  return APELIDOS[k] ?? k;
};

export function paletaDoPartido(sigla: string): EntradaPaleta {
  const k = chavePartido(sigla);
  const pop = populista(k);
  if (pop) return pop;
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
 *  - mesmo partido duas vezes: o mais votado com a cor do partido; o outro, cor externa (roxo, depois amarelo),
 *    mesmo quando não pinta o mapa (1978: Montoro e FHC, sublegendas do MDB);
 *  - sem alternativa: paleta neutra (até o usuário preencher as reservas do partido).
 */
/**
 * Bipartidarismo (1966–1979), definido com o usuário: cada partido tinha até 3 candidatos (sublegendas),
 * e a cor vai pela ordem de votos dentro do partido. MDB: vermelho, verde, amarelo. ARENA: azul e cinza do PP, roxo.
 */
const DITADURA: Record<string, Faixas[]> = {
  MDB66: ['#D62828', '#00AA4F', '#FFC401'].map(gerarFaixas),
  ARENA: ['#04368A', '#5F747A', '#7B2CBF'].map(gerarFaixas),
};

// ------------------------------------------------------------------ cores escolhidas pelo usuário
/**
 * O usuário pode trocar a cor de um partido por outra faixa da tabela do degradê (seletor no painel).
 * A escolha vale por partido (sigla canônica do ano, ver chavePartido), fica no navegador e o partido
 * passa a ser fixo: no conflito, quem troca de cor é o outro.
 */
let escolhidas: Record<string, string[]> = {};
export const definirCoresEscolhidas = (m: Record<string, string[]>) => { escolhidas = m; };
const escolhida = (k: string): Faixas | undefined => {
  const c = escolhidas[k];
  return Array.isArray(c) && c.length === 10 ? paraFaixas(c) : undefined;
};
export const faixasEmLista = (f: Faixas) => CHAVES.map((k) => f[k]);

export interface OpcaoCor { rotulo: string; faixas: Faixas }
/** Opções de cor de um partido: as dele na tabela (principal, extra, reservas) e as demais faixas da tabela. */
export function opcoesDeCor(sigla: string): { chave: string; proprias: OpcaoCor[]; outras: OpcaoCor[] } {
  const k = chavePartido(sigla);
  const proprias: OpcaoCor[] = [];
  const dit = DITADURA[k];
  if (dit) dit.forEach((f, i) => proprias.push({ rotulo: `${i + 1}ª sublegenda`, faixas: f }));
  else {
    const pal = paletaDoPartido(sigla);
    proprias.push({ rotulo: 'Principal', faixas: pal.principal });
    if (pal.extra) proprias.push({ rotulo: 'Extra', faixas: pal.extra });
    pal.reservas.forEach((f, i) => proprias.push({ rotulo: pal.reservas.length > 1 ? `Reserva ${i + 1}` : 'Reserva', faixas: f }));
  }
  const vistas = new Set(proprias.map((o) => o.faixas['50'].toUpperCase()));
  const outras: OpcaoCor[] = [];
  const por = (rotulo: string, f: Faixas | undefined) => {
    if (!f) return;
    const b = f['50'].toUpperCase();
    if (vistas.has(b)) return;
    vistas.add(b); outras.push({ rotulo, faixas: f });
  };
  for (const p of paleta.partidos as { sigla: string }[]) {
    const kk = normaliza(p.sigla), d = TABELA.get(kk);
    if (!d) continue;
    const res = RESERVAS_BASE.get(kk) ?? [];
    por(p.sigla, d.principal);
    por(`${p.sigla} (extra)`, d.extra);
    res.forEach((b, i) => por(`${p.sigla} (reserva${res.length > 1 ? ' ' + (i + 1) : ''})`, gerarFaixas(b)));
  }
  for (const [kk, cores] of Object.entries(POPULISTA_FAIXAS)) {
    por(`${kk.replace(/45$/, '')} (1945–65)`, paraFaixas(cores[0]));
    if (cores[1]) por(`${kk.replace(/45$/, '')} (1945–65, extra)`, paraFaixas(cores[1]));
  }
  por('MDB (1966–79)', DITADURA.MDB66[0]);
  por('ARENA (1966–79)', DITADURA.ARENA[0]);
  por('Roxo', EXTERNAS[0]);
  por('Amarelo', EXTERNAS[1]);
  NEUTRAS.forEach((f, i) => por(`Neutra ${i + 1}`, f));
  return { chave: k, proprias, outras };
}

export function atribuirCores(partidosEmOrdem: string[], daltonico = false, pinta?: boolean[]): Faixas[] {
  if (daltonico) return partidosEmOrdem.map((_, i) => gerarFaixas(DALTONICO[i % DALTONICO.length]));
  const chaves = partidosEmOrdem.map(chavePartido);
  const pals = partidosEmOrdem.map(paletaDoPartido);
  const escolha: Faixas[] = pals.map((p) => p.principal);
  const ativos: number[] = []; // já decididos e que pintam o mapa
  // cor escolhida pelo usuário: vale para o mais votado do partido, que fica fixo
  const doUsuario = new Set<number>();
  chaves.forEach((k, i) => {
    const f = escolhida(k);
    if (f && !chaves.slice(0, i).includes(k)) { pals[i] = { principal: f, reservas: [] }; escolha[i] = f; doUsuario.add(i); }
  });
  const fixo = (i: number) => FIXOS.has(chaves[i]) || doUsuario.has(i);

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
    if (doUsuario.has(i)) {
      if (!pinta || pinta[i]) {
        ativos.push(i);
        const tentados = new Set<number>();
        for (let j = conflito(escolha[i], i); j >= 0 && !tentados.has(j); j = conflito(escolha[i], i)) {
          tentados.add(j);
          if (fixo(j)) break; // duas cores fixas parecidas: escolha do usuário, fica assim
          tirarDoCaminho(j);
        }
      }
      continue;
    }
    const dit = DITADURA[chaves[i]];
    if (dit) {
      const k = chaves.slice(0, i).filter((c) => c === chaves[i]).length;
      escolha[i] = dit[Math.min(k, dit.length - 1)];
      if (!pinta || pinta[i]) ativos.push(i);
      continue;
    }
    if (pinta && !pinta[i]) {
      // não pinta o mapa, mas aparece na legenda e no painel: o 2º candidato do mesmo partido não repete a cor
      if (chaves.slice(0, i).includes(chaves[i])) escolha[i] = [...EXTERNAS, ...NEUTRAS].find((f) => conflito(f, i) < 0) ?? EXTERNAS[0];
      continue;
    }
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
        if (fixo(j)) break; // dois fixos parecidos (ou cor escolhida pelo usuário)
        tirarDoCaminho(j);
      }
      continue;
    }
    const j = conflito(escolha[i], i);
    if (j >= 0) {
      const mesmo = chaves[i] === chaves[j];
      const livreI = (f: Faixas) => f !== escolha[j] && conflito(f, i) < 0;
      // j troca só se ainda está na principal e a nova cor não bate com ninguém (nem com i)
      const livreJ = (f: Faixas) => !mesmo && !fixo(j) && escolha[j] === pals[j].principal && conflito(f, j) < 0 && !parecidas(f, j, escolha[i], i) && conflito(escolha[i], i, j) < 0;
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
