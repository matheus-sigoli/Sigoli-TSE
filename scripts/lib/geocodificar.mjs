/**
 * Sigoli.TSE — ponto dos locais de votação sem coordenadas (ADR 0016).
 *
 * O cadastro do TSE de anos anteriores tem muitos locais sem latitude/longitude (2014: 22% do eleitorado;
 * MG, ES e SE quase inteiros). Sem ponto, o local não entra no desenho das zonas nem casa com as áreas do Atlas
 * (em Manaus 2014, 437 de 440 locais estavam sem ponto e a cidade inteira virava 3 zonas).
 *
 * O ponto vem, nesta ordem, de:
 *   1. o mesmo local (código município-zona-local e mesmo nome) no cadastro de outro ano;
 *   2. um local com o mesmo nome na mesma cidade em outro ano;
 *   3. o mesmo nome sem as palavras genéricas (ESCOLA, ESTADUAL, E E, MUNICIPAL…), se só um local da cidade casar;
 *   4. o mesmo código com nome parecido (metade das palavras em comum) — local renomeado;
 *   5. o centro do bairro: os locais do mesmo bairro (nome do TSE) que têm ponto, neste ano ou em outro;
 *   6. o centro da zona na cidade: os locais da mesma zona que já têm ponto (só para o local entrar no desenho).
 * Os de 1 a 4 são o ponto real do prédio; 5 e 6 são aproximados e ficam marcados (`aprox`).
 */
import { normalizar } from './texto.mjs';

const GENERICAS = new Set(('ESCOLA ESTADUAL MUNICIPAL E EE EM EMEF EMEI EEEF EEEM ESC EST MUN DE DA DO DAS DOS COLEGIO COL ' +
  'UNIDADE ESCOLAR U CENTRO EDUCACIONAL CE CEI CIEP INSTITUTO GRUPO ENSINO FUNDAMENTAL MEDIO INFANTIL PROF PROFESSOR PROFESSORA ' +
  'DR DOUTOR DONA D SAO STA SANTA SANTO EDUC EDUCACAO CRECHE CMEI CEM').split(' '));
const nucleo = (nome) => normalizar(nome).split(' ').filter((p) => p && !GENERICAS.has(p)).join(' ');
const palavras = (nome) => new Set(nucleo(nome).split(' ').filter(Boolean));
function parecido(a, b) {
  const A = palavras(a), B = palavras(b);
  if (!A.size || !B.size) return false;
  let comuns = 0;
  for (const p of A) if (B.has(p)) comuns++;
  return comuns / Math.min(A.size, B.size) >= 0.5;
}

/**
 * Preenche lon/lat dos locais sem ponto. `refs` são cadastros de outros anos (só pontos reais).
 * Altera os objetos de `locais` (lon, lat, aprox) e devolve a contagem por método.
 */
export function geocodificar(locais, refs) {
  const conta = { codigo: 0, nome: 0, nucleo: 0, renomeado: 0, bairro: 0, zona: 0, sem: 0 };
  const comPonto = (l) => l.lon !== null && l.lat !== null && !l.aprox;
  const porCodigoNome = new Map(), porNome = new Map(), porNucleo = new Map(), porCodigo = new Map(), porBairro = new Map();
  const juntarBairro = (l) => {
    const k = `${l.ibge}|${normalizar(l.bairro)}`;
    if (!normalizar(l.bairro)) return;
    const b = porBairro.get(k) ?? { sx: 0, sy: 0, n: 0 };
    b.sx += l.lon; b.sy += l.lat; b.n++;
    porBairro.set(k, b);
  };
  for (const ref of refs) for (const l of ref) {
    if (!comPonto(l)) continue;
    const n = normalizar(l.nome);
    porCodigoNome.set(`${l.id}|${n}`, l);
    if (!porNome.has(`${l.ibge}|${n}`)) porNome.set(`${l.ibge}|${n}`, l);
    const k = `${l.ibge}|${nucleo(l.nome)}`;
    if (nucleo(l.nome)) {
      // nome genérico que aparece em dois lugares da cidade (> ~500 m): ambíguo, não usa
      if (!porNucleo.has(k)) porNucleo.set(k, l);
      else { const v = porNucleo.get(k); if (v && Math.hypot(v.lon - l.lon, v.lat - l.lat) > 0.005) porNucleo.set(k, null); }
    }
    if (!porCodigo.has(l.id)) porCodigo.set(l.id, l);
    juntarBairro(l);
  }
  // o próprio ano também ajuda no centro do bairro
  for (const l of locais) if (comPonto(l)) juntarBairro(l);

  const usar = (l, r, metodo) => { l.lon = r.lon; l.lat = r.lat; conta[metodo]++; };
  for (const l of locais) {
    if (comPonto(l)) continue;
    const n = normalizar(l.nome);
    let r;
    if ((r = porCodigoNome.get(`${l.id}|${n}`))) usar(l, r, 'codigo');
    else if ((r = porNome.get(`${l.ibge}|${n}`))) usar(l, r, 'nome');
    else if (nucleo(l.nome) && (r = porNucleo.get(`${l.ibge}|${nucleo(l.nome)}`))) usar(l, r, 'nucleo');
    else if ((r = porCodigo.get(l.id)) && parecido(r.nome, l.nome)) usar(l, r, 'renomeado');
    else {
      const b = porBairro.get(`${l.ibge}|${normalizar(l.bairro)}`);
      if (b) { l.lon = b.sx / b.n; l.lat = b.sy / b.n; l.aprox = true; conta.bairro++; }
    }
  }
  // 6. ainda sem ponto: centro dos locais da mesma zona na cidade
  const porZona = new Map();
  for (const l of locais) {
    if (l.lon === null || l.lat === null) continue;
    const k = `${l.ibge}|${l.zona}`;
    const z = porZona.get(k) ?? { sx: 0, sy: 0, n: 0 };
    z.sx += l.lon; z.sy += l.lat; z.n++;
    porZona.set(k, z);
  }
  for (const l of locais) {
    if (l.lon !== null && l.lat !== null) continue;
    const z = porZona.get(`${l.ibge}|${l.zona}`);
    if (z) { l.lon = z.sx / z.n; l.lat = z.sy / z.n; l.aprox = true; conta.zona++; }
    else conta.sem++;
  }
  return conta;
}
