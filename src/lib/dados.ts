'use client';
/**
 * Carregamento dos arquivos estáticos (/data, /geo) com cache em memória e
 * deduplicação de requisições em andamento.
 */
import { useEffect, useState } from 'react';
import type { Arquivo, CargoSlug, Municipio, Turno } from './dominio';
import { caixaGeo } from './projecao';
import { toGeoJSON, type Topology } from './topojson';

const cache = new Map<string, Promise<unknown>>();

export class ArquivoAusente extends Error {
  constructor(public url: string) {
    super(`Arquivo não encontrado: ${url}`);
  }
}

export function buscar<T>(url: string): Promise<T> {
  let p = cache.get(url) as Promise<T> | undefined;
  if (!p) {
    p = fetch(url).then(async (r) => {
      if (r.status === 404) throw new ArquivoAusente(url);
      if (!r.ok) throw new Error(`Falha ao carregar ${url} (HTTP ${r.status})`);
      return r.json() as Promise<T>;
    });
    p.catch(() => cache.delete(url)); // permite tentar de novo
    cache.set(url, p);
  }
  return p;
}

/** Pré-carrega em segundo plano (ex.: ao passar o mouse numa aba). */
export const preCarregar = (url: string) => void buscar(url).catch(() => {});

export const urlResultado = (cargo: CargoSlug, turno: Turno, abr: string) =>
  `/data/2026/${cargo}/${turno}/${abr === 'exterior' ? 'zz' : abr}.json`;

/** Presidente usa um arquivo nacional único também na visão por UF. */
export const urlResultadoParaTela = (cargo: CargoSlug, turno: Turno, abr: string) =>
  cargo === 'presidente' && abr !== 'exterior' ? urlResultado(cargo, turno, 'br') : urlResultado(cargo, turno, abr);

export const urlMalha = (abr: string) =>
  abr === 'br' ? '/geo/br.json' : abr === 'exterior' ? '/geo/mundo.json' : `/geo/uf/${abr}.json`;

export type Malha = { municipios: GeoJSON.FeatureCollection; linhas: GeoJSON.FeatureCollection; bbox: [number, number, number, number] };

const malhas = new Map<string, Promise<Malha>>();
export function buscarMalha(abr: string): Promise<Malha> {
  let p = malhas.get(abr);
  if (!p) {
    p = buscar<Topology>(urlMalha(abr)).then((topo) => {
      const nomes = Object.keys(topo.objects);
      const area = nomes.includes('municipios') ? 'municipios' : nomes[0];
      const linha = nomes.find((n) => n !== area);
      const municipios = toGeoJSON(topo, area);
      if (abr === 'exterior') desembrulharAntimeridiano(municipios);
      return {
        municipios,
        linhas: linha ? toGeoJSON(topo, linha) : { type: 'FeatureCollection', features: [] },
        bbox: topo.bbox,
      };
    });
    p.catch(() => malhas.delete(abr));
    malhas.set(abr, p);
  }
  return p;
}

export interface Estado<T> {
  dados: T | null;
  erro: Error | null;
  carregando: boolean;
}

/** Hook mínimo de dados: mantém o último valor enquanto o próximo carrega. */
export function useArquivo<T>(carregar: (() => Promise<T>) | null, chave: string): Estado<T> {
  const [estado, setEstado] = useState<Estado<T>>({ dados: null, erro: null, carregando: !!carregar });
  useEffect(() => {
    if (!carregar) { setEstado({ dados: null, erro: null, carregando: false }); return; }
    let vivo = true;
    setEstado((e) => ({ ...e, carregando: true, erro: null }));
    carregar().then(
      (dados) => vivo && setEstado({ dados, erro: null, carregando: false }),
      (erro: Error) => vivo && setEstado({ dados: null, erro, carregando: false }),
    );
    return () => { vivo = false; };
    // a chave identifica a requisição; `carregar` muda a cada render
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave]);
  return estado;
}

/** Nível do mapa numa UF (ADRs 0008 e 0009). */
export type Nivel = 'municipios' | 'zonas' | 'bairros';
export const lerNivel = (s: string | null, abr: string): Nivel =>
  abr !== 'br' && abr !== 'exterior' && (s === 'zonas' || s === 'bairros') ? s : 'municipios';

