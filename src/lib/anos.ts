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
];
