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
  /** zonas só para estes cargos e UFs (1994: a votação por seção só tem Presidente, de 17 UFs) */
  zonasSo?: { cargos: string[]; ufs: string[] };
  /** só estes cargos (1989: eleição só de Presidente) */
  soCargos?: string[];
  /** de onde vêm os resultados, quando não é o TSE por município */
  fonte?: string;
  /** só resultado por estado (planilha, sem nada por município): o Brasil abre direto no mapa por estado e não há
   *  página por estado */
  soEstados?: boolean;
}

export const ELEICOES: Eleicao[] = [
  {
    ano: 2026, titulo: 'Eleições Gerais 2026', datas: '4 e 25 de outubro',
    cargos: 'Presidente, Governador, Senador, Deputados', disponivel: true, rota: '/2026/br/presidente?t=2',
  },
  {
    ano: 2024, titulo: 'Eleições Municipais 2024', datas: '6 e 27 de outubro',
    cargos: 'Prefeito e Vereador', disponivel: true, rota: '/2024/sp/prefeito', soCargos: ['prefeito', 'vereador'],
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
    cargos: 'Presidente, Governador, Senador, Deputados', disponivel: true, rota: '/1994/br/presidente', semLocais: true,
    zonasSo: { cargos: ['presidente'], ufs: ['ac', 'al', 'am', 'ap', 'ba', 'go', 'ma', 'ms', 'pb', 'pe', 'pi', 'ro', 'rs', 'sc', 'se', 'sp', 'to'] },
  },
  {
    ano: 1993, titulo: 'Plebiscito de 1993', datas: '21 de abril',
    cargos: 'Forma de governo (República ou Monarquia) e sistema de governo (Presidencialismo ou Parlamentarismo); por município: SP, GO, DF, BA, SC e PI (os outros estados só no total do Brasil)',
    disponivel: true, rota: '/1993/br/forma', semLocais: true, semZonas: true,
    soCargos: ['forma', 'sistema'],
    fonte: 'TSE, relatórios "Resultado do Município" do plebiscito, do acervo (por município)',
  },
  {
    ano: 1990, titulo: 'Eleições 1990', datas: '3 de outubro e 25 de novembro',
    cargos: 'Governador (por enquanto AC, AL, AP, BA, CE, ES, GO, MA, MG, MS, MT, PA, PI, RJ, RN, RO, RS e SP; PI só no 2º turno e metade dos municípios), Senador (BA, CE, ES, MS, PA, RN, RO e RS; MA só com parte dos municípios e ES sem 3) e Deputados (CE, MS, RN, RO e RS)', disponivel: true, rota: '/1990/sp/governador', semLocais: true, semZonas: true,
    soCargos: ['governador', 'senador', 'deputado-federal', 'deputado-estadual'],
    fonte: 'Acervo Sigoli.TSE e TREs (por município)',
  },
  {
    ano: 1989, titulo: 'Eleição Presidencial 1989', datas: '15 de novembro e 17 de dezembro',
    cargos: 'Presidente', disponivel: true, rota: '/1989/br/presidente?t=2', semLocais: true, semZonas: true, soCargos: ['presidente'],
    fonte: 'Geografia do Voto (IpeaData com correções), conferido com o TSE por UF',
  },
  {
    ano: 1986, titulo: 'Eleições 1986', datas: '15 de novembro',
    cargos: 'Governador (por enquanto BA, CE, ES, MA, MG, MS, MT, PE, RJ, RS, SE e SP), Senador (CE, MS, PE e RS) e Deputados (CE e RS)', disponivel: true, rota: '/1986/sp/governador', semLocais: true, semZonas: true, soCargos: ['governador', 'senador', 'deputado-federal', 'deputado-estadual'],
    fonte: 'Acervo Sigoli.TSE e TREs (por município)',
  },
  {
    ano: 1982, titulo: 'Eleições 1982', datas: '15 de novembro',
    cargos: 'Governador', disponivel: true, rota: '/1982/br/governador', semLocais: true, semZonas: true, soCargos: ['governador'],
    fonte: 'Acervo Sigoli.TSE (por município) e TSE, Dados Estatísticos de 1982 (total de cada estado)',
  },
  {
    ano: 1978, titulo: 'Eleições 1978', datas: '15 de novembro',
    cargos: 'Senador (CE, MT, PE, RS e SP; PE por partido) e Deputados (CE e RS)', disponivel: true, rota: '/1978/sp/senador', semLocais: true, semZonas: true,
    soCargos: ['senador', 'deputado-federal', 'deputado-estadual'],
    fonte: 'Acervo Sigoli.TSE, TRE-CE, TRE-PE e TRE-RS (por município)',
  },
  {
    ano: 1974, titulo: 'Eleições 1974', datas: '15 de novembro',
    cargos: 'Senador (CE, MT, RS e SP; MT por partido) e Deputados (RS)', disponivel: true, rota: '/1974/sp/senador', semLocais: true, semZonas: true,
    soCargos: ['senador', 'deputado-federal', 'deputado-estadual'],
    fonte: 'TRE-RS, TRE-CE, TRE-MT e acervo Sigoli.TSE (por município)',
  },
  {
    ano: 1970, titulo: 'Eleições 1970', datas: '15 de novembro',
    cargos: 'Senador (PR e RS) e Deputado Federal (RS)', disponivel: true, rota: '/1970/pr/senador', semLocais: true, semZonas: true,
    soCargos: ['senador', 'deputado-federal'],
    fonte: 'TRE-RS e TRE-PR (por município)',
  },
  {
    ano: 1966, titulo: 'Eleições 1966', datas: '15 de novembro',
    cargos: 'Senador (CE, PR e RS), Deputado Federal (CE e RS) e Deputado Estadual (CE)', disponivel: true, rota: '/1966/ce/senador', semLocais: true, semZonas: true,
    soCargos: ['senador', 'deputado-federal', 'deputado-estadual'],
    fonte: 'TRE-RS, TRE-CE e TRE-PR (por município)',
  },
  {
    ano: 1965, titulo: 'Eleições 1965', datas: '3 de outubro',
    cargos: 'Governador (por enquanto AL, MA, MG, MT, RN e SC)', disponivel: true, rota: '/1965/mg/governador', semLocais: true, semZonas: true,
    soCargos: ['governador'],
    fonte: 'TRE-MG, TRE-SC e planilhas do acervo (por município)',
  },
  {
    ano: 1962, titulo: 'Eleições 1962', datas: '7 de outubro',
    cargos: 'Governador e Senador (ES, PE e RS; PE por zona eleitoral) e Deputados (RS)', disponivel: true, rota: '/1962/pe/governador', semLocais: true, semZonas: true,
    soCargos: ['governador', 'senador', 'deputado-federal', 'deputado-estadual'],
    fonte: 'TRE-RS e TRE-ES (por município) e TRE-PE, Relatório Final das Eleições de 1962 (por zona eleitoral)',
  },
  {
    ano: 1960, titulo: 'Eleições 1960', datas: '3 de outubro',
    cargos: 'Presidente e Vice-Presidente (todo o Brasil, menos Amapá e Rio Branco) e Governador (por enquanto AL, MG, PR e SC)', disponivel: true, rota: '/1960/br/presidente', semLocais: true, semZonas: true,
    soCargos: ['presidente', 'vice-presidente', 'governador'],
    fonte: 'Acervo Sigoli.TSE (mapas de apuração de Presidente e Vice por município), TRE-MG, TRE-PR e TRE-SC (por município); total do Brasil pelo IBGE',
  },
  {
    ano: 1958, titulo: 'Eleições 1958', datas: '3 de outubro',
    cargos: 'Governador (BA, CE, RS e SP), Senador (BA, CE, PE e RS; PE por zona eleitoral) e Deputados (RS)', disponivel: true, rota: '/1958/ba/governador', semLocais: true, semZonas: true,
    soCargos: ['governador', 'senador', 'deputado-federal', 'deputado-estadual'],
    fonte: 'TRE-RS, TRE-BA, TRE-CE, TRE-PE e acervo Sigoli.TSE (por município)',
  },
  {
    ano: 1955, titulo: 'Eleições 1955', datas: '3 de outubro',
    cargos: 'Presidente e Vice-Presidente (todo o Brasil) e Governador (por enquanto AL, MG, MT, PR e SC; MG por zona eleitoral)', disponivel: true, rota: '/1955/br/presidente', semLocais: true, semZonas: true,
    soCargos: ['presidente', 'vice-presidente', 'governador'],
    fonte: 'Acervo Sigoli.TSE (banco de dados de Presidente e Vice por município), TRE-MG (por zona eleitoral), TRE-PR e TRE-SC (por município)',
  },
  {
    ano: 1954, titulo: 'Eleições 1954', datas: '3 de outubro',
    cargos: 'Governador (BA, CE, ES, PE, RJ e RS), Senador (BA, CE, ES, MT, PE, RJ e RS; PE por zona eleitoral, MT por junta apuradora) e Deputados (RS)', disponivel: true, rota: '/1954/ba/governador', semLocais: true, semZonas: true,
    soCargos: ['governador', 'senador', 'deputado-federal', 'deputado-estadual'],
    fonte: 'TRE-RS, TRE-BA, TRE-CE, TRE-ES, TRE-RJ, TRE-PE (por zona) e acervo Sigoli.TSE (por município)',
  },
  {
    ano: 1950, titulo: 'Eleições 1950', datas: '3 de outubro',
    cargos: 'Presidente e Vice-Presidente (por enquanto AL, AM, AP, CE, ES, MA, MG, MT, PB, PE, PR, RJ, RN, RS, SC, SE e o Distrito Federal; MG por zona eleitoral), Governador (por enquanto AL, BA, CE, MA, RS e SC; RS por junta apuradora) e Senador (CE, RS e SC)', disponivel: true, rota: '/1950/br/presidente', semLocais: true, semZonas: true,
    soCargos: ['presidente', 'vice-presidente', 'governador', 'senador'],
    fonte: 'TRE-BA, TRE-CE, TRE-SC e acervo Sigoli.TSE (banco de dados de Presidente e Vice e planilhas por município), NUPERGS/UFRGS (RS, por junta apuradora)',
  },
  {
    ano: 1947, titulo: 'Eleições 1947', datas: '19 de janeiro',
    cargos: 'Governador (por enquanto AL, BA, MG, PE, PR, RS, SC e SP; MG, PE e SC por zona eleitoral, RS por junta apuradora, AL por grupo de municípios) e Senador (PE, por zona eleitoral)', disponivel: true, rota: '/1947/mg/governador', semLocais: true, semZonas: true,
    soCargos: ['governador', 'senador'],
    fonte: 'TRE-MG, TRE-PE e TRE-SC (por zona eleitoral), TRE-BA, Diário Oficial de Alagoas e acervo Sigoli.TSE (por município), NUPERGS/UFRGS (RS, por junta apuradora)',
  },
  {
    ano: 1945, titulo: 'Eleição Presidencial de 1945', datas: '2 de dezembro',
    cargos: 'Presidente (só por estado; inclui os territórios de 1943–1946)', disponivel: true, rota: '/1945/br/presidente',
    soCargos: ['presidente'], soEstados: true, semLocais: true, semZonas: true,
    fonte: 'Planilha "Eleições Presidenciais por Estado (1881-1930)" do acervo Sigoli.TSE (votos por estado)',
  },
  {
    ano: 1930, titulo: 'Eleição Presidencial de 1930', datas: '1º de março',
    cargos: 'Presidente e Vice-Presidente (só por estado)', disponivel: true, rota: '/1930/br/presidente',
    soCargos: ['presidente', 'vice-presidente'], soEstados: true, semLocais: true, semZonas: true,
    fonte: 'Planilha "Eleições Presidenciais por Estado (1881-1930)" do acervo Sigoli.TSE (votos por estado)',
  },
  {
    ano: 1926, titulo: 'Eleição Presidencial de 1926', datas: '1º de março',
    cargos: 'Presidente e Vice-Presidente (só por estado)', disponivel: true, rota: '/1926/br/presidente',
    soCargos: ['presidente', 'vice-presidente'], soEstados: true, semLocais: true, semZonas: true,
    fonte: 'Planilha "Eleições Presidenciais por Estado (1881-1930)" do acervo Sigoli.TSE (votos por estado)',
  },
  {
    ano: 1922, titulo: 'Eleição Presidencial de 1922', datas: '1º de março',
    cargos: 'Presidente e Vice-Presidente (só por estado)', disponivel: true, rota: '/1922/br/presidente',
    soCargos: ['presidente', 'vice-presidente'], soEstados: true, semLocais: true, semZonas: true,
    fonte: 'Planilha "Eleições Presidenciais por Estado (1881-1930)" do acervo Sigoli.TSE (votos por estado)',
  },
  {
    ano: 1920, titulo: 'Eleição Suplementar de 1920', datas: '',
    cargos: 'Vice-Presidente (suplementar; só por estado)', disponivel: true, rota: '/1920/br/vice-presidente',
    soCargos: ['vice-presidente'], soEstados: true, semLocais: true, semZonas: true,
    fonte: 'Planilha "Eleições Presidenciais por Estado (1881-1930)" do acervo Sigoli.TSE (votos por estado)',
  },
  {
    ano: 1919, titulo: 'Eleição Suplementar de 1919', datas: '13 de abril',
    cargos: 'Presidente (suplementar; só por estado)', disponivel: true, rota: '/1919/br/presidente',
    soCargos: ['presidente'], soEstados: true, semLocais: true, semZonas: true,
    fonte: 'Planilha "Eleições Presidenciais por Estado (1881-1930)" do acervo Sigoli.TSE (votos por estado)',
  },
  {
    ano: 1918, titulo: 'Eleição Presidencial de 1918', datas: '1º de março',
    cargos: 'Presidente e Vice-Presidente (só por estado)', disponivel: true, rota: '/1918/br/presidente',
    soCargos: ['presidente', 'vice-presidente'], soEstados: true, semLocais: true, semZonas: true,
    fonte: 'Planilha "Eleições Presidenciais por Estado (1881-1930)" do acervo Sigoli.TSE (votos por estado)',
  },
  {
    ano: 1914, titulo: 'Eleição Presidencial de 1914', datas: '1º de março',
    cargos: 'Presidente e Vice-Presidente (só por estado)', disponivel: true, rota: '/1914/br/presidente',
    soCargos: ['presidente', 'vice-presidente'], soEstados: true, semLocais: true, semZonas: true,
    fonte: 'Planilha "Eleições Presidenciais por Estado (1881-1930)" do acervo Sigoli.TSE (votos por estado)',
  },
  {
    ano: 1910, titulo: 'Eleição Presidencial de 1910', datas: '1º de março',
    cargos: 'Presidente e Vice-Presidente (só por estado)', disponivel: true, rota: '/1910/br/presidente',
    soCargos: ['presidente', 'vice-presidente'], soEstados: true, semLocais: true, semZonas: true,
    fonte: 'Planilha "Eleições Presidenciais por Estado (1881-1930)" do acervo Sigoli.TSE (votos por estado)',
  },
  {
    ano: 1906, titulo: 'Eleição Presidencial de 1906', datas: '1º de março',
    cargos: 'Presidente e Vice-Presidente (só por estado)', disponivel: true, rota: '/1906/br/presidente',
    soCargos: ['presidente', 'vice-presidente'], soEstados: true, semLocais: true, semZonas: true,
    fonte: 'Planilha "Eleições Presidenciais por Estado (1881-1930)" do acervo Sigoli.TSE (votos por estado)',
  },
  {
    ano: 1903, titulo: 'Eleição Suplementar de 1903', datas: '',
    cargos: 'Vice-Presidente (suplementar; só por estado)', disponivel: true, rota: '/1903/br/vice-presidente',
    soCargos: ['vice-presidente'], soEstados: true, semLocais: true, semZonas: true,
    fonte: 'Planilha "Eleições Presidenciais por Estado (1881-1930)" do acervo Sigoli.TSE (votos por estado)',
  },
  {
    ano: 1902, titulo: 'Eleição Presidencial de 1902', datas: '1º de março',
    cargos: 'Presidente e Vice-Presidente (só por estado)', disponivel: true, rota: '/1902/br/presidente',
    soCargos: ['presidente', 'vice-presidente'], soEstados: true, semLocais: true, semZonas: true,
    fonte: 'Planilha "Eleições Presidenciais por Estado (1881-1930)" do acervo Sigoli.TSE (votos por estado)',
  },
  {
    ano: 1898, titulo: 'Eleição Presidencial de 1898', datas: '1º de março',
    cargos: 'Presidente e Vice-Presidente (só por estado)', disponivel: true, rota: '/1898/br/presidente',
    soCargos: ['presidente', 'vice-presidente'], soEstados: true, semLocais: true, semZonas: true,
    fonte: 'Planilha "Eleições Presidenciais por Estado (1881-1930)" do acervo Sigoli.TSE (votos por estado)',
  },
  {
    ano: 1894, titulo: 'Eleição Presidencial de 1894', datas: '1º de março',
    cargos: 'Presidente e Vice-Presidente (só por estado; PR, SC e RS em guerra, sem eleição)', disponivel: true, rota: '/1894/br/presidente',
    soCargos: ['presidente', 'vice-presidente'], soEstados: true, semLocais: true, semZonas: true,
    fonte: 'Planilha "Eleições Presidenciais por Estado (1881-1930)" do acervo Sigoli.TSE (votos por estado)',
  },
  {
    ano: 1886, titulo: 'Eleições Gerais de 1886 (Império)', datas: '15 de janeiro',
    cargos: 'Câmara dos Deputados, votos por partido em cada província (Conservadores 97 deputados, Liberais 17)', disponivel: true, rota: '/1886/br/camara',
    soCargos: ['camara'], soEstados: true, semLocais: true, semZonas: true,
    fonte: 'Planilha "Eleições Presidenciais por Estado (1881-1930)" do acervo Sigoli.TSE (votos por estado)',
  },
  {
    ano: 1884, titulo: 'Eleições Gerais de 1884 (Império)', datas: '1º de dezembro',
    cargos: 'Câmara dos Deputados, votos por partido (só 5 províncias na planilha)', disponivel: true, rota: '/1884/br/camara',
    soCargos: ['camara'], soEstados: true, semLocais: true, semZonas: true,
    fonte: 'Planilha "Eleições Presidenciais por Estado (1881-1930)" do acervo Sigoli.TSE (votos por estado)',
  },
];

