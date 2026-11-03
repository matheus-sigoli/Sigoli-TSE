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

/**
 * Arquivos por ano (ADR 0015). Resultados: /data/{ano}/... Malhas que dependem do cadastro de locais do ano
 * (zonas, zonas-cidade, locais, locais-areas): /geo/{nome} em 2026 e /geo/{ano}/{nome} nos outros anos.
 * Municípios, UFs, bairros do IBGE e regiões são os mesmos em todos os anos.
 */
export const geoDoAno = (ano: number, nome: string) => (ano === 2026 ? `/geo/${nome}` : `/geo/${ano}/${nome}`);

export const urlResultado = (ano: number, cargo: CargoSlug, turno: Turno, abr: string) =>
  `/data/${ano}/${cargo}/${turno}/${abr === 'exterior' ? 'zz' : abr}.json`;

/** Presidente usa um arquivo nacional único também na visão por UF. */
export const urlResultadoParaTela = (ano: number, cargo: CargoSlug, turno: Turno, abr: string) =>
  cargo === 'presidente' && abr !== 'exterior' ? urlResultado(ano, cargo, turno, 'br') : urlResultado(ano, cargo, turno, abr);

const arquivoMalha = (abr: string) => (abr === 'br' ? 'br.json' : abr === 'exterior' ? 'mundo.json' : `uf/${abr}.json`);
/**
 * Malha municipal do ano: a do IBGE 2025, salvo onde um município novo ainda não existia (ex.: Boa Esperança do Norte
 * junto de Nova Ubiratã até 2022). scripts/malha-ano.mjs grava as trocadas em /geo/{ano}/ e lista em malhas.json.
 */
async function urlMalha(abr: string, ano: number) {
  const arq = arquivoMalha(abr);
  if (ano === 2026) return `/geo/${arq}`;
  const trocadas = await buscar<string[]>(`/geo/${ano}/malhas.json`).catch((): string[] => []);
  return trocadas.includes(arq) ? `/geo/${ano}/${arq}` : `/geo/${arq}`;
}

export type Malha = { municipios: GeoJSON.FeatureCollection; linhas: GeoJSON.FeatureCollection; bbox: [number, number, number, number] };

