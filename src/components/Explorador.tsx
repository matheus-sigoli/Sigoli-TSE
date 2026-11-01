'use client';
/**
 * Tela principal: filtros | mapa | painel.
 * Estado na URL: caminho = /2026/{abr}/{cargo}; busca = ?t=2&mun=3550308&reg=350001&foco=c:1&nivel=zonas
 * No nível zonas, `mun` guarda a zona; no nível bairros, `cid` é a cidade (IBGE) e `mun` o bairro.
 */
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import {
  cargoPorSlug, nomeAbrangencia, rotaDe, turnoDisponivel,
  type ArquivoResultado, type CargoSlug, type Turno,
} from '@/lib/dominio';
import { pct, titulo } from '@/lib/formato';
import {
  ArquivoAusente, lerNivel, useBairros, useLocais, useMalha, useMalhaCidade, useMunicipios, useRegioes, useResultado, type Nivel,
} from '@/lib/dados';
import { calcularVisao, ufDoIbge, type Foco } from '@/lib/resultados';
import Filtros from './Filtros';
import Painel from './Painel';
import Carregando from './Carregando';

// MapLibre (~800 KB) só entra no navegador e depois da primeira pintura.
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
  const nivel = lerNivel(params.get('nivel'), abr);

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
      // o nível só vale dentro de uma UF
      if (nivel !== 'municipios' && novaAbr !== 'br' && novaAbr !== 'exterior' && !extra.mun) p.set('nivel', nivel);
      for (const [k, v] of Object.entries(extra)) p.set(k, v);
      const q = p.toString();
      iniciarTransicao(() => router.push(`${rotaDe(novaAbr, novoCargo)}${q ? `?${q}` : ''}`, { scroll: false }));
    },
    [cargoSlug, turno, router, nivel],
  );
  const hrefCargo = useCallback(
    (c: CargoSlug) => {
      const destino = cargoPorSlug(c)!;
      const a = abr === 'exterior' && c !== 'presidente' ? 'br' : abr;
      const p = new URLSearchParams();
      if (turno === 2 && turnoDisponivel(destino, a, 2)) p.set('t', '2');
      if (nivel !== 'municipios') p.set('nivel', nivel);
      const cidade = params.get('cid');
      if (nivel === 'bairros' && cidade) p.set('cid', cidade);
      const q = p.toString();
      return `${rotaDe(a, c)}${q ? `?${q}` : ''}`;
    },
    [abr, turno, nivel, params],
  );

  // ---- dados
  // Bairros: sem cidade escolhida, o mapa mostra os municípios do estado para escolher uma (ADR 0009)
  const cid = nivel === 'bairros' ? params.get('cid') : null;
  const nivelDados: Nivel = nivel === 'bairros' && !cid ? 'municipios' : nivel;
  const resultado = useResultado(cargoSlug, turno, abr, nivelDados);
  const malhaUf = useMalha(abr, nivelDados === 'zonas' ? 'zonas' : 'municipios');
  const malhaCidade = useMalhaCidade(cid ? abr : null, cid);
  const malha = cid ? { dados: malhaCidade.dados?.malha ?? null, carregando: malhaCidade.carregando } : malhaUf;
  const bairros = useBairros(nivel === 'bairros' ? abr : null);
  const locais = useLocais(nivel === 'zonas' || (cid && mun) ? abr : null);
  // zona → municípios que ela cobre (para os nomes)
  const municipiosDaZona = useMemo(() => {
    const m = new Map<string, Set<string>>();
    for (const l of locais.dados ?? []) {
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
    if (!reg || !malhaUf.dados || abr === 'br' || abr === 'exterior' || nivelDados !== 'municipios' || cid) return null;
    const s = new Set<string>();
    for (const f of malhaUf.dados.municipios.features) {
      const pr = f.properties as { id: string; rgi?: string; rgint?: string };
      if (pr.rgi === reg || pr.rgint === reg) s.add(pr.id);
    }
    return s.size ? s : null;
  }, [reg, malhaUf.dados, abr, nivelDados, cid]);

  const bairrosDaCidade = useMemo(
    () => (cid ? new Set((bairros.dados?.porCidade.get(cid) ?? []).map((b) => b.id)) : null),
    [cid, bairros.dados],
  );

  const recorteMunicipios = useMemo(() => {
    if (mun) {
      if (abr === 'exterior') return new Set(indiceMunicipios.porPais.get(mun)?.cidades ?? []);
      return new Set([mun]);
    }
    if (cid) return bairrosDaCidade ?? new Set<string>();
    return municipiosRegiao;
  }, [mun, abr, cid, bairrosDaCidade, municipiosRegiao, indiceMunicipios]);

  const visao = useMemo(() => {
    if (!resultado.dados) return null;
    // o foco aponta para índices do arquivo atual; ignora se não couber
    const arq = resultado.dados;
    const focoValido = foco && !arq.resumo && (foco.tipo === 'c' ? foco.idx < arq.cands.length : foco.idx < arq.partidos.length) ? foco : null;
    return calcularVisao(arq, { abr, municipios: recorteMunicipios }, { daltonico, foco: focoValido, municipios: municipios.dados ?? undefined });
  }, [resultado.dados, abr, recorteMunicipios, daltonico, foco, municipios.dados]);

  // ---- título do recorte
  const nomeZona = useCallback(
    (z: string) => {
      const nomes = [...(municipiosDaZona.get(z) ?? [])].map((i) => indiceMunicipios.porIbge.get(i)?.nome).filter(Boolean).map((n) => titulo(n!));
      nomes.sort((a, b) => a.localeCompare(b, 'pt-BR'));
      return nomes.length > 2 ? `${nomes.slice(0, 2).join(', ')} e mais ${nomes.length - 2}` : nomes.join(' e ');
    },
    [municipiosDaZona, indiceMunicipios],
  );
  const nomeBairro = (id: string) => {
    const b = bairros.dados?.porId.get(id);
    return b ? (b.origem === 't' ? titulo(b.nome) : b.nome) : 'Bairro';
  };

  const nomeRecorte = useMemo(() => {
    if (mun && nivel === 'zonas') return `Zona ${mun}`;
    if (cid) return mun ? nomeBairro(mun) : nomeCidade(cid);
    if (mun) {
      if (abr === 'exterior') return indiceMunicipios.porPais.get(mun)?.nome ?? 'País';
      const m = indiceMunicipios.porIbge.get(mun);
      return m ? titulo(m.nome) : 'Município';
    }
    if (reg && regioes.dados?.[reg]) return regioes.dados[reg].nome;
    return nomeAbrangencia(abr);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mun, reg, abr, cid, indiceMunicipios, regioes.dados, nivel, bairros.dados]);

  // linha de contexto abaixo do título
  const contexto = useMemo(() => {
    if (nivel === 'zonas') return mun ? nomeZona(mun) || null : null;
    if (nivel !== 'bairros') return null;
    if (!cid) return 'Escolha uma cidade no mapa para ver os bairros.';
    if (!mun) {
      const lista = bairros.dados?.porCidade.get(cid) ?? [];
      const comArea = lista.filter((b) => b.origem === 'i').length;
      return `${lista.length} bairros${comArea ? `, ${comArea} com área do IBGE` : ''}`;
    }
    const b = bairros.dados?.porId.get(mun);
    if (!b) return null;
    return [
      nomeCidade(b.ibge),
      `${b.locais} ${b.locais === 1 ? 'local' : 'locais'} de votação`,
      `${b.eleitorado.toLocaleString('pt-BR')} eleitores`,
      b.origem === 'i' ? 'área do IBGE' : 'bairro informado pelo TSE',
    ].join(' · ');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mun, nivel, cid, nomeZona, bairros.dados, indiceMunicipios]);

  const locaisDoBairro = useMemo(
    () => (cid && mun ? (locais.dados ?? []).filter((l) => l.idBairro === mun).sort((a, b) => b.eleitorado - a.eleitorado) : null),
    [cid, mun, locais.dados],
  );

  const trilha = useMemo(() => {
    const itens: { rotulo: string; acao: () => void; href?: string }[] = [];
    if (abr !== 'br') itens.push({ rotulo: 'Brasil', acao: () => irPara('br'), href: `${rotaDe('br', cargoSlug)}${turno === 2 ? '?t=2' : ''}` });
    if ((mun || reg || cid) && abr !== 'br') itens.push({ rotulo: nomeAbrangencia(abr), acao: () => atualizarBusca({ mun: null, reg: null, cid: null, foco: null }) });
    if (cid && mun) itens.push({ rotulo: nomeCidade(cid), acao: () => atualizarBusca({ mun: null, foco: null }) });
    return itens;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [abr, mun, reg, cid, irPara, atualizarBusca, cargoSlug, turno, indiceMunicipios]);

  // ---- interações do mapa
  const aoSelecionar = useCallback(
    (id: string | null) => {
      if (nivel === 'bairros' && !cid) {
        // escolher a cidade abre os bairros dela
        return id ? atualizarBusca({ cid: id, mun: null, reg: null, foco: null }) : undefined;
      }
      if (!id) return atualizarBusca({ mun: null });
      if (abr === 'br') {
        // na visão Brasil, clicar num município abre o estado já com ele selecionado
        const uf = ufDoIbge(id);
        if (uf) return irPara(uf, cargoSlug, { mun: id });
      }
      atualizarBusca({ mun: id === mun ? null : id });
    },
    [abr, mun, cid, nivel, cargoSlug, irPara, atualizarBusca],
  );

  const descreverFeicao = useCallback(
    (id: string): { titulo: string; linha: string } | null => {
      const arq = resultado.dados;
      if (!arq) return null;
      if (nivelDados !== 'municipios' && !arq.resumo) {
        let tituloDica: string;
        if (nivelDados === 'zonas') {
          const nomes = nomeZona(id);
          tituloDica = `Zona ${id}${nomes ? ` · ${nomes}` : ''}`;
        } else tituloDica = nomeBairro(id);
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
      return { titulo: nome, linha: linhaVencedor(arq, regs) + (nivel === 'bairros' ? ' · clique para ver os bairros' : '') };
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [resultado.dados, abr, indiceMunicipios, nivel, nivelDados, nomeZona, bairros.dados],
  );

  const mudarNivel = useCallback(
    (n: Nivel) => atualizarBusca({ nivel: n === 'municipios' ? null : n, mun: null, reg: null, cid: null, foco: null }),
    [atualizarBusca],
  );

  const carregando = resultado.carregando || malha.carregando || bairros.carregando || (nivel === 'zonas' && locais.carregando);
  const ausente = resultado.erro instanceof ArquivoAusente;
  const chaveMapa = cid ? `${abr}:b:${cid}` : nivelDados === 'zonas' ? `${abr}:zonas` : abr;

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
          if (m.uf !== abr) return irPara(m.uf, cargoSlug, nivel === 'bairros' ? { nivel: 'bairros', cid: m.ibge } : { mun: m.ibge });
          if (nivel === 'bairros') return atualizarBusca({ cid: m.ibge, mun: null, reg: null });
          atualizarBusca({ mun: m.ibge, reg: null, nivel: null });
        }}
        nivel={nivel}
        unidade={nivelDados}
        aoMudarNivel={mudarNivel}
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
            descrever={descreverFeicao}
          />
        ) : null}
        {carregando ? <Carregando texto={`Carregando ${cargo.nome.toLowerCase()}, ${cid ? nomeCidade(cid) : nomeAbrangencia(abr)}…`} /> : null}
        <p className="creditos-mapa">
          Malha: IBGE{cid ? ' (bairros: Censo 2022)' : ' 2025'} · Resultados: TSE
          {nivelDados === 'zonas' ? ' · Áreas das zonas aproximadas pelos locais de votação' : ''}
          {cid ? ' · Círculos: bairros do cadastro do TSE, sem área no IBGE' : ''}
        </p>
      </main>
      <Painel
        cargo={cargo}
        abr={abr}
        turno={turno}
        nomeRecorte={nomeRecorte}
        contexto={contexto}
        nivel={nivelDados}
        locais={locaisDoBairro}
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

