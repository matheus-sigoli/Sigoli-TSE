'use client';
/**
 * Tela principal: filtros | mapa | painel.
 * Estado na URL: caminho = /2026/{abr}/{cargo}; busca = ?t=2&mun=3550308&reg=350001&foco=c:1
 */
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import {
  cargoPorSlug, nomeAbrangencia, rotaDe, turnoDisponivel,
  type ArquivoResultado, type CargoSlug, type Turno,
} from '@/lib/dominio';
import { pct, titulo } from '@/lib/formato';
import { ArquivoAusente, useMalha, useMunicipios, useRegioes, useResultado } from '@/lib/dados';
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
      for (const [k, v] of Object.entries(extra)) p.set(k, v);
      const q = p.toString();
      iniciarTransicao(() => router.push(`${rotaDe(novaAbr, novoCargo)}${q ? `?${q}` : ''}`, { scroll: false }));
    },
    [cargoSlug, turno, router],
  );
  const hrefCargo = useCallback(
    (c: CargoSlug) => {
      const destino = cargoPorSlug(c)!;
      const a = abr === 'exterior' && c !== 'presidente' ? 'br' : abr;
      const t = turno === 2 && turnoDisponivel(destino, a, 2) ? '?t=2' : '';
      return `${rotaDe(a, c)}${t}`;
    },
    [abr, turno],
  );

  // ---- dados
  const resultado = useResultado(cargoSlug, turno, abr);
  const malha = useMalha(abr);
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

  // municípios da região escolhida (a partir das propriedades da malha da UF)
  const municipiosRegiao = useMemo(() => {
    if (!reg || !malha.dados || abr === 'br' || abr === 'exterior') return null;
    const s = new Set<string>();
    for (const f of malha.dados.municipios.features) {
      const pr = f.properties as { id: string; rgi?: string; rgint?: string };
      if (pr.rgi === reg || pr.rgint === reg) s.add(pr.id);
    }
    return s.size ? s : null;
  }, [reg, malha.dados, abr]);

  const recorteMunicipios = useMemo(() => {
    if (mun) {
      if (abr === 'exterior') return new Set(indiceMunicipios.porPais.get(mun)?.cidades ?? []);
      return new Set([mun]);
    }
    return municipiosRegiao;
  }, [mun, abr, municipiosRegiao, indiceMunicipios]);

  const visao = useMemo(() => {
    if (!resultado.dados) return null;
    // o foco aponta para índices do arquivo atual; ignora se não couber
    const arq = resultado.dados;
    const focoValido = foco && !arq.resumo && (foco.tipo === 'c' ? foco.idx < arq.cands.length : foco.idx < arq.partidos.length) ? foco : null;
    return calcularVisao(arq, { abr, municipios: recorteMunicipios }, { daltonico, foco: focoValido, municipios: municipios.dados ?? undefined });
  }, [resultado.dados, abr, recorteMunicipios, daltonico, foco, municipios.dados]);

  // ---- título do recorte
  const nomeRecorte = useMemo(() => {
    if (mun) {
      if (abr === 'exterior') return indiceMunicipios.porPais.get(mun)?.nome ?? 'País';
      const m = indiceMunicipios.porIbge.get(mun);
      return m ? titulo(m.nome) : 'Município';
    }
    if (reg && regioes.dados?.[reg]) return regioes.dados[reg].nome;
    return nomeAbrangencia(abr);
  }, [mun, reg, abr, indiceMunicipios, regioes.dados]);

  const trilha = useMemo(() => {
    const itens: { rotulo: string; acao: () => void }[] = [];
    if (abr !== 'br') itens.push({ rotulo: 'Brasil', acao: () => irPara('br') });
    if ((mun || reg) && abr !== 'br') itens.push({ rotulo: nomeAbrangencia(abr), acao: () => atualizarBusca({ mun: null, reg: null, foco: null }) });
    return itens;
  }, [abr, mun, reg, irPara, atualizarBusca]);

  // ---- interações do mapa
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

  const descreverFeicao = useCallback(
    (id: string): { titulo: string; linha: string } | null => {
      const arq = resultado.dados;
      if (!arq) return null;
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
      return { titulo: nome, linha: linhaVencedor(arq, regs) };
    },
    [resultado.dados, abr, indiceMunicipios],
  );

  const carregando = resultado.carregando || malha.carregando;
  const ausente = resultado.erro instanceof ArquivoAusente;

  return (
    <div className="app">
      <Filtros
        abr={abr}
        cargo={cargo}
        regiaoSelecionada={reg}
        malha={malha.dados}
        regioes={regioes.dados}
        municipios={municipios.dados}
        legenda={visao?.legenda ?? []}
        escalaFoco={foco && visao ? [...visao.candidatos, ...visao.partidos].find((l) => l.chave === `${foco.tipo}:${foco.idx}`) ?? null : null}
        modoCalor={!!foco}
        tema={tema}
        daltonico={daltonico}
        aoMudarAbrangencia={(a) => irPara(a)}
        aoMudarRegiao={(r) => atualizarBusca({ reg: r, mun: null })}
        aoEscolherMunicipio={(m) => (m.uf === abr ? atualizarBusca({ mun: m.ibge, reg: null }) : irPara(m.uf, cargoSlug, { mun: m.ibge }))}
        aoAlternarTema={alternarTema}
        aoAlternarDaltonico={alternarDaltonico}
      />
      <main className="mapa" aria-label={`Mapa de ${cargo.nome} — ${nomeAbrangencia(abr)}`}>
        {malha.dados ? (
          <Mapa
            chave={abr}
            malha={malha.dados}
            cores={visao?.cores ?? null}
            selecionado={mun}
            destaque={municipiosRegiao}
            mundo={abr === 'exterior'}
            aoSelecionar={aoSelecionar}
            descrever={descreverFeicao}
          />
        ) : null}
        {carregando ? <Carregando texto={`Carregando ${cargo.nome.toLowerCase()} — ${nomeAbrangencia(abr)}`} /> : null}
        <p className="creditos-mapa">Malha: IBGE 2025 · Resultados: TSE</p>
      </main>
      <Painel
        cargo={cargo}
        abr={abr}
        turno={turno}
        nomeRecorte={nomeRecorte}
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
        aoAbrirUf={(uf) => irPara(uf)}
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

