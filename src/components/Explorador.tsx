'use client';
/**
 * Tela principal: filtros | mapa | painel.
 * Estado na URL: caminho = /2026/{abr}/{cargo}; busca = ?t=2&mun=3550308&reg=350001&foco=c:1&nivel=zonas
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
  ArquivoAusente, lerNivel, useBairros, useLocais, useMalha, useMalhaCidade, useMunicipios, useRegioes, useResultado,
  type Local, type Nivel, type NivelArquivo,
} from '@/lib/dados';
import { calcularVisao, ufDoIbge, type Foco } from '@/lib/resultados';
import Filtros from './Filtros';
import Painel from './Painel';
import Carregando from './Carregando';

// O mapa (SVG, ADR 0010) só entra no navegador: depende do tamanho da janela.
const Mapa = dynamic(() => import('./Mapa'), { ssr: false, loading: () => <div className="mapa-canvas" /> });

function lerFoco(s: string | null): Foco {
  const m = s?.match(/^(c|p):(\d+)$/);
  return m ? { tipo: m[1] as 'c' | 'p', idx: Number(m[2]) } : null;
}

export default function Explorador({ abr, cargo: cargoSlug }: { abr: string; cargo: CargoSlug }) {
  const cargo = cargoPorSlug(cargoSlug)!;
  const router = useRouter();
  const caminho = usePathname();
  const params = useSearchParams();
  const [, iniciarTransicao] = useTransition();

  const turnoPedido = (Number(params.get('t')) === 2 ? 2 : 1) as Turno;
  const turno: Turno = turnoDisponivel(cargo, abr, turnoPedido) ? turnoPedido : 1;
  const mun = params.get('mun');
  const reg = params.get('reg');
  const foco = lerFoco(params.get('foco'));
  // visão da cidade (duplo clique num município): ?cid={ibge}&nivel=zonas|bairros|locais
  const cid = abr !== 'br' && abr !== 'exterior' ? params.get('cid') : null;
  const nivel = lerNivel(params.get('nivel'), abr, !!cid);

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
      iniciarTransicao(() => router.push(`${rotaDe(novaAbr, novoCargo)}${q ? `?${q}` : ''}`, { scroll: false }));
    },
    [cargoSlug, turno, router, nivel, cid],
  );
  const hrefCargo = useCallback(
    (c: CargoSlug) => {
      const destino = cargoPorSlug(c)!;
      const a = abr === 'exterior' && c !== 'presidente' ? 'br' : abr;
      const p = new URLSearchParams();
      if (turno === 2 && turnoDisponivel(destino, a, 2)) p.set('t', '2');
      if (cid && a === abr) p.set('cid', cid);
      if (nivel !== 'municipios' && a === abr) p.set('nivel', nivel);
      const q = p.toString();
      return `${rotaDe(a, c)}${q ? `?${q}` : ''}`;
    },
    [abr, turno, nivel, cid],
  );

  // ---- dados
  // Na visão da cidade, cada nível tem seu arquivo por UF: zonas-cidade, bairros ou locais (ADRs 0009 e 0011)
  const nivelArquivo: NivelArquivo = cid ? (nivel === 'zonas' ? 'zonas-cidade' : nivel === 'locais' ? 'locais' : 'bairros') : nivel === 'zonas' ? 'zonas' : 'municipios';
  const resultado = useResultado(cargoSlug, turno, abr, nivelArquivo);
  // arquivo do mapa do estado: a ordem das cores sai dele, para cada candidato ter a mesma cor em todos os níveis
  const resultadoEstado = useResultado(cargoSlug, turno, abr, 'municipios');
  const malhaUf = useMalha(abr, !cid && nivel === 'zonas' ? 'zonas' : 'municipios');
  const malhaCidade = useMalhaCidade(cid ? abr : null, cid, cid ? (nivel as 'zonas' | 'bairros' | 'locais') : 'bairros');
  const malha = cid ? { dados: malhaCidade.dados?.malha ?? null, carregando: malhaCidade.carregando } : malhaUf;
  const bairros = useBairros(cid ? abr : null);
  const locais = useLocais(nivel === 'zonas' || cid ? abr : null);
  // zona → municípios que ela cobre (para os nomes)
  const municipiosDaZona = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const l of locais.dados?.lista ?? []) {
      if (!m.has(l.zona)) m.set(l.zona, new Set());
      m.get(l.zona)!.add(l.ibge);
    }
    return m;
  }, [locais.dados]);
  const municipios = useMunicipios();
  const regioes = useRegioes();

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
  const nomeCidade = (ibge: string) => titulo(indiceMunicipios.porIbge.get(ibge)?.nome ?? 'Cidade');

  // municípios da região escolhida (a partir das propriedades da malha da UF)
  const municipiosRegiao = useMemo(() => {
    if (!reg || !malhaUf.dados || abr === 'br' || abr === 'exterior' || nivel !== 'municipios' || cid) return null;
    const s = new Set<string>();
    for (const f of malhaUf.dados.municipios.features) {
      const pr = f.properties as { id: string; rgi?: string; rgint?: string };
      if (pr.rgi === reg || pr.rgint === reg) s.add(pr.id);
    }
    return s.size ? s : null;
  }, [reg, malhaUf.dados, abr, nivel, cid]);

  // unidades (zona/bairro/local) da cidade aberta
  const unidadesDaCidade = useMemo(() => {
    if (!cid) return null;
    if (nivel === 'bairros') return new Set((bairros.dados?.porCidade.get(cid) ?? []).map((b) => b.id));
    if (nivel === 'locais') return new Set((locais.dados?.porCidade.get(cid) ?? []).map((l) => l.id));
    return new Set((malhaCidade.dados?.malha.municipios.features ?? []).map((f) => String(f.id)));
  }, [cid, nivel, bairros.dados, locais.dados, malhaCidade.dados]);

  const recorteMunicipios = useMemo(() => {
    if (mun) {
      if (abr === 'exterior') return new Set(indiceMunicipios.porPais.get(mun)?.cidades ?? []);
      return new Set([mun]);
    }
    if (cid) return unidadesDaCidade ?? new Set<string>();
    return municipiosRegiao;
  }, [mun, abr, cid, unidadesDaCidade, municipiosRegiao, indiceMunicipios]);

  const visao = useMemo(() => {
    if (!resultado.dados) return null;
    // o foco aponta para índices do arquivo atual; ignora se não couber
    const arq = resultado.dados;
    const focoValido = foco && !arq.resumo && (foco.tipo === 'c' ? foco.idx < arq.cands.length : foco.idx < arq.partidos.length) ? foco : null;
    const base = resultadoEstado.dados;
    const totalCores = base && !base.resumo ? { c: base.total.c, p: base.total.p } : undefined;
    return calcularVisao(arq, { abr, municipios: recorteMunicipios }, { daltonico, foco: focoValido, municipios: municipios.dados ?? undefined, totalCores });
  }, [resultado.dados, resultadoEstado.dados, abr, recorteMunicipios, daltonico, foco, municipios.dados]);

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
    if (cid) return mun ? nomeUnidade(mun) : nomeCidade(cid);
    if (mun && nivel === 'zonas') return `Zona ${mun}`;
    if (mun) {
      if (abr === 'exterior') return indiceMunicipios.porPais.get(mun)?.nome ?? 'País';
      const m = indiceMunicipios.porIbge.get(mun);
      return m ? titulo(m.nome) : 'Município';
    }
    if (reg && regioes.dados?.[reg]) return regioes.dados[reg].nome;
    return nomeAbrangencia(abr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mun, reg, abr, cid, nivel, indiceMunicipios, regioes.dados, bairros.dados, locais.dados]);

  // linha de contexto abaixo do título
  const contexto = useMemo(() => {
    if (!cid) return nivel === 'zonas' && mun ? nomeZona(mun) || null : null;
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
  }, [mun, nivel, cid, abr, unidadesDaCidade, nomeZona, bairros.dados, locais.dados, indiceMunicipios]);

  // locais de votação da zona ou do bairro selecionado (lista no painel)
  const locaisDaUnidade = useMemo(() => {
    if (!cid || !mun || nivel === 'locais') return null;
    const ls = locais.dados?.porCidade.get(cid) ?? [];
    const filtro = nivel === 'zonas' ? (l: Local) => l.zona === mun.split('-')[1] : (l: Local) => l.idBairro === mun;
    return ls.filter(filtro).sort((a, b) => b.eleitorado - a.eleitorado);
  }, [cid, mun, nivel, locais.dados]);

  const trilha = useMemo(() => {
    const itens: { rotulo: string; acao: () => void; href?: string }[] = [];
    if (abr !== 'br') itens.push({ rotulo: 'Brasil', acao: () => irPara('br'), href: `${rotaDe('br', cargoSlug)}${turno === 2 ? '?t=2' : ''}` });
    if ((mun || reg || cid) && abr !== 'br') itens.push({ rotulo: nomeAbrangencia(abr), acao: () => atualizarBusca({ mun: null, reg: null, cid: null, nivel: null, foco: null }) });
    if (cid && mun) itens.push({ rotulo: nomeCidade(cid), acao: () => atualizarBusca({ mun: null, foco: null }) });
    return itens;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abr, mun, reg, cid, irPara, atualizarBusca, cargoSlug, turno, indiceMunicipios]);

  // ---- interações do mapa
  const abrirCidade = useCallback(
    (ibge: string) => atualizarBusca({ cid: ibge, nivel: 'zonas', mun: null, reg: null, foco: null }),
    [atualizarBusca],
  );

  const aoSelecionar = useCallback(
    (id: string | null) => {
      if (!id) return atualizarBusca({ mun: null });
      if (abr === 'br') {
        // na visão Brasil, clicar num município abre o estado já com ele selecionado
        const uf = ufDoIbge(id);
        if (uf) return irPara(uf, cargoSlug, { mun: id });
      }
      atualizarBusca({ mun: id === mun ? null : id });
    },
    [abr, mun, cargoSlug, irPara, atualizarBusca],
  );

  // duplo clique num município (estado, sem zonas) abre a visão da cidade
  const aoAbrir = useCallback(
    (id: string) => {
      if (cid || abr === 'br' || abr === 'exterior' || nivel !== 'municipios') return;
      abrirCidade(id);
    },
    [cid, abr, nivel, abrirCidade],
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
    [resultado.dados, abr, indiceMunicipios, nivelArquivo, nomeZona, bairros.dados, locais.dados],
  );

  const mudarNivel = useCallback(
    (n: Nivel) => atualizarBusca({ nivel: n === 'municipios' ? null : n, mun: null, reg: null, foco: null }),
    [atualizarBusca],
  );

  const carregando = resultado.carregando || malha.carregando || bairros.carregando || locais.carregando;
  const ausente = resultado.erro instanceof ArquivoAusente;
  const chaveMapa = cid ? `${abr}:${cid}:${nivel}` : nivel === 'zonas' ? `${abr}:zonas` : abr;
  // município selecionado no estado: oferece abrir a cidade (no toque não há duplo clique óbvio)
  const cidadeSelecionada = !cid && nivel === 'municipios' && mun && abr !== 'br' && abr !== 'exterior' ? mun : null;

  return (
    <div className="app">
      <Filtros
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
        aoMudarRegiao={(r) => atualizarBusca({ reg: r, mun: null })}
        aoEscolherMunicipio={(m) => {
          if (m.uf !== abr) return irPara(m.uf, cargoSlug, cid ? { cid: m.ibge, nivel } : { mun: m.ibge });
          if (cid) return atualizarBusca({ cid: m.ibge, mun: null, reg: null });
          atualizarBusca({ mun: m.ibge, reg: null, nivel: null });
        }}
        nivel={nivel}
        cidade={cid ? nomeCidade(cid) : null}
        aoMudarNivel={mudarNivel}
        aoFecharCidade={() => atualizarBusca({ cid: null, nivel: null, mun: cid, foco: null })}
        aoAlternarTema={alternarTema}
        aoAlternarDaltonico={alternarDaltonico}
      />
      <main className="mapa" aria-label={`Mapa de ${cargo.nome} — ${cid ? nomeCidade(cid) : nomeAbrangencia(abr)}`}>
        {malha.dados ? (
          <Mapa
            chave={chaveMapa}
            malha={malha.dados}
            fundo={cid ? malhaCidade.dados?.fundo ?? null : null}
            pontos={cid ? malhaCidade.dados?.pontos ?? null : null}
            cores={visao?.cores ?? null}
            selecionado={mun}
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
          {cid && nivel === 'locais'
            ? malhaCidade.dados?.pontos.features.length
              ? ' · Círculos: locais de votação, pelo tamanho do eleitorado'
              : ' · Áreas dos locais: Atlas Eleitoral 2026 (@mroctoz)'
            : ''}
        </p>
      </main>
      <Painel
        cargo={cargo}
        abr={abr}
        turno={turno}
        nomeRecorte={nomeRecorte}
        contexto={contexto}
        nivel={nivelArquivo === 'municipios' ? 'municipios' : nivel}
        locais={locaisDaUnidade}
        aoAbrirCidade={cidadeSelecionada ? () => abrirCidade(cidadeSelecionada) : undefined}
        aoEscolherLocal={cid && nivel !== 'locais' ? (id) => atualizarBusca({ nivel: 'locais', mun: id }) : undefined}
        trilha={trilha}
        visao={visao}
        arquivo={resultado.dados}
        foco={foco}
        ausente={ausente}
        erro={resultado.erro && !ausente ? resultado.erro.message : null}
        temSelecao={!!mun}
        hrefCargo={hrefCargo}
        turnoPossivel={(t) => turnoDisponivel(cargo, abr, t)}
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

