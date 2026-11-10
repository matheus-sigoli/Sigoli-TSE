'use client';
/**
 * Tela principal: filtros | mapa | painel.
 * Estado na URL: caminho = /{ano}/{abr}/{cargo}; busca = ?t=2&mun=3550308&reg=350001&foco=c:1&nivel=zonas
 * Visão da cidade: `cid` é a cidade (IBGE), `nivel` = zonas|bairros|locais e `mun` a unidade selecionada.
 */
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import {
  cargoPorSlug, nomeAbrangencia, rotaDe, turnoDisponivel,
  type ArquivoResultado, type CargoSlug, type Turno,
} from '@/lib/dominio';
import { pct, titulo, votos } from '@/lib/formato';
import {
  ArquivoAusente, lerNivel, naRegiao, useBairros, useLocais, useMalha, useMalhaCidade, useMalhaRegiao, useMunicipios, useRegioes, useResultado,
  type Local, type Nivel, type NivelArquivo,
} from '@/lib/dados';
import { agruparLocais, calcularVisao, ufDoIbge, type Foco } from '@/lib/resultados';
import { definirAnoCores } from '@/lib/cores';
import { temLocais, temPresidente, temZonas } from '@/lib/anos';
import Filtros from './Filtros';
import Painel from './Painel';
import Carregando from './Carregando';

// O mapa (SVG, ADR 0010) só entra no navegador: depende do tamanho da janela.
const Mapa = dynamic(() => import('./Mapa'), { ssr: false, loading: () => <div className="mapa-canvas" /> });

function lerFoco(s: string | null): Foco {
  const m = s?.match(/^(c|p):(\d+)$/);
  return m ? { tipo: m[1] as 'c' | 'p', idx: Number(m[2]) } : null;
}

