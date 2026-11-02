'use client';
/**
 * Mapa em SVG (ADR 0010). Sem biblioteca de mapas: a malha do IBGE é projetada uma vez
 * (Mercator, src/lib/projecao.ts) e o zoom/arraste é uma transformação no <g> de cima.
 * Fundo #666666 e bordas brancas (ADR 0004). Camadas, de baixo para cima:
 *   fundo (cidade em cinza, no nível bairros) → áreas (cor do vencedor) → linhas (divisas)
 *   → círculos (bairros sem área) → contorno de hover e de seleção.
 */
import { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { BORDA_MUNICIPIO, FUNDO_MAPA, SEM_DADOS } from '@/lib/cores';
import type { Malha } from '@/lib/dados';
import { caixa, caminho, criarProjecao, type Caixa } from '@/lib/projecao';

interface Props {
  /** muda quando a malha muda (abrangência/nível) */
  chave: string;
  malha: Malha;
  /** geometria de apoio pintada em cinza por baixo (ex.: a cidade, no nível bairros) */
  fundo?: GeoJSON.FeatureCollection | null;
  /** fundo sem a linha externa (bairros: o contorno da cidade não aparece) */
  semContornoFundo?: boolean;
  /** unidades sem área (bairros do cadastro do TSE): círculos com área ∝ properties.eleitorado */
  pontos?: GeoJSON.FeatureCollection | null;
  cores: Map<string, string> | null;
  selecionado: string | null;
  /** várias unidades somadas (shift + clique): todas ganham o contorno de seleção */
  selecionados?: string[];
  destaque: Set<string> | null;
  mundo: boolean;
  /** somar = shift + clique: põe ou tira a unidade da soma */
  aoSelecionar: (id: string | null, somar?: boolean) => void;
  /** duplo clique (ou toque duplo) numa área: abrir o detalhe dela */
  aoAbrir?: (id: string) => void;
  descrever: (id: string) => { titulo: string; linha: string } | null;
}

interface Vista { k: number; x: number; y: number }
interface Item { id: string; d: string }
interface Ponto { id: string; cx: number; cy: number; e: number }

const BBOX_MUNDO: [number, number, number, number] = [-170, -58, 180, 78];
const ZOOM_MAX = 80;

/** No celular a gaveta cobre a parte de baixo do mapa (ver --espiada no CSS). */
const margens = () =>
  typeof window !== 'undefined' && window.innerWidth < 1100
    ? { t: 16, r: 16, b: 300 + 16, l: 16 }
    : { t: 24, r: 24, b: 24, l: 24 };

const reduzirMovimento = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;

function Mapa({ chave, malha, fundo = null, pontos = null, cores, selecionado, selecionados, destaque, mundo, semContornoFundo = false, aoSelecionar, aoAbrir, descrever }: Props) {
  const raiz = useRef<HTMLDivElement>(null);
  const svg = useRef<SVGSVGElement>(null);
  const [tam, setTam] = useState({ w: 0, h: 0 });
  const [vista, setVista] = useState<Vista>({ k: 1, x: 0, y: 0 });
  const vistaRef = useRef(vista);
  vistaRef.current = vista;
  const [hover, setHover] = useState<string | null>(null);
  const [dica, setDica] = useState<{ x: number; y: number; titulo: string; linha: string } | null>(null);
  const cb = useRef({ aoSelecionar, aoAbrir, descrever });
  cb.current = { aoSelecionar, aoAbrir, descrever };
  const ultimoClique = useRef<{ id: string | null; t: number }>({ id: null, t: 0 });

  // ---- tamanho do quadro
  useEffect(() => {
    const el = raiz.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setTam({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // ---- projeção e caminhos (uma vez por malha)
  const proj = useMemo(() => criarProjecao(mundo ? BBOX_MUNDO : malha.bbox), [malha, mundo]);
  const areas = useMemo<Item[]>(
    () => malha.municipios.features.map((f) => ({ id: String(f.id), d: caminho(f.geometry, proj) })),
    [malha, proj],
  );
  const linhas = useMemo(() => malha.linhas.features.map((f) => caminho(f.geometry, proj)).join(''), [malha, proj]);
  const fundoD = useMemo(() => (fundo ? fundo.features.map((f) => caminho(f.geometry, proj)).join('') : ''), [fundo, proj]);
  const circulos = useMemo<Ponto[]>(
    () => (pontos?.features ?? []).flatMap((f) => {
      if (f.geometry.type !== 'Point') return [];
      const [cx, cy] = proj(f.geometry.coordinates[0], f.geometry.coordinates[1]);
      return [{ id: String(f.id), cx, cy, e: Number(f.properties?.eleitorado) || 0 }];
    }),
    [pontos, proj],
  );
  const dPorId = useMemo(() => new Map(areas.map((a) => [a.id, a.d])), [areas]);

  // caixa do conteúdo (para enquadrar)
  const caixaDe = useCallback(
    (ids: Set<string> | null): Caixa | null => {
      let c: Caixa | null = null;
      const fontes = [...(fundo?.features ?? []), ...malha.municipios.features, ...(pontos?.features ?? [])];
      for (const f of fontes) {
        if (ids && !ids.has(String(f.id))) continue;
        c = caixa(f.geometry, proj, c ?? undefined);
      }
      return c && Number.isFinite(c[0]) ? c : null;
    },
    [malha, fundo, pontos, proj],
  );

  // ---- vista: enquadrar com animação curta
  const anim = useRef(0);
  const irPara = useCallback((alvo: Vista, animar: boolean) => {
    cancelAnimationFrame(anim.current);
    if (!animar || reduzirMovimento()) { setVista(alvo); return; }
    const de = vistaRef.current;
    const t0 = performance.now();
    const passo = (t: number) => {
      const u = Math.min(1, (t - t0) / 380);
      const e = 1 - (1 - u) ** 3; // ease-out
      // interpola em escala log para o zoom não "pular"
      const k = Math.exp(Math.log(de.k) + (Math.log(alvo.k) - Math.log(de.k)) * e);
      setVista({ k, x: de.x + (alvo.x - de.x) * e, y: de.y + (alvo.y - de.y) * e });
      if (u < 1) anim.current = requestAnimationFrame(passo);
    };
    anim.current = requestAnimationFrame(passo);
  }, []);

  const enquadrar = useCallback(
    (c: Caixa | null, animar: boolean, folga = 0) => {
      if (!c || !tam.w || !tam.h) return;
      const m = margens();
      const w = Math.max(40, tam.w - m.l - m.r - folga * 2), h = Math.max(40, tam.h - m.t - m.b - folga * 2);
      const k = Math.min(w / Math.max(1e-6, c[2] - c[0]), h / Math.max(1e-6, c[3] - c[1]));
      const x = m.l + folga + (w - (c[2] - c[0]) * k) / 2 - c[0] * k;
      const y = m.t + folga + (h - (c[3] - c[1]) * k) / 2 - c[1] * k;
      irPara({ k, x, y }, animar);
    },
    [tam, irPara],
  );

  // zoom mínimo/máximo relativos ao enquadramento inicial
  const kBase = useRef(1);
  useEffect(() => {
    if (!tam.w) return;
    const c = caixaDe(null);
    if (!c) return;
    const m = margens();
    kBase.current = Math.min((tam.w - m.l - m.r) / (c[2] - c[0]), (tam.h - m.t - m.b) / (c[3] - c[1]));
    enquadrar(c, false);
    setHover(null); setDica(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, tam.w > 0, mundo]);

  // região destacada: enquadra nela (ou volta ao todo)
  const primeiraRegiao = useRef(true);
  useEffect(() => {
    if (primeiraRegiao.current) { primeiraRegiao.current = false; if (!destaque) return; }
    if (destaque) enquadrar(caixaDe(destaque), true, 16);
    else if (!mundo) enquadrar(caixaDe(null), true);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [destaque]);

  const zoomEm = useCallback((px: number, py: number, fator: number, animar = false) => {
    const v = vistaRef.current;
    const k = Math.min(kBase.current * ZOOM_MAX, Math.max(kBase.current * 0.6, v.k * fator));
    const f = k / v.k;
    const alvo = { k, x: px - (px - v.x) * f, y: py - (py - v.y) * f };
    if (animar) irPara(alvo, true); else { cancelAnimationFrame(anim.current); setVista(alvo); }
  }, [irPara]);

  // ---- roda do mouse (precisa de listener não passivo para impedir a rolagem da página)
  useEffect(() => {
    const el = svg.current;
    if (!el) return;
    const roda = (e: WheelEvent) => {
      e.preventDefault();
      const r = el.getBoundingClientRect();
      const fator = Math.exp(-e.deltaY * (e.deltaMode === 1 ? 0.05 : 0.0018));
      zoomEm(e.clientX - r.left, e.clientY - r.top, fator);
    };
    el.addEventListener('wheel', roda, { passive: false });
    return () => el.removeEventListener('wheel', roda);
  }, [zoomEm]);

  // ---- arrastar, pinça, hover e clique
  const ponteiros = useRef(new Map<number, { x: number; y: number }>());
  const gesto = useRef<{ x: number; y: number; v: Vista; moveu: boolean; dist?: number; meio?: { x: number; y: number }; id?: string | null } | null>(null);

  const idSob = (t: EventTarget | null) => (t instanceof Element ? t.closest('[data-id]')?.getAttribute('data-id') ?? null : null);
  const local = (e: React.PointerEvent) => {
    const r = svg.current!.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  };

  const aoApertar = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const p = local(e);
    ponteiros.current.set(e.pointerId, p);
    svg.current!.setPointerCapture(e.pointerId);
    cancelAnimationFrame(anim.current);
    if (ponteiros.current.size === 2) {
      const [a, b] = [...ponteiros.current.values()];
      gesto.current = { x: p.x, y: p.y, v: vistaRef.current, moveu: true, dist: Math.hypot(a.x - b.x, a.y - b.y), meio: { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 } };
    } else gesto.current = { x: p.x, y: p.y, v: vistaRef.current, moveu: false, id: idSob(e.target) };
  };

  const aoMover = (e: React.PointerEvent) => {
    const p = local(e);
    const g = gesto.current;
    if (g && ponteiros.current.has(e.pointerId)) {
      ponteiros.current.set(e.pointerId, p);
      if (ponteiros.current.size === 2 && g.dist && g.meio) {
        const [a, b] = [...ponteiros.current.values()];
        const dist = Math.hypot(a.x - b.x, a.y - b.y);
        const meio = { x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 };
        const k = Math.min(kBase.current * ZOOM_MAX, Math.max(kBase.current * 0.6, g.v.k * (dist / g.dist)));
        const f = k / g.v.k;
        setVista({ k, x: meio.x - (g.meio.x - g.v.x) * f, y: meio.y - (g.meio.y - g.v.y) * f });
        return;
      }
      const dx = p.x - g.x, dy = p.y - g.y;
      if (!g.moveu && Math.hypot(dx, dy) > 4) { g.moveu = true; setDica(null); }
      if (g.moveu) { setVista({ k: g.v.k, x: g.v.x + dx, y: g.v.y + dy }); return; }
    }
    if (e.pointerType !== 'mouse') return; // no toque não há hover
    const id = idSob(e.target);
    setHover(id);
    const d = id ? cb.current.descrever(id) : null;
    setDica(d ? { x: p.x, y: p.y, ...d } : null);
  };

  const aoSoltar = (e: React.PointerEvent) => {
    const g = gesto.current;
    ponteiros.current.delete(e.pointerId);
    if (ponteiros.current.size > 0) return;
    gesto.current = null;
    if (g && !g.moveu) {
      // a área vem do momento em que o botão desceu: com a captura do ponteiro, o evento de soltar
      // chega pelo <svg> inteiro (no mouse), e não pela área clicada
      const id = g.id ?? null;
      const agora = performance.now();
      const duplo = id !== null && ultimoClique.current.id === id && agora - ultimoClique.current.t < 420;
      ultimoClique.current = { id, t: duplo ? 0 : agora };
      // o 1º clique seleciona; o 2º, logo em seguida e na mesma área, abre o detalhe
      if (duplo && !e.shiftKey && cb.current.aoAbrir) cb.current.aoAbrir(id);
      else cb.current.aoSelecionar(id, e.shiftKey);
    }
  };

  // ---- teclado: + − 0 e setas
  const aoTeclar = (e: React.KeyboardEvent) => {
    const c = { x: tam.w / 2, y: tam.h / 2 };
    const v = vistaRef.current;
    const passo = 60;
    const acoes: Record<string, () => void> = {
      '+': () => zoomEm(c.x, c.y, 1.5, true),
      '=': () => zoomEm(c.x, c.y, 1.5, true),
      '-': () => zoomEm(c.x, c.y, 1 / 1.5, true),
      '0': () => enquadrar(caixaDe(destaque), true),
      ArrowLeft: () => setVista({ ...v, x: v.x + passo }),
      ArrowRight: () => setVista({ ...v, x: v.x - passo }),
      ArrowUp: () => setVista({ ...v, y: v.y + passo }),
      ArrowDown: () => setVista({ ...v, y: v.y - passo }),
      Escape: () => cb.current.aoSelecionar(null),
    };
    const fn = acoes[e.key];
    if (fn) { e.preventDefault(); fn(); }
  };

  // ---- camadas (memorizadas: zoom e hover não redesenham milhares de caminhos)
  const camadaAreas = useMemo(
    () => areas.map((a) => (
      <path
        key={a.id}
        data-id={a.id}
        d={a.d}
        fill={cores?.get(a.id) ?? SEM_DADOS}
        fillOpacity={destaque && !destaque.has(a.id) ? 0.28 : 1}
      />
    )),
    [areas, cores, destaque],
  );

  // largura das bordas cresce devagar com o zoom
  const z = vista.k / (kBase.current || 1);
  const traco = Math.min(1.4, (areas.length > 2000 ? 0.12 : 0.35) * Math.sqrt(z));
  // área do círculo ∝ eleitorado; pequeno na cidade inteira, cresce com o zoom para separar os vizinhos
  const raioPx = (e: number) => Math.max(2.5, Math.min(24, 0.045 * Math.sqrt(e) * Math.min(4, Math.sqrt(z))));

  const dHover = hover ? dPorId.get(hover) : undefined;
  const dSel = selecionados?.length ? selecionados.map((s) => dPorId.get(s) ?? '').join('') : selecionado ? dPorId.get(selecionado) : undefined;
  const cSels = selecionados?.length ? circulos.filter((c) => selecionados.includes(c.id)) : [];
  const cHover = hover ? circulos.find((c) => c.id === hover) : undefined;
  const cSel = selecionado ? circulos.find((c) => c.id === selecionado) : undefined;

  return (
    <div ref={raiz} className="mapa-canvas">
      <svg
        ref={svg}
        className="mapa-svg"
        width={tam.w}
        height={tam.h}
        viewBox={`0 0 ${tam.w || 1} ${tam.h || 1}`}
        role="application"
        aria-roledescription="mapa"
        aria-label="Mapa de resultados. Arraste para mover, use a roda ou + e − para aproximar, clique numa área para ver o resultado."
        tabIndex={0}
        onPointerDown={aoApertar}
        onPointerMove={aoMover}
        onPointerUp={aoSoltar}
        onPointerCancel={aoSoltar}
        onPointerLeave={() => { setHover(null); setDica(null); }}
        onKeyDown={aoTeclar}
      >
        <rect width="100%" height="100%" fill={FUNDO_MAPA} />
        <g transform={`translate(${vista.x},${vista.y}) scale(${vista.k})`}>
          {fundoD ? <path className={semContornoFundo ? 'mapa-fundo sem-contorno' : 'mapa-fundo'} d={fundoD} /> : null}
          <g className="mapa-areas" stroke={BORDA_MUNICIPIO} strokeWidth={traco} strokeOpacity={areas.length > 2000 ? 0.75 : 0.95}>
            {camadaAreas}
          </g>
          {linhas ? <path className="mapa-linhas" d={linhas} stroke={BORDA_MUNICIPIO} strokeWidth={Math.min(3, 1.1 * Math.sqrt(z))} /> : null}
          {circulos.length ? (
            <g className="mapa-pontos" stroke={BORDA_MUNICIPIO} strokeWidth={1}>
              {circulos.map((c) => (
                <circle
                  key={c.id}
                  data-id={c.id}
                  cx={c.cx}
                  cy={c.cy}
                  r={raioPx(c.e) / vista.k}
                  fill={cores?.get(c.id) ?? SEM_DADOS}
                  fillOpacity={0.88}
                />
              ))}
            </g>
          ) : null}
          {dHover && hover !== selecionado ? <path className="mapa-hover" d={dHover} /> : null}
          {cHover && hover !== selecionado ? <circle className="mapa-hover" cx={cHover.cx} cy={cHover.cy} r={raioPx(cHover.e) / vista.k} /> : null}
          {dSel ? <path className="mapa-selecao" d={dSel} /> : null}
          {cSel ? <circle className="mapa-selecao" cx={cSel.cx} cy={cSel.cy} r={raioPx(cSel.e) / vista.k} /> : null}
          {cSels.map((c) => <circle key={c.id} className="mapa-selecao" cx={c.cx} cy={c.cy} r={raioPx(c.e) / vista.k} />)}
        </g>
      </svg>

      <div className="mapa-zoom" role="group" aria-label="Zoom">
        <button type="button" aria-label="Aproximar" onClick={() => zoomEm(tam.w / 2, tam.h / 2, 1.6, true)}>+</button>
        <button type="button" aria-label="Afastar" onClick={() => zoomEm(tam.w / 2, tam.h / 2, 1 / 1.6, true)}>−</button>
        <button type="button" aria-label="Ver tudo" onClick={() => enquadrar(caixaDe(destaque), true)}>
          <svg viewBox="0 0 16 16" width="14" height="14" aria-hidden><path d="M2 6V2h4M10 2h4v4M14 10v4h-4M6 14H2v-4" fill="none" stroke="currentColor" strokeWidth="1.6" /></svg>
        </button>
      </div>

      {dica ? (
        <div className="dica-mapa" style={{ left: dica.x, top: dica.y }} role="status">
          <strong>{dica.titulo}</strong>
          <span>{dica.linha}</span>
        </div>
      ) : null}
    </div>
  );
}

export default memo(Mapa);
