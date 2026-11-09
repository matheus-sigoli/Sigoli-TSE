import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import paleta from '@config/paleta-partidos.json';
import { ELEICOES } from '@/lib/anos';
import type { ArquivoResultado, ArquivoResumo } from '@/lib/dominio';
import { pct, titulo, votos } from '@/lib/formato';
import './inicio.css';

export const metadata: Metadata = {
  title: { absolute: 'Sigoli.TSE — Eleições 2026, município por município' },
  description:
    'Entenda como funcionam as eleições brasileiras e veja o resultado de 2026 para Presidente, Governador, Senador e Deputados em cada município, com dados oficiais do TSE.',
};

// Lido no build (página estática): números sempre iguais aos arquivos publicados.
const ler = <T,>(rel: string): T => JSON.parse(readFileSync(join(process.cwd(), 'public/data/2026', rel), 'utf8')) as T;

function numeros() {
  const p1 = ler<ArquivoResultado>('presidente/1/br.json');
  const p2 = ler<ArquivoResultado>('presidente/2/br.json');
  const dep = ler<ArquivoResumo>('deputado-federal/1/br.json');
  const gov = ler<ArquivoResumo>('governador/1/br.json');
  const sen = ler<ArquivoResumo>('senador/1/br.json');

  const segundo = p2.cands.map((c, i) => ({ ...c, votos: p2.total.c[i], pct: p2.total.c[i] / p2.total.t[3] }));
  const primeiro = p1.cands.slice(0, 5).map((c, i) => ({ ...c, votos: p1.total.c[i], pct: p1.total.c[i] / p1.total.t[3] }));
  const contar = (r: ArquivoResumo) => {
    const m = new Map<string, number>();
    for (const l of Object.values(r.eleitos)) for (const e of l) if (e.eleito) m.set(e.partido, (m.get(e.partido) ?? 0) + 1);
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  };
  const vencedoresMun = new Map<string, number>();
  for (const r of Object.values(p2.mun)) {
    let i = 0;
    r.c.forEach((v, k) => { if (v > r.c[i]) i = k; });
    if (r.t[3]) vencedoresMun.set(p2.cands[i].nome, (vencedoresMun.get(p2.cands[i].nome) ?? 0) + 1);
  }
  const ufs2t = Object.keys(ler<ArquivoResumo>('governador/2/br.json').eleitos).length;
  return {
    segundo, primeiro, vencedoresMun,
    comparecimento2: p2.total.t[1] / p2.total.t[0],
    eleitorado: p2.total.t[0],
    camara: contar(dep),
    governadores1t: Object.values(gov.eleitos).filter((l) => l.some((e) => e.eleito)).length,
    ufs2t,
    senadores: contar(sen).reduce((s, [, n]) => s + n, 0),
    municipios: Object.keys(p2.mun).length,
  };
}

const corDe = (sigla: string) =>
  paleta.partidos.find((p) => p.sigla.toUpperCase() === sigla.toUpperCase() || (sigla === 'PODE' && p.sigla === 'PODE'))?.principal['50'] ?? '#888';

const CARGOS = [
  {
    slug: 'presidente',
    nome: 'Presidente',
    regra: 'Maioria absoluta dos votos válidos. Se ninguém passar de 50%, os dois mais votados disputam o 2º turno.',
    mandato: '4 anos',
    vagas: '1 vaga, eleita pelo país inteiro',
  },
  {
    slug: 'governador',
    nome: 'Governador',
    regra: 'Mesma regra do Presidente, dentro de cada estado e do Distrito Federal.',
    mandato: '4 anos',
    vagas: '27 vagas, uma por estado e DF',
  },
  {
    slug: 'senador',
    nome: 'Senador',
    regra: 'Vencem os mais votados, sem 2º turno. Em 2026 cada eleitor votou em dois nomes, porque o Senado renovou dois terços.',
    mandato: '8 anos',
    vagas: '54 vagas, duas por estado e DF',
  },
  {
    slug: 'deputado-federal',
    nome: 'Deputado Federal',
    regra: 'Sistema proporcional: as cadeiras vão primeiro para partidos e federações, conforme os votos de todos os seus candidatos e de legenda; depois, para os mais votados de cada lista.',
    mandato: '4 anos',
    vagas: '513 vagas, divididas entre os estados',
  },
  {
    slug: 'deputado-estadual',
    nome: 'Deputado Estadual',
    regra: 'Mesmo sistema proporcional, para as Assembleias Legislativas. No DF o cargo se chama Deputado Distrital.',
    mandato: '4 anos',
    vagas: '1.059 vagas nas 27 assembleias',
  },
];

