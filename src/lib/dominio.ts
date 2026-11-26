/** Vocabulário do Sigoli.TSE — ver CONTEXT.md. */
import SEGUNDO_TURNO_2024 from './segundo-turno-prefeito-2024.json';

export type CargoSlug = 'presidente' | 'vice-presidente' | 'governador' | 'senador' | 'deputado-federal' | 'deputado-estadual' | 'prefeito' | 'vereador' | 'forma' | 'sistema' | 'camara' | 'regente';
export type Turno = 1 | 2;
export type TipoCargo = 'maj' | 'prop';

export interface Cargo {
  slug: CargoSlug;
  nome: string;
  curto: string;
  tipo: TipoCargo;
  turnos: Turno[];
  federal: boolean;
  /** eleição municipal: cada cidade tem a sua disputa (no estado, o município pinta com o partido mais votado) */
  municipal?: boolean;
  /** plebiscito (1993): pergunta com opções no lugar de candidatos */
  plebiscito?: boolean;
}

export const CARGOS: Cargo[] = [
  { slug: 'presidente', nome: 'Presidente', curto: 'Presidente', tipo: 'maj', turnos: [1, 2], federal: true },
  // República de 1946: o Vice-Presidente tinha eleição própria (1945–1960)
  { slug: 'vice-presidente', nome: 'Vice-Presidente', curto: 'Vice-Presidente', tipo: 'maj', turnos: [1], federal: true },
  { slug: 'governador', nome: 'Governador', curto: 'Governador', tipo: 'maj', turnos: [1, 2], federal: false },
  { slug: 'senador', nome: 'Senador', curto: 'Senador', tipo: 'maj', turnos: [1], federal: false },
  { slug: 'deputado-federal', nome: 'Deputado Federal', curto: 'Dep. Federal', tipo: 'prop', turnos: [1], federal: false },
  { slug: 'deputado-estadual', nome: 'Deputado Estadual', curto: 'Dep. Estadual', tipo: 'prop', turnos: [1], federal: false },
  { slug: 'prefeito', nome: 'Prefeito', curto: 'Prefeito', tipo: 'maj', turnos: [1, 2], federal: false, municipal: true },
  { slug: 'vereador', nome: 'Vereador', curto: 'Vereador', tipo: 'prop', turnos: [1], federal: false, municipal: true },
  // plebiscito de 21 de abril de 1993: as duas perguntas são os "cargos" e as opções, os "candidatos"
  { slug: 'forma', nome: 'Forma de governo', curto: 'Forma de governo', tipo: 'maj', turnos: [1], federal: true, plebiscito: true },
  { slug: 'sistema', nome: 'Sistema de governo', curto: 'Sistema de governo', tipo: 'maj', turnos: [1], federal: true, plebiscito: true },
  // Império (1884, 1886): eleições para a Câmara dos Deputados, só os votos por partido em cada província
  // Império, 1835: eleição do Regente (Regência Una), votos por colégio eleitoral
  { slug: 'regente', nome: 'Regente do Império', curto: 'Regente', tipo: 'maj', turnos: [1], federal: true },
  { slug: 'camara', nome: 'Câmara dos Deputados (votos por partido)', curto: 'Câmara dos Deputados', tipo: 'maj', turnos: [1], federal: true, plebiscito: true },
];

/** cidades com 2º turno de Prefeito, por ano e UF (public/data/{ano}/segundo-turno.json, scripts/municipal-tse.mjs) */
export const SEGUNDO_TURNO_PREFEITO: Record<number, Record<string, string[]>> = { 2024: SEGUNDO_TURNO_2024 };

export const cargoPorSlug = (s: string) => CARGOS.find((c) => c.slug === s);

