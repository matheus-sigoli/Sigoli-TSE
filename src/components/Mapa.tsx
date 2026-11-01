'use client';
/**
 * Mapa coroplético com MapLibre GL, sem mapa de fundo: só a malha do IBGE
 * sobre o cinza #666666 (ADR 0004). Cores entram por feature-state, então
 * trocar de cargo/turno não recria a fonte de dados.
 */
import {
  LngLatBounds, Map as MapaGL, NavigationControl,
  type GeoJSONSource, type MapMouseEvent,
} from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { memo, useEffect, useRef, useState } from 'react';
import { BORDA_MUNICIPIO, FUNDO_MAPA, SEM_DADOS } from '@/lib/cores';
import type { Malha } from '@/lib/dados';
import Carregando from './Carregando';

interface Props {
  /** muda quando a malha muda (abrangência) */
  chave: string;
  malha: Malha;
  cores: Map<string, string> | null;
  selecionado: string | null;
  destaque: Set<string> | null;
  mundo: boolean;
  /** locais de votação (círculos); quando presentes, são eles que recebem cor e clique */
  pontos?: GeoJSON.FeatureCollection | null;
  aoSelecionar: (id: string | null) => void;
  descrever: (id: string) => { titulo: string; linha: string } | null;
}

/** No celular a gaveta cobre a parte de baixo do mapa (ver --espiada no CSS). */
const margem = (base: number) =>
  typeof window !== 'undefined' && window.innerWidth < 1100
    ? { top: base, left: base, right: base, bottom: 300 + base }
    : base;

const VAZIO: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

