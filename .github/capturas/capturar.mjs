// Abre páginas do site montado (out/, servido em :3000) e grava capturas + erros do console em capturas/.
import { chromium } from 'playwright';
import { mkdirSync, writeFileSync } from 'node:fs';
const PAGINAS = JSON.parse(process.env.PAGINAS);
mkdirSync('capturas', { recursive: true });
const nav = await chromium.launch();
const ctx = await nav.newContext({ viewport: { width: 1440, height: 900 } });
const log = [];
for (const [nome, url] of Object.entries(PAGINAS)) {
  const pg = await ctx.newPage();
  const erros = [];
  pg.on('console', (m) => { if (m.type() === 'error' || m.type() === 'warning') erros.push(`${m.type()}: ${m.text()}`); });
  pg.on('pageerror', (e) => erros.push(`pageerror: ${e.message}`));
  pg.on('response', (r) => { if (r.status() >= 400) erros.push(`${r.status()} ${r.url()}`); });
  const t0 = Date.now();
  await pg.goto(`http://localhost:3000${url}`, { waitUntil: 'networkidle', timeout: 120000 }).catch((e) => erros.push(`goto: ${e.message}`));
  await pg.waitForFunction(() => !document.querySelector('.carregando, [class*="Carregando"]'), null, { timeout: 90000 }).catch(() => erros.push('ainda carregando'));
  await pg.waitForTimeout(1500);
  await pg.screenshot({ path: `capturas/${nome}.png` });
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
