/**
 * Funde geometrias de um TopoJSON (como topojson-client mergeArcs, sem dependência): os arcos usados por duas das
 * geometrias somem e o resto vira os anéis do polígono unido. Mantém a orientação dos arcos (anel externo continua
 * externo e buraco continua buraco).
 */
function pontos(topo, i) {
  const a = topo.arcs[i < 0 ? ~i : i];
  const t = topo.transform;
  let x = 0, y = 0;
  const pts = a.map(([dx, dy]) => (t ? [(x += dx), (y += dy)] : [dx, dy]));
  return i < 0 ? pts.reverse() : pts;
}
const area = (r) => { let s = 0; for (let i = 0, j = r.length - 1; i < r.length; j = i++) s += (r[j][0] - r[i][0]) * (r[j][1] + r[i][1]); return s; };
const dentro = ([x, y], r) => {
  let c = false;
  for (let i = 0, j = r.length - 1; i < r.length; j = i++) {
    const [xi, yi] = r[i], [xj, yj] = r[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
};

export function fundirGeometrias(topo, geoms) {
  const polys = geoms.flatMap((g) => (g.type === 'Polygon' ? [g.arcs] : g.type === 'MultiPolygon' ? g.arcs : []));
  const refs = polys.flat(2);
  const uso = new Map();
  for (const r of refs) { const k = r < 0 ? ~r : r; uso.set(k, (uso.get(k) ?? 0) + 1); }
  const sobra = refs.filter((r) => uso.get(r < 0 ? ~r : r) === 1);
  // costura: fim de um arco = começo do próximo
  const chave = (p) => `${p[0]},${p[1]}`;
  const porInicio = new Map();
  const ini = new Map(), fim = new Map();
  for (const r of sobra) {
    const p = pontos(topo, r);
    ini.set(r, p[0]); fim.set(r, p[p.length - 1]);
    const k = chave(p[0]);
    (porInicio.get(k) ?? porInicio.set(k, []).get(k)).push(r);
  }
  const usado = new Set();
  const aneis = [];
  for (const r0 of sobra) {
    if (usado.has(r0)) continue;
    const anel = [];
    let r = r0;
    for (let n = 0; r !== undefined && !usado.has(r) && n < 100000; n++) {
      usado.add(r);
      anel.push(r);
      const cand = (porInicio.get(chave(fim.get(r))) ?? []).filter((x) => !usado.has(x));
      r = cand[0];
    }
    aneis.push(anel);
  }
  // anel externo x buraco: mesmo sinal de área que os externos originais
  const coords = (anel) => anel.flatMap((r) => pontos(topo, r));
  const sinalExterno = Math.sign(area(coords(polys[0][0]))) || -1;
  const ext = [], bur = [];
  for (const a of aneis) (Math.sign(area(coords(a))) === sinalExterno ? ext : bur).push(a);
  const out = ext.map((a) => [a]);
  for (const b of bur) {
    const p = pontos(topo, b[0])[0];
    const dono = ext.findIndex((e) => dentro(p, coords(e)));
    (out[dono === -1 ? 0 : dono] ?? out[0]).push(b);
  }
  return out.length === 1 ? { type: 'Polygon', arcs: out[0] } : { type: 'MultiPolygon', arcs: out };
}
