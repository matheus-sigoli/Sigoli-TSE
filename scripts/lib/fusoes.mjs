/**
 * Municípios criados depois de uma eleição (ADR 0015): no mapa daquele ano, a área volta para o município de origem.
 * `ateAno`: último ano de eleição em que o município novo ainda não existia (o eleitor votava na origem).
 */
export const FUSOES = [
  // Boa Esperança do Norte (MT): desmembrado de Nova Ubiratã, instalado em 2025
  { uf: 'mt', novo: '5101837', origem: '5106240', ateAno: 2025 },
  // Nazária (PI): criado em 1995, instalado em 2009 (primeira eleição municipal em 2008); em 2006 votava em Teresina
  { uf: 'pi', novo: '2206720', origem: '2211001', ateAno: 2007 },
  // instalados em 2001 (primeira eleição municipal em 2000): em 1998 ainda votavam na origem. Origem pela genealogia
  // do IBGE/SPGG-RS; com mais de uma origem, a que tinha a zona eleitoral do município novo (scripts/propor-fusoes.mjs)
  { uf: 'al', novo: '2703759', origem: '2708600', ateAno: 2000 }, // Jequiá da praia ← São Miguel dos Campos
  { uf: 'ba', novo: '2919553', origem: '2903201', ateAno: 2000 }, // Luís eduardo magalhães ← Barreiras
  { uf: 'ba', novo: '2903276', origem: '2930501', ateAno: 2000 }, // Barrocas ← Serrinha
  { uf: 'es', novo: '3202256', origem: '3201506', ateAno: 2000 }, // Governador lindenberg ← Colatina
  { uf: 'go', novo: '5210158', origem: '5205406', ateAno: 2000 }, // Ipiranga de goiás ← Ceres
  { uf: 'go', novo: '5208152', origem: '5220603', ateAno: 2000 }, // Gameleira de goiás ← Silvânia
  { uf: 'go', novo: '5204854', origem: '5201108', ateAno: 2000 }, // Campo limpo de goiás ← Anápolis
  { uf: 'go', novo: '5212253', origem: '5210802', ateAno: 2000 }, // Lagoa santa ← Itajá
  { uf: 'mt', novo: '5103361', origem: '5106752', ateAno: 2000 }, // Conquista d'oeste ← Pontes e Lacerda
  { uf: 'mt', novo: '5103254', origem: '5101407', ateAno: 2000 }, // Colniza ← Aripuanã
  { uf: 'mt', novo: '5101852', origem: '5100359', ateAno: 2000 }, // Bom jesus do araguaia ← Alto Boa Vista
  { uf: 'mt', novo: '5108352', origem: '5106752', ateAno: 2000 }, // Vale de são domingos ← Pontes e Lacerda
  { uf: 'mt', novo: '5107883', origem: '5107859', ateAno: 2000 }, // Serra nova dourada ← São Félix do Araguaia
  { uf: 'mt', novo: '5107768', origem: '5106224', ateAno: 2000 }, // Santa rita do trivelato ← Nova Mutum
  { uf: 'mt', novo: '5106315', origem: '5107859', ateAno: 2000 }, // Novo santo antônio ← São Félix do Araguaia
  { uf: 'mt', novo: '5106174', origem: '5100201', ateAno: 2000 }, // Nova nazaré ← Água Boa
  { uf: 'rj', novo: '3302858', origem: '3303500', ateAno: 2000 }, // Mesquita ← Nova Iguaçu
  { uf: 'rs', novo: '4315313', origem: '4310900', ateAno: 2000 }, // Quatro irmãos ← Jacutinga
  { uf: 'rs', novo: '4323770', origem: '4321451', ateAno: 2000 }, // Westfalia ← Teutônia
  { uf: 'rs', novo: '4306130', origem: '4303806', ateAno: 2000 }, // Cruzaltense ← Campinas do Sul
  { uf: 'rs', novo: '4314464', origem: '4307401', ateAno: 2000 }, // Pinhal da serra ← Esmeralda
  { uf: 'rs', novo: '4314175', origem: '4314506', ateAno: 2000 }, // Pedras altas ← Pinheiro Machado
  { uf: 'rs', novo: '4314134', origem: '4310900', ateAno: 2000 }, // Paulo bento ← Jacutinga
  { uf: 'rs', novo: '4305934', origem: '4308607', ateAno: 2000 }, // Coronel pilar ← Garibaldi
  { uf: 'rs', novo: '4305835', origem: '4313003', ateAno: 2000 }, // Coqueiro baixo ← Nova Bréscia
  { uf: 'rs', novo: '4321469', origem: '4323200', ateAno: 2000 }, // Tio hugo ← Victor Graeff
  { uf: 'rs', novo: '4313466', origem: '4305801', ateAno: 2000 }, // Novo xingu ← Constantina
  { uf: 'rs', novo: '4304622', origem: '4311304', ateAno: 2000 }, // Capão bonito do sul ← Lagoa Vermelha
  { uf: 'rs', novo: '4304614', origem: '4315156', ateAno: 2000 }, // Canudos do vale ← Progresso
  { uf: 'rs', novo: '4304655', origem: '4317400', ateAno: 2000 }, // Capão do cipó ← Santiago
  { uf: 'rs', novo: '4312179', origem: '4303301', ateAno: 2000 }, // Mato queimado ← Caibaté
  { uf: 'rs', novo: '4311239', origem: '4320701', ateAno: 2000 }, // Lagoa bonita do sul ← Sobradinho
  { uf: 'rs', novo: '4319364', origem: '4313706', ateAno: 2000 }, // São pedro das missões ← Palmeira das Missões
  { uf: 'rs', novo: '4302584', origem: '4310207', ateAno: 2000 }, // Bozano ← Ijuí
  { uf: 'rs', novo: '4310652', origem: '4321436', ateAno: 2000 }, // Itati ← Terra de Areia
  { uf: 'rs', novo: '4310876', origem: '4316451', ateAno: 2000 }, // Jacuizinho ← Salto do Jacuí
  { uf: 'rs', novo: '4318614', origem: '4316501', ateAno: 2000 }, // São josé do sul ← Salvador do Sul
  { uf: 'rs', novo: '4301073', origem: '4314407', ateAno: 2000 }, // Arroio do padre ← Pelotas
  { uf: 'rs', novo: '4316972', origem: '4318309', ateAno: 2000 }, // Santa margarida do sul ← São Gabriel
  { uf: 'rs', novo: '4300471', origem: '4304705', ateAno: 2000 }, // Almirante tamandaré do sul ← Carazinho
  { uf: 'rs', novo: '4300034', origem: '4301602', ateAno: 2000 }, // Aceguá ← Bagé
  { uf: 'rs', novo: '4308433', origem: '4311403', ateAno: 2000 }, // Forquetinha ← Lajeado
  { uf: 'rs', novo: '4316733', origem: '4300059', ateAno: 2000 }, // Santa cecília do sul ← Água Santa
  // instalados em 2005 (primeira eleição municipal em 2004): em 2002 ainda votavam na origem
  { uf: 'pi', novo: '2200954', origem: '2208007', ateAno: 2003 }, // Aroeiras do Itaim ← Picos
  { uf: 'ms', novo: '5003900', origem: '5002605', ateAno: 2003 }, // Figueirão ← Camapuã
  { uf: 'mt', novo: '5104526', origem: '5108006', ateAno: 2003 }, // Ipiranga do Norte ← Tapurah
  { uf: 'mt', novo: '5104542', origem: '5108006', ateAno: 2003 }, // Itanhangá ← Tapurah
  // criados em 2013 (primeira eleição municipal em 2012): em 2010 ainda votavam na origem
  { uf: 'sc', novo: '4212650', origem: '4209409', ateAno: 2011 }, // Pescaria Brava ← Laguna
  { uf: 'sc', novo: '4220000', origem: '4207007', ateAno: 2011 }, // Balneário Rincão ← Içara
  { uf: 'pa', novo: '1504752', origem: '1506807', ateAno: 2011 }, // Mojuí dos Campos ← Santarém
  { uf: 'rs', novo: '4314548', origem: '4302105', ateAno: 2011 }, // Pinto Bandeira ← Bento Gonçalves
  { uf: 'ms', novo: '5006275', origem: '5003256', ateAno: 2011 }, // Paraíso das Águas ← Costa Rica
];

export const fusoesDoAno = (ano) => FUSOES.filter((f) => ano <= f.ateAno);