export default function Explorador({ ano, abr, cargo: cargoSlug }: { ano: number; abr: string; cargo: CargoSlug }) {
  const cargo = cargoPorSlug(cargoSlug)!;
  const router = useRouter();
  const caminho = usePathname();
  const params = useSearchParams();
  const [, iniciarTransicao] = useTransition();

  const turnoPedido = (Number(params.get('t')) === 2 ? 2 : 1) as Turno;
  const turno: Turno = turnoDisponivel(cargo, abr, turnoPedido, ano) ? turnoPedido : 1;
  // seleção: uma unidade (?mun=id) ou várias somadas com shift + clique (?mun=id1,id2,...)
  const munParam = params.get('mun');
  const selecao = useMemo(() => (munParam ? munParam.split(',').filter(Boolean) : []), [munParam]);
  const mun = selecao.length === 1 ? selecao[0] : null;
  const multi = selecao.length > 1;
  const reg = params.get('reg');
  const foco = lerFoco(params.get('foco'));
  // visão da cidade (duplo clique num município): ?cid={ibge}&nivel=zonas|bairros|locais
  // o DF é um município só (Brasília): abre direto na visão da cidade, com as zonas do DF.svg (ADR 0013)
  const CIDADE_UNICA: Record<string, string> = { df: '5300108' };
  const cidadeUnica = CIDADE_UNICA[abr] ?? null;
  // ano sem zonas (1994): só municípios, sem visão da cidade
  const comZonas = temZonas(ano);
  const cid = abr !== 'br' && abr !== 'exterior' && comZonas ? params.get('cid') ?? cidadeUnica : null;
  const nivelUrl = lerNivel(params.get('nivel'), abr, !!cid, !!reg && !cid && comZonas);
  // ano sem locais (1998): a cidade abre por zonas (sem locais, sem bairros)
  const nivel: Nivel = !comZonas ? 'municipios' : (nivelUrl === 'locais' || nivelUrl === 'bairros') && !temLocais(ano) ? (cid ? 'zonas' : 'municipios') : nivelUrl;
  // micro ou mesorregião vista por locais de votação: os locais de todas as cidades dela num mapa só
  const regiaoLocais = !cid && !!reg && nivel === 'locais';

  // preferências (o script do <head> já aplicou no <html>)
  const [daltonico, setDaltonico] = useState(false);
  const [tema, setTema] = useState<'escuro' | 'claro'>('escuro');
  useEffect(() => {
    setDaltonico(document.documentElement.dataset.daltonico === '1');
    setTema(document.documentElement.dataset.theme === 'claro' ? 'claro' : 'escuro');
  }, []);
  const alternarTema = useCallback(() => {
    setTema((t) => {
      const novo = t === 'claro' ? 'escuro' : 'claro';
      document.documentElement.dataset.theme = novo;
      try { localStorage.setItem('sigoli:tema', novo); } catch {}
      return novo;
    });
  }, []);
  const alternarDaltonico = useCallback(() => {
    setDaltonico((d) => {
      const novo = !d;
      if (novo) document.documentElement.dataset.daltonico = '1';
      else delete document.documentElement.dataset.daltonico;
      try { localStorage.setItem('sigoli:daltonico', novo ? '1' : '0'); } catch {}
      return novo;
    });
  }, []);

  // ---- navegação: mantém o turno, limpa seleção quando muda o recorte
  const atualizarBusca = useCallback(
    (mudancas: Record<string, string | null>) => {
      const p = new URLSearchParams(params.toString());
      for (const [k, v] of Object.entries(mudancas)) (v === null ? p.delete(k) : p.set(k, v));
      const q = p.toString();
      iniciarTransicao(() => router.replace(q ? `${caminho}?${q}` : caminho, { scroll: false }));
    },
    [params, caminho, router],
  );
  const irPara = useCallback(
    (novaAbr: string, novoCargo: CargoSlug = cargoSlug, extra: Record<string, string> = {}) => {
      const p = new URLSearchParams();
      if (turno === 2) p.set('t', '2');
      // zonas do estado continuam ao trocar de UF
      if (nivel === 'zonas' && !cid && novaAbr !== 'br' && novaAbr !== 'exterior' && !extra.mun && !extra.cid) p.set('nivel', 'zonas');
      for (const [k, v] of Object.entries(extra)) p.set(k, v);
      const q = p.toString();
      iniciarTransicao(() => router.push(`${rotaDe(novaAbr, novoCargo, ano)}${q ? `?${q}` : ''}`, { scroll: false }));
    },
    [cargoSlug, turno, router, nivel, cid, ano],
  );
  const hrefCargo = useCallback(
    (c: CargoSlug) => {
      const destino = cargoPorSlug(c)!;
      const a = abr === 'exterior' && c !== 'presidente' ? 'br' : abr;
      const p = new URLSearchParams();
      if (turno === 2 && turnoDisponivel(destino, a, 2, ano)) p.set('t', '2');
      if (cid && a === abr) p.set('cid', cid);
      if (nivel !== 'municipios' && a === abr) p.set('nivel', nivel);
      const q = p.toString();
      return `${rotaDe(a, c, ano)}${q ? `?${q}` : ''}`;
    },
    [abr, turno, nivel, cid, ano],
  );
  // outro ano: mesmo cargo, lugar e nível; a seleção (mun, foco) é do arquivo do ano e fica para trás
  const hrefAno = useCallback(
    (outro: number) => {
      const p = new URLSearchParams();
      if (turno === 2 && turnoDisponivel(cargo, abr, 2, outro)) p.set('t', '2');
      if (cid && cid !== cidadeUnica) p.set('cid', cid);
      if (nivel !== 'municipios') p.set('nivel', nivel);
      const q = p.toString();
      // 1998 não tem Presidente: vai para Governador (no Brasil, São Paulo)
      if (cargoSlug === 'presidente' && !temPresidente(outro)) return `${rotaDe(abr === 'br' || abr === 'exterior' ? 'sp' : abr, 'governador', outro)}${q ? `?${q}` : ''}`;
      return `${rotaDe(abr, cargoSlug, outro)}${q ? `?${q}` : ''}`;
    },
    [abr, cargo, cargoSlug, turno, nivel, cid, cidadeUnica],
  );

  // ---- dados
  // Na visão da cidade, cada nível tem seu arquivo por UF: zonas-cidade, bairros ou locais (ADRs 0009 e 0011)
  const nivelArquivo: NivelArquivo = cid ? (nivel === 'zonas' ? 'zonas-cidade' : nivel === 'locais' ? 'locais' : 'bairros') : regiaoLocais ? 'locais' : nivel === 'zonas' ? 'zonas' : 'municipios';
  const resultado = useResultado(ano, cargoSlug, turno, abr, nivelArquivo);
  // arquivo do mapa do estado: a ordem das cores sai dele, para cada candidato ter a mesma cor em todos os níveis
  const resultadoEstado = useResultado(ano, cargoSlug, turno, abr, 'municipios');
  const malhaUf = useMalha(ano, abr, !cid && nivel === 'zonas' ? 'zonas' : 'municipios');
  const malhaCidade = useMalhaCidade(ano, cid ? abr : null, cid, cid ? (nivel as 'zonas' | 'bairros' | 'locais') : 'bairros');
  // mapa dos municípios de um estado: sem a linha externa (contorno do estado)
  const malhaEstado = useMemo(
    () => (malhaUf.dados && abr !== 'br' && abr !== 'exterior' && nivel === 'municipios'
      ? { ...malhaUf.dados, linhas: { type: 'FeatureCollection' as const, features: [] } }
      : malhaUf.dados),
    [malhaUf.dados, abr, nivel],
  );
  const regioes = useRegioes();
  // municípios da micro ou mesorregião escolhida (os da malha do ano)
  const cidadesRegiao = useMemo(() => {
    if (!reg || cid || !regioes.dados || !malhaUf.dados || abr === 'br' || abr === 'exterior' || nivel === 'zonas') return null;
    const ids = malhaUf.dados.municipios.features.map((f) => String((f.properties as { id?: string } | null)?.id ?? f.id)).filter((i) => naRegiao(regioes.dados!, i, reg));
    return ids.length ? ids.sort() : null;
  }, [reg, cid, regioes.dados, malhaUf.dados, abr, nivel]);
  const malhaRegiao = useMalhaRegiao(ano, regiaoLocais ? abr : null, reg, regiaoLocais ? cidadesRegiao : null);
  // a visão por locais (cidade ou região) usa a mesma malha montada: áreas, círculos e fundo
  const malhaLocais = cid ? malhaCidade : regiaoLocais ? malhaRegiao : null;
  const malha = malhaLocais
    ? { dados: malhaLocais.dados?.malha ?? null, carregando: malhaLocais.carregando || (regiaoLocais && !cidadesRegiao) }
    : { dados: malhaEstado, carregando: malhaUf.carregando };
  const bairros = useBairros(ano, cid || regiaoLocais ? abr : null);
  const locais = useLocais(ano, nivel === 'zonas' || cid || regiaoLocais ? abr : null);
  // zona → municípios que ela cobre (para os nomes)
  const municipiosDaZona = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const l of locais.dados?.lista ?? []) {
      if (!m.has(l.zona)) m.set(l.zona, new Set());
      m.get(l.zona)!.add(l.ibge);
    }
    return m;
  }, [locais.dados]);
  const municipios = useMunicipios(ano);

  const indiceMunicipios = useMemo(() => {
    const porIbge = new Map<string, { nome: string; uf: string }>();
    const porPais = new Map<string, { nome: string; cidades: string[] }>();
    for (const m of municipios.dados ?? []) {
      if (m.uf === 'zz') {
        const p = porPais.get(m.paisNum!) ?? { nome: m.nomePais!, cidades: [] };
        p.cidades.push(m.tse);
        porPais.set(m.paisNum!, p);
      } else porIbge.set(m.ibge, { nome: m.nome, uf: m.uf });
    }
    return { porIbge, porPais };
  }, [municipios.dados]);
  // no DF a "cidade" é a UF inteira: mostra "Distrito Federal", não "Brasília"
  const nomeCidade = (ibge: string) => (ibge === cidadeUnica ? nomeAbrangencia(abr) : titulo(indiceMunicipios.porIbge.get(ibge)?.nome ?? 'Cidade'));

  // região escolhida no mapa dos municípios: destaca e soma só ela
  const municipiosRegiao = useMemo(() => (nivel === 'municipios' && cidadesRegiao ? new Set(cidadesRegiao) : null), [nivel, cidadesRegiao]);
  // locais de votação da região (visão da região por locais)
  const locaisRegiao = useMemo(
    () => (regiaoLocais && cidadesRegiao && locais.dados ? cidadesRegiao.flatMap((c) => locais.dados!.porCidade.get(c) ?? []) : null),
    [regiaoLocais, cidadesRegiao, locais.dados],
  );
  const nomeRegiao = reg ? regioes.dados?.regioes[reg]?.nome ?? null : null;
  const tipoRegiao = reg ? (regioes.dados?.regioes[reg]?.tipo === 'meso' ? 'Mesorregião' : 'Microrregião') : '';

  // unidades (zona/bairro/local) da cidade aberta
  const unidadesDaCidade = useMemo(() => {
    if (!cid) return null;
    if (nivel === 'bairros') return new Set((bairros.dados?.porCidade.get(cid) ?? []).map((b) => b.id));
    if (nivel === 'locais') return new Set((locais.dados?.porCidade.get(cid) ?? []).map((l) => l.id));
    // zonas: todas as zonas da cidade no arquivo de resultados, mesmo as sem desenho (zona extinta depois, sem
    // local com ponto conhecido) — o total da cidade fica igual nas visões Zonas e Locais
    const ids = new Set((malhaCidade.dados?.malha.municipios.features ?? []).map((f) => String(f.id)));
    const arq = resultado.dados;
    if (arq && !arq.resumo) for (const k of Object.keys(arq.mun)) if (k.startsWith(`${cid}-`)) ids.add(k);
    return ids;
  }, [cid, nivel, bairros.dados, locais.dados, malhaCidade.dados, resultado.dados]);

  const recorteMunicipios = useMemo(() => {
    if (multi) return new Set(selecao); // soma das unidades selecionadas
    if (mun) {
      if (abr === 'exterior') return new Set(indiceMunicipios.porPais.get(mun)?.cidades ?? []);
      return new Set([mun]);
    }
    if (cid) return unidadesDaCidade ?? new Set<string>();
    if (regiaoLocais) return new Set((locaisRegiao ?? []).map((l) => l.id));
    return municipiosRegiao;
  }, [mun, multi, selecao, abr, cid, unidadesDaCidade, municipiosRegiao, indiceMunicipios, regiaoLocais, locaisRegiao]);

  // áreas do Atlas que reúnem vários locais (properties.inclui): área → locais incluídos
  const gruposAreas = useMemo(() => {
    const g = new Map<string, string[]>();
    if (nivel !== 'locais' || !malhaLocais) return g;
    for (const f of malhaLocais.dados?.malha.municipios.features ?? []) {
      const inc = (f.properties as { inclui?: string[] } | null)?.inclui;
      if (inc?.length) g.set(String(f.id), inc);
    }
    return g;
  }, [nivel, malhaLocais]);
  // local escolhido na busca que o Atlas juntou a outra área: seleciona a área que o contém
  useEffect(() => {
    if (nivel !== 'locais' || !mun || !gruposAreas.size || gruposAreas.has(mun)) return;
    for (const [area, inc] of gruposAreas) if (inc.includes(mun)) return atualizarBusca({ mun: area });
  }, [nivel, mun, gruposAreas, atualizarBusca]);

  const visao = useMemo(() => {
    if (!resultado.dados) return null;
    // o foco aponta para índices do arquivo atual; ignora se não couber
    const arq = !resultado.dados.resumo && gruposAreas.size ? agruparLocais(resultado.dados, gruposAreas) : resultado.dados;
    const focoValido = foco && !arq.resumo && (foco.tipo === 'c' ? foco.idx < arq.cands.length : foco.idx < arq.partidos.length) ? foco : null;
    const base = resultadoEstado.dados;
    const totalCores = base && !base.resumo ? { c: base.total.c, p: base.total.p, pintam: base.pintam } : undefined;
    definirAnoCores(ano);
    return calcularVisao(arq, { abr, municipios: recorteMunicipios }, { daltonico, foco: focoValido, municipios: municipios.dados ?? undefined, totalCores });
  }, [resultado.dados, resultadoEstado.dados, gruposAreas, abr, recorteMunicipios, daltonico, foco, municipios.dados, ano]);

  // ---- nomes
  const nomeZona = useCallback(
    (z: string) => {
      const nomes = [...(municipiosDaZona.get(z) ?? [])].map((i) => indiceMunicipios.porIbge.get(i)?.nome).filter(Boolean).map((n) => titulo(n!));
      nomes.sort((a, b) => a.localeCompare(b, 'pt-BR'));
      return nomes.length > 2 ? `${nomes.slice(0, 2).join(', ')} e mais ${nomes.length - 2}` : nomes.join(' e ');
    },
    [municipiosDaZona, indiceMunicipios],
  );
  const nomeUnidade = (id: string): string => {
    if (nivel === 'zonas') return `Zona ${cid ? id.split('-')[1] : id}`;
    if (nivel === 'bairros') {
      const b = bairros.dados?.porId.get(id);
      return b ? (b.origem === 't' ? titulo(b.nome) : b.nome) : 'Bairro';
    }
    const l = locais.dados?.porId.get(id);
    return l ? titulo(l.nome) : 'Local de votação';
  };

  const nomeRecorte = useMemo(() => {
    if (multi) {
      const rotulo = cid || regiaoLocais ? { zonas: 'zonas', bairros: 'bairros', locais: 'locais de votação' }[nivel as 'zonas' | 'bairros' | 'locais'] : nivel === 'zonas' ? 'zonas' : 'municípios';
      return `${selecao.length} ${rotulo} somados`;
    }
    if (cid) return mun ? nomeUnidade(mun) : nomeCidade(cid);
    if (regiaoLocais) return mun ? nomeUnidade(mun) : nomeRegiao ?? nomeAbrangencia(abr);
    if (mun && nivel === 'zonas') return `Zona ${mun}`;
    if (mun) {
      if (abr === 'exterior') return indiceMunicipios.porPais.get(mun)?.nome ?? 'País';
      const m = indiceMunicipios.porIbge.get(mun);
      return m ? titulo(m.nome) : 'Município';
    }
    if (nomeRegiao) return nomeRegiao;
    return nomeAbrangencia(abr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mun, multi, selecao, abr, cid, nivel, regiaoLocais, nomeRegiao, indiceMunicipios, bairros.dados, locais.dados]);

  // linha de contexto abaixo do título
  const contexto = useMemo(() => {
    if (multi) {
      const nomes = selecao.map((id) => (cid || regiaoLocais || nivel === 'zonas' ? nomeUnidade(id) : titulo(indiceMunicipios.porIbge.get(id)?.nome ?? id)));
      return `${nomes.slice(0, 6).join(' + ')}${nomes.length > 6 ? ` e mais ${nomes.length - 6}` : ''} · shift + clique para tirar ou pôr`;
    }
    // região sem nada escolhido: tipo, municípios e locais
    if (reg && !cid && !mun && nomeRegiao && cidadesRegiao) {
      const partes = [`${tipoRegiao} · ${abr.toUpperCase()}`, `${cidadesRegiao.length} ${cidadesRegiao.length === 1 ? 'município' : 'municípios'}`];
      if (regiaoLocais && locaisRegiao) partes.push(`${locaisRegiao.length} locais de votação`);
      return partes.join(' · ');
    }
    if (!cid && !regiaoLocais) return nivel === 'zonas' && mun ? nomeZona(mun) || null : null;
    if (!cid) {
      // um local da região
      const l = mun ? locais.dados?.porId.get(mun) : null;
      if (!l) return null;
      const b = bairros.dados?.porId.get(l.idBairro);
      return [b ? (b.origem === 't' ? titulo(b.nome) : b.nome) : l.bairro && titulo(l.bairro), nomeCidade(l.ibge), `Zona ${l.zona}`, `${votos(l.eleitorado)} eleitores`]
        .filter(Boolean).join(' · ');
    }
    const qtd = unidadesDaCidade?.size ?? 0;
    const rotulo = { zonas: ['zona eleitoral', 'zonas eleitorais'], bairros: ['bairro', 'bairros'], locais: ['local de votação', 'locais de votação'] }[nivel as 'zonas' | 'bairros' | 'locais'];
    if (!mun) return `${nomeAbrangencia(abr)} · ${qtd} ${qtd === 1 ? rotulo[0] : rotulo[1]}`;
    if (nivel === 'zonas') {
      const ls = (locais.dados?.porCidade.get(cid) ?? []).filter((l) => l.zona === mun.split('-')[1]);
      const eleitores = ls.reduce((s, l) => s + l.eleitorado, 0);
      return `${nomeCidade(cid)} · ${ls.length} locais de votação · ${votos(eleitores)} eleitores`;
    }
    if (nivel === 'bairros') {
      const b = bairros.dados?.porId.get(mun);
      if (!b) return null;
      return [nomeCidade(b.ibge), `${b.locais} ${b.locais === 1 ? 'local' : 'locais'} de votação`, `${votos(b.eleitorado)} eleitores`,
        b.origem === 'i' ? 'área do IBGE' : 'bairro informado pelo TSE'].join(' · ');
    }
    const l = locais.dados?.porId.get(mun);
    if (!l) return null;
    const b = bairros.dados?.porId.get(l.idBairro);
    return [b ? (b.origem === 't' ? titulo(b.nome) : b.nome) : l.bairro && titulo(l.bairro), nomeCidade(l.ibge), `Zona ${l.zona}`, `${votos(l.eleitorado)} eleitores`]
      .filter(Boolean).join(' · ');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mun, multi, selecao, nivel, cid, abr, reg, regiaoLocais, nomeRegiao, tipoRegiao, cidadesRegiao, locaisRegiao, unidadesDaCidade, nomeZona, bairros.dados, locais.dados, indiceMunicipios]);

  // locais de votação da zona, do bairro ou da área do Atlas selecionada (lista no painel)
  const locaisDaUnidade = useMemo(() => {
    if ((!cid && !regiaoLocais) || !selecao.length) return null;
    if (nivel === 'locais') {
      const ids = selecao.flatMap((id) => [id, ...(gruposAreas.get(id) ?? [])]);
      if (ids.length < 2) return null;
      return ids.map((id) => locais.dados?.porId.get(id)).filter((l): l is Local => !!l).sort((a, b) => b.eleitorado - a.eleitorado);
    }
    const ls = locais.dados?.porCidade.get(cid!) ?? [];
    const sel = new Set(nivel === 'zonas' ? selecao.map((id) => id.split('-')[1]) : selecao);
    const filtro = nivel === 'zonas' ? (l: Local) => sel.has(l.zona) : (l: Local) => sel.has(l.idBairro);
    return ls.filter(filtro).sort((a, b) => b.eleitorado - a.eleitorado);
  }, [cid, regiaoLocais, selecao, nivel, locais.dados, gruposAreas]);

  const trilha = useMemo(() => {
    const itens: { rotulo: string; acao: () => void; href?: string }[] = [];
    if (abr !== 'br') itens.push({ rotulo: 'Brasil', acao: () => irPara('br'), href: `${rotaDe('br', cargoSlug, ano)}${turno === 2 ? '?t=2' : ''}` });
    if ((selecao.length || reg || cid) && abr !== 'br') itens.push({ rotulo: nomeAbrangencia(abr), acao: () => atualizarBusca({ mun: null, reg: null, cid: null, nivel: null, foco: null }) });
    if (cid && selecao.length && cid !== cidadeUnica) itens.push({ rotulo: nomeCidade(cid), acao: () => atualizarBusca({ mun: null, foco: null }) });
    if (!cid && nomeRegiao && selecao.length) itens.push({ rotulo: nomeRegiao, acao: () => atualizarBusca({ mun: null, foco: null }) });
    return itens;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abr, selecao, reg, cid, nomeRegiao, irPara, atualizarBusca, cargoSlug, turno, indiceMunicipios]);

  // ---- interações do mapa
  const abrirCidade = useCallback(
    (ibge: string) => atualizarBusca({ cid: ibge, nivel: null, mun: null, reg: null, foco: null }),
    [atualizarBusca],
  );

  const aoSelecionar = useCallback(
    (id: string | null, somar = false) => {
      if (!id) return atualizarBusca({ mun: null });
      // shift + clique: põe ou tira a unidade da soma (não vale na visão Brasil nem no exterior, que agrupa por país)
      if (somar && abr !== 'br' && abr !== 'exterior') {
        const nova = selecao.includes(id) ? selecao.filter((x) => x !== id) : [...selecao, id];
        return atualizarBusca({ mun: nova.length ? nova.join(',') : null, foco: null });
      }
      if (abr === 'br') {
        // na visão Brasil, clicar num município abre o estado já com ele selecionado
        const uf = ufDoIbge(id);
        if (uf) return irPara(uf, cargoSlug, { mun: id });
      }
      atualizarBusca({ mun: id === mun ? null : id });
    },
    [abr, mun, selecao, cargoSlug, irPara, atualizarBusca],
  );

  // duplo clique num município (estado, sem zonas) abre a visão da cidade
  const aoAbrir = useCallback(
    (id: string) => {
      if (cid || abr === 'br' || abr === 'exterior' || nivel !== 'municipios' || !comZonas) return;
      abrirCidade(id);
    },
    [cid, abr, nivel, abrirCidade, comZonas],
  );

  const descreverFeicao = useCallback(
    (id: string): { titulo: string; linha: string } | null => {
      const arq = resultado.dados;
      if (!arq) return null;
      if (nivelArquivo !== 'municipios' && !arq.resumo) {
        let tituloDica: string;
        if (nivelArquivo === 'zonas') {
          const nomes = nomeZona(id);
          tituloDica = `Zona ${id}${nomes ? ` · ${nomes}` : ''}`;
        } else tituloDica = nomeUnidade(id);
        // na região por locais, o nome da cidade ajuda
        if (regiaoLocais) { const l = locais.dados?.porId.get(id); if (l) tituloDica += ` · ${nomeCidade(l.ibge)}`; }
        const r = arq.mun[id];
        return { titulo: tituloDica, linha: r ? linhaVencedor(arq, [r]) : 'Sem votos neste cargo' };
      }
      const nome = abr === 'exterior'
        ? indiceMunicipios.porPais.get(id)?.nome
        : indiceMunicipios.porIbge.get(id) && `${titulo(indiceMunicipios.porIbge.get(id)!.nome)} (${indiceMunicipios.porIbge.get(id)!.uf.toUpperCase()})`;
      if (!nome) return null;
      if (arq.resumo) {
        const r = arq.mun[id];
        if (!r) return { titulo: nome, linha: 'Sem dados' };
        const quem = r[2] ? `${titulo(r[2])} (${arq.partidos[r[0]]})` : arq.partidos[r[0]];
        return { titulo: nome, linha: `${quem} · ${pct(r[1] / 1000)}` };
      }
      const regs = abr === 'exterior' ? (indiceMunicipios.porPais.get(id)?.cidades ?? []).map((c) => arq.mun[c]).filter(Boolean) : [arq.mun[id]].filter(Boolean);
      if (!regs.length) return { titulo: nome, linha: 'Sem votos neste cargo' };
      const dica = abr !== 'br' && abr !== 'exterior' ? ' · dois cliques: zonas, bairros e locais' : '';
      return { titulo: nome, linha: linhaVencedor(arq, regs) + dica };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resultado.dados, abr, indiceMunicipios, nivelArquivo, nomeZona, bairros.dados, locais.dados, regiaoLocais],
  );

  const mudarNivel = useCallback(
    // a região escolhida continua ao trocar entre Municípios e Locais
    (n: Nivel) => atualizarBusca({ nivel: n === 'municipios' ? null : n, mun: null, reg: !cid && n !== 'zonas' ? reg : null, foco: null }),
    [atualizarBusca, cid, reg],
  );

  const carregando = resultado.carregando || malha.carregando || bairros.carregando || locais.carregando;
  const ausente = resultado.erro instanceof ArquivoAusente;
  const chaveMapa = cid ? `${abr}:${cid}:${nivel}` : regiaoLocais ? `${abr}:regiao:${reg}` : nivel === 'zonas' ? `${abr}:zonas` : abr;
  // município selecionado no estado: oferece abrir a cidade (no toque não há duplo clique óbvio)
  const cidadeSelecionada = !cid && nivel === 'municipios' && mun && abr !== 'br' && abr !== 'exterior' ? mun : null;

  return (
    <div className="app">
      <Filtros
        ano={ano}
        hrefAno={hrefAno}
        abr={abr}
        cargo={cargo}
        regiaoSelecionada={reg}
        malha={malhaUf.dados}
        regioes={regioes.dados}
        municipios={municipios.dados}
        legenda={visao?.legenda ?? []}
        escalaFoco={foco && visao ? [...visao.candidatos, ...visao.partidos].find((l) => l.chave === `${foco.tipo}:${foco.idx}`) ?? null : null}
        modoCalor={!!foco}
        tema={tema}
        daltonico={daltonico}
        aoMudarAbrangencia={(a) => irPara(a)}
        aoMudarRegiao={(r) => atualizarBusca({ reg: r, mun: null, foco: null, ...(!r && nivel === 'locais' ? { nivel: null } : {}) })}
        aoEscolherMunicipio={(m) => {
          if (m.uf !== abr) return irPara(m.uf, cargoSlug, cid ? { cid: m.ibge, nivel } : { mun: m.ibge });
          if (cid) return atualizarBusca({ cid: m.ibge, mun: null, reg: null });
          atualizarBusca({ mun: m.ibge, reg: null, nivel: null });
        }}
        nivel={nivel}
        cidade={cid ? nomeCidade(cid) : null}
        aoMudarNivel={mudarNivel}
        locaisDaCidade={cid ? locais.dados?.porCidade.get(cid) ?? null : locaisRegiao}
        aoEscolherLocal={(id) => atualizarBusca({ nivel: 'locais', mun: id, foco: null })}
        aoFecharCidade={cidadeUnica ? undefined : () => atualizarBusca({ cid: null, nivel: null, mun: cid, foco: null })}
        aoAlternarTema={alternarTema}
        aoAlternarDaltonico={alternarDaltonico}
      />
      <main className="mapa" aria-label={`Mapa de ${cargo.nome} — ${cid ? nomeCidade(cid) : nomeAbrangencia(abr)}`}>
        {malha.dados ? (
          <Mapa
            chave={chaveMapa}
            malha={malha.dados}
            // no nível Locais as áreas do Atlas cobrem a cidade inteira: sem o contorno do município por baixo
            fundo={regiaoLocais ? malhaRegiao.dados?.fundo ?? null : cid && !(nivel === 'locais' && !malhaCidade.dados?.pontos.features.length) ? malhaCidade.dados?.fundo ?? null : null}
            pontos={malhaLocais ? malhaLocais.dados?.pontos ?? null : null}
            cores={visao?.cores ?? null}
            selecionado={mun}
            selecionados={multi ? selecao : undefined}
            semContornoFundo={nivel === 'bairros'}
            destaque={municipiosRegiao}
            mundo={abr === 'exterior'}
            aoSelecionar={aoSelecionar}
            aoAbrir={aoAbrir}
            descrever={descreverFeicao}
          />
        ) : null}
        {carregando ? <Carregando texto={`Carregando ${cargo.nome.toLowerCase()}, ${cid ? nomeCidade(cid) : nomeAbrangencia(abr)}…`} /> : null}
        <p className="creditos-mapa">
          Malha: IBGE{cid && nivel === 'bairros' ? ' (bairros: Censo 2022)' : ' 2025'} · Resultados: TSE
          {nivel === 'zonas' ? ' · Áreas das zonas aproximadas pelos locais de votação' : ''}
          {cid && nivel === 'bairros' ? ' · Círculos: bairros do cadastro do TSE, sem área no IBGE' : ''}
          {(cid || regiaoLocais) && nivel === 'locais'
            ? [
              malhaLocais?.dados?.malha.municipios.features.length ? `Áreas dos locais: Atlas Eleitoral 2026 (@mroctoz)${ano !== 2026 ? `, casadas com os locais de ${ano}` : ''}` : '',
              malhaLocais?.dados?.pontos.features.length ? 'Círculos: locais de votação, pelo tamanho do eleitorado' : '',
            ].filter(Boolean).map((t) => ` · ${t}`).join('')
            : ''}
        </p>
      </main>
      <Painel
        ano={ano}
        cargo={cargo}
        abr={abr}
        turno={turno}
        nomeRecorte={nomeRecorte}
        contexto={contexto}
        nivel={nivelArquivo === 'municipios' ? 'municipios' : nivel}
        locais={locaisDaUnidade}
        aoAbrirCidade={cidadeSelecionada && comZonas ? () => abrirCidade(cidadeSelecionada) : undefined}
        aoEscolherLocal={cid && nivel !== 'locais' ? (id) => atualizarBusca({ nivel: 'locais', mun: id }) : undefined}
        trilha={trilha}
        visao={visao}
        arquivo={resultado.dados}
        foco={foco}
        ausente={ausente}
        erro={resultado.erro && !ausente ? resultado.erro.message : null}
        temSelecao={!!mun}
        hrefCargo={hrefCargo}
        turnoPossivel={(t) => turnoDisponivel(cargo, abr, t, ano)}
        aoMudarTurno={(t) => atualizarBusca({ t: t === 2 ? '2' : null, foco: null })}
        aoFocar={(chave) => atualizarBusca({ foco: chave && params.get('foco') !== chave ? chave : null })}
      />
    </div>
  );
}

function linhaVencedor(arq: ArquivoResultado, regs: ArquivoResultado['mun'][string][]) {
  const prop = arq.tipo === 'prop';
  const n = prop ? arq.partidos.length : arq.cands.length;
  const soma = new Array(n).fill(0);
  let validos = 0;
  for (const r of regs) {
    validos += r.t[3];
    (prop ? r.p! : r.c).forEach((v, i) => (soma[i] += v));
  }
  let idx = 0;
  for (let i = 1; i < n; i++) if (soma[i] > soma[idx]) idx = i;
  if (!validos || !soma[idx]) return 'Sem votos válidos';
  const quem = prop ? arq.partidos[idx].sg : `${titulo(arq.cands[idx].nome)} (${arq.cands[idx].partido})`;
  return `${quem} · ${pct(soma[idx] / validos)}`;
}