function Mapa({ chave, malha, cores, selecionado, destaque, mundo, pontos = null, aoSelecionar, descrever }: Props) {
  const alvo = pontos ? 'pontos' : 'areas';
  const div = useRef<HTMLDivElement>(null);
  const mapa = useRef<MapaGL | null>(null);
  const [pronto, setPronto] = useState(false);
  const [desenhando, setDesenhando] = useState(true);
  const [dica, setDica] = useState<{ x: number; y: number; titulo: string; linha: string } | null>(null);
  // callbacks mais recentes sem re-registrar eventos
  const cb = useRef({ aoSelecionar, descrever, alvo });
  cb.current = { aoSelecionar, descrever, alvo };
  const coresAplicadas = useRef(new Set<string>());

  // ---- cria o mapa uma vez
  useEffect(() => {
    if (!div.current) return;
    const m = new MapaGL({
      container: div.current,
      style: {
        version: 8,
        sources: {
          areas: { type: 'geojson', data: VAZIO, promoteId: 'id' },
          linhas: { type: 'geojson', data: VAZIO },
          pontos: { type: 'geojson', data: VAZIO, promoteId: 'id' },
        },
        layers: [
          { id: 'fundo', type: 'background', paint: { 'background-color': FUNDO_MAPA } },
          {
            id: 'areas',
            type: 'fill',
            source: 'areas',
            paint: {
              'fill-color': ['coalesce', ['feature-state', 'cor'], SEM_DADOS],
              'fill-opacity': ['case', ['boolean', ['feature-state', 'apagado'], false], 0.28, 1],
            },
          },
          {
            id: 'bordas',
            type: 'line',
            source: 'areas',
            paint: {
              'line-color': BORDA_MUNICIPIO,
              'line-width': ['interpolate', ['linear'], ['zoom'], 3, 0.15, 6, 0.5, 9, 1.1],
              'line-opacity': ['interpolate', ['linear'], ['zoom'], 3, 0.5, 7, 0.9],
            },
          },
          {
            id: 'divisas',
            type: 'line',
            source: 'linhas',
            paint: { 'line-color': BORDA_MUNICIPIO, 'line-width': ['interpolate', ['linear'], ['zoom'], 3, 1, 8, 2.4] },
          },
          {
            id: 'hover',
            type: 'line',
            source: 'areas',
            paint: {
              'line-color': '#111317',
              'line-width': ['case', ['boolean', ['feature-state', 'hover'], false], 2, 0],
            },
          },
          {
            id: 'selecao',
            type: 'line',
            source: 'areas',
            paint: {
              'line-color': '#111317',
              'line-width': ['case', ['boolean', ['feature-state', 'sel'], false], 3.2, 0],
            },
          },
          {
            id: 'pontos',
            type: 'circle',
            source: 'pontos',
            paint: {
              'circle-color': ['coalesce', ['feature-state', 'cor'], SEM_DADOS],
              // área do círculo proporcional ao eleitorado do local
              'circle-radius': [
                'interpolate', ['linear'], ['zoom'],
                4, ['max', 1, ['*', 0.025, ['sqrt', ['get', 'eleitorado']]]],
                8, ['max', 2, ['*', 0.09, ['sqrt', ['get', 'eleitorado']]]],
                12, ['max', 4, ['*', 0.4, ['sqrt', ['get', 'eleitorado']]]],
              ],
              'circle-stroke-color': ['case', ['boolean', ['feature-state', 'sel'], false], '#111317', ['boolean', ['feature-state', 'hover'], false], '#111317', BORDA_MUNICIPIO],
              'circle-stroke-width': ['case', ['boolean', ['feature-state', 'sel'], false], 2.6, ['boolean', ['feature-state', 'hover'], false], 2, ['interpolate', ['linear'], ['zoom'], 5, 0.3, 10, 1]],
              'circle-opacity': ['case', ['boolean', ['feature-state', 'apagado'], false], 0.25, 0.95],
            },
          },
        ],
      },
      attributionControl: false,
      dragRotate: false,
      pitchWithRotate: false,
      renderWorldCopies: false,
      fadeDuration: 0,
      maxZoom: 12,
    });
    m.touchZoomRotate.disableRotation();
    m.keyboard.disableRotation();
    m.addControl(new NavigationControl({ showCompass: false }), 'bottom-right');

    // passa o mouse / clica na camada ativa (áreas, ou círculos dos locais)
    let hover: { fonte: string; id: string | number } | null = null;
    const limparHover = () => {
      if (hover && m.getSource(hover.fonte)) m.setFeatureState({ source: hover.fonte, id: hover.id }, { hover: false });
      hover = null;
      m.getCanvas().style.cursor = '';
      setDica(null);
    };
    m.on('mousemove', (e: MapMouseEvent) => {
      const fonte = cb.current.alvo;
      const f = m.queryRenderedFeatures(e.point, { layers: [fonte] })[0];
      if (!f || f.id === undefined) return limparHover();
      if (!hover || hover.id !== f.id || hover.fonte !== fonte) {
        limparHover();
        hover = { fonte, id: f.id };
        m.setFeatureState({ source: fonte, id: f.id }, { hover: true });
      }
      m.getCanvas().style.cursor = 'pointer';
      const d = cb.current.descrever(String(f.id));
      setDica(d ? { x: e.point.x, y: e.point.y, ...d } : null);
    });
    m.on('mouseout', limparHover);
    m.on('click', (e: MapMouseEvent) => {
      const f = m.queryRenderedFeatures(e.point, { layers: [cb.current.alvo] })[0];
      cb.current.aoSelecionar(f && f.id !== undefined ? String(f.id) : null);
    });
    m.on('load', () => setPronto(true));
    mapa.current = m;
    return () => { m.remove(); mapa.current = null; };
  }, []);

  // ---- troca de malha
  useEffect(() => {
    const m = mapa.current;
    if (!m || !pronto) return;
    setDesenhando(true);
    m.once('idle', () => setDesenhando(false));
    (m.getSource('areas') as GeoJSONSource).setData(malha.municipios);
    (m.getSource('linhas') as GeoJSONSource).setData(malha.linhas);
    coresAplicadas.current.clear();
    m.removeFeatureState({ source: 'areas' });
    const [x0, y0, x1, y1] = mundo ? [-125, -45, 160, 66] : malha.bbox;
    m.fitBounds([[x0, y0], [x1, y1]], { padding: margem(24), animate: false });
    m.setMinZoom(Math.max(0, m.getZoom() - 1));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, pronto]);

  // ---- círculos dos locais de votação
  useEffect(() => {
    const m = mapa.current;
    if (!m || !pronto) return;
    m.removeFeatureState({ source: 'pontos' });
    m.removeFeatureState({ source: 'areas' }); // as cores mudam de camada
    (m.getSource('pontos') as GeoJSONSource).setData(pontos ?? VAZIO);
    coresAplicadas.current.clear();
  }, [pontos, pronto]);

  // ---- cores (feature-state) na camada ativa; nos locais as áreas ficam neutras
  useEffect(() => {
    const m = mapa.current;
    if (!m || !pronto || !cores) return;
    const anteriores = coresAplicadas.current;
    for (const id of anteriores) if (!cores.has(id)) m.removeFeatureState({ source: alvo, id }, 'cor');
    for (const [id, cor] of cores) m.setFeatureState({ source: alvo, id }, { cor });
    coresAplicadas.current = new Set(cores.keys());
  }, [cores, pronto, chave, alvo, pontos]);

  // ---- seleção
  useEffect(() => {
    const m = mapa.current;
    if (!m || !pronto || !selecionado) return;
    m.setFeatureState({ source: alvo, id: selecionado }, { sel: true });
    return () => { if (m.getSource(alvo)) m.setFeatureState({ source: alvo, id: selecionado }, { sel: false }); };
  }, [selecionado, pronto, chave, alvo, pontos]);

  // ---- região: apaga o que está fora e enquadra
  useEffect(() => {
    const m = mapa.current;
    if (!m || !pronto) return;
    const ids: string[] = [];
    for (const f of malha.municipios.features) {
      const id = String(f.id);
      ids.push(id);
      m.setFeatureState({ source: 'areas', id }, { apagado: !!destaque && !destaque.has(id) });
    }
    const alvo = destaque ? malha.municipios.features.filter((f) => destaque.has(String(f.id))) : null;
    if (alvo?.length) {
      const b = new LngLatBounds();
      for (const f of alvo) percorrer(f.geometry, (x, y) => b.extend([x, y]));
      m.fitBounds(b, { padding: margem(40), duration: 500 });
    } else if (!destaque && !mundo) {
      const [x0, y0, x1, y1] = malha.bbox;
      m.fitBounds([[x0, y0], [x1, y1]], { padding: margem(24), duration: 400 });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destaque, pronto, chave]);

  return (
    <>
      <div ref={div} className="mapa-canvas" />
      {desenhando ? <Carregando texto="Desenhando o mapa…" /> : null}
      {dica ? (
        <div className="dica-mapa" style={{ left: dica.x, top: dica.y }} role="status">
          <strong>{dica.titulo}</strong>
          <span>{dica.linha}</span>
        </div>
      ) : null}
    </>
  );
}

function percorrer(g: GeoJSON.Geometry, fn: (x: number, y: number) => void) {
  if (g.type === 'Polygon') for (const r of g.coordinates) for (const [x, y] of r) fn(x, y);
  else if (g.type === 'MultiPolygon') for (const p of g.coordinates) for (const r of p) for (const [x, y] of r) fn(x, y);
}

export default memo(Mapa);
