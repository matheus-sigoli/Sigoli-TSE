'use client';
import Link from 'next/link';
import { memo, useDeferredValue, useEffect, useId, useMemo, useRef, useState } from 'react';
import { FAIXAS_LEGENDA, type Faixas } from '@/lib/cores';
import type { Local, Malha, Nivel, Regioes, TipoRegiao } from '@/lib/dados';
import { CONTINENTES, REGIOES_PAIS, continentesDe, regioesDoPais } from '@/lib/dados';
import { UFS, type Cargo, type Municipio } from '@/lib/dominio';
import type { Linha } from '@/lib/resultados';
import { semAcento, titulo } from '@/lib/formato';
import { ELEICOES, temLocais, temZonas } from '@/lib/anos';

interface Props {
  ano: number;
  /** link para o mesmo mapa em outro ano */
  hrefAno: (ano: number) => string;
  abr: string;
  cargo: Cargo;
  regiaoSelecionada: string | null;
  /** no Brasil, com resultado por município: mostra as grandes regiões */
  regioesPais?: boolean;
  malha: Malha | null;
  regioes: Regioes | null;
  municipios: Municipio[] | null;
  legenda: { rotulo: string; faixas: Faixas }[];
  modoCalor: boolean;
  escalaFoco: Linha | null;
  tema: 'escuro' | 'claro';
  daltonico: boolean;
  aoMudarAbrangencia: (abr: string) => void;
  aoMudarRegiao: (reg: string | null) => void;
  aoEscolherMunicipio: (m: Municipio) => void;
  aoAlternarTema: () => void;
  aoAlternarDaltonico: () => void;
  nivel: Nivel;
  /** nome da cidade aberta (visão da cidade) */
  cidade: string | null;
  /** ausente quando a UF é uma cidade só (DF): não há estado para voltar */
  aoFecharCidade?: () => void;
  aoMudarNivel: (n: Nivel) => void;
  /** locais de votação da cidade aberta ou da região vista por locais (busca por local) */
  locaisDaCidade: Local[] | null;
  aoEscolherLocal: (id: string) => void;
}

const NIVEIS_ESTADO: { n: Nivel; rotulo: string }[] = [
  { n: 'municipios', rotulo: 'Municípios' },
  { n: 'zonas', rotulo: 'Zonas' },
];
const NIVEIS_CIDADE: { n: Nivel; rotulo: string }[] = [
  { n: 'zonas', rotulo: 'Zonas' },
  { n: 'bairros', rotulo: 'Bairros' },
  { n: 'locais', rotulo: 'Locais' },
];
/** com uma micro ou mesorregião escolhida, o estado também pode ser visto por locais de votação da região */
const NIVEIS_REGIAO: { n: Nivel; rotulo: string }[] = [...NIVEIS_ESTADO, { n: 'locais', rotulo: 'Locais' }];
const DICA_CIDADE: Record<string, string> = {
  zonas: 'Zonas eleitorais dentro da cidade. Clique numa zona para ver o resultado dela.',
  bairros: 'Bairros com área vêm do IBGE; os demais, do cadastro do TSE, aparecem como círculos.',
  locais: 'Cada área é a região atendida por um local de votação (Atlas Eleitoral 2026). Clique para ver o resultado dele.',
};
const UNIDADE: Record<Nivel, string> = { municipios: 'no município', zonas: 'na zona', bairros: 'no bairro', locais: 'no local' };

const ANOS_NO_AR = ELEICOES.filter((e) => e.disponivel).map((e) => e.ano);
const UFS_ORDENADAS = Object.entries(UFS).sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'));

