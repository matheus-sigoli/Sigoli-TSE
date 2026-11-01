'use client';
import Link from 'next/link';
import { memo, useDeferredValue, useId, useMemo, useRef, useState } from 'react';
import { FAIXAS_LEGENDA, type Faixas } from '@/lib/cores';
import type { Malha, Regiao } from '@/lib/dados';
import { UFS, type Cargo, type Municipio } from '@/lib/dominio';
import type { Linha } from '@/lib/resultados';
import { semAcento, titulo } from '@/lib/formato';

interface Props {
  abr: string;
  cargo: Cargo;
  regiaoSelecionada: string | null;
  malha: Malha | null;
  regioes: Record<string, Regiao> | null;
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
}

const UFS_ORDENADAS = Object.entries(UFS).sort((a, b) => a[1].localeCompare(b[1], 'pt-BR'));

function Filtros(p: Props) {
  const idAbr = useId();
  const idReg = useId();

  // regiões presentes na malha da UF
  const opcoesRegiao = useMemo(() => {
    if (!p.malha || !p.regioes || p.abr === 'br' || p.abr === 'exterior') return null;
    const imediatas = new Set<string>(), intermediarias = new Set<string>();
    for (const f of p.malha.municipios.features) {
      const pr = f.properties as { rgi?: string; rgint?: string };
      if (pr.rgi) imediatas.add(pr.rgi);
      if (pr.rgint) intermediarias.add(pr.rgint);
    }
    const nome = (c: string) => p.regioes![c]?.nome ?? c;
    const ord = (s: Set<string>) => [...s].sort((a, b) => nome(a).localeCompare(nome(b), 'pt-BR')).map((c) => ({ c, nome: nome(c) }));
    return { imediatas: ord(imediatas), intermediarias: ord(intermediarias) };
  }, [p.malha, p.regioes, p.abr]);

  return (
    <aside className="filtros" aria-label="Filtros">
      <div>
        <Link href="/" className="marca" aria-label="Sigoli.TSE, página inicial">
          <b>Sigoli</b><span>.TSE</span>
        </Link>
        <p className="marca-sub">Eleições 2026, município por município</p>
      </div>

      <div className="campo">
        <label htmlFor={idAbr}>Onde</label>
        <select id={idAbr} className="select" value={p.abr} onChange={(e) => p.aoMudarAbrangencia(e.target.value)}>
          <option value="br">Brasil</option>
          {UFS_ORDENADAS.map(([uf, nome]) => <option key={uf} value={uf}>{nome}</option>)}
          {p.cargo.slug === 'presidente' ? <option value="exterior">Exterior</option> : null}
        </select>
      </div>

      {opcoesRegiao ? (
        <div className="campo">
          <label htmlFor={idReg}>Região</label>
          <select id={idReg} className="select" value={p.regiaoSelecionada ?? ''} onChange={(e) => p.aoMudarRegiao(e.target.value || null)}>
            <option value="">Estado inteiro</option>
            <optgroup label="Regiões intermediárias">
              {opcoesRegiao.intermediarias.map((r) => <option key={r.c} value={r.c}>{r.nome}</option>)}
            </optgroup>
            <optgroup label="Regiões imediatas">
              {opcoesRegiao.imediatas.map((r) => <option key={r.c} value={r.c}>{r.nome}</option>)}
            </optgroup>
          </select>
        </div>
      ) : null}

      {p.abr !== 'exterior' ? <Busca municipios={p.municipios} aoEscolher={p.aoEscolherMunicipio} /> : null}

      {p.legenda.length ? (
        <div className="campo legenda-bloco">
          <span className="campo-rotulo">{p.abr === 'exterior' ? (p.modoCalor ? '% de votos no país' : 'Vencedor no país') : p.modoCalor ? '% de votos no município' : 'Vencedor no município'}</span>
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

function Busca({ municipios, aoEscolher }: { municipios: Municipio[] | null; aoEscolher: (m: Municipio) => void }) {
  const id = useId();
  const [texto, setTexto] = useState('');
  const [aberta, setAberta] = useState(false);
  const [ativo, setAtivo] = useState(0);
  const termo = useDeferredValue(texto);
  const entrada = useRef<HTMLInputElement>(null);

  const indice = useMemo(
    () => (municipios ?? []).filter((m) => m.uf !== 'zz').map((m) => ({ m, chave: semAcento(m.nome) })),
    [municipios],
  );
  const achados = useMemo(() => {
    const q = semAcento(termo.trim());
    if (q.length < 2) return [];
    const comeca: Municipio[] = [], contem: Municipio[] = [];
    for (const { m, chave } of indice) {
      if (chave.startsWith(q)) comeca.push(m);
      else if (chave.includes(q)) contem.push(m);
      if (comeca.length >= 8) break;
    }
    return [...comeca, ...contem].slice(0, 8);
  }, [termo, indice]);

  const escolher = (m: Municipio) => {
    aoEscolher(m);
    setTexto('');
    setAberta(false);
    entrada.current?.blur();
  };

  return (
    <div className="campo busca">
      <label htmlFor={id}>Buscar município</label>
      <input
        ref={entrada}
        id={id}
        className="entrada"
        type="search"
        placeholder="Ex.: Campinas"
        autoComplete="off"
        role="combobox"
        aria-expanded={aberta && achados.length > 0}
        aria-controls={`${id}-lista`}
        aria-activedescendant={achados[ativo] ? `${id}-${achados[ativo].ibge}` : undefined}
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
        <ul className="busca-lista" id={`${id}-lista`} role="listbox" aria-label="Municípios encontrados">
          {achados.map((m, i) => (
            <li
              key={m.ibge}
              id={`${id}-${m.ibge}`}
              role="option"
              aria-selected={i === ativo}
              onMouseDown={(e) => { e.preventDefault(); escolher(m); }}
            >
              <span>{titulo(m.nome)}</span>
              <small>{m.uf.toUpperCase()}</small>
            </li>
          ))}
        </ul>
      ) : aberta && termo.trim().length >= 2 && municipios ? (
        <ul className="busca-lista" role="listbox" aria-label="Municípios encontrados">
          <li aria-disabled="true"><span>Nenhum município com esse nome</span></li>
        </ul>
      ) : null}
    </div>
  );
}

export default memo(Filtros);