export const urlResultadoNivel = (cargo: CargoSlug, turno: Turno, abr: string, nivel: Nivel) =>
  nivel === 'municipios' ? urlResultadoParaTela(cargo, turno, abr) : `/data/2026/${cargo}/${turno}/${nivel}/${abr}.json`;

export const useResultado = (cargo: CargoSlug, turno: Turno, abr: string, nivel: Nivel = 'municipios') => {
  const url = urlResultadoNivel(cargo, turno, abr, nivel);
  return useArquivo<Arquivo>(() => buscar<Arquivo>(url), url);
};

/** Áreas das zonas eleitorais da UF, com as divisas dos municípios por cima. */
function buscarMalhaZonas(uf: string): Promise<Malha> {
  const k = `zonas:${uf}`;
  let p = malhas.get(k);
  if (!p) {
    p = Promise.all([buscar<Topology>(`/geo/zonas/${uf}.json`), buscarMalha(uf)]).then(([topo, base]) => ({
      municipios: toGeoJSON(topo, 'zonas'),
      linhas: base.municipios, // contorno dos municípios
      bbox: base.bbox,
    }));
    p.catch(() => malhas.delete(k));
    malhas.set(k, p);
  }
  return p;
}

export const useMalha = (abr: string, nivel: Nivel = 'municipios') =>
  useArquivo<Malha>(() => (nivel === 'zonas' ? buscarMalhaZonas(abr) : buscarMalha(abr)), `malha:${abr}:${nivel === 'zonas' ? 'z' : 'm'}`);

// ------------------------------------------------------------------ bairros (ADR 0009)
/** Bairro: área do IBGE (origem 'i') ou nome do cadastro do TSE, sem área (origem 't'). */
export interface Bairro { id: string; ibge: string; nome: string; origem: 'i' | 't'; lon: number | null; lat: number | null; eleitorado: number; locais: number }
export interface Bairros { lista: Bairro[]; porId: Map<string, Bairro>; porCidade: Map<string, Bairro[]> }

const bairrosCache = new Map<string, Promise<Bairros>>();
function buscarBairros(uf: string): Promise<Bairros> {
  let p = bairrosCache.get(uf);
  if (!p) {
    p = buscar<{ b: (string | number | null)[][] }>(`/data/2026/bairros/${uf}.json`).then(({ b }) => {
      const lista: Bairro[] = b.map(([id, ibge, nome, origem, lon, lat, eleitorado, locais]) => ({
        id: String(id), ibge: String(ibge), nome: String(nome), origem: origem === 'i' ? 'i' : 't',
        lon: lon as number | null, lat: lat as number | null, eleitorado: Number(eleitorado) || 0, locais: Number(locais) || 0,
      }));
      const porCidade = new Map<string, Bairro[]>();
      for (const x of lista) {
        if (!porCidade.has(x.ibge)) porCidade.set(x.ibge, []);
        porCidade.get(x.ibge)!.push(x);
      }
      return { lista, porId: new Map(lista.map((x) => [x.id, x])), porCidade };
    });
    p.catch(() => bairrosCache.delete(uf));
    bairrosCache.set(uf, p);
  }
  return p;
}
export const useBairros = (uf: string | null) =>
  useArquivo<Bairros>(uf ? () => buscarBairros(uf) : null, `bairros:${uf ?? '-'}`);

/** Malha de uma cidade no nível bairros: áreas do IBGE (se houver) + a cidade como fundo + círculos dos bairros sem área. */
export interface MalhaCidade { malha: Malha; fundo: GeoJSON.FeatureCollection; pontos: GeoJSON.FeatureCollection }