/** UFs que tiveram 2º turno para governador, por ano (2026: config 6260 do TSE; 2022: resultado oficial). */
export const UFS_2T_GOVERNADOR: Record<number, string[]> = {
  2026: ['ac', 'am', 'df', 'es', 'rn', 'to'],
  // 1990: só os estados que já estão no acervo
  1990: ['ac', 'al', 'ap', 'es', 'ma', 'mg', 'pa', 'rn', 'rs', 'sp'],
  2022: ['al', 'am', 'ba', 'es', 'ms', 'pb', 'pe', 'ro', 'rs', 'sc', 'se', 'sp'],
  2018: ['am', 'ap', 'df', 'mg', 'ms', 'pa', 'rj', 'rn', 'ro', 'rr', 'rs', 'sc', 'se', 'sp'],
  2014: ['ac', 'am', 'ap', 'ce', 'df', 'go', 'ms', 'pa', 'pb', 'rj', 'rn', 'ro', 'rr', 'rs'],
  2010: ['al', 'ap', 'df', 'go', 'pa', 'pb', 'pi', 'ro', 'rr'],
  2006: ['go', 'ma', 'pa', 'pb', 'pe', 'pr', 'rj', 'rn', 'rs', 'sc'],
  1994: ['ac', 'ap', 'ba', 'df', 'es', 'go', 'ma', 'mg', 'pa', 'pb', 'pi', 'rj', 'ro', 'rr', 'rs', 'sc', 'se', 'sp'],
  1998: ['ap', 'df', 'go', 'mg', 'ms', 'pa', 'pi', 'rj', 'ro', 'rr', 'rs', 'se', 'sp'],
  2002: ['ap', 'ce', 'df', 'ms', 'pa', 'pb', 'pr', 'rn', 'ro', 'rr', 'rs', 'sc', 'se', 'sp'],
};

export const UFS: Record<string, string> = {
  ac: 'Acre', al: 'Alagoas', ap: 'Amapá', am: 'Amazonas', ba: 'Bahia', ce: 'Ceará',
  df: 'Distrito Federal', es: 'Espírito Santo', go: 'Goiás', ma: 'Maranhão', mt: 'Mato Grosso',
  ms: 'Mato Grosso do Sul', mg: 'Minas Gerais', pa: 'Pará', pb: 'Paraíba', pr: 'Paraná',
  pe: 'Pernambuco', pi: 'Piauí', rj: 'Rio de Janeiro', rn: 'Rio Grande do Norte',
  rs: 'Rio Grande do Sul', ro: 'Rondônia', rr: 'Roraima', sc: 'Santa Catarina',
  sp: 'São Paulo', se: 'Sergipe', to: 'Tocantins',
};

/** Abrangência da tela: Brasil, uma UF ou o exterior. */
export type Abrangencia = 'br' | 'exterior' | keyof typeof UFS;

export const nomeAbrangencia = (abr: string) =>
  abr === 'br' ? 'Brasil' : abr === 'exterior' ? 'Exterior' : UFS[abr] ?? abr.toUpperCase();

export const abrangenciaValida = (abr: string, cargo: Cargo) =>
  abr === 'br' || (abr === 'exterior' ? cargo.slug === 'presidente' : abr in UFS && !(cargo.municipal && abr === 'df'));
/** o DF não tem eleição municipal (nem Prefeito nem Vereador) */

export const turnoDisponivel = (cargo: Cargo, abr: string, turno: Turno, ano = 2026, cid?: string | null) => {
  if (!cargo.turnos.includes(turno)) return false;
  if (turno === 2 && cargo.slug === 'prefeito') {
    const porUf = SEGUNDO_TURNO_PREFEITO[ano] ?? {};
    if (abr === 'br') return Object.keys(porUf).length > 0;
    return cid ? (porUf[abr] ?? []).includes(cid) : (porUf[abr] ?? []).length > 0;
  }
  // 2º turno só existe desde a Constituição de 1988 (República de 1946 e ditadura: turno único)
  if (turno === 2 && ano < 1989) return false;
  if (turno === 2 && cargo.slug === 'governador' && abr !== 'br') return (UFS_2T_GOVERNADOR[ano] ?? []).includes(abr);
  // 1994 e 1998: Fernando Henrique eleito no 1º turno, sem 2º turno de Presidente
  if (turno === 2 && cargo.slug === 'presidente' && (ano === 1998 || ano === 1994)) return false;
  return true;
};

export const rotaDe = (abr: string, cargo: CargoSlug, ano = 2026) => `/${ano}/${abr}/${cargo}`;

