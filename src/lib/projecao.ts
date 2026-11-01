/**
 * Projeção e caminhos SVG, sem dependências (ADR 0010).
 * Mercator em unidades fixas: o mapa é desenhado uma vez num quadro de LADO × LADO
 * e o zoom/arraste é só uma transformação (translate + scale) no <g> de cima.
 */
export const LADO = 1000;

type Pos = GeoJSON.Position;
export type Caixa = [number, number, number, number]; // x0, y0, x1, y1 (unidades projetadas)

const RAD = Math.PI / 180;
const LAT_MAX = 82; // corta os polos no mapa-múndi
export const mercator = (lon: number, lat: number): [number, number] => {
  const l = Math.max(-LAT_MAX, Math.min(LAT_MAX, lat));
  return [lon * RAD, -Math.log(Math.tan(Math.PI / 4 + (l * RAD) / 2))];
};

/** Ajusta a projeção a uma caixa geográfica [lon0, lat0, lon1, lat1], centralizada no quadro. */
export function criarProjecao(bbox: [number, number, number, number]) {
  const [ax, ay] = mercator(bbox[0], bbox[3]);
  const [bx, by] = mercator(bbox[2], bbox[1]);
  const k = LADO / Math.max(bx - ax, by - ay);
  const ox = (LADO - (bx - ax) * k) / 2;
  const oy = (LADO - (by - ay) * k) / 2;
  return (lon: number, lat: number): [number, number] => {
    const [x, y] = mercator(lon, lat);
    return [(x - ax) * k + ox, (y - ay) * k + oy];
  };
}
export type Projecao = ReturnType<typeof criarProjecao>;

const r1 = (v: number) => Math.round(v * 10) / 10;

function anel(coords: Pos[], p: Projecao, fechar: boolean) {
  let d = '';
  let px = NaN, py = NaN;
  for (let i = 0; i < coords.length; i++) {
    const [x, y] = p(coords[i][0], coords[i][1]);
    const rx = r1(x), ry = r1(y);
    if (rx === px && ry === py) continue; // pontos repetidos depois do arredondamento
    d += (d ? 'L' : 'M') + rx + ',' + ry;
    px = rx; py = ry;
  }
  return fechar && d ? d + 'Z' : d;
}

/** Caminho SVG (atributo d) de uma geometria GeoJSON. */
export function caminho(g: GeoJSON.Geometry, p: Projecao): string {
  switch (g.type) {
    case 'Polygon': return g.coordinates.map((r) => anel(r, p, true)).join('');
    case 'MultiPolygon': return g.coordinates.map((pol) => pol.map((r) => anel(r, p, true)).join('')).join('');
    case 'LineString': return anel(g.coordinates, p, false);
    case 'MultiLineString': return g.coordinates.map((r) => anel(r, p, false)).join('');
    default: return '';
  }
}

/** Caixa projetada de uma geometria (para enquadrar seleção e região). */
export function caixa(g: GeoJSON.Geometry, p: Projecao, acc?: Caixa): Caixa {
  const c: Caixa = acc ?? [Infinity, Infinity, -Infinity, -Infinity];
  const visita = (pos: Pos) => {
    const [x, y] = p(pos[0], pos[1]);
    if (x < c[0]) c[0] = x; if (y < c[1]) c[1] = y;
    if (x > c[2]) c[2] = x; if (y > c[3]) c[3] = y;
  };
  if (g.type === 'Polygon') g.coordinates[0].forEach(visita);
  else if (g.type === 'MultiPolygon') g.coordinates.forEach((pol) => pol[0].forEach(visita));
  else if (g.type === 'Point') visita(g.coordinates);
  else if (g.type === 'MultiLineString') g.coordinates.forEach((l) => l.forEach(visita));
  return c;
}

/** Caixa geográfica [lon0, lat0, lon1, lat1] de uma coleção. */
export function caixaGeo(fc: GeoJSON.FeatureCollection): [number, number, number, number] {
  const c: [number, number, number, number] = [Infinity, Infinity, -Infinity, -Infinity];
  const visita = ([x, y]: Pos) => {
    if (x < c[0]) c[0] = x; if (y < c[1]) c[1] = y;
    if (x > c[2]) c[2] = x; if (y > c[3]) c[3] = y;
  };
  for (const f of fc.features) {
    const g = f.geometry;
    if (g.type === 'Polygon') g.coordinates[0].forEach(visita);
    else if (g.type === 'MultiPolygon') g.coordinates.forEach((p) => p[0].forEach(visita));
    else if (g.type === 'Point') visita(g.coordinates);
  }
  return c;
}
