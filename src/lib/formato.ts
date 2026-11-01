/** Formatação em pt-BR. */
const inteiro = new Intl.NumberFormat('pt-BR');

export const votos = (n: number) => inteiro.format(n);

export const pct = (x: number, casas = 1) =>
  `${(x * 100).toLocaleString('pt-BR', { minimumFractionDigits: casas, maximumFractionDigits: casas })}%`;

/** "SÃO JOSÉ DOS CAMPOS" → "São José dos Campos" */
export const titulo = (s: string) =>
  s
    .toLowerCase()
    .replace(/(^|[\s\-'(])(\p{L})/gu, (_, a: string, b: string) => a + b.toUpperCase())
    .replace(/(?<=\s)(Da|De|Do|Das|Dos|E|Em)(?=\s)/g, (w) => w.toLowerCase());

/** Comparação sem acento e sem caixa, para a busca. */
export const semAcento = (s: string) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