function Filtros(p: Props) {
  const idAbr = useId();
  const idReg = useId();
  const itensMunicipios = useMemo<ItemBusca[] | null>(
    () => p.municipios?.filter((m) => m.uf !== 'zz').map((m) => ({ id: m.ibge, nome: titulo(m.nome), detalhe: m.uf.toUpperCase(), chave: semAcento(m.nome), uf: m.uf })) ?? null,
    [p.municipios],
  );
  const itensLocais = useMemo<ItemBusca[] | null>(
    () => p.locaisDaCidade?.map((l) => ({
      id: l.id,
      nome: titulo(l.nome),
      detalhe: `Zona ${l.zona}${l.bairro ? ` · ${titulo(l.bairro)}` : ''}`,
      chave: semAcento(l.nome),
      extra: semAcento(l.bairro),
    })) ?? null,
    [p.locaisDaCidade],
  );

  // as quatro divisões do IBGE presentes na malha da UF
  const opcoesRegiao = useMemo(() => {
    if (!p.malha || !p.regioes || p.abr === 'br' || p.abr === 'exterior') return null;
    const { regioes, municipios } = p.regioes;
    const por: Record<TipoRegiao, Set<string>> = { meso: new Set(), micro: new Set(), intermediaria: new Set(), imediata: new Set() };
    for (const f of p.malha.municipios.features) {
      for (const c of municipios[String((f.properties as { id?: string } | null)?.id ?? f.id)] ?? []) {
        const r = regioes[c];
        if (!r) continue;
        por[r.tipo].add(c);
        if (r.pai && regioes[r.pai]) por[regioes[r.pai].tipo].add(r.pai);
      }
    }
    if (!por.micro.size && !por.imediata.size) return null;
    const nome = (c: string) => regioes[c]?.nome ?? c;
    const ord = (s: Set<string>) => [...s].sort((a, b) => nome(a).localeCompare(nome(b), 'pt-BR')).map((c) => ({ c, nome: nome(c) }));
    return { mesos: ord(por.meso), micros: ord(por.micro), intermediarias: ord(por.intermediaria), imediatas: ord(por.imediata) };
  }, [p.malha, p.regioes, p.abr]);
  // no Brasil: grandes regiões, uma ou várias (ex.: Sul e Sudeste)
  // no exterior: continentes e regiões do mundo, do mesmo jeito
  const exterior = p.abr === 'exterior';
  const gruposRegiao: { s: string; nome: string }[] = exterior ? CONTINENTES : REGIOES_PAIS;
  const pais: { s: string }[] | null = exterior ? continentesDe(p.regiaoSelecionada) : regioesDoPais(p.regiaoSelecionada);
  const alternarRegiaoPais = (s: string) => {
    const atual = new Set(pais?.map((r) => r.s) ?? []);
    if (atual.has(s)) atual.delete(s); else atual.add(s);
    const l = gruposRegiao.filter((r) => atual.has(r.s)).map((r) => r.s);
    p.aoMudarRegiao(l.length && l.length < gruposRegiao.length ? l.join(',') : null);
  };
  const comRegiao = !!p.regiaoSelecionada && !p.cidade && temLocais(p.ano);

  return (
    <aside className="filtros" aria-label="Filtros">
      <div className="bloco-marca">
        <Link href="/" className="marca" aria-label="Sigoli.TSE, página inicial">
          <b>Sigoli</b><span>.TSE</span>
        </Link>
        <p className="marca-sub">Eleições {p.ano}, município por município</p>
      </div>

      {ANOS_NO_AR.length > 1 ? (
        <div className="campo campo-ano">
          <span className="campo-rotulo" id="rot-ano">Eleição</span>
          <div className="segmentado anos" role="group" aria-labelledby="rot-ano">
            {ANOS_NO_AR.map((a) => (
              <Link key={a} href={p.hrefAno(a)} aria-current={a === p.ano ? 'page' : undefined} scroll={false} prefetch={false}>{a}</Link>
            ))}
          </div>
        </div>
      ) : null}

      <div className="campo campo-onde">
        <label htmlFor={idAbr}>Onde</label>
        <select id={idAbr} className="select" value={p.abr} onChange={(e) => p.aoMudarAbrangencia(e.target.value)}>
          <option value="br">Brasil</option>
          {UFS_ORDENADAS.map(([uf, nome]) => <option key={uf} value={uf}>{nome}</option>)}
          {p.cargo.slug === 'presidente' ? <option value="exterior">Exterior</option> : null}
        </select>
      </div>

      {p.abr !== 'br' && p.abr !== 'exterior' && temZonas(p.ano, p.cargo.slug, p.abr) ? (
        <div className="campo campo-nivel">
          {p.cidade ? (
            <div className="cidade-aberta">
              <span className="campo-rotulo">Cidade</span>
              <strong>{p.cidade}</strong>
              {p.aoFecharCidade ? <button type="button" className="link-botao" onClick={p.aoFecharCidade}>Voltar ao estado</button> : null}
            </div>
          ) : null}
          <span className="campo-rotulo" id="rot-nivel">Ver por</span>
          <div className="segmentado nivel" role="group" aria-labelledby="rot-nivel">
            {(p.cidade ? NIVEIS_CIDADE.filter((x) => x.n === 'zonas' || temLocais(p.ano)) : comRegiao ? NIVEIS_REGIAO : NIVEIS_ESTADO).map(({ n, rotulo }) => (
              <button key={n} aria-pressed={p.nivel === n} onClick={() => p.aoMudarNivel(n)}>{rotulo}</button>
            ))}
          </div>
          <p className="marca-sub dica-nivel" style={{ marginTop: 6 }}>
            {p.cidade ? DICA_CIDADE[p.nivel]
              : comRegiao && p.nivel === 'locais' ? 'Todos os locais de votação da região num mapa só. Clique num local para ver o resultado dele.'
              : comRegiao ? 'Em Locais, a região inteira aparece por local de votação. Dois cliques num município abrem só ele.'
              : 'Dois cliques num município abrem as zonas, os bairros e os locais de votação dele.'}
            {' '}Shift + clique soma várias áreas.
          </p>
        </div>
      ) : null}

      {opcoesRegiao && (p.nivel === 'municipios' || p.nivel === 'locais') && !p.cidade ? (
        <div className="campo campo-regiao">
          <label htmlFor={idReg}>Região</label>
          <select id={idReg} className="select" value={p.regiaoSelecionada ?? ''} onChange={(e) => p.aoMudarRegiao(e.target.value || null)}>
            <option value="">Estado inteiro</option>
            <optgroup label="Mesorregiões">
              {opcoesRegiao.mesos.map((r) => <option key={r.c} value={r.c}>{r.nome}</option>)}
            </optgroup>
            <optgroup label="Microrregiões">
              {opcoesRegiao.micros.map((r) => <option key={r.c} value={r.c}>{r.nome}</option>)}
            </optgroup>
            <optgroup label="Regiões intermediárias">
              {opcoesRegiao.intermediarias.map((r) => <option key={r.c} value={r.c}>{r.nome}</option>)}
            </optgroup>
            <optgroup label="Regiões imediatas">
              {opcoesRegiao.imediatas.map((r) => <option key={r.c} value={r.c}>{r.nome}</option>)}
            </optgroup>
          </select>
        </div>
      ) : null}

      {p.regioesPais ? (
        <div className="campo campo-regiao-pais">
          <span className="campo-rotulo">{exterior ? 'Continentes e regiões' : 'Regiões do país'}</span>
          <div className="segmentado anos" role="group" aria-label={exterior ? 'Continentes e regiões' : 'Regiões do país'}>
            {gruposRegiao.map((r) => (
              <button key={r.s} type="button" aria-pressed={!!pais?.some((x) => x.s === r.s)} onClick={() => alternarRegiaoPais(r.s)}>
                {r.nome}
              </button>
            ))}
          </div>
          <p className="dica">{exterior ? 'Escolha um ou mais (ex.: Europa e América do Norte) para somar só eles.' : 'Escolha uma ou mais (ex.: Sul e Sudeste) para somar só elas.'}</p>
        </div>
      ) : null}

      {p.locaisDaCidade ? (
        <Busca
          rotulo="Buscar local de votação"
          placeholder="Nome da escola ou bairro"
          itens={itensLocais}
          vazio={p.cidade ? 'Nenhum local de votação com esse nome nesta cidade' : 'Nenhum local de votação com esse nome nesta região'}
          aoEscolher={p.aoEscolherLocal}
          classe="busca-local"
        />
      ) : null}

      {p.abr !== 'exterior' ? (
        <Busca
          rotulo="Buscar município"
          placeholder="Ex.: São Gonçalo RJ"
          itens={itensMunicipios}
          vazio="Nenhum município com esse nome"
          filtroUf
          classe="busca-municipio"
          aoEscolher={(ibge) => { const m = p.municipios?.find((x) => x.ibge === ibge); if (m) p.aoEscolherMunicipio(m); }}
        />
      ) : null}

      {p.legenda.length ? (
        <div className="campo legenda-bloco">
          <span className="campo-rotulo">{p.abr === 'exterior' ? (p.modoCalor ? '% de votos no país' : 'Vencedor no país') : p.modoCalor ? `% de votos ${UNIDADE[p.nivel]}` : `Vencedor ${UNIDADE[p.nivel]}`}</span>
          <div className="legenda">
            {(p.modoCalor ? p.legenda.slice(0, 0) : p.legenda).map((l) => (
              <div key={l.rotulo} className="legenda-item">
                <i style={{ background: l.faixas['50'] }} />
                <span>{l.rotulo.includes('(') ? titulo(l.rotulo.split(' (')[0]) + ' (' + l.rotulo.split(' (')[1] : l.rotulo}</span>
              </div>
            ))}
          </div>
          {p.modoCalor && p.escalaFoco ? (
            <div className="legenda-item"><i style={{ background: p.escalaFoco.faixas['50'] }} /><span>{p.escalaFoco.chave.startsWith('c') ? titulo(p.escalaFoco.nome) : p.escalaFoco.nome}</span></div>
          ) : null}
          {p.legenda[0] ? (
            <div>
              <div className="escala" aria-hidden>
                {FAIXAS_LEGENDA.map((k) => <i key={k} style={{ background: (p.modoCalor && p.escalaFoco ? p.escalaFoco.faixas : p.legenda[0].faixas)[k] }} />)}
              </div>
              <div className="escala-rotulos"><span>10%</span><span>50%</span><span>100%</span></div>
              <p className="marca-sub" style={{ marginTop: 6 }}>
                {p.modoCalor ? 'Quanto mais escuro, maior a votação.' : 'Tom mais escuro: vitória mais folgada.'}
              </p>
            </div>
          ) : null}
        </div>
      ) : null}

      <a className="autor-mini" href="/#t-autor">
        <img src="/autor-96.webp" alt="" width={32} height={32} />
        <span>por <strong>Matheus Sigoli</strong></span>
      </a>

      <div className="preferencias">
        <div className="alternador">
          <span id="rot-tema">Tema claro</span>
          <button role="switch" aria-checked={p.tema === 'claro'} aria-labelledby="rot-tema" onClick={p.aoAlternarTema} />
        </div>
        <div className="alternador">
          <span id="rot-dalt">Cores para daltonismo</span>
          <button role="switch" aria-checked={p.daltonico} aria-labelledby="rot-dalt" onClick={p.aoAlternarDaltonico} />
        </div>
      </div>
    </aside>
  );
}

