/** Vocabulário do Sigoli.TSE — ver CONTEXT.md. */

export type CargoSlug = 'presidente' | 'governador' | 'senador' | 'deputado-federal' | 'deputado-estadual';
export type Turno = 1 | 2;
export type TipoCargo = 'maj' | 'prop';

export interface Cargo {
  slug: CargoSlug;
  nome: string;
  curto: string;
  tipo: TipoCargo;
  turnos: Turno[];
  federal: boolean;
}

export const CARGOS: Cargo[] = [
  { slug: 'presidente', nome: 'Presidente', curto: 'Presidente', tipo: 'maj', turnos: [1, 2], federal: true },
  { slug: 'governador', nome: 'Governador', curto: 'Governador', tipo: 'maj', turnos: [1, 2], federal: false },
  { slug: 'senador', nome: 'Senador', curto: 'Senador', tipo: 'maj', turnos: [1], federal: false },
  { slug: 'deputado-federal', nome: 'Deputado Federal', curto: 'Dep. Federal', tipo: 'prop', turnos: [1], federal: false },
  { slug: 'deputado-estadual', nome: 'Deputado Estadual', curto: 'Dep. Estadual', tipo: 'prop', turnos: [1], federal: false },
];

export const cargoPorSlug = (s: string) => CARGOS.find((c) => c.slug === s);

/** UFs que tiveram 2º turno para governador, por ano (2026: config 6260 do TSE; 2022: resultado oficial). */
export const UFS_2T_GOVERNADOR: Record<number, string[]> = {
  2026: ['ac', 'am', 'df', 'es', 'rn', 'to'],
  2022: ['al', 'am', 'ba', 'es', 'ms', 'pb', 'pe', 'ro', 'rs', 'sc', 'se', 'sp'],
  2018: ['am', 'ap', 'df', 'mg', 'ms', 'pa', 'rj', 'rn', 'ro', 'rr', 'rs', 'sc', 'se', 'sp'],
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
  abr === 'br' || (abr === 'exterior' ? cargo.slug === 'presidente' : abr in UFS);

export const turnoDisponivel = (cargo: Cargo, abr: string, turno: Turno, ano = 2026) => {
  if (!cargo.turnos.includes(turno)) return false;
  if (turno === 2 && cargo.slug === 'governador' && abr !== 'br') return (UFS_2T_GOVERNADOR[ano] ?? []).includes(abr);
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
