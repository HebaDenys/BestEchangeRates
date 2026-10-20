import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {BANK_SOURCES,parseAtlas,parseUeno,parseFamiliar,parseSolar} from '../adapters-banks.js';
import {BANK_PROVIDERS,BANK_REGISTER} from '../bank-providers.js';
const fixture=name=>readFileSync(new URL(`./fixtures/bank-${name}-2026-10-20.txt`,import.meta.url),'utf8');

test('Atlas preserves channel pairs and explicit unavailable cells',()=>{
 const usd=parseAtlas(fixture('atlas'),'USD');assert.deepEqual(usd.map(q=>[q.channel,q.buy,q.sell]),[['cash',5600,5840],['cheque',5620,5830],['online',5630,5820]]);
 const brl=parseAtlas(fixture('atlas'),'BRL');assert.equal(brl[1].buy,null);assert.equal(brl[1].sell,null);assert.equal(brl[1].availability,'unavailable');
 const partial=parseAtlas(fixture('atlas').replace('| 5600 | 5840 |','| N/A | 5840 |'),'USD')[0];assert.equal(partial.buy,null);assert.equal(partial.availability,'partial');
});
test('Atlas rejects renamed channel headings and altered column count',()=>{
 assert.throws(()=>parseAtlas(fixture('atlas').replace('| CHEQUE |','| OTRO |'),'USD'));
 assert.throws(()=>parseAtlas(fixture('atlas').replace('| Dólares | 5600 |','| Dólares | 5600 | 1 |'),'USD'));
});
test('Ueno app, cash, transfer are distinct; unsupported currency has no fabricated quote',()=>{
 assert.deepEqual(parseUeno(fixture('ueno'),'USD').map(q=>[q.channel,q.buy,q.sell]),[['app',5650,5850],['cash',5630,5860]]);
 assert.deepEqual(parseUeno(fixture('ueno'),'EUR').map(q=>q.channel),['cash','transfer']);
 assert.match(parseUeno(fixture('ueno'),'USD')[1].serviceNote,/ueno bank x/);
 assert.throws(()=>parseUeno(fixture('ueno'),'BRL'));
});
test('Familiar combined cheque/transfer is not split; Peso/Real remain unspecified',()=>{
 assert.deepEqual(parseFamiliar(fixture('familiar'),'USD').map(q=>q.channel),['cash','cheque_transfer']);
 assert.deepEqual(parseFamiliar(fixture('familiar'),'ARS').map(q=>[q.channel,q.buy,q.sell]),[['unspecified',1,5]]);
 assert.equal(parseFamiliar(fixture('familiar'),'BRL')[0].channel,'unspecified');
 assert.throws(()=>parseFamiliar(fixture('familiar').replace('Peso Argentino','Peso Chileno'),'ARS'));
});
test('Solar deduplicates ticker and parses decimal comma without assuming cash',()=>{
 const quotes=parseSolar(fixture('solar'),'ARS');assert.equal(quotes.length,1);assert.equal(quotes[0].sell,4.5);assert.equal(quotes[0].channel,'unspecified');
 assert.throws(()=>parseSolar(fixture('solar').replace('VENTA: 4,50','VENTA: 5,50'),'ARS'),/contradictorias/);
});
test('invalid/reversed values fail closed and duplicate agreement is allowed',()=>{
 for(const [parser,name] of [[parseAtlas,'atlas'],[parseUeno,'ueno'],[parseFamiliar,'familiar'],[parseSolar,'solar']]){
  assert.throws(()=>parser(fixture(name),'GBP'));
  assert.deepEqual(parser(fixture(name)+ '\n'+fixture(name),'USD'),parser(fixture(name),'USD'));
 }
 assert.throws(()=>parseUeno(fixture('ueno').replace('5.650','99.000'),'USD'));
 assert.throws(()=>parseFamiliar(fixture('familiar').replace('\n5600\n','\n0\n'),'USD'));
 assert.throws(()=>parseSolar(fixture('solar').replace('COMPRA: 5650','COMPRA: bad'),'USD'));
});
test('all adapters use public Reader transport, stamps retrieval only and never synthesize a city',async()=>{
 for(const source of BANK_SOURCES){let requested;const quotes=await source.fetch('USD',{city:'Asunción',now:()=>Date.parse('2026-10-20T12:00:00Z'),fetcher:async url=>{requested=url;return {ok:true,text:async()=>fixture(source.id)};}});
  assert.equal(requested,`https://r.jina.ai/${source.url}`);assert.equal(source.institutionType,'bank');assert.deepEqual(source.cities,[]);assert.deepEqual(source.supportedCurrencies,source.id==='ueno'?['USD','EUR']:['USD','EUR','ARS','BRL']);assert.equal(source.sourceUpdatedLabel,null);
  for(const q of quotes){assert.equal(q.city,null);assert.equal(q.geographicScope,'bank_publication_unspecified');assert.equal(q.sourceUpdatedLabel,null);assert.equal(q.retrievedAt,'2026-10-20T12:00:00.000Z');assert.equal(q.url,source.url);}
 }
 await assert.rejects(()=>BANK_SOURCES[0].fetch('USD',{fetcher:async()=>({ok:false,status:503})}),/HTTP 503/);
});
test('directory separates sixteen institutions from four adapters and does not invent Brazil URL',()=>{
 assert.equal(BANK_PROVIDERS.length,16);assert.equal(new Set(BANK_PROVIDERS.map(p=>p.id)).size,16);
 assert.equal(BANK_PROVIDERS.filter(p=>p.feedStatus==='public_adapter').length,4);
 const brasil=BANK_PROVIDERS.find(p=>p.id==='bancodobrasil');assert.equal(brasil.officialWebsite,null);assert.equal(brasil.url,BANK_REGISTER.url);
 assert.equal(BANK_PROVIDERS.filter(p=>p.cities.length>0).length,4);
 assert.ok(BANK_PROVIDERS.every(p=>p.geographicScope==='bank_publication_unspecified'));
});

test('Atlas fetches the verified public destination without the root JS navigation',async()=>{
 const source=BANK_SOURCES.find(s=>s.id==='atlas');
 assert.equal(source.url,'https://www.bancoatlas.com.py/web');
 assert.equal(BANK_PROVIDERS.find(p=>p.id==='atlas').url,source.url);
 const text=readFileSync(new URL('./fixtures/bank-atlas-web-2026-10-20.txt',import.meta.url),'utf8');
 for(const currency of source.supportedCurrencies){
  let requested;
  const quotes=await source.fetch(currency,{fetcher:async url=>{requested=url;return {ok:true,text:async()=>text};}});
  assert.equal(requested,'https://r.jina.ai/https://www.bancoatlas.com.py/web');
  assert.deepEqual(quotes.map(q=>q.channel),['cash','cheque','online']);
  assert.equal(quotes.length,3);
 }
 assert.deepEqual(parseAtlas(text,'USD').map(q=>[q.channel,q.buy,q.sell]),[['cash',5630,5890],['cheque',5640,5880],['online',5650,5870]]);
});
