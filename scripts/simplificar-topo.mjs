#!/usr/bin/env node
/**
 * Sigoli.TSE — simplifica as bordas (arcos) de arquivos TopoJSON já gravados, sem dependências.
 * Douglas-Peucker em cada arco, mantendo as pontas: vizinhos continuam com a mesma borda (a topologia não quebra).
 * Usado nas zonas (recortadas pela malha fina dos municípios, ficavam com detalhe demais para o tamanho do site).
 * Uso: node scripts/simplificar-topo.mjs --tol 0.0002 arquivo.json [...]
 */
import { readFileSync, writeFileSync } from 'node:fs';

const argv = process.argv.slice(2);
const TOL = Number(argv[argv.indexOf('--tol') + 1] ?? 0.0002);
const arquivos = argv.filter((a, i) => a.endsWith('.json') && argv[i - 1] !== '--tol');
function dp(pts, tol) {
  if (pts.length <= 2) return pts;
  const manter = new Uint8Array(pts.length); manter[0] = manter[pts.length - 1] = 1;
  const pilha = [[0, pts.length - 1]];
  while (pilha.length) {
    const [a, b] = pilha.pop();
    const [ax, ay] = pts[a], [bx, by] = pts[b];
    const dx = bx - ax, dy = by - ay, L = dx * dx + dy * dy;
    let maxD = -1, idx = -1;
    for (let i = a + 1; i < b; i++) {
      const [px, py] = pts[i];
      let t = L ? ((px - ax) * dx + (py - ay) * dy) / L : 0; t = Math.max(0, Math.min(1, t));
      const d = (px - ax - t * dx) ** 2 + (py - ay - t * dy) ** 2;
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > tol * tol) { manter[idx] = 1; pilha.push([a, idx], [idx, b]); }
  }
  const out = pts.filter((_, i) => manter[i]);
  // anel fechado num arco só: precisa de ao menos 4 pontos
  if (out.length < 4 && pts[0][0] === pts.at(-1)[0] && pts[0][1] === pts.at(-1)[1]) return pts.length >= 4 ? [pts[0], pts[Math.floor(pts.length / 3)], pts[Math.floor((2 * pts.length) / 3)], pts.at(-1)] : pts;
  return out;
}
let antes = 0, depois = 0;
for (const arq of arquivos) {
  const t = JSON.parse(readFileSync(arq, 'utf8'));
  antes += JSON.stringify(t).length;
  const q = t.transform;
  t.arcs = t.arcs.map((arc) => {
    let x = 0, y = 0;
    const abs = q ? arc.map(([dx, dy]) => [(x += dx), (y += dy)]) : arc;
    const geo = q ? abs.map(([a, b]) => [a * q.scale[0] + q.translate[0], b * q.scale[1] + q.translate[1]]) : abs;
    const keep = dp(geo.map((p, i) => [...p, i]), TOL).map((p) => p[2]);
    const novo = keep.map((i) => abs[i]);
    if (!q) return novo;
    let px = 0, py = 0;
    return novo.map(([a, b]) => { const d = [a - px, b - py]; px = a; py = b; return d; });
  });
  const s = JSON.stringify(t);
  depois += s.length;
  writeFileSync(arq, s);
}
console.log(`${arquivos.length} arquivos: ${(antes / 1e6).toFixed(1)} MB → ${(depois / 1e6).toFixed(1)} MB (tolerância ${TOL}°)`);
