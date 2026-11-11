'use client';
import Link from 'next/link';
import { memo, useCallback, useEffect, useRef, useState } from 'react';
import { textoSobre } from '@/lib/cores';
import { preCarregar, urlResultadoNivel, type Local, type Nivel } from '@/lib/dados';
import { temCargo } from '@/lib/anos';
import { CARGOS, UFS, type Arquivo, type Cargo, type CargoSlug, type Turno } from '@/lib/dominio';
import { pct, titulo, votos } from '@/lib/formato';
import { bancada, type Foco, type Linha, type Visao } from '@/lib/resultados';

interface Props {
  ano: number;
  cargo: Cargo;
  abr: string;
  turno: Turno;
  nomeRecorte: string;
  /** bairro, município, zona: linha abaixo do título no nível zonas/locais */
  contexto?: string | null;
  nivel: Nivel;
  /** locais de votação da zona ou do bairro selecionado */
  locais?: Local[] | null;
  /** município selecionado no estado: botão para abrir a visão da cidade */
  aoAbrirCidade?: () => void;
  /** clicar num local da lista abre ele no nível Locais */
  aoEscolherLocal?: (id: string) => void;
  trilha: { rotulo: string; acao: () => void; href?: string }[];
  visao: Visao | null;
  arquivo: Arquivo | null;
  foco: Foco;
  ausente: boolean;
  erro: string | null;
  temSelecao: boolean;
  hrefCargo: (c: CargoSlug) => string;
  turnoPossivel: (t: Turno) => boolean;
  aoMudarTurno: (t: Turno) => void;
  aoFocar: (chave: string | null) => void;
}

const POR_PAGINA = 40;
const UNIDADE: Record<Nivel, string> = { municipios: 'município', zonas: 'zona', bairros: 'bairro', locais: 'local de votação' };

