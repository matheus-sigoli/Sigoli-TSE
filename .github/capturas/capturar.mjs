// Abre páginas do site montado (out/, servido em :3000) e grava capturas + erros do console em capturas/.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const PAGINAS = JSON.parse(process.env.PAGINAS);
mkdirSync('capturas', { recursive: true });
const nav = await chromium.launch();
// nome terminado em @cel = celular (390×844), @tab = tablet (820×1180), @peq = celular pequeno (360×640)
const TELAS = { cel: { width: 390, height: 844 }, tab: { width: 820, height: 1180 }, peq: { width: 360, height: 640 } };
const contextos = {};
const ctxDe = async (nome) => {
  const t = nome.split('@')[1] ?? 'pc';
  contextos[t] ??= await nav.newContext(TELAS[t] ? { viewport: TELAS[t], isMobile: true, hasTouch: true, deviceScaleFactor: 2 } : { viewport: { width: 1440, height: 900 } });
  return contextos[t];
};
const log = [];
// a página pode ser só a URL ou { url, local: {chave: valor do localStorage}, cliques: [seletores clicados em ordem] }
for (const [nome, item] of Object.entries(PAGINAS)) {
  const { url, local, cliques } = typeof item === 'string' ? { url: item } : item;
  const pg = await (await ctxDe(nome)).newPage();
  if (local) await pg.addInitScript((l) => { for (const [k, v] of Object.entries(l)) localStorage.setItem(k, v); }, local);
  const erros = [];
  pg.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') erros.push(`${m.type()}: ${m.text()}`); });
  pg.on('pageerror', (e) => erros.push(`pageerror: ${e.message}`));
  pg.on('response', (r) => { if (r.status() >= 400) erros.push(`${r.status()} ${r.url()}`); });
  const t0 = Date.now();
  await pg.goto(`http://localhost:3000${url}`, { waitUntil: 'networkidle', timeout: 120000 }).catch((e) => erros.push(`goto: ${e.message}`));
  await pg.waitForFunction(() => !document.querySelector('.carregando, [class*="Carregando"]'), null, { timeout: 90000 }).catch(() => erros.push('ainda carregando'));
  await pg.waitForTimeout(1500);
  for (const sel of cliques ?? []) {
    await pg.locator(sel).first().click({ force: true, timeout: 15000 }).catch((e) => erros.push(`clique ${sel}: ${e.message}`));
    await pg.waitForTimeout(800);
  }
  await pg.screenshot({ path: `capturas/${nome.replace('@', '-')}.png` });
  // largura maior que a tela = rolagem horizontal (problema de responsividade)
  const larg = await pg.evaluate(() => ({ doc: document.documentElement.scrollWidth, tela: window.innerWidth }));
  if (larg.doc > larg.tela + 1) erros.push(`rolagem horizontal: ${larg.doc}px numa tela de ${larg.tela}px`);
  const texto = await pg.evaluate(() => {
    const t = (s) => document.querySelector(s)?.innerText?.trim() ?? '';
    return { painel: t('.painel')?.slice(0, 1200), filtros: t('.filtros')?.slice(0, 800), creditos: t('.creditos-mapa'),
      areas: document.querySelectorAll('.mapa svg path').length, circulos: document.querySelectorAll('.mapa svg circle').length };
  });
  log.push({ nome, url, ms: Date.now() - t0, erros, ...texto });
  await pg.close();
}
writeFileSync('capturas/relatorio.json', JSON.stringify(log, null, 2));
await nav.close();
