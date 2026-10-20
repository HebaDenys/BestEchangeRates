import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { parseGuarani, parseNorte, parseNorteCurrency, calculate, fetchSource, proxyUrl, SOURCES } from '../rates.js';
const fixture = readFileSync(new URL('./fixtures/norte-2026-10-20.md', import.meta.url), 'utf8');
test('Paraguay grouping and decimals are unambiguous', () => {
  for (const [input, value] of [['7.300', 7300], ['7.300,50',7300.5], ['3,00',3], ['1.234.567',1234567], ['123',123], ['5.650 arrow_upward',5650]]) assert.equal(parseGuarani(input),value);
  for (const input of ['', '-1', '0', 'NaN', '7.30', '1,234.56', '7.300 8.000', '1e5']) assert.throws(() => parseGuarani(input));
});
test('real homepage snapshot identifies branch and exact currencies, not crosspairs', () => {
  for (const currency of ['USD','EUR','ARS','BRL']) {
    const [quote] = parseNorte(fixture,currency);
    assert.equal(quote.branch,'Pedro Juan Caballero');
    assert.equal(quote.currency,currency);
    assert.ok(quote.buy > 0);
    assert.ok(quote.sell >= quote.buy);
    assert.match(quote.sourceUpdatedLabel,/Actualizado/);
    assert.equal(quote.updated, undefined);
  }
  assert.equal(parseNorte(fixture,'USD')[0].buy,5650);
  assert.equal(parseNorte(fixture,'BRL')[0].buy,1105);
});
test('missing, malformed, duplicate and crossed rates fail closed', () => {
  assert.throws(() => parseNorte('Login required', 'USD'));
  assert.throws(() => parseNorte(fixture, 'JPY'));
  assert.throws(() => parseNorte(fixture.replace('5.650 arrow_upward','6.000 arrow_upward'),'USD'));
  assert.throws(() => parseNorte(fixture.replace('5.650 arrow_upward','bad'),'USD'));
  assert.throws(() => parseNorte(fixture + fixture,'USD'));
});
test('calculator uses house buy when user sells, house sell when user buys', () => {
  const quote = {buy:7300,sell:7400};
  assert.equal(calculate(100,quote,'sell'),730000);
  assert.equal(calculate(100,quote,'buy'),740000);
  for (const value of [0,-1,Infinity,NaN,1e13]) assert.equal(calculate(value,quote,'sell'),null);
  assert.equal(calculate(100,null,'sell'),null);
  assert.equal(calculate(100,quote,'unknown'),null);
});
test('proxy preserves target scheme and path', () => {
  assert.equal(proxyUrl(SOURCES[0].url),'https://r.jina.ai/https://www.nortecambios.com.py/');
  assert.throws(() => proxyUrl('http://example.com'));
});
test('successful fetch records retrieval, not a fabricated source timestamp', async () => {
  const [quote] = await fetchSource(SOURCES[0],'EUR',{fetcher:async()=>({ok:true,text:async()=>readFileSync(new URL('./fixtures/norte-eur-2026-10-20.md', import.meta.url),'utf8')})});
  assert.equal(quote.sourceName,'Norte Cambios');
  assert.ok(Number.isFinite(Date.parse(quote.retrievedAt)));
  assert.equal(quote.updated,undefined);
});
test('HTTP and parse errors remain rejections', async () => {
  await assert.rejects(fetchSource(SOURCES[0],'USD',{fetcher:async()=>({ok:false,status:503})}),/503/);
  await assert.rejects(fetchSource(SOURCES[0],'USD',{fetcher:async()=>({ok:true,text:async()=>'empty'})}));
});

test('currency pages require exact currency and verified city rows', () => {
  for (const [currency,buy,sell] of [['USD',5650,5750],['EUR',6300,6550],['BRL',1115,1155],['ARS',3.4,3.8]]) {
    const text = readFileSync(new URL(`./fixtures/norte-${currency.toLowerCase()}-2026-10-20.md`,import.meta.url),'utf8');
    const rows = parseNorteCurrency(text,currency);
    const quote = rows.find(row=>row.city==='Asunción');
    assert.equal(rows.length,7);
    assert.equal(quote.branch,'Asunción'); assert.equal(quote.buy,buy); assert.equal(quote.sell,sell);
    assert.throws(()=>parseNorteCurrency(text,currency === 'USD' ? 'EUR' : 'USD')); 
    assert.equal(parseNorteCurrency(text.replaceAll('Asunción','Other city'),currency).some(row=>row.city==='Other city'),false);
    assert.throws(()=>parseNorteCurrency(text.replace('| [Asunción]', '| [Pedro Juan Caballero]'),currency));
  }
});

test('reject cross-currency headings rather than mislabel a branch rate', () => {
  const text = readFileSync(new URL('./fixtures/norte-brl-2026-10-20.md',import.meta.url),'utf8');
  const crossed = text.replace('## ![Image 6: BRL]', '## ![USD](https://www.nortecambios.com.py/img/core/flag-usd.png) ![Image 6: BRL]');
  assert.throws(()=>parseNorteCurrency(crossed,'USD'));
  assert.throws(()=>parseNorteCurrency(crossed,'BRL'));
});