/** ano de eleição municipal (Prefeito e Vereador) */
export const anoMunicipal = (ano: number) => !!ELEICOES.find((e) => e.ano === ano)?.soCargos?.includes('prefeito');

/** o ano tem locais de votação (visão Locais na cidade) */
export const temLocais = (ano: number) => !ELEICOES.find((e) => e.ano === ano)?.semLocais;

/** o ano tem as zonas eleitorais (visão Zonas e a visão da cidade) */
export const temZonas = (ano: number, cargo?: string, abr?: string) => {
  const e = ELEICOES.find((x) => x.ano === ano);
  if (e?.zonasSo) return (!cargo || e.zonasSo.cargos.includes(cargo)) && (!abr || e.zonasSo.ufs.includes(abr));
  return !e?.semZonas;
};

/** o ano tem o Presidente por município */
export const temPresidente = (ano: number) => !ELEICOES.find((e) => e.ano === ano)?.semPresidente;

/** o ano tem o cargo (1998 sem Presidente; 1989 só Presidente) */
export const temCargo = (ano: number, cargo: string) => {
  // o vice-presidente só tinha eleição própria até 1960; depois é eleito com o presidente
  if (cargo === 'vice-presidente' && ano > 1960) return false;
  const e = ELEICOES.find((x) => x.ano === ano);
  if (e?.soCargos) return e.soCargos.includes(cargo);
  if (cargo === 'prefeito' || cargo === 'vereador') return false; // só nos anos de eleição municipal (soCargos)
  if (cargo === 'forma' || cargo === 'sistema') return false; // só no plebiscito de 1993 (soCargos)
  if (cargo === 'camara') return false; // só no Império (soCargos)
  return cargo !== 'presidente' || !e?.semPresidente;
};

/** o ano só tem resultado por estado */
export const soEstados = (ano: number) => !!ELEICOES.find((e) => e.ano === ano)?.soEstados;

/** fonte dos resultados do ano, quando não é o TSE por município */
export const fonteDoAno = (ano: number) => ELEICOES.find((e) => e.ano === ano)?.fonte ?? null;
