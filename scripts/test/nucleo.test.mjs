import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CARGOS, ehEleito, montarArquivo, montarResumoBrasil, normalizar, urlResultado, vencedor } from '../lib/nucleo.mjs';

// Arquivo -u.json mínimo no formato do TSE
const bruto = (abr, votos, st = ['2º turno', '2º turno', 'Não eleito']) => ({
  ele: '6257', t: '1', tpabr: 'mu', cdabr: abr, dg: '05/10/2026', hg: '12:00:00',
  e: { te: '1000', c: '800', a: '200' },
  v: { vv: String(votos.reduce((a, b) => a + b, 0)), vb: '20', tvn: '30' },
  carg: [{ cd: '1', nv: '1', fed: [], agr: [
    { n: '1', nm: 'PL', tp: 'i', par: [{ n: '22', sg: 'PL', cand: [{ n: '22', sqcand: 'a', nmu: 'FLAVIO', e: 's', st: st[0], vap: String(votos[0]) }] }] },
    { n: '2', nm: 'COLIG', tp: 'c', par: [{ n: '13', sg: 'PT', cand: [{ n: '13', sqcand: 'b', nmu: 'LULA', e: 's', st: st[1], vap: String(votos[1]) }] }] },
    { n: '3', nm: 'AVANTE', tp: 'i', par: [{ n: '70', sg: 'AVANTE', cand: [{ n: '70', sqcand: 'c', nmu: 'CURY', e: 'n', st: st[2], vap: String(votos[2]) }] }] },
  ] }],
});

test('situação define quem foi eleito (e="s" também marca 2º turno)', () => {
  assert.equal(ehEleito('Eleito'), true);
  assert.equal(ehEleito('Eleito por QP'), true);
  assert.equal(ehEleito('Eleito por média'), true);
  assert.equal(ehEleito('2º turno'), false);
  assert.equal(ehEleito('Não eleito'), false);
  assert.equal(normalizar(bruto('x', [5, 4, 1])).candidatos.some((c) => c.eleito), false);
});

test('URL segue o padrão oficial do TSE', () => {
  assert.equal(urlResultado(6257, 1, 'sp', '71072'),
    'https://resultados.tse.jus.br/oficial/ele2026/6257/dados/sp/sp71072-c0001-e006257-u.json');
});

test('montarArquivo ordena por votos e calcula vencedor por município', () => {
  const cargo = CARGOS.find((c) => c.slug === 'presidente');
  const total = normalizar(bruto('sp', [300, 500, 20]));
  const mun = new Map([['3550308', normalizar(bruto('71072', [100, 300, 10]))], ['3509502', normalizar(bruto('62910', [200, 100, 10]))]]);
  const arq = montarArquivo(cargo, 1, 'sp', total, mun);
  assert.deepEqual(arq.cands.map((c) => c.nome), ['LULA', 'FLAVIO', 'CURY']);
  assert.deepEqual(arq.total.c, [500, 300, 20]);
  assert.deepEqual(arq.mun['3550308'].t, [1000, 800, 200, 410, 20, 30]);
  const w = vencedor(arq, arq.mun['3509502']);
  assert.equal(arq.cands[w.idx].nome, 'FLAVIO');
  assert.equal(Math.round(w.pct * 1000), Math.round((200 / 310) * 1000));
});

test('resumo nacional lista quem disputa o 2º turno', () => {
  const cargo = CARGOS.find((c) => c.slug === 'governador');
  const total = normalizar(bruto('ac', [300, 200, 20]));
  const arq = montarArquivo(cargo, 1, 'ac', total, new Map([['1200401', normalizar(bruto('01392', [300, 200, 20]))]]));
  const r = montarResumoBrasil(cargo, 1, [arq]);
  assert.equal(r.eleitos.ac.length, 2);
  assert.ok(r.eleitos.ac.every((e) => !e.eleito && e.situacao === '2º turno'));
  assert.equal(r.partidos[r.mun['1200401'][0]], 'PL');
});