const cidadesCache = new Map<string, Promise<MalhaCidade>>();
function buscarMalhaCidade(uf: string, ibge: string): Promise<MalhaCidade> {
  const k = `${uf}:${ibge}`;
  let p = cidadesCache.get(k);
  if (!p) {
    p = Promise.all([
      buscarMalha(uf),
      buscar<Record<string, number>>(`/geo/bairros/${uf}/cidades.json`).catch(() => ({} as Record<string, number>)),
      // sem o cadastro de bairros (dados ainda não gerados) a malha da cidade aparece mesmo assim
      buscarBairros(uf).catch((): Bairros => ({ lista: [], porId: new Map(), porCidade: new Map() })),
    ]).then(async ([base, comMalha, bairros]) => {
      const cidade = base.municipios.features.filter((f) => String(f.id) === ibge);
      const fundo: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: cidade };
      const areas: GeoJSON.FeatureCollection = ibge in comMalha
        ? toGeoJSON(await buscar<Topology>(`/geo/bairros/${uf}/${ibge}.json`), 'bairros')
        : { type: 'FeatureCollection', features: [] };
      const pontos: GeoJSON.FeatureCollection = {
        type: 'FeatureCollection',
        features: (bairros.porCidade.get(ibge) ?? [])
          .filter((x) => x.origem === 't' && x.lon !== null && x.lat !== null)
          .sort((a, b) => b.eleitorado - a.eleitorado) // maiores embaixo
          .map((x) => ({ type: 'Feature', id: x.id, properties: { id: x.id, eleitorado: x.eleitorado }, geometry: { type: 'Point', coordinates: [x.lon!, x.lat!] } })),
      };
      const bbox = caixaGeo({ type: 'FeatureCollection', features: [...cidade, ...areas.features, ...pontos.features] });
      return { malha: { municipios: areas, linhas: { type: 'FeatureCollection', features: [] }, bbox }, fundo, pontos };
    });
    p.catch(() => cidadesCache.delete(k));
    cidadesCache.set(k, p);
  }
  return p;
}
export const useMalhaCidade = (uf: string | null, ibge: string | null) =>
  useArquivo<MalhaCidade>(uf && ibge ? () => buscarMalhaCidade(uf, ibge) : null, `cidade:${uf}:${ibge}`);

/** Locais de votação de um bairro (cadastro do TSE), para a lista no painel. */
export interface Local { id: string; ibge: string; nome: string; eleitorado: number; idBairro: string; zona: string }
const locaisCache = new Map<string, Promise<Local[]>>();
function buscarLocais(uf: string): Promise<Local[]> {
  let p = locaisCache.get(uf);
  if (!p) {
    p = buscar<{ l: (string | number | null)[][] }>(`/geo/locais/${uf}.json`).then(({ l }) =>
      l.map((r) => ({ id: String(r[0]), ibge: String(r[1]), zona: String(r[2]), nome: String(r[3]), eleitorado: Number(r[7]) || 0, idBairro: String(r[8] ?? '') })),
    );
    p.catch(() => locaisCache.delete(uf));
    locaisCache.set(uf, p);
  }
  return p;
}
export const useLocais = (uf: string | null) => useArquivo<Local[]>(uf ? () => buscarLocais(uf) : null, `locais:${uf ?? '-'}`);

export const useMunicipios = () =>
  useArquivo<Municipio[]>(() => buscar<Municipio[]>('/data/2026/municipios.json'), 'municipios');

export interface Regiao { tipo: 'imediata' | 'intermediaria'; nome: string; uf: string; pai?: string }
export const useRegioes = () => useArquivo<Record<string, Regiao>>(() => buscar('/geo/regioes.json'), 'regioes');

/**
 * Países que cruzam a linha de data (Rússia, Fiji) têm anéis que saltam de +180 para -180,
 * o que desenha uma faixa horizontal no mapa. Desloca a parte oeste em +360°.
 */
function desembrulharAntimeridiano(fc: GeoJSON.FeatureCollection) {
  const anel = (r: GeoJSON.Position[]) => {
    const temLeste = r.some(([x]) => x > 150);
    const temOeste = r.some(([x]) => x < -150);
    // cria pontos novos: as posições são compartilhadas entre arcos vizinhos
    if (temLeste && temOeste) for (let i = 0; i < r.length; i++) if (r[i][0] < 0) r[i] = [r[i][0] + 360, r[i][1]];
  };
  for (const f of fc.features) {
    const g = f.geometry;
    if (g.type === 'Polygon') g.coordinates.forEach(anel);
    else if (g.type === 'MultiPolygon') g.coordinates.forEach((p) => p.forEach(anel));
  }
}
