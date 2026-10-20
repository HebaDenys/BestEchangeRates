import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const fixture = name => readFileSync(new URL(`fixtures/${name}`, import.meta.url), 'utf8');
test('multi-provider cities, rankings, selection stability and partial-city failure cache', async () => {
  const dom = new JSDOM(readFileSync(new URL('../index.html', import.meta.url), 'utf8'), { url: 'https://example.org/' });
  const originals = { document: globalThis.document, Option: globalThis.Option, fetch: globalThis.fetch };
  globalThis.document = dom.window.document;
  globalThis.Option = dom.window.Option;
  let failEncarnacion = false, enableExtra = false;
  globalThis.fetch = async (url, { signal }) => {
    let body;
    if (url.includes('nortecambios')) {
      await new Promise(resolve => setTimeout(resolve, 60));
      body = fixture(`norte-${url.split('/').pop().toLowerCase()}-2026-10-20.md`);
    } else if (url.includes('bonanzacambios')) {
      body = fixture('bonanza.txt');
    } else if (url.includes('cambiosalberdi')) {
      const key = new URL(url.slice('https://r.jina.ai/'.length)).searchParams.get('suc');
      if (failEncarnacion && key === 'encarnacion') throw new Error('Branch unavailable');
      // Synthetic branch responses test routing, not real-world branch prices.
      body = fixture('alberdi-encarnacion.txt').replace('suc=encarnacion\n', `suc=${key}\n`);
    } else if (enableExtra && url.includes('fecambios')) body = fixture('fe.txt');
    else if (enableExtra && url.includes('itacambios')) body = fixture('ita.txt');
    else if (enableExtra && url.includes('fenixexchange')) body = fixture('fenix.txt');
    else return { ok: false, status: 503 };
    if (signal.aborted) throw new Error('Aborted');
    return { ok: true, text: async () => body };
  };
  const $ = id => dom.window.document.getElementById(id);
  const change = (id, value, event = 'change') => { $(id).value = value; $(id).dispatchEvent(new dom.window.Event(event)); };
  const settle = async () => {
    for (let i = 0; i < 200; i++) { if (!$('fetchBtn').disabled) return; await new Promise(resolve => setTimeout(resolve, 10)); }
    throw new Error('Multi-provider refresh did not settle');
  };
  const cards = () => [...document.querySelectorAll('.quote')];
  try {
    await import('../script.js'); await settle();
    assert.equal(cards().length, 3);
    change('citySelect', ''); await settle();
    assert.equal(cards().length, 16);
    assert.ok(cards().some(card => card.textContent.includes('Paraná Country · Hernandarias')));
    change('citySelect', 'Ciudad del Este'); await settle();
    assert.equal(cards().length, 5);
    const rates = column => cards().map(card => Number(card.querySelectorAll('.price-value')[column].textContent.replace(/[^0-9,]/g, '').replace(',', '.')));
    assert.deepEqual(rates(0), [...rates(0)].sort((a, b) => b - a));
    change('operation', 'buy', 'input');
    assert.deepEqual(rates(1), [...rates(1)].sort((a, b) => a - b));
    change('operation', 'sell', 'input');
    assert.ok(!cards().some(card => card.textContent.includes('Asunción') || card.textContent.includes('Hernandarias')));
    const selected = [...$('quoteSelect').options].find(option => option.textContent.includes('Bonanza') && option.textContent.includes('Jebai'));
    change('quoteSelect', selected.value, 'input');
    const previousDetail = $('calculationDetail').textContent;
    $('fetchBtn').click(); await settle();
    assert.equal($('calculationDetail').textContent, previousDetail);
    change('citySelect', 'Encarnación'); await settle();
    assert.equal(cards().length, 1);
    failEncarnacion = true;
    $('fetchBtn').click(); await settle();
    assert.equal(document.querySelectorAll('.previous').length, 1);
    assert.equal($('result').textContent, '—');
    change('citySelect', 'Asunción'); await settle();
    assert.equal(cards().length, 3);
    assert.equal(document.querySelectorAll('.previous').length, 0);
    assert.ok(!cards().some(card => card.textContent.includes('Encarnación')));
    failEncarnacion = false; enableExtra = true;
    $('fetchBtn').click(); await settle();
    assert.equal(cards().length, 7);
    change('citySelect', ''); await settle();
    assert.equal(cards().length, 31);
    change('citySelect', 'Ciudad del Este'); await settle();
    assert.equal(cards().length, 10);
  } finally { Object.assign(globalThis, originals); dom.window.close(); }
});
