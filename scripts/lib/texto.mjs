/** Chave de comparação de nomes: sem acento, maiúsculas, só letras e números, espaços simples. */
export const normalizar = (s = '') =>
  String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase().replace(/[^A-Z0-9]+/g, ' ').trim();
