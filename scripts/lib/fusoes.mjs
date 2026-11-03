/**
 * Municípios criados depois de uma eleição (ADR 0015): no mapa daquele ano, a área volta para o município de origem.
 * `ateAno`: último ano de eleição em que o município novo ainda não existia (o eleitor votava na origem).
 */
export const FUSOES = [
  // Boa Esperança do Norte (MT): desmembrado de Nova Ubiratã, instalado em 2025
  { uf: 'mt', novo: '5101837', origem: '5106240', ateAno: 2025 },
  // criados em 2013 (primeira eleição municipal em 2012): em 2010 ainda votavam na origem
  { uf: 'sc', novo: '4212650', origem: '4209409', ateAno: 2011 }, // Pescaria Brava ← Laguna
  { uf: 'sc', novo: '4220000', origem: '4207007', ateAno: 2011 }, // Balneário Rincão ← Içara
  { uf: 'pa', novo: '1504752', origem: '1506807', ateAno: 2011 }, // Mojuí dos Campos ← Santarém
  { uf: 'rs', novo: '4314548', origem: '4302105', ateAno: 2011 }, // Pinto Bandeira ← Bento Gonçalves
  { uf: 'ms', novo: '5006275', origem: '5003256', ateAno: 2011 }, // Paraíso das Águas ← Costa Rica
];

export const fusoesDoAno = (ano) => FUSOES.filter((f) => ano <= f.ateAno);