// ------------------------------------------------------------------ arquivos de dados (ADR 0007)
/** [eleitorado, comparecimento, abstenção, válidos, brancos, nulos] */
export type Totais = [number, number, number, number, number, number];

export interface Candidato {
  id: string;
  n: string;
  nome: string;
  partido: string;
  eleito: boolean;
  situacao: string;
  /** vice (tipo 'v') ou suplentes de senador ('s1', 's2') */
  vices?: { tipo: string; nome: string; partido: string }[];
  /** destinação do voto quando NÃO é válido (ex.: "Anulado sub judice"): votos não contam */
  anulado?: string;
  /** coligação (nome) e composição, quando houver */
  col?: string;
  comp?: string;
  /** eleição municipal: código IBGE (e TSE) da cidade do candidato */
  mun?: string;
  tse?: string;
}

export interface Partido {
  sg: string;
  n: string;
  fed?: string;
  col?: string;
}

export interface RegistroMunicipio {
  t: Totais;
  /** Majoritário: votos por candidato (denso). Proporcional: [idx, votos, idx, votos...] */
  c: number[];
  /** Proporcional: votos por partido (nominais + legenda). */
  p?: number[];
}

export interface ArquivoResultado {
  v: 1;
  cargo: CargoSlug;
  turno: Turno;
  abr: string;
  tipo: TipoCargo;
  vagas: number;
  atualizado: string;
  cands: Candidato[];
  partidos: Partido[];
  total: { t: Totais; c: number[]; p: number[] };
  /** quem vence ao menos uma área em algum nível (scripts/pintam.mjs, ADR 0014) */
  pintam?: { c: number[]; p: number[] };
  mun: Record<string, RegistroMunicipio>;
  /** eleições antigas do acervo (scripts/historico.py): só os votos válidos, sem eleitorado, brancos e nulos */
  semTotais?: boolean;
  /** de onde vieram os resultados, quando não é o TSE (ex.: PDF do TRE; scripts/tre.py) */
  fonte?: string;
  /** proporcional sem voto de legenda na fonte: o total do partido é só a soma dos nominais */
  semLegenda?: boolean;
  /** Senado com duas vagas: cada votante deu dois votos (brancos e nulos contam por voto) */
  votosPorEleitor?: number;
  /** total do estado tirado do resultado final oficial (os municípios do mapa podem estar incompletos; scripts/oficial.py) */
  oficial?: { fonte: string; municipios: number };
  /** eleição municipal: no arquivo da UF, candidatos de todas as cidades (cada um com `mun`); no da cidade, só os dela */
  municipal?: boolean;
  /** arquivo da cidade (eleição municipal): UF da cidade */
  uf?: string;
  /** eleições antigas: município sem resultado neste cargo que votou junto com outro (mesma zona) → de quem é o resultado
   *  (scripts/juntos.py; o "z" da malha vale para todos os cargos do ano, este só para o cargo do arquivo) */
  juntos?: Record<string, string>;
  resumo?: undefined;
}

export interface EleitoResumo {
  nome: string;
  partido: string;
  n: string;
  votos: number;
  eleito: boolean;
  situacao: string;
}

/** Visão Brasil de cargos estaduais: vencedor por município + eleitos por UF. */
export interface ArquivoResumo {
  v: 1;
  cargo: CargoSlug;
  turno: Turno;
  abr: 'br';
  tipo: TipoCargo;
  resumo: true;
  partidos: string[];
  total: { t: Totais };
  eleitos: Record<string, EleitoResumo[]>;
  /** ibge → [índice do partido, pct × 1000, nome do vencedor] */
  mun: Record<string, [number, number, string]>;
  /** eleição municipal: prefeitos ou vereadores eleitos por partido (no lugar da lista de eleitos por UF) */
  municipal?: boolean;
  bancadas?: [string, number][];
  /** (como no ArquivoResultado) */
  juntos?: Record<string, string>;
}

export type Arquivo = ArquivoResultado | ArquivoResumo;

export interface Municipio {
  tse: string;
  ibge: string;
  nome: string;
  uf: string;
  capital?: boolean;
  pais?: string;
  paisNum?: string;
  nomePais?: string;
}
