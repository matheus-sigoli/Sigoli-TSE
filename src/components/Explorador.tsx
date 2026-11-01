'use client';
/**
 * Tela principal: filtros | mapa | painel.
 * Estado na URL: caminho = /2026/{abr}/{cargo}; busca = ?t=2&mun=3550308&reg=350001&foco=c:1&nivel=zonas
 * No nível zonas/locais, `mun` guarda a zona ou o local selecionado.
 */
import dynamic from 'next/dynamic';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState, useTransition } from 'react';
import {
  cargoPorSlug, nomeAbrangencia, rotaDe, turnoDisponivel,
  type ArquivoResultado, type CargoSlug, type Turno,
} from '@/lib/dominio';
import { pct, titulo } from '@/lib/formato';
import { ArquivoAusente, lerNivel, useLocais, useMalha, useMunicipios, useRegioes, useResultado, type Nivel } from '@/lib/dados';
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
      const q = p.toString();
      return `${rotaDe(a, c)}${q ? `?${q}` : ''}`;
    },
    [abr, turno, nivel],
  );

  // ---- dados
  const resultado = useResultado(cargoSlug, turno, abr, nivel);
  const malha = useMalha(abr, nivel);
  const locais = useLocais(nivel !== 'municipios' ? abr : null);
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

  // municípios da região escolhida (a partir das propriedades da malha da UF)
  const municipiosRegiao = useMemo(() => {
    if (!reg || !malha.dados || abr === 'br' || abr === 'exterior' || nivel !== 'municipios') return null;
    const s = new Set<string>();
    for (const f of malha.dados.municipios.features) {
      const pr = f.properties as { id: string; rgi?: string; rgint?: string };
      if (pr.rgi === reg || pr.rgint === reg) s.add(pr.id);
    }
    return s.size ? s : null;
  }, [reg, malha.dados, abr, nivel]);

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
  const nomeZona = useCallback(
    (z: string) => {
      const nomes = [...(municipiosDaZona.get(z) ?? [])].map((i) => indiceMunicipios.porIbge.get(i)?.nome).filter(Boolean).map((n) => titulo(n!));
      nomes.sort((a, b) => a.localeCompare(b, 'pt-BR'));
      return nomes.length > 2 ? `${nomes.slice(0, 2).join(', ')} e mais ${nomes.length - 2}` : nomes.join(' e ');
    },
    [municipiosDaZona, indiceMunicipios],
  );

  const nomeRecorte = useMemo(() => {
    if (mun && nivel === 'zonas') return `Zona ${mun}`;
    if (mun && nivel === 'locais') return titulo(locais.dados?.porId.get(mun)?.nome ?? 'Local de votação');
    if (mun) {
      if (abr === 'exterior') return indiceMunicipios.porPais.get(mun)?.nome ?? 'País';
      const m = indiceMunicipios.porIbge.get(mun);
      return m ? titulo(m.nome) : 'Município';
    }
    if (reg && regioes.dados?.[reg]) return regioes.dados[reg].nome;
    return nomeAbrangencia(abr);
  }, [mun, reg, abr, indiceMunicipios, regioes.dados, nivel, locais.dados]);

  // linha de contexto abaixo do título, para zona e local
  const contexto = useMemo(() => {
    if (!mun || nivel === 'municipios') return null;
    if (nivel === 'zonas') return nomeZona(mun) || null;
    const l = locais.dados?.porId.get(mun);
    if (!l) return null;
    const cidade = indiceMunicipios.porIbge.get(l.ibge)?.nome;
    return [l.bairro && titulo(l.bairro), cidade && titulo(cidade), `Zona ${l.zona}`, `${l.eleitorado.toLocaleString('pt-BR')} eleitores`].filter(Boolean).join(' · ');
  }, [mun, nivel, nomeZona, locais.dados, indiceMunicipios]);

  const trilha = useMemo(() => {
    const itens: { rotulo: string; acao: () => void; href?: string }[] = [];
    if (abr !== 'br') itens.push({ rotulo: 'Brasil', acao: () => irPara('br'), href: `${rotaDe('br', cargoSlug)}${turno === 2 ? '?t=2' : ''}` });
    if ((mun || reg) && abr !== 'br') itens.push({ rotulo: nomeAbrangencia(abr), acao: () => atualizarBusca({ mun: null, reg: null, foco: null }) });
    return itens;
  }, [abr, mun, reg, irPara, atualizarBusca, cargoSlug, turno]);

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
      if (nivel !== 'municipios' && !arq.resumo) {
        let tituloDica: string;
        if (nivel === 'zonas') {
          const nomes = nomeZona(id);
          tituloDica = `Zona ${id}${nomes ? ` · ${nomes}` : ''}`;
        } else {
          const l = locais.dados?.porId.get(id);
          tituloDica = l ? `${titulo(l.nome)}${l.bairro ? ` · ${titulo(l.bairro)}` : ''}` : 'Local de votação';
        }
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
      return { titulo: nome, linha: linhaVencedor(arq, regs) };
    },
    [resultado.dados, abr, indiceMunicipios, nivel, nomeZona, locais.dados],
  );

  const mudarNivel = useCallback(
    (n: Nivel) => atualizarBusca({ nivel: n === 'municipios' ? null : n, mun: null, reg: null, foco: null }),
    [atualizarBusca],
  );

  const carregando = resultado.carregando || malha.carregando || locais.carregando;
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
        aoEscolherMunicipio={(m) => (m.uf === abr ? atualizarBusca({ mun: m.ibge, reg: null, nivel: null }) : irPara(m.uf, cargoSlug, { mun: m.ibge }))}
        nivel={nivel}
        aoMudarNivel={mudarNivel}
        aoAlternarTema={alternarTema}
        aoAlternarDaltonico={alternarDaltonico}
      />
      <main className="mapa" aria-label={`Mapa de ${cargo.nome} — ${nomeAbrangencia(abr)}`}>
        {malha.dados ? (
          <Mapa
            chave={nivel === 'zonas' ? `${abr}:zonas` : abr}
            malha={malha.dados}
            pontos={nivel === 'locais' ? locais.dados?.pontos ?? null : null}
            cores={visao?.cores ?? null}
            selecionado={mun}
            destaque={municipiosRegiao}
            mundo={abr === 'exterior'}
            aoSelecionar={aoSelecionar}
            descrever={descreverFeicao}
          />
        ) : null}
        {carregando ? <Carregando texto={`Carregando ${cargo.nome.toLowerCase()}, ${nomeAbrangencia(abr)}…`} /> : null}
        <p className="creditos-mapa">
          Malha: IBGE 2025 · Resultados: TSE{nivel === 'zonas' ? ' · Áreas das zonas aproximadas pelos locais de votação' : ''}
        </p>
      </main>
      <Painel
        cargo={cargo}
        abr={abr}
        turno={turno}
        nomeRecorte={nomeRecorte}
        contexto={contexto}
        nivel={nivel}
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