function Painel(p: Props) {
  const { cargo, abr, turno, visao, arquivo, foco } = p;
  const [aba, setAba] = useState<'partidos' | 'candidatos'>('partidos');
  const [limite, setLimite] = useState(POR_PAGINA);
  useEffect(() => setLimite(POR_PAGINA), [cargo.slug, abr, p.nomeRecorte]);

  // gaveta (celular)
  const [aberta, setAberta] = useState(false);
  const [arrastando, setArrastando] = useState(false);
  const ref = useRef<HTMLElement>(null);
  const inicio = useRef<{ y: number; aberta: boolean } | null>(null);
  const aoApertar = useCallback((e: React.PointerEvent) => {
    inicio.current = { y: e.clientY, aberta };
    setArrastando(true);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  }, [aberta]);
  const aoMover = useCallback((e: React.PointerEvent) => {
    if (!inicio.current || !ref.current) return;
    const dy = e.clientY - inicio.current.y;
    // altura da gaveta recolhida: a mesma do CSS (--espiada, menor no celular)
    const espiada = parseFloat(getComputedStyle(ref.current).getPropertyValue('--espiada')) || 300;
    const base = inicio.current.aberta ? 0 : ref.current.offsetHeight - espiada;
    ref.current.style.transform = `translateY(${Math.max(0, base + dy)}px)`;
  }, []);
  const aoSoltar = useCallback((e: React.PointerEvent) => {
    if (!inicio.current || !ref.current) return;
    const dy = e.clientY - inicio.current.y;
    ref.current.style.transform = '';
    setArrastando(false);
    setAberta(Math.abs(dy) < 6 ? !inicio.current.aberta : dy < 0);
    inicio.current = null;
  }, []);

  const focoChave = foco ? `${foco.tipo}:${foco.idx}` : null;
  const prop = visao?.tipo === 'prop';
  const porPartido = p.nivel !== 'municipios';
  const abaAtiva = porPartido ? 'partidos' : aba;
  const t = visao?.totais;

  return (
    <aside
      ref={ref}
      className="painel"
      aria-label="Resultados"
      data-aberta={aberta}
      data-arrastando={arrastando}
    >
      <button
        className="puxador"
        aria-label={aberta ? 'Recolher resultados' : 'Expandir resultados'}
        aria-expanded={aberta}
        onPointerDown={aoApertar}
        onPointerMove={aoMover}
        onPointerUp={aoSoltar}
        onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && setAberta((a) => !a)}
      />

      <nav className="abas" aria-label="Cargo">
        {CARGOS.filter((c) => temCargo(p.ano, c.slug)).map((c) => (
          <Link
            key={c.slug}
            href={p.hrefCargo(c.slug)}
            aria-current={c.slug === cargo.slug ? 'page' : undefined}
            scroll={false}
            onMouseEnter={() => preCarregar(urlResultadoNivel(p.ano, c.slug, 1, abr === 'exterior' ? 'br' : abr, p.nivel))}
          >
            {c.curto}
          </Link>
        ))}
      </nav>

      <header className="painel-topo">
        {p.trilha.length ? (
          <nav className="trilha" aria-label="Voltar para">
            {p.trilha.map((t, i) => (
              <span key={t.rotulo}>
                {i > 0 ? ' / ' : null}
                {t.href ? <Link href={t.href} scroll={false}>{t.rotulo}</Link> : <button onClick={t.acao}>{t.rotulo}</button>}
              </span>
            ))}
          </nav>
        ) : null}
        <h1 className="titulo">{p.nomeRecorte}</h1>
        {p.contexto ? <p className="contexto">{p.contexto}</p> : null}
        {p.aoAbrirCidade ? (
          <button type="button" className="abrir-cidade" onClick={p.aoAbrirCidade}>
            Abrir detalhamento da cidade
            <span>zonas, bairros e locais de votação</span>
          </button>
        ) : null}
        <p className="subtitulo">
          {cargo.nome}, {turno}º turno
          {p.ano === 1989 ? '. Totalização final, por município: Geografia do Voto' : p.ano !== 2026 ? '. Totalização final do TSE' : arquivo && !arquivo.resumo && arquivo.atualizado ? `. Dados do TSE de ${arquivo.atualizado.split(' ')[0]}` : ''}
        </p>
        {cargo.turnos.length > 1 ? (
          <div className="segmentado" role="group" aria-label="Turno">
            {([1, 2] as Turno[]).map((n) => (
              <button
                key={n}
                aria-pressed={turno === n}
                disabled={!p.turnoPossivel(n)}
                title={!p.turnoPossivel(n) ? 'Não houve 2º turno neste estado' : undefined}
                onClick={() => p.aoMudarTurno(n)}
              >
                {n}º turno
              </button>
            ))}
          </div>
        ) : null}
      </header>

      {p.ausente ? (
        <div className="aviso" role="status">
          <p>Ainda não há resultados publicados para este recorte.</p>
          <p>Os dados são gerados a partir dos arquivos oficiais do TSE. Escolha outro estado ou cargo.</p>
        </div>
      ) : p.erro ? (
        <div className="aviso" role="alert">
          <p>Não foi possível carregar os resultados.</p>
          <p>Verifique sua conexão e recarregue a página.</p>
        </div>
      ) : null}

      {t ? (
        <dl className="indicadores">
          <div><dt>Comparecimento</dt><dd className="num">{pct(t[1] / (t[0] || 1))}</dd></div>
          <div><dt>Abstenção</dt><dd className="num">{pct(t[2] / (t[0] || 1))}</dd></div>
          <div><dt>Brancos</dt><dd className="num">{pct(t[4] / (t[1] || 1))}</dd></div>
          <div><dt>Nulos</dt><dd className="num">{pct(t[5] / (t[1] || 1))}</dd></div>
        </dl>
      ) : null}

      {visao?.tipo === 'resumo' && visao.eleitosPorUf ? (
        <Resumo ano={p.ano} visao={visao} cargo={cargo} turno={turno} />
      ) : visao ? (
        <>
          {prop && porPartido ? (
            <p className="dica">
              Nas zonas, bairros e locais, os deputados aparecem por partido. O voto em cada candidato está no mapa por município.
            </p>
          ) : prop ? (
            <div style={{ padding: '14px 20px 0' }}>
              <div className="segmentado" role="group" aria-label="Agrupar por">
                <button aria-pressed={aba === 'partidos'} onClick={() => setAba('partidos')}>Partidos</button>
                <button aria-pressed={aba === 'candidatos'} onClick={() => setAba('candidatos')}>Candidatos</button>
              </div>
            </div>
          ) : null}
          <p className="dica">
            {focoChave ? `Mapa mostrando o % deste concorrente em cada ${UNIDADE[p.nivel]}. Clique de novo para voltar.` : 'Clique num nome para ver onde ele teve mais votos.'}
          </p>
          <Lista
            linhas={(prop && abaAtiva === 'partidos' ? visao.partidos : visao.candidatos).slice(0, limite)}
            focoChave={focoChave}
            aoFocar={p.aoFocar}
            mostrarSelos={!p.temSelecao}
          />
          {(prop && abaAtiva === 'partidos' ? visao.partidos : visao.candidatos).length > limite ? (
            <button className="mais" onClick={() => setLimite((l) => l + POR_PAGINA)}>
              Mostrar mais {Math.min(POR_PAGINA, (abaAtiva === 'partidos' && prop ? visao.partidos : visao.candidatos).length - limite)}
            </button>
          ) : null}
        </>
      ) : null}

      {p.locais?.length ? (
        <details className="locais-bairro">
          <summary>
            {p.locais.length} {p.locais.length === 1 ? 'local de votação' : 'locais de votação'} {p.nivel === 'zonas' ? 'nesta zona' : p.nivel === 'locais' ? 'nesta área' : 'neste bairro'}
          </summary>
          <ul>
            {p.locais.map((l) => (
              <li key={l.id}>
                {p.aoEscolherLocal ? (
                  <button type="button" onClick={() => p.aoEscolherLocal!(l.id)}>
                    <span>{titulo(l.nome)}</span>
                    <span className="num">Zona {l.zona} · {votos(l.eleitorado)} eleitores</span>
                  </button>
                ) : (
                  <>
                    <span>{titulo(l.nome)}</span>
                    <span className="num">Zona {l.zona} · {votos(l.eleitorado)} eleitores</span>
                  </>
                )}
              </li>
            ))}
          </ul>
        </details>
      ) : null}

      <footer className="rodape">
        Fonte: {p.ano === 2026 ? <a href="https://resultados.tse.jus.br" target="_blank" rel="noreferrer">TSE, resultados oficiais 2026</a>
          : p.ano === 1989 ? <><a href="https://geografiadovoto.com/fontes/" target="_blank" rel="noreferrer">Geografia do Voto</a> (IpeaData com correções), conferido com o <a href="https://dadosabertos.tse.jus.br/dataset/resultados-1989" target="_blank" rel="noreferrer">TSE por UF</a>; exterior do 2º turno por país: livro do TSE <i>Eleições 89, Turno II</i></>
          : <a href="https://dadosabertos.tse.jus.br" target="_blank" rel="noreferrer">TSE, dados abertos {p.ano}</a>}.
        Malha municipal: IBGE 2025. Percentuais de candidatos sobre votos válidos.
      </footer>
    </aside>
  );
}