const malhas = new Map<string, Promise<Malha>>();
export function buscarMalha(abr: string, ano = 2026): Promise<Malha> {
  const k = `${ano}:${abr}`;
  let p = malhas.get(k);
  if (!p) {
    p = urlMalha(abr, ano).then((url) => buscar<Topology>(url)).then((topo) => {
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
    p.catch(() => malhas.delete(k));
    malhas.set(k, p);
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

/**
 * Nível do mapa. No estado: municipios | zonas. Na visão da cidade (?cid=): zonas | bairros | locais (ADR 0011).
 */
export type Nivel = 'municipios' | 'zonas' | 'bairros' | 'locais';
/** Arquivo de resultado por UF de cada nível. */
export type NivelArquivo = 'municipios' | 'zonas' | 'zonas-cidade' | 'bairros' | 'locais';

export const lerNivel = (s: string | null, abr: string, cidade: boolean): Nivel => {
  if (abr === 'br' || abr === 'exterior') return 'municipios';
  if (cidade) return s === 'bairros' || s === 'locais' ? s : 'zonas';
  return s === 'zonas' ? 'zonas' : 'municipios';
};

export const urlResultadoNivel = (ano: number, cargo: CargoSlug, turno: Turno, abr: string, nivel: NivelArquivo) =>
  nivel === 'municipios' ? urlResultadoParaTela(ano, cargo, turno, abr) : `/data/${ano}/${cargo}/${turno}/${nivel}/${abr}.json`;

export const useResultado = (ano: number, cargo: CargoSlug, turno: Turno, abr: string, nivel: NivelArquivo = 'municipios') => {
  const url = urlResultadoNivel(ano, cargo, turno, abr, nivel);
  return useArquivo<Arquivo>(() => buscar<Arquivo>(url), url);
};

/** Áreas das zonas eleitorais da UF, com as divisas dos municípios por cima. */
function buscarMalhaZonas(ano: number, uf: string): Promise<Malha> {
  const k = `zonas:${ano}:${uf}`;
  let p = malhas.get(k);
  if (!p) {
    p = Promise.all([buscar<Topology>(`${geoDoAno(ano, 'zonas')}/${uf}.json`), buscarMalha(uf, ano)]).then(([topo, base]) => ({
      municipios: toGeoJSON(topo, 'zonas'),
      linhas: base.municipios, // contorno dos municípios
      bbox: base.bbox,
    }));
    p.catch(() => malhas.delete(k));
    malhas.set(k, p);
  }
  return p;
}

export const useMalha = (ano: number, abr: string, nivel: 'municipios' | 'zonas' = 'municipios') =>
  useArquivo<Malha>(() => (nivel === 'zonas' ? buscarMalhaZonas(ano, abr) : buscarMalha(abr, ano)), `malha:${ano}:${abr}:${nivel === 'zonas' ? 'z' : 'm'}`);

// ------------------------------------------------------------------ bairros (ADR 0009)
/** Bairro: área do IBGE (origem 'i') ou nome do cadastro do TSE, sem área (origem 't'). */
export interface Bairro { id: string; ibge: string; nome: string; origem: 'i' | 't'; lon: number | null; lat: number | null; eleitorado: number; locais: number }
export interface Bairros { lista: Bairro[]; porId: Map<string, Bairro>; porCidade: Map<string, Bairro[]> }

const bairrosCache = new Map<string, Promise<Bairros>>();
function buscarBairros(ano: number, uf: string): Promise<Bairros> {
  const k = `${ano}:${uf}`;
  let p = bairrosCache.get(k);
  if (!p) {
    p = buscar<{ b: (string | number | null)[][] }>(`/data/${ano}/bairros/${uf}.json`).then(({ b }) => {
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
    p.catch(() => bairrosCache.delete(k));
    bairrosCache.set(k, p);
  }
  return p;
}
export const useBairros = (ano: number, uf: string | null) =>
  useArquivo<Bairros>(uf ? () => buscarBairros(ano, uf) : null, `bairros:${ano}:${uf ?? '-'}`);

/** Malha de uma cidade: áreas do nível (zonas recortadas, bairros do IBGE) + a cidade como fundo + círculos (bairros do TSE ou locais). */
export interface MalhaCidade { malha: Malha; fundo: GeoJSON.FeatureCollection; pontos: GeoJSON.FeatureCollection }
const VAZIA: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: [] };

/** Áreas de 2026 com os ids do local de outro ano; áreas que foram para o mesmo local viram uma só feição. */
/** a: área de 2026 → local do ano; i: locais incluídos; f: cidades criadas depois cujas áreas entram nesta */
type TrocaAreas = { a: Record<string, string>; i?: Record<string, string[]>; f?: string[] };
function trocarIds(fc: GeoJSON.FeatureCollection, troca: TrocaAreas): GeoJSON.FeatureCollection {
  const porId = new Map<string, GeoJSON.Position[][][]>();
  for (const f of fc.features) {
    const id = troca.a[String(f.id)];
    if (!id) continue;
    const g = f.geometry;
    const polys = g.type === 'Polygon' ? [g.coordinates] : g.type === 'MultiPolygon' ? g.coordinates : [];
    porId.set(id, [...(porId.get(id) ?? []), ...polys]);
  }
  return {
    type: 'FeatureCollection',
    features: [...porId].map(([id, coordinates]) => ({
      type: 'Feature', id, properties: troca.i?.[id] ? { inclui: troca.i[id] } : {}, geometry: { type: 'MultiPolygon', coordinates },
    })),
  };
}

const cidadesCache = new Map<string, Promise<MalhaCidade>>();
function buscarMalhaCidade(ano: number, uf: string, ibge: string, nivel: 'zonas' | 'bairros' | 'locais'): Promise<MalhaCidade> {
  const k = `${ano}:${uf}:${ibge}:${nivel}`;
  let p = cidadesCache.get(k);
  if (!p) {
    p = (async () => {
      const base = await buscarMalha(uf, ano);
      const cidade = base.municipios.features.filter((f) => String(f.id) === ibge);
      const fundo: GeoJSON.FeatureCollection = { type: 'FeatureCollection', features: cidade };
      const comMalha = await buscar<Record<string, number>>(`/geo/bairros/${uf}/cidades.json`).catch(() => ({} as Record<string, number>));
      const bairrosIbge = async () => (ibge in comMalha ? toGeoJSON(await buscar<Topology>(`/geo/bairros/${uf}/${ibge}.json`), 'bairros') : VAZIA);
      let areas = VAZIA, linhas = VAZIA, pontos = VAZIA;
      const ponto = (id: string, lon: number, lat: number, eleitorado: number): GeoJSON.Feature =>
        ({ type: 'Feature', id, properties: { id, eleitorado }, geometry: { type: 'Point', coordinates: [lon, lat] } });

      if (nivel === 'zonas') {
        const topo = await buscar<Topology>(`${geoDoAno(ano, 'zonas-cidade')}/${uf}.json`);
        const todas = toGeoJSON(topo, 'zonas');
        areas = { type: 'FeatureCollection', features: todas.features.filter((f) => String(f.properties?.ibge) === ibge) };
      } else if (nivel === 'bairros') {
        areas = await bairrosIbge();
        const bairros = await buscarBairros(ano, uf).catch((): Bairros => ({ lista: [], porId: new Map(), porCidade: new Map() }));
        pontos = {
          type: 'FeatureCollection',
          features: (bairros.porCidade.get(ibge) ?? [])
            .filter((x) => x.origem === 't' && x.lon !== null && x.lat !== null)
            .sort((a, b) => b.eleitorado - a.eleitorado) // maiores embaixo
            .map((x) => ponto(x.id, x.lon!, x.lat!, x.eleitorado)),
        };
      } else {
        // locais de votação: áreas do Atlas Eleitoral 2026 (ADR 0012); sem elas, círculos sobre os bairros do IBGE
        // outros anos: as mesmas áreas, com os ids trocados pelos locais do ano (scripts/areas-ano.mjs, ADR 0015)
        const comAreas = await buscar<Record<string, number>>(`/geo/locais-areas/${uf}/cidades.json`).catch(() => ({} as Record<string, number>));
        const troca = ano === 2026 ? null
          : (await buscar<Record<string, TrocaAreas>>(`${geoDoAno(ano, 'locais-areas')}/${uf}.json`).catch(() => ({} as Record<string, TrocaAreas>)))[ibge];
        if (ibge in comAreas && (ano === 2026 || troca)) {
          areas = toGeoJSON(await buscar<Topology>(`/geo/locais-areas/${uf}/${ibge}.json`), 'locais');
          for (const cod of troca?.f ?? []) {
            const anexa = toGeoJSON(await buscar<Topology>(`/geo/locais-areas/${uf}/${cod}.json`), 'locais');
            areas = { type: 'FeatureCollection', features: [...areas.features, ...anexa.features] };
          }
          if (troca) areas = trocarIds(areas, troca);
          const bbox = caixaGeo({ type: 'FeatureCollection', features: [...cidade, ...areas.features] });
          return { malha: { municipios: areas, linhas, bbox }, fundo, pontos };
        }
        const ib = await bairrosIbge();
        linhas = ib;
        const locais = await buscarLocais(ano, uf);
        pontos = {
          type: 'FeatureCollection',
          features: (locais.porCidade.get(ibge) ?? [])
            .filter((l) => l.lon !== null && l.lat !== null)
            .sort((a, b) => b.eleitorado - a.eleitorado)
            .map((l) => ponto(l.id, l.lon!, l.lat!, l.eleitorado)),
        };
      }
      const bbox = caixaGeo({ type: 'FeatureCollection', features: [...cidade, ...areas.features, ...pontos.features] });
      return { malha: { municipios: areas, linhas, bbox }, fundo, pontos };
    })();
    p.catch(() => cidadesCache.delete(k));
    cidadesCache.set(k, p);
  }
  return p;
}
export const useMalhaCidade = (ano: number, uf: string | null, ibge: string | null, nivel: 'zonas' | 'bairros' | 'locais') =>
  useArquivo<MalhaCidade>(uf && ibge ? () => buscarMalhaCidade(ano, uf, ibge, nivel) : null, `cidade:${ano}:${uf}:${ibge}:${nivel}`);

/** Local de votação (cadastro do TSE). */
export interface Local {
  id: string; ibge: string; zona: string; nome: string; bairro: string;
  lon: number | null; lat: number | null; eleitorado: number; idBairro: string;
}
export interface Locais { lista: Local[]; porId: Map<string, Local>; porCidade: Map<string, Local[]> }
const locaisCache = new Map<string, Promise<Locais>>();
function buscarLocais(ano: number, uf: string): Promise<Locais> {
  const k = `${ano}:${uf}`;
  let p = locaisCache.get(k);
  if (!p) {
    p = buscar<{ l: (string | number | null)[][] }>(`${geoDoAno(ano, 'locais')}/${uf}.json`).then(({ l }) => {
      const lista: Local[] = l.map((r) => ({
        id: String(r[0]), ibge: String(r[1]), zona: String(r[2]), nome: String(r[3]), bairro: String(r[4] ?? ''),
        lon: r[5] as number | null, lat: r[6] as number | null, eleitorado: Number(r[7]) || 0, idBairro: String(r[8] ?? ''),
      }));
      const porCidade = new Map<string, Local[]>();
      for (const x of lista) {
        if (!porCidade.has(x.ibge)) porCidade.set(x.ibge, []);
        porCidade.get(x.ibge)!.push(x);
      }
      return { lista, porId: new Map(lista.map((x) => [x.id, x])), porCidade };
    });
    p.catch(() => locaisCache.delete(k));
    locaisCache.set(k, p);
  }
  return p;
}
export const useLocais = (ano: number, uf: string | null) => useArquivo<Locais>(uf ? () => buscarLocais(ano, uf) : null, `locais:${ano}:${uf ?? '-'}`);

export const useMunicipios = (ano: number) =>
  useArquivo<Municipio[]>(() => buscar<Municipio[]>(`/data/${ano}/municipios.json`), `municipios:${ano}`);

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
