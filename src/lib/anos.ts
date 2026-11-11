/**
 * Eleições do Sigoli.TSE. Para publicar um ano novo: gerar os dados em public/data/{ano}/,
 * criar as rotas /{ano}/... e marcar `disponivel: true` aqui (ver CONTEXT.md, "Outros anos").
 */
export interface Eleicao {
  ano: number;
  titulo: string;
  /** datas dos turnos, por extenso */
  datas: string;
  cargos: string;
  disponivel: boolean;
  /** destino do card quando disponível */
  rota?: string;
  /** sem locais de votação no TSE (1998): a cidade só tem a visão por zonas */
  semLocais?: boolean;
  /** sem Presidente por município nos dados abertos do TSE (1998) */
  semPresidente?: boolean;
  /** sem zona eleitoral nos dados do TSE (1994: NR_ZONA = -3): só a visão por municípios */
  semZonas?: boolean;
  /** só estes cargos (1989: eleição só de Presidente) */
  soCargos?: string[];
  /** de onde vêm os resultados, quando não é o TSE por município */
  fonte?: string;
}

export const ELEICOES: Eleicao[] = [
  {
    ano: 2026, titulo: 'Eleições Gerais 2026', datas: '4 e 25 de outubro',
    cargos: 'Presidente, Governador, Senador, Deputados', disponivel: true, rota: '/2026/br/presidente?t=2',
  },
  {
    ano: 2022, titulo: 'Eleições Gerais 2022', datas: '2 e 30 de outubro',
    cargos: 'Presidente, Governador, Senador, Deputados', disponivel: true, rota: '/2022/br/presidente?t=2',
  },
  {
    ano: 2018, titulo: 'Eleições Gerais 2018', datas: '7 e 28 de outubro',
    cargos: 'Presidente, Governador, Senador, Deputados', disponivel: true, rota: '/2018/br/presidente?t=2',
  },
  {
    ano: 2014, titulo: 'Eleições Gerais 2014', datas: '5 e 26 de outubro',
    cargos: 'Presidente, Governador, Senador, Deputados', disponivel: true, rota: '/2014/br/presidente?t=2',
  },
  {
    ano: 2010, titulo: 'Eleições Gerais 2010', datas: '3 e 31 de outubro',
    cargos: 'Presidente, Governador, Senador, Deputados', disponivel: true, rota: '/2010/br/presidente?t=2',
  },
  {
    ano: 2006, titulo: 'Eleições Gerais 2006', datas: '1º e 29 de outubro',
    cargos: 'Presidente, Governador, Senador, Deputados', disponivel: true, rota: '/2006/br/presidente?t=2',
  },
  {
    ano: 2002, titulo: 'Eleições Gerais 2002', datas: '6 e 27 de outubro',
    cargos: 'Presidente, Governador, Senador, Deputados', disponivel: true, rota: '/2002/br/presidente?t=2',
  },
  {
    ano: 1998, titulo: 'Eleições Gerais 1998', datas: '4 e 25 de outubro',
    cargos: 'Presidente, Governador, Senador, Deputados', disponivel: true, rota: '/1998/br/presidente', semLocais: true,
  },
  {
    ano: 1994, titulo: 'Eleições Gerais 1994', datas: '3 de outubro e 15 de novembro',
    cargos: 'Presidente, Governador, Senador, Deputados', disponivel: true, rota: '/1994/br/presidente', semLocais: true, semZonas: true,
  },
  {
    ano: 1989, titulo: 'Eleição Presidencial 1989', datas: '15 de novembro e 17 de dezembro',
    cargos: 'Presidente', disponivel: true, rota: '/1989/br/presidente?t=2', semLocais: true, semZonas: true, soCargos: ['presidente'],
    fonte: 'Geografia do Voto (IpeaData com correções), conferido com o TSE por UF',
  },
  {
    ano: 1978, titulo: 'Eleições 1978', datas: '15 de novembro',
    cargos: 'Senador (por enquanto só São Paulo)', disponivel: true, rota: '/1978/sp/senador', semLocais: true, semZonas: true, soCargos: ['senador'],
    fonte: 'Acervo Sigoli.TSE (votos válidos por município)',
  },
];

/** o ano tem locais de votação (visão Locais na cidade) */
export const temLocais = (ano: number) => !ELEICOES.find((e) => e.ano === ano)?.semLocais;

/** o ano tem as zonas eleitorais (visão Zonas e a visão da cidade) */
export const temZonas = (ano: number) => !ELEICOES.find((e) => e.ano === ano)?.semZonas;

/** o ano tem o Presidente por município */
export const temPresidente = (ano: number) => !ELEICOES.find((e) => e.ano === ano)?.semPresidente;

/** o ano tem o cargo (1998 sem Presidente; 1989 só Presidente) */
export const temCargo = (ano: number, cargo: string) => {
  const e = ELEICOES.find((x) => x.ano === ano);
  if (e?.soCargos) return e.soCargos.includes(cargo);
  return cargo !== 'presidente' || !e?.semPresidente;
};

/** fonte dos resultados do ano, quando não é o TSE por município */
export const fonteDoAno = (ano: number) => ELEICOES.find((e) => e.ano === ano)?.fonte ?? null;
