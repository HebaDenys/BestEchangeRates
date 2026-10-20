import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { JSDOM } from 'jsdom';
const fixtures = Object.fromEntries(['USD','EUR','BRL','ARS'].map(currency => [currency, readFileSync(new URL(`./fixtures/norte-${currency.toLowerCase()}-2026-10-20.md`,import.meta.url),'utf8')]));
const settle = async condition => { for (let i=0;i<100;i++) { if(condition()) return; await new Promise(resolve=>setTimeout(resolve,10)); } throw new Error('UI failed to settle'); };
test('UI: four currencies, buy/sell, invalid input, interrupted requests, failure, cache, manual rates, recovery', async () => {
  const dom = new JSDOM(readFileSync(new URL('../index.html',import.meta.url),'utf8'), {url:'https://example.org/'});
  const originals = {document:globalThis.document,Option:globalThis.Option,fetch:globalThis.fetch};
  globalThis.document=dom.window.document; globalThis.Option=dom.window.Option;
  let fail = false, delay = false;
  globalThis.fetch = async (url, {signal}) => {
    if (!url.includes('nortecambios')) return {ok:false,status:503};
    const currency = url.split('/').pop();
    if (delay && currency === 'EUR') await new Promise(resolve=>setTimeout(resolve,150));
    if (signal.aborted) throw new Error('Aborted');
    return {ok:!fail,status:fail?503:200,text:async()=>fixtures[currency]};
  };
  const $ = id => dom.window.document.getElementById(id);
  const change = (id,value,event='input') => { $(id).value=value; $(id).dispatchEvent(new dom.window.Event(event)); };
  const done = () => !$('fetchBtn').disabled;
  try {
    await import('../script.js'); await settle(done);
    assert.equal($('quotes').querySelector('.branch').textContent,'Asunción');
    assert.equal($('result').textContent,'₲ 565.000');
    assert.ok($('bestFreshness').textContent.length>0);
    assert.equal($('sourceDiagnostics').open,false);
    assert.match($('sourceDiagnostics').textContent,/HTTP 503/);
    assert.ok($('sourceDiagnostics').querySelector('a[href^="https://"]'));
    assert.ok([...$('citySelect').options].some(option=>option.value==='Luque'));
    assert.match($('bankDirectory').textContent,/Presencia en Asunción/);
    assert.match($('bankDirectory').textContent,/Sede bancaria; cambio no confirmado/);
    change('operation','buy'); assert.equal($('result').textContent,'₲ 575.000');
    for (const amount of ['0','-1','','10000000000000']) {change('amount',amount);assert.equal($('result').textContent,'—');assert.equal($('amount').getAttribute('aria-invalid'),'true');}
    change('amount','100');
    for (const [currency,total] of [['EUR','₲ 655.000'],['BRL','₲ 115.500'],['ARS','₲ 380']]) {change('currencySelect',currency,'change'); await settle(done); assert.equal($('result').textContent,total);}
    delay=true; change('currencySelect','EUR','change'); change('currencySelect','USD','change'); await settle(done); await new Promise(resolve=>setTimeout(resolve,200));
    assert.equal($('result').textContent,'₲ 575.000'); assert.match($('calculationDetail').textContent,/USD/);
    change('citySelect','Ciudad del Este','change'); await settle(done); assert.equal($('result').textContent,'₲ 573.000');
    assert.equal($('quotes').querySelector('.branch').textContent,'Ciudad del Este');
    change('citySelect','Asunción','change'); await settle(done);
    fail=true; $('fetchBtn').click();await settle(done);
    assert.ok($('status').classList.contains('error')); assert.equal($('quotes').querySelectorAll('.previous').length,1); assert.equal($('result').textContent,'—');
    change('citySelect','Bella Vista Norte','change');await settle(done);assert.equal($('quotes').querySelectorAll('.previous').length,0);
    change('citySelect','Asunción','change');await settle(done);assert.equal($('quotes').querySelectorAll('.previous').length,1);
    change('quoteSelect','manual');change('manualRate','6000'); assert.equal($('result').textContent,'₲ 600.000'); assert.match($('calculationDetail').textContent,/introducida por ti.*no verificada/);
    change('manualRate','-1');assert.equal($('result').textContent,'—');
    change('manualRate','6000'); change('operation','sell'); assert.equal($('manualRate').value,''); assert.equal($('result').textContent,'—');
    change('operation','buy');
    change('quoteSelect','');change('currencySelect','EUR','change'); await settle(done);$('fetchBtn').click();await settle(done);assert.equal($('result').textContent,'—');
    fail=false;delay=false; $('fetchBtn').click();await settle(done); assert.equal($('result').textContent,'₲ 655.000'); assert.ok(!$('status').classList.contains('error'));
  } finally { Object.assign(globalThis,originals);dom.window.close(); }
});
