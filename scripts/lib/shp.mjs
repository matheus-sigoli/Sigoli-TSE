/**
 * Sigoli.TSE — leitura de shapefile (zip do IBGE) e escrita de TopoJSON, sem dependências.
 * Usado por scripts/malha.mjs (municípios) e scripts/bairros.mjs (bairros).
 */
import { inflateRawSync } from 'node:zlib';

export const QUANT = 1e5;
// Grade usada só para identificar pontos idênticos (1e-6° ≈ 10 cm).
// Faixa do Brasil: lon -80..-20, lat -40..10 → chave < 2^53 (inteiro exato).
export const GRID = 1e6;

// ---------------------------------------------------------------- zip / shp / dbf
export function unzip(buf) {
  const files = new Map();
  let eocd = buf.length - 22;
  while (eocd >= 0 && buf.readUInt32LE(eocd) !== 0x06054b50) eocd--;
  if (eocd < 0) throw new Error('zip inválido');
  const count = buf.readUInt16LE(eocd + 10);
  let p = buf.readUInt32LE(eocd + 16);
  for (let i = 0; i < count; i++) {
    const method = buf.readUInt16LE(p + 10);
    const csize = buf.readUInt32LE(p + 20);
    const nlen = buf.readUInt16LE(p + 28);
    const xlen = buf.readUInt16LE(p + 30);
    const clen = buf.readUInt16LE(p + 32);
    const off = buf.readUInt32LE(p + 42);
    const name = buf.toString('utf8', p + 46, p + 46 + nlen);
    const lnlen = buf.readUInt16LE(off + 26);
    const lxlen = buf.readUInt16LE(off + 28);
    const data = buf.subarray(off + 30 + lnlen + lxlen, off + 30 + lnlen + lxlen + csize);
    files.set(name.split('/').pop(), method === 0 ? data : inflateRawSync(data));
    p += 46 + nlen + xlen + clen;
  }
  return files;
}

export function readDbf(buf) {
  const n = buf.readUInt32LE(4);
  const hl = buf.readUInt16LE(8);
  const rl = buf.readUInt16LE(10);
  const fields = [];
  for (let o = 32; buf[o] !== 0x0d; o += 32) {
    fields.push({ name: buf.toString('latin1', o, o + 11).replace(/\0.*$/, ''), len: buf[o + 16] });
  }
  const rows = [];
  for (let i = 0; i < n; i++) {
    let o = hl + i * rl + 1;
    const row = {};
    for (const f of fields) {
      row[f.name] = buf.toString('utf8', o, o + f.len).trim();
      o += f.len;
    }
    rows.push(row);
  }
  return rows;
}

/** Retorna, por registro, a lista de anéis (arrays planos [x0,y0,x1,y1,...]). */
export function readShp(buf) {
  const recs = [];
  let o = 100;
  while (o < buf.length) {
    const len = buf.readInt32BE(o + 4) * 2;
    const c = o + 8;
    const type = buf.readInt32LE(c);
    const rings = [];
    if (type === 5 || type === 15 || type === 25) {
      const nParts = buf.readInt32LE(c + 36);
      const nPts = buf.readInt32LE(c + 40);
      const parts = [];
      for (let i = 0; i < nParts; i++) parts.push(buf.readInt32LE(c + 44 + i * 4));
      parts.push(nPts);
      const base = c + 44 + nParts * 4;
      for (let i = 0; i < nParts; i++) {
        const ring = new Float64Array((parts[i + 1] - parts[i]) * 2);
        for (let k = parts[i], j = 0; k < parts[i + 1]; k++, j += 2) {
          ring[j] = buf.readDoubleLE(base + k * 16);
          ring[j + 1] = buf.readDoubleLE(base + k * 16 + 8);
        }
        rings.push(ring);
      }
    }
    recs.push(rings);
    o += 8 + len;
  }
  return recs;
}

// ---------------------------------------------------------------- geometria
export const keyOf = (x, y) => Math.round((x + 80) * GRID) * 1e8 + Math.round((y + 40) * GRID);

/** Assinatura compacta de uma sequência de chaves (comprimento + extremos + 2 hashes). */
export function sigOf(ks) {
  let h1 = 0, h2 = 0;
  for (let i = 0; i < ks.length; i++) {
    const k = ks[i];
    h1 = (Math.imul(h1, 31) + (k % 1e8)) | 0;
    h2 = (Math.imul(h2, 131) + Math.floor(k / 1e8)) | 0;
  }
  return `${ks.length}:${ks[0]}:${ks[ks.length - 1]}:${h1}:${h2}`;
}

export function signedArea(r) {
  let a = 0;
  for (let i = 0; i < r.length - 2; i += 2) a += r[i] * r[i + 3] - r[i + 2] * r[i + 1];
  return a / 2;
}