const ROTULO_VICE: Record<string, string> = { v: 'Vice', s1: '1º suplente', s2: '2º suplente' };

/** Reserva do avatar quando não há número (ex.: resumo nacional por partido): sigla ou iniciais. */
const iniciais = (l: Linha) => {
  if (l.chave.startsWith('p')) return l.partido.replace(/[^A-Za-zÀ-ú0-9]/g, '').slice(0, 3);
  const p = l.nome.split(/\s+/).filter((x) => !/^(DA|DE|DO|DAS|DOS|E)$/.test(x));
  return ((p[0]?.[0] ?? '') + (p.length > 1 ? p[p.length - 1][0] : '')).toUpperCase();
};

const Lista = memo(function Lista({ linhas, focoChave, aoFocar, mostrarSelos }: {
  linhas: Linha[];
  focoChave: string | null;
  aoFocar: (chave: string | null) => void;
  mostrarSelos: boolean;
}) {
  return (
    <ul className="lista">
      {linhas.map((l) => {
        const cor = l.faixas['50'];
        const candidato = l.chave.startsWith('c');
        return (
          <li key={l.chave}>
            <button className="linha" aria-pressed={focoChave === l.chave} onClick={() => aoFocar(l.chave)}>
              <span
                className="avatar num"
                data-digitos={Math.min(5, (l.numero || iniciais(l)).length)}
                style={{ '--cor': cor, color: textoSobre(cor) } as React.CSSProperties}
                aria-label={l.numero ? `número ${l.numero}` : undefined}
              >
                {l.numero || iniciais(l)}
              </span>
              <span className="linha-info">
                <span className="linha-nome">
                  {candidato ? `${titulo(l.nome)} (${l.partido})` : l.partido}
                  {mostrarSelos && l.eleito ? <span className="selo eleito">Eleito</span> : null}
                  {mostrarSelos && !l.eleito && l.segundoTurno ? <span className="selo segundo">2º turno</span> : null}
                  {l.anulado ? <span className="selo anulado" title={`Destinação do voto no TSE: ${l.anulado}`}>Votos anulados</span> : null}
                </span>
                <span className="linha-meta">
                  {candidato ? `${l.partido} / ${l.numero}` : l.federacao ? `${l.federacao} / ${l.numero}` : `Nominais + legenda / ${l.numero}`}
                </span>
                {l.vices?.length ? (
                  <span className="linha-meta">
                    {l.vices.map((v) => `${ROTULO_VICE[v.tipo] ?? 'Vice'}: ${titulo(v.nome)}${v.partido ? ` (${v.partido})` : ''}`).join(' · ')}
                  </span>
                ) : null}
                {l.coligacao ? (
                  <span className="linha-meta linha-col" title={l.composicao}>
                    Coligação {titulo(l.coligacao)}{l.composicao ? `: ${l.composicao}` : ''}
                  </span>
                ) : null}
              </span>
              <span className="linha-num">
                <span className="num linha-pct">{l.anulado ? '–' : pct(l.pct, 2)}</span>
                <span className="num linha-votos">{votos(l.votos)} votos</span>
              </span>
              <span className="barra" aria-hidden>
                <i style={{ background: cor, transform: `scaleX(${Math.min(1, l.pct)})` }} />
              </span>
            </button>
          </li>
        );
      })}
    </ul>
  );
});

