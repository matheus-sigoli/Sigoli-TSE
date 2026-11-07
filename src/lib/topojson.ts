/**
 * Decodificador mínimo de TopoJSON → GeoJSON (sem dependências).
 * Suporta Polygon, MultiPolygon e MultiLineString com transform quantizado.
 */
export interface Topology {
  type: 'Topology';
  bbox: [number, number, number, number];
  transform: { scale: [number, number]; translate: [number, number] };
  objects: Record<string, { type: 'GeometryCollection'; geometries: TopoGeometry[] }>;
  arcs: [number, number][][];
}

export interface TopoGeometry {
  type: 'Polygon' | 'MultiPolygon' | 'MultiLineString';
  id?: string;
  properties?: Record<string, unknown>;
  arcs: number[][] | number[][][];
}

type Position = [number, number];

function decodeArcs(topo: Topology): Position[][] {
  const [sx, sy] = topo.transform.scale;
  const [tx, ty] = topo.transform.translate;
  return topo.arcs.map((arc) => {
    let x = 0;
    let y = 0;
    return arc.map(([dx, dy]) => {
      x += dx;
      y += dy;
      return [x * sx + tx, y * sy + ty] as Position;
    });
  });
}

export function toGeoJSON(topo: Topology, objectName: string): GeoJSON.FeatureCollection {
  const arcs = decodeArcs(topo);
  const line = (refs: number[]): Position[] => {
    const out: Position[] = [];
    refs.forEach((ref, i) => {
      const a = ref < 0 ? [...arcs[~ref]].reverse() : arcs[ref];
      // pula o primeiro ponto de cada arco depois do primeiro (é o último do anterior)
      for (let k = i === 0 ? 0 : 1; k < a.length; k++) out.push(a[k]);
    });
    return out;
  };
  const obj = topo.objects[objectName];
  return {
    type: 'FeatureCollection',
    features: obj.geometries.map((g) => {
      let geometry: GeoJSON.Geometry;
      if (g.type === 'Polygon') geometry = { type: 'Polygon', coordinates: (g.arcs as number[][]).map(line) };
      else if (g.type === 'MultiPolygon')
        geometry = { type: 'MultiPolygon', coordinates: (g.arcs as number[][][]).map((p) => p.map(line)) };
      else geometry = { type: 'MultiLineString', coordinates: (g.arcs as number[][]).map(line) };
      return { type: 'Feature', id: g.id, properties: { id: g.id, ...(g.properties ?? {}) }, geometry };
    }),
  };
}