interface ItemBusca { id: string; nome: string; detalhe: string; chave: string; /** texto extra que também casa (ex.: bairro) */ extra?: string; uf?: string }

const ordenarPorNome = (a: ItemBusca, b: ItemBusca) => a.nome.localeCompare(b.nome, 'pt-BR') || a.detalhe.localeCompare(b.detalhe, 'pt-BR');

/**
 * Campo de busca com lista rolável: exatos primeiro, depois os que começam com o termo, os que contêm
 * e, por fim, os que casam só pelo texto extra. Com `filtroUf`, a UF no fim filtra o estado ("sao goncalo rj").
 */
function Busca({ rotulo, placeholder, itens, vazio, filtroUf, aoEscolher, classe }: {
  rotulo: string; placeholder: string; itens: ItemBusca[] | null; vazio: string; filtroUf?: boolean; aoEscolher: (id: string) => void; classe?: string;
}) {
  const id = useId();
  const [texto, setTexto] = useState('');
  const [aberta, setAberta] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const termo = useDeferredValue(texto);
  const entrada = useRef<HTMLInputElement>(null);

  const achados = useMemo(() => {
    let q = semAcento(termo.trim());
    let uf: string | null = null;
    if (filtroUf) {
      const m = q.match(/^(.*\S)(?:\s+|\s*[-(,/]\s*)\(?([a-z]{2})\)?$/);
      if (m && m[2] in UFS && m[1].length >= 2) { q = m[1].replace(/[-(,/]\s*$/, '').trim(); uf = m[2]; }
    }
    if (q.length < 2) return [];
    const exato: ItemBusca[] = [], comeca: ItemBusca[] = [], contem: ItemBusca[] = [], pelaExtra: ItemBusca[] = [];
    for (const it of itens ?? []) {
      if (uf && it.uf !== uf) continue;
      if (it.chave === q) exato.push(it);
      else if (it.chave.startsWith(q)) comeca.push(it);
      else if (it.chave.includes(q)) contem.push(it);
      else if (it.extra?.includes(q)) pelaExtra.push(it);
    }
    return [...exato.sort(ordenarPorNome), ...comeca.sort(ordenarPorNome), ...contem.sort(ordenarPorNome), ...pelaExtra.sort(ordenarPorNome)].slice(0, 200);
  }, [termo, itens, filtroUf]);
  const lista = useRef<HTMLUListElement>(null);
  // setas do teclado: mantém a opção ativa visível na lista rolável
  useEffect(() => {
    lista.current?.querySelector('[aria-selected="true"]')?.scrollIntoView({ block: 'nearest' });
  }, [ativo]);

  const escolher = (it: ItemBusca) => {
    aoEscolher(it.id);
    setTexto('');
    setAberta(false);
    entrada.current?.blur();
  };

  return (
    <div className={`campo busca ${classe ?? ''}`}>
      <label htmlFor={id}>{rotulo}</label>
      <input
        ref={entrada}
        id={id}
        className="entrada"
        type="search"
        placeholder={placeholder}
        spellCheck={false}
        autoComplete="off"
        role="combobox"
        aria-expanded={aberta && achados.length > 0}
        aria-controls={`${id}-lista`}
        aria-activedescendant={achados[ativo] ? `${id}-${achados[ativo].id}` : undefined}
        value={texto}
        onChange={(e) => { setTexto(e.target.value); setAberta(true); setAtivo(0); }}
        onFocus={() => setAberta(true)}
        onBlur={() => setTimeout(() => setAberta(false), 120)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { e.preventDefault(); setAtivo((a) => Math.min(a + 1, achados.length - 1)); }
          else if (e.key === 'ArrowUp') { e.preventDefault(); setAtivo((a) => Math.max(a - 1, 0)); }
          else if (e.key === 'Enter' && achados[ativo]) { e.preventDefault(); escolher(achados[ativo]); }
          else if (e.key === 'Escape') setAberta(false);
        }}
      />
      {aberta && achados.length ? (
        <ul ref={lista} className="busca-lista" id={`${id}-lista`} role="listbox" aria-label={`${achados.length} resultados`}>
          {achados.map((it, i) => (
            <li
              key={it.id}
              id={`${id}-${it.id}`}
              role="option"
              aria-selected={i === ativo}
              onMouseDown={(e) => { e.preventDefault(); escolher(it); }}
            >
              <span>{it.nome}</span>
              <small>{it.detalhe}</small>
            </li>
          ))}
        </ul>
      ) : aberta && termo.trim().length >= 2 && itens ? (
        <ul className="busca-lista" role="listbox" aria-label="Nenhum resultado">
          <li aria-disabled="true"><span>{vazio}</span></li>
        </ul>
      ) : null}
    </div>
  );
}

export default memo(Filtros);