function Resumo({ ano, visao, cargo, turno }: { ano: number; visao: Visao; cargo: Cargo; turno: Turno }) {
  const prop = cargo.tipo === 'prop';
  const eleitos = visao.eleitosPorUf!;
  const ordemUfs = Object.keys(eleitos).sort((a, b) => (UFS[a] ?? a).localeCompare(UFS[b] ?? b, 'pt-BR'));
  const corDe = new Map(visao.partidos.map((l) => [l.partido, l.faixas['50']]));
  return (
    <>
      {prop ? (
        <>
          <h2 className="secao-titulo">Bancada eleita por partido</h2>
          <div className="bancada">
            {bancada(eleitos).map(([sg, n]) => (
              <span key={sg}>
                <i className="tecla pequena" style={{ '--cor': corDe.get(sg) ?? '#888', color: textoSobre(corDe.get(sg) ?? '#888'), fontStyle: 'normal' } as React.CSSProperties}>{n}</i>
                {sg}
              </span>
            ))}
          </div>
        </>
      ) : null}
      <h2 className="secao-titulo">{prop ? 'Eleitos por estado' : cargo.slug === 'senador' ? 'Senadores eleitos por estado' : 'Resultado por estado'}</h2>
      {ordemUfs.map((uf) => (
        <section key={uf} className="uf-bloco">
          <h3><Link href={`/${ano}/${uf}/${cargo.slug}${turno === 2 ? '?t=2' : ''}`} scroll={false}>{UFS[uf]}</Link></h3>
          {prop ? (
            <p className="linha-meta" style={{ margin: 0, whiteSpace: 'normal' }}>
              {bancada({ [uf]: eleitos[uf] }).map(([sg, n]) => `${sg} ${n}`).join(', ')}
            </p>
          ) : (
            eleitos[uf].map((e) => (
              <div key={e.n + e.nome} className="eleito-mini">
                <span className="numero num pequeno" style={{ color: corDe.get(e.partido) ?? 'var(--muted)' }}>{e.n}</span>
                <span style={{ flex: 1 }}>
                  {titulo(e.nome)} <span className="linha-meta">{e.partido}</span>
                  {e.eleito ? <span className="selo eleito">Eleito</span> : <span className="selo segundo">2º turno</span>}
                </span>
                <span className="num">{votos(e.votos)}</span>
              </div>
            ))
          )}
        </section>
      ))}
    </>
  );
}

export default memo(Painel);
