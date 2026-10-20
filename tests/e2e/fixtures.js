import { readFileSync } from 'node:fs';
import { test as base, expect } from '@playwright/test';

const read = name => readFileSync(new URL(`../fixtures/${name}`, import.meta.url), 'utf8');
const files = {
  'www.orientecambios.com.py': 'coverage-oriente.html',
  'www.maxicambios.com.py': 'coverage-maxi.html',
  'www.mydcambios.com.py': 'coverage-myd.html',
  'www.bancoatlas.com.py': 'bank-atlas-2026-10-20.txt',
  'www.ueno.com.py': 'bank-ueno-2026-10-20.txt',
  'familiar.com.py': 'bank-familiar-2026-10-20.txt',
  'www.solar.com.py': 'bank-solar-2026-10-20.txt',
  'www.bonanzacambios.com.py': 'bonanza.txt',
  'www.fortunacambios.com.py': 'fortuna.txt',
  'www.fecambios.com.py': 'fe.txt',
  'itacambios.com.py': 'ita.txt',
  'fenixexchange.com.py': 'fenix.txt',
  'www.valor.com.py': 'extra-valor.txt',
  'cambiosrioparana.com.py': 'extra-rioparana.txt',
  'cambiostriplec.com.py': 'extra-triplec.txt',
  'site.mercosurcambios.com': 'extra-mercosur.txt',
};

export const test = base.extend({
  sources: async ({ page }, use) => {
    const state = { fail: false, norteOnly: false, delayEUR: false, requests: [], observed: [], unexpected: [], errors: [] };
    // Freeze Date only: cache age is stable, but real request/abort timers still run.
    await page.clock.setFixedTime(new Date('2026-10-20T01:00:00Z'));
    page.on('pageerror', error => state.errors.push(error.message));
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin === 'http://127.0.0.1:8766') return route.continue();
      state.observed.push({url:url.href,headers:route.request().headers()});
      if (url.hostname === 'mascambios.com.py' && url.pathname === '/api/cotizaciones.php') {
        state.requests.push(url.href);
        if (state.fail || state.norteOnly || url.searchParams.get('sucursal') !== 'matriz') return route.fulfill({ status:503, body:'Fixture unavailable' });
        // Only Matriz has a real saved fixture; other branches remain unavailable.
        return route.fulfill({ status:200, contentType:'application/json', body:read('coverage-mas-matriz.json') });
      }
      if (url.hostname !== 'r.jina.ai') {
        state.unexpected.push(url.href);
        return route.abort();
      }
      state.requests.push(url.href);
      const source = new URL(url.href.slice('https://r.jina.ai/'.length));
      if (state.delayEUR && source.pathname.endsWith('/EUR')) await new Promise(resolve => setTimeout(resolve, 350));
      if (state.fail || (state.norteOnly && source.hostname !== 'www.nortecambios.com.py')) return route.fulfill({ status: 503, body: 'Fixture unavailable' });
      let body;
      if (source.hostname === 'unocambios.com.py' && source.pathname === '/modelos.php') {
        const id=source.searchParams.get('id_sucursal');
        if (!['1','2','3','7','8','15','18'].includes(id)) return route.fulfill({status:503,body:'No saved real branch fixture'});
        body=read(`uno/branch-${id}.html`);
      } else if (source.hostname === 'www.nortecambios.com.py') body = read(`norte-${source.pathname.split('/').pop().toLowerCase()}-2026-10-20.md`);
      else if (source.hostname === 'www.cambiosalberdi.com') {
        // Synthetic branch variants exercise routing, not assertions of real local prices.
        body = read('alberdi-encarnacion.txt').replaceAll('suc=encarnacion', `suc=${source.searchParams.get('suc')}`);
      } else if (files[source.hostname]) body = read(files[source.hostname]);
      else {
        state.unexpected.push(source.href);
        return route.abort();
      }
      await route.fulfill({ status: 200, contentType: 'text/plain; charset=utf-8', body });
    });
    await use(state);
    expect(state.errors, 'No uncaught browser errors').toEqual([]);
    expect(state.unexpected, 'No unmocked sources, analytics or unexpected external requests').toEqual([]);
  },
});
export { expect };
export const settled = async page => {
  await expect(page.locator('#fetchBtn')).toBeEnabled();
  await expect(page.locator('#quotes')).toHaveAttribute('aria-busy', 'false');
};
export const open = async page => { await page.goto('/'); await settled(page); };
export const select = async (page, selector, value) => { await page.locator(selector).selectOption(value); await settled(page); };
