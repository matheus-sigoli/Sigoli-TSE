/**
 * Sigoli.TSE — leitura dos arquivos do Portal de Dados Abertos do TSE (cdn.tse.jus.br/estatistica/sead/odsele).
 * Download com nova tentativa e leitura de CSV (latin1, ";") direto do zip, linha a linha.
 */
import { createWriteStream, existsSync, mkdirSync, renameSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { Readable } from 'node:stream';
import { pipeline } from 'node:stream/promises';
import { createInterface } from 'node:readline';
import yauzl from 'yauzl';

export const CDN = 'https://cdn.tse.jus.br/estatistica/sead/odsele';

/** Baixa para `.parcial` e só renomeia no fim: um download interrompido nunca passa por arquivo completo. */
export async function baixar(url, destino) {
  if (existsSync(destino)) return;
  mkdirSync(join(destino, '..'), { recursive: true });
  const parcial = `${destino}.parcial`;
  for (let tentativa = 1; ; tentativa++) {
    try {
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

/** Separa uma linha CSV do TSE (campos entre aspas ou não, separador ;). */
export function separar(l) {
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
      i = j + 2;
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

/**
 * Lê as entradas CSV de um zip que passam no filtro, uma de cada vez.
 * aoLinha(campos, cabecalho, nomeDaEntrada); cabecalho = { NOME_DA_COLUNA: índice }.
 */
export function lerCsvDoZip(zip, filtroNome, aoLinha) {
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
            aoLinha(f, cab, e.fileName);
          });
          rl.on('close', () => z.readEntry());
        });
      });
      z.on('end', () => (achou ? resolve() : reject(new Error(`nada em ${zip} casou com o filtro`))));
      z.readEntry();
    });
  });
}

export const num = (s) => { const n = parseInt(s, 10); return Number.isFinite(n) ? n : 0; };
export const pad5 = (s) => String(num(s)).padStart(5, '0');
/** "#NULO", "#NULO#" (arquivos de 2018), "#NE" e vazio viram '' */
export const texto = (s) => (s === undefined || s === null || /^#(NULO|NE)#?$/i.test(s) || s === '-1' ? '' : String(s).trim());