export default function Inicio() {
  const n = numeros();
  const [v, d] = n.segundo;
  const faixas = paleta.partidos.find((p) => p.sigla === v.partido)?.principal ?? {};
  return (
    <div className="inicio">
      <header className="inicio-topo">
        <Link href="/" className="marca" aria-label="Sigoli.TSE, página inicial">
          <b>Sigoli</b><span>.TSE</span>
        </Link>
        <nav aria-label="Principal">
          <a href="#como-funciona">Como funciona</a>
          <a href="#como-ler">Como ler o mapa</a>
          <a href="#outros-anos">Outros anos</a>
          <Link href="/2026/br/presidente?t=2" className="botao">Abrir o mapa</Link>
        </nav>
      </header>

      <main>
        <section className="abertura">
          <div className="abertura-texto">
            <p className="abertura-data">Eleições gerais de 4 e 25 de outubro de 2026</p>
            <h1>O voto de cada município do Brasil, num mapa só.</h1>
            <p className="abertura-lead">
              Resultados oficiais do TSE para Presidente, Governador, Senador e Deputados, dos {votos(n.municipios)} municípios
              até cada zona eleitoral e bairro.
            </p>
            <div className="acoes">
              <Link href="/2026/br/presidente?t=2" className="botao grande">Ver o mapa do 2º turno</Link>
              <Link href="/2026/br/governador" className="link-secundario">Governadores eleitos</Link>
            </div>
          </div>
          <figure className="abertura-mapa">
            <Image
              src="/mapa-2turno.webp"
              alt={`Mapa do Brasil por município no 2º turno para Presidente: em vermelho onde ${titulo(v.nome)} venceu, em azul onde ${titulo(d.nome)} venceu.`}
              width={1100}
              height={951}
              priority
            />
            <figcaption>
              Presidente, 2º turno. Cada município na cor de quem venceu ali; quanto mais escuro, maior a vantagem.
            </figcaption>
          </figure>
        </section>

        <section className="resultado" aria-labelledby="t-resultado">
          <h2 id="t-resultado">O resultado de 2026</h2>
          <div className="placar">
            {[v, d].map((c) => (
              <div key={c.id} className="placar-lado" style={{ '--cor': corDe(c.partido) } as React.CSSProperties}>
                <span className="placar-num num">{c.n}</span>
                <div>
                  <p className="placar-nome">{titulo(c.nome)} <span>({c.partido})</span></p>
                  <p className="placar-pct num">{pct(c.pct, 2)}</p>
                  <p className="placar-votos">
                    {votos(c.votos)} votos, venceu em {votos(n.vencedoresMun.get(c.nome) ?? 0)} municípios
                  </p>
                </div>
              </div>
            ))}
            <div className="placar-barra" aria-hidden>
              <i style={{ width: `${v.pct * 100}%`, background: corDe(v.partido) }} />
              <i style={{ width: `${d.pct * 100}%`, background: corDe(d.partido) }} />
            </div>
          </div>
          <dl className="fatos">
            <div><dt>Eleitorado</dt><dd className="num">{votos(n.eleitorado)}</dd></div>
            <div><dt>Comparecimento no 2º turno</dt><dd className="num">{pct(n.comparecimento2)}</dd></div>
            <div><dt>Governadores eleitos no 1º turno</dt><dd className="num">{n.governadores1t} de 27</dd></div>
            <div><dt>Estados com 2º turno para governador</dt><dd className="num">{n.ufs2t}</dd></div>
          </dl>

          <h3>Nova Câmara dos Deputados</h3>
          <div className="camara" role="img" aria-label={`Composição da Câmara: ${n.camara.map(([p, q]) => `${p} ${q}`).join(', ')}`}>
            {n.camara.map(([p, q]) => (
              <i key={p} style={{ flexGrow: q, background: corDe(p) }} title={`${p}: ${q}`} />
            ))}
          </div>
          <ul className="camara-legenda">
            {n.camara.slice(0, 10).map(([p, q]) => (
              <li key={p}><i style={{ background: corDe(p) }} />{p} <b className="num">{q}</b></li>
            ))}
            <li className="mudo">e mais {n.camara.length - 10} partidos</li>
          </ul>
        </section>

        <section id="como-funciona" className="funciona" aria-labelledby="t-funciona">
          <h2 id="t-funciona">Como funciona a eleição</h2>
          <p className="intro">
            Em outubro de 2026 o Brasil escolheu, de uma vez, cinco cargos. O voto é obrigatório entre 18 e 70 anos e
            facultativo aos 16 e 17, acima dos 70 e para quem não sabe ler. Brancos e nulos não entram na conta: os percentuais
            oficiais são calculados sobre os votos válidos.
          </p>
          <ol className="cargos">
            {CARGOS.map((c) => (
              <li key={c.slug}>
                <h3>{c.nome}</h3>
                <p>{c.regra}</p>
                <p className="cargo-meta">{c.vagas}, mandato de {c.mandato}</p>
                <Link href={`/2026/br/${c.slug}`}>Ver no mapa</Link>
              </li>
            ))}
          </ol>
        </section>

        <section id="como-ler" className="ler" aria-labelledby="t-ler">
          <h2 id="t-ler">Como ler o mapa</h2>
          <div className="ler-grade">
            <div>
              <h3>A cor é de quem venceu</h3>
              <p>
                Cada partido tem uma cor fixa. Nos cargos de deputado, a cor é do partido mais votado no lugar, somando
                candidatos e votos de legenda.
              </p>
            </div>
            <div>
              <h3>O tom é o tamanho da vitória</h3>
              <div className="escala-inicio" aria-hidden>
                {['10', '20', '30', '40', '50', '60', '70', '80', '90', '100'].map((k) => <i key={k} style={{ background: (faixas as Record<string, string>)[k] }} />)}
              </div>
              <p className="escala-rotulos-inicio"><span>10%</span><span>50%</span><span>100%</span></p>
              <p>Tom claro é disputa apertada; tom escuro, vitória larga.</p>
            </div>
            <div>
              <h3>Clique para aprofundar</h3>
              <p>
                Clique num nome para ver onde ele foi mais votado. Clique num município para abrir o resultado dele. Troque o
                nível para zonas eleitorais ou para os bairros de uma cidade.
              </p>
            </div>
          </div>
          <Link href="/2026/br/presidente" className="botao grande">Abrir o mapa</Link>
        </section>

        <section id="outros-anos" className="anos" aria-labelledby="t-anos">
          <h2 id="t-anos">Outras eleições</h2>
          <p className="intro">
            O mesmo mapa, município por município, para as eleições gerais anteriores. Os anos chegam aos poucos, com os
            dados oficiais do TSE de cada um.
          </p>
          <ul className="anos-lista">
            {ELEICOES.map((e) => (
              <li key={e.ano} className="ano" data-disponivel={e.disponivel}>
                {e.disponivel && e.rota ? (
                  <Link href={e.rota} className="ano-cartao">
                    <span className="ano-num num">{e.ano}</span>
                    <span className="ano-titulo">{e.titulo}</span>
                    <span className="ano-meta">{e.datas} · {e.cargos}</span>
                    <span className="ano-selo">Ver o mapa</span>
                  </Link>
                ) : (
                  <div className="ano-cartao" aria-disabled="true">
                    <span className="ano-num num">{e.ano}</span>
                    <span className="ano-titulo">{e.titulo}</span>
                    <span className="ano-meta">{e.datas} · {e.cargos}</span>
                    <span className="ano-selo">Em breve</span>
                  </div>
                )}
              </li>
            ))}
          </ul>
        </section>
      </main>

      <section className="autor" aria-labelledby="t-autor">
        <img src="/autor.webp" alt="Matheus Sigoli" width={160} height={160} className="autor-foto" loading="lazy" />
        <div>
          <p className="autor-rotulo">Quem fez</p>
          <h2 id="t-autor">Matheus Sigoli</h2>
          <p>
            O Sigoli.TSE é um projeto independente de Matheus Sigoli: os resultados oficiais do TSE em mapas, do Brasil inteiro até o
            local de votação. O código está aberto no GitHub.
          </p>
          <a href="https://github.com/matheus-sigoli/Sigoli-TSE" target="_blank" rel="noreferrer" className="link-secundario">
            Ver o projeto no GitHub
          </a>
        </div>
      </section>

      <footer className="inicio-rodape">
        <p>
          Dados: <a href="https://resultados.tse.jus.br" target="_blank" rel="noreferrer">TSE, resultados oficiais</a> e{' '}
          <a href="https://dadosabertos.tse.jus.br" target="_blank" rel="noreferrer">Portal de Dados Abertos do TSE</a>. Malha municipal:
          IBGE 2025. Projeto independente, sem vínculo com o TSE.
        </p>
      </footer>
    </div>
  );
}
