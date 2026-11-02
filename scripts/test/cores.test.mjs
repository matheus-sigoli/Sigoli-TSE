// Regras de cores (ADR 0014), com confrontos reais de 2026.
// src/lib/cores.ts é TypeScript com o apelido @config: copia para um temporário com o caminho real e importa
// (o Node 22 roda TypeScript direto, tirando os tipos).
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';

const dir = mkdtempSync(join(tmpdir(), 'cores-'));
const fonte = readFileSync('src/lib/cores.ts', 'utf8').replace(
  "import paleta from '@config/paleta-partidos.json';",
  `import paleta from '${resolve('config/paleta-partidos.json')}' with { type: 'json' };`,
);
writeFileSync(join(dir, 'cores.ts'), fonte);
const { atribuirCores, paletaDoPartido } = await import(join(dir, 'cores.ts'));
const base = (sg) => paletaDoPartido(sg).principal['50'];
const cores = (siglas, pinta) => atribuirCores(siglas, false, pinta).map((f) => f['50']);

test('PP e PL convivem com as cores principais (Senado SP: Derrite × André do Prado)', () => {
  assert.deepEqual(cores(['PP', 'PL']), [base('PP'), base('PL')]);
});

test('no Pará, PODE vira roxo (cor extra) e o MDB fica verde, mesmo o PODE sendo mais votado', () => {
  const [pode, mdb] = cores(['PODE', 'MDB']);
  assert.equal(pode, paletaDoPartido('PODE').extra['50']);
  assert.equal(mdb, base('MDB'));
});

test('quem não pinta o mapa não faz ninguém trocar de cor', () => {
  // PRTB tem um azul quase igual ao do PP, mas não vence nenhuma área
  assert.deepEqual(cores(['PRTB', 'PP'], [false, true]), [base('PRTB'), base('PP')]);
  assert.notEqual(cores(['PRTB', 'PP'])[1], base('PP'));
});

test('mesmo partido duas vezes (Senado com 2 vagas): o mais votado fica com a cor do partido, o outro roxo ou amarelo', () => {
  const [a, b] = cores(['PL', 'PL']);
  assert.equal(a, base('PL'));
  assert.ok(['#7B2CBF', '#F5C400'].includes(b), b);
  const [c, d] = cores(['PT', 'PT']);
  assert.equal(c, base('PT'));
  assert.ok(['#7B2CBF', '#F5C400'].includes(d), d);
});

test('PT, PL e MISSÃO nunca trocam: no conflito, troca o outro, mesmo sendo o mais votado (PE: PSB × PT)', () => {
  const [psb, pt] = cores(['PSB', 'PT']);
  assert.equal(pt, base('PT'));
  assert.equal(psb, paletaDoPartido('PSB').reservas[0]['50']);
});

test('sem fixo no confronto, o menos votado usa a reserva do partido (REPUBLICANOS × AVANTE)', () => {
  const [rep, av] = cores(['REPUBLICANOS', 'AVANTE']);
  assert.equal(rep, base('REPUBLICANOS'));
  assert.notEqual(av, base('AVANTE'));
});
