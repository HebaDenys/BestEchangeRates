import { readFileSync } from 'node:fs';
import { test as base, expect } from '@playwright/test';

const read = name => readFileSync(new URL(`../fixtures/${name}`, import.meta.url), 'utf8');
const files = {
  'www.bonanzacambios.com.py': 'bonanza.txt',
  'www.fortunacambios.com.py': 'fortuna.txt',
  'www.fecambios.com.py': 'fe.txt',
  'itacambios.com.py': 'ita.txt',
  'fenixexchange.com.py': 'fenix.txt',
  'unocambios.com.py': 'extra-uno.txt',
  'www.valor.com.py': 'extra-valor.txt',
  'cambiosrioparana.com.py': 'extra-rioparana.txt',
  'cambiostriplec.com.py': 'extra-triplec.txt',
  'site.mercosurcambios.com': 'extra-mercosur.txt',
};

export const test = base.extend({
  sources: async ({ page }, use) => {
    const state = { fail: false, norteOnly: false, delayEUR: false, requests: [], unexpected: [], errors: [] };
    // Freeze Date only: cache age is stable, but real request/abort timers still run.
    await page.clock.setFixedTime(new Date('2026-10-20T01:00:00Z'));
    page.on('pageerror', error => state.errors.push(error.message));
    await page.route('**/*', async route => {
      const url = new URL(route.request().url());
      if (url.origin === 'http://127.0.0.1:8766') return route.continue();
      if (url.hostname !== 'r.jina.ai') {
        state.unexpected.push(url.href);
        return route.abort();
      }
      state.requests.push(url.href);
      const source = new URL(url.href.slice('https://r.jina.ai/'.length));
      if (state.delayEUR && source.pathname.endsWith('/EUR')) await new Promise(resolve => setTimeout(resolve, 350));
      if (state.fail || (state.norteOnly && source.hostname !== 'www.nortecambios.com.py')) return route.fulfill({ status: 503, body: 'Fixture unavailable' });
      let body;
      if (source.hostname === 'www.nortecambios.com.py') body = read(`norte-${source.pathname.split('/').pop().toLowerCase()}-2026-10-20.md`);
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