export function pointInRing(x, y, r) {
  let inside = false;
  for (let i = 0, j = r.length - 2; i < r.length; j = i, i += 2) {
    const xi = r[i], yi = r[i + 1], xj = r[j], yj = r[j + 1];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

/** Douglas-Peucker sobre array plano; mantém extremos. */
export function douglasPeucker(pts, tol) {
  const n = pts.length / 2;
  if (n <= 2) return pts;
  const keep = new Uint8Array(n);
  keep[0] = keep[n - 1] = 1;
  const stack = [[0, n - 1]];
  const t2 = tol * tol;
  while (stack.length) {
    const [a, b] = stack.pop();
    const ax = pts[a * 2], ay = pts[a * 2 + 1], bx = pts[b * 2], by = pts[b * 2 + 1];
    const dx = bx - ax, dy = by - ay;
    const len2 = dx * dx + dy * dy;
    let maxD = -1, idx = -1;
    for (let i = a + 1; i < b; i++) {
      const px = pts[i * 2] - ax, py = pts[i * 2 + 1] - ay;
      let d;
      if (len2 === 0) d = px * px + py * py;
      else {
        const cr = px * dy - py * dx;
        d = (cr * cr) / len2;
      }
      if (d > maxD) { maxD = d; idx = i; }
    }
    if (maxD > t2) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  const out = [];
  for (let i = 0; i < n; i++) if (keep[i]) out.push(pts[i * 2], pts[i * 2 + 1]);
  return out;
}

/** Anel fechado (1º == último) simplificado sem colapsar: mínimo 4 pontos. */
export function simplifyArc(pts, tol) {
  const n = pts.length / 2;
  const closed = pts[0] === pts[pts.length - 2] && pts[1] === pts[pts.length - 1];
  if (!closed) return douglasPeucker(pts, tol);
  if (n <= 4) return Array.from(pts);
  // divide o anel no ponto mais distante do início para o DP funcionar
  let far = 1, best = -1;
  for (let i = 1; i < n - 1; i++) {
    const d = (pts[i * 2] - pts[0]) ** 2 + (pts[i * 2 + 1] - pts[1]) ** 2;
    if (d > best) { best = d; far = i; }
  }
  const a = douglasPeucker(pts.slice(0, far * 2 + 2), tol);
  const b = douglasPeucker(pts.slice(far * 2), tol);
  const out = a.concat(b.slice(2));
  if (out.length / 2 >= 4) return out;
  const q = Math.floor(n / 3);
  return [pts[0], pts[1], pts[q * 2], pts[q * 2 + 1], pts[2 * q * 2], pts[2 * q * 2 + 1], pts[0], pts[1]];
}

// ---------------------------------------------------------------- topologia
/**
 * Recebe features {id, props, rings:[Float64Array]} e um conjunto de junções
 * extras (vindas de outros estados). Devolve features com anéis expressos como
 * listas de referências de arco, e o dicionário de arcos brutos.
 */
export function buildTopology(features, extraJunctions) {
  // vizinhos distintos de cada ponto
  const neigh = new Map();
  const addN = (k, nk) => {
    let s = neigh.get(k);
    if (s === undefined) neigh.set(k, nk);
    else if (typeof s === 'number') { if (s !== nk) neigh.set(k, new Set([s, nk])); }
    else s.add(nk);
  };
  for (const f of features) {
    f.keys = f.rings.map((r) => {
      const n = r.length / 2;
      const ks = new Array(n);
      for (let i = 0; i < n; i++) ks[i] = keyOf(r[i * 2], r[i * 2 + 1]);
      return ks;
    });
    for (const ks of f.keys) {
      const n = ks.length - 1; // último repete o primeiro
      for (let i = 0; i < n; i++) {
        addN(ks[i], ks[(i + 1) % n]);
        addN(ks[i], ks[(i - 1 + n) % n]);
      }
    }
  }
  const isJunction = (k) => {
    if (extraJunctions?.has(k)) return true;
    const s = neigh.get(k);
    return typeof s === 'object' && s.size > 2;
  };

  const arcs = []; // {pts: number[], sig}
  const arcIndex = new Map(); // assinatura canônica → índice
  const arcUse = []; // quantos anéis usam o arco

  const register = (ptsKeys, coords) => {
    // orientação canônica: menor chave inicial (empate: 2º ponto)
    const n = ptsKeys.length;
    let fwd;
    if (ptsKeys[0] !== ptsKeys[n - 1]) fwd = ptsKeys[0] < ptsKeys[n - 1];
    else fwd = ptsKeys[1] <= ptsKeys[n - 2];
    const ks = fwd ? ptsKeys : [...ptsKeys].reverse();
    const sig = sigOf(ks);
    let idx = arcIndex.get(sig);
    if (idx === undefined) {
      idx = arcs.length;
      const c = fwd ? coords : reversePairs(coords);
      arcs.push({ pts: c, keys: ks });
      arcIndex.set(sig, idx);
      arcUse.push(0);
    }
    arcUse[idx]++;
    return fwd ? idx : ~idx;
  };

  for (const f of features) {
    f.ringArcs = f.keys.map((ks, ri) => {
      const r = f.rings[ri];
      const n = ks.length - 1;
      // começa numa junção; sem junções, começa no menor ponto (canônico)
      let start = -1;
      for (let i = 0; i < n; i++) if (isJunction(ks[i])) { start = i; break; }
      if (start === -1) {
        start = 0;
        for (let i = 1; i < n; i++) if (ks[i] < ks[start]) start = i;
      }
      const refs = [];
      let curK = [ks[start]];
      let curC = [r[start * 2], r[start * 2 + 1]];
      for (let step = 1; step <= n; step++) {
        const i = (start + step) % n;
        curK.push(ks[i]);
        curC.push(r[i * 2], r[i * 2 + 1]);
        if (step === n || isJunction(ks[i])) {
          refs.push(register(curK, curC));
          curK = [ks[i]];
          curC = [r[i * 2], r[i * 2 + 1]];
        }
      }
      return refs;
    });
    delete f.keys;
  }
  return { arcs, arcUse, neigh };
}

export function reversePairs(c) {
  const out = new Array(c.length);
  for (let i = 0, j = c.length - 2; j >= 0; i += 2, j -= 2) { out[i] = c[j]; out[i + 1] = c[j + 1]; }
  return out;
}

/** Agrupa anéis (refs) em polígonos: externos (horário no SHP) + buracos. */
export function groupPolygons(f) {
  const outers = [], holes = [];
  f.rings.forEach((r, i) => (signedArea(r) <= 0 ? outers : holes).push(i));
  if (!outers.length) { outers.push(...holes.splice(0)); }
  const polys = outers.map((i) => [i]);
  for (const h of holes) {
    const r = f.rings[h];
    const owner = outers.findIndex((o) => pointInRing(r[0], r[1], f.rings[o]));
    polys[owner === -1 ? 0 : owner].push(h);
  }
  return polys.map((p) => p.map((ri) => f.ringArcs[ri]));
}

// ---------------------------------------------------------------- TopoJSON
export function encodeTopo(objects, rawArcs, tol, usedArcIdx) {
  // simplifica só os arcos usados e remapeia índices
  const remap = new Map();
  const simplified = [];
  for (const i of usedArcIdx) {
    remap.set(i, simplified.length);
    const a = rawArcs[i];
    simplified.push(a.presimplified ? a.pts : simplifyArc(a.pts, tol));
  }
  let x0 = Infinity, y0 = Infinity, x1 = -Infinity, y1 = -Infinity;
  for (const a of simplified) for (let i = 0; i < a.length; i += 2) {
    if (a[i] < x0) x0 = a[i]; if (a[i] > x1) x1 = a[i];
    if (a[i + 1] < y0) y0 = a[i + 1]; if (a[i + 1] > y1) y1 = a[i + 1];
  }
  const kx = (x1 - x0) / (QUANT - 1) || 1, ky = (y1 - y0) / (QUANT - 1) || 1;
  const arcs = simplified.map((a) => {
    const out = [];
    let px = 0, py = 0;
    for (let i = 0; i < a.length; i += 2) {
      const qx = Math.round((a[i] - x0) / kx), qy = Math.round((a[i + 1] - y0) / ky);
      if (out.length && qx === px && qy === py) continue;
      out.push([qx - px, qy - py]);
      px = qx; py = qy;
    }
    if (out.length === 1) out.push([0, 0]);
    return out;
  });
  const mapRef = (r) => (r < 0 ? ~remap.get(~r) : remap.get(r));
  const mapped = {};
  for (const [name, obj] of Object.entries(objects)) {
    mapped[name] = {
      type: 'GeometryCollection',
      geometries: obj.geometries.map((g) => ({
        ...g,
        arcs: g.type === 'MultiPolygon'
          ? g.arcs.map((poly) => poly.map((ring) => ring.map(mapRef)))
          : g.arcs.map((ring) => ring.map(mapRef)), // Polygon e MultiLineString
      })),
    };
  }
  return {
    type: 'Topology',
    bbox: [x0, y0, x1, y1].map((v) => +v.toFixed(5)),
    transform: { scale: [kx, ky], translate: [x0, y0] },
    objects: mapped,
    arcs,
  };
}

