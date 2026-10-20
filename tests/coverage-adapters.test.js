import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {JSDOM} from 'jsdom';
import {COVERAGE_SOURCES,COVERAGE_GAPS,ORIENTE_BRANCHES,MAS_BRANCHES,parseOriente,parseMaxi,parseMyd,parseEuro,parseMas,coverageTimestamp} from '../adapters-coverage.js';
import {PROVIDERS} from '../providers.js';
const DOMParser = new JSDOM('').window.DOMParser;
const now = Date.parse('2026-10-20T11:13:00Z'), options = {DOMParser,now};
const fixture = name => fs.readFileSync(new URL(`./fixtures/coverage-${name}`,import.meta.url),'utf8');
const html = Object.fromEntries(['oriente','maxi','myd'].map(name=>[name,fixture(`${name}.html`)]));
for(const [id,parser,count] of [['oriente',parseOriente,8],['maxi',parseMaxi,2],['myd',parseMyd,2]]) {
 for(const currency of ['USD','EUR','ARS','BRL']) test(`${id} ${currency}: exact verified boards only`,()=>{
  const rows=parser(html[id],currency,options);assert.equal(rows.length,count);assert.equal(new Set(rows.map(q=>q.branch)).size,count);
  assert.ok(rows.every(q=>q.currency===currency&&q.buy>0&&q.sell>=q.buy&&q.channel==='unspecified'));
  if(id!=='oriente')assert.ok(rows.every(q=>q.quoteScope==='city'&&['Asunción','Ciudad del Este'].includes(q.city)));
 });
 test(`${id}: unsupported currency and non-HTML fail closed`,()=>{assert.throws(()=>parser(html[id],'GBP',options));assert.throws(()=>parser('USD 123 456','USD',options));});
}
test('Oriente preserves branch identity and rejects duplicate or mismatched rows',()=>{
 const rows=parseOriente(html.oriente,'USD',options);assert.deepEqual(rows.map(q=>q.branch),ORIENTE_BRANCHES.map(b=>b.branch));assert.ok(!rows.some(q=>q.branchId==='003'));
 assert.throws(()=>parseOriente(html.oriente.replace('data-sucursal="004"','data-sucursal="999"'),'USD',options));
 const d=new DOMParser().parseFromString(html.oriente,'text/html');const row=d.querySelector('tr[data-symbol="USD"]');row.after(row.cloneNode(true));assert.throws(()=>parseOriente(d.documentElement.outerHTML,'USD',options),/duplicada/);
});
test('invalid one Oriente currency row does not discard other branches',()=>{
 const d=new DOMParser().parseFromString(html.oriente,'text/html');d.querySelector('tr[data-symbol="ARS"]').dataset.compra='0';assert.equal(parseOriente(d.documentElement.outerHTML,'ARS',options).length,7);
});
test('Maxi ignores cloned carousel cards and other product panels',()=>{
 const d=new DOMParser().parseFromString(html.maxi,'text/html');const card=d.querySelector('.shadow_exchange');const clone=card.cloneNode(true);clone.classList.add('cloned');card.after(clone);
 assert.equal(parseMaxi(d.documentElement.outerHTML,'USD',options).length,2);
 const extra=d.createElement('div');extra.id='cotizacion-cheq-tra';extra.append(card.cloneNode(true));d.body.append(extra);assert.equal(parseMaxi(d.documentElement.outerHTML,'USD',options).length,2);
});
test('M&D deduplicates identical responsive boards, rejects conflicting duplicates and ignores comments',()=>{
 const rows=parseMyd(html.myd,'BRL',options);assert.equal(rows[0].buy,1110);assert.equal(rows[0].sourceUpdatedLabel,null);
 assert.equal(parseMyd(html.myd+'<!-- <div class="cambios-banner-wrap"><h2>Luque</h2></div> -->','USD',options).length,2);
 const d=new DOMParser().parseFromString(html.myd,'text/html');const img=d.querySelectorAll('img[src$="us-1.png"]')[2];img.closest('ul').querySelectorAll('li')[1].textContent='5601';assert.throws(()=>parseMyd(d.documentElement.outerHTML,'USD',options));
});
test('Euro uses individual row timestamps: stale BRL and ambiguous boundary EUR do not inherit fresh USD',()=>{
 const rows=fixture('euro-central.json');assert.equal(parseEuro(rows,'USD',options)[0].buy,5650);assert.throws(()=>parseEuro(rows,'BRL',options));assert.throws(()=>parseEuro(rows,'EUR',options));
 assert.throws(()=>parseEuro(fixture('euro-sucursal.json'),'USD',{...options,branchId:'2'}));
 const changed=JSON.parse(rows);changed.find(r=>r.id==='EU').fecha='2026-10-19 10:00:00';assert.equal(parseEuro(changed,'EUR',options)[0].sourceTimestampStatus,'timezone-unverified');
 assert.ok(!COVERAGE_SOURCES.some(s=>s.id==='euro'));assert.equal(COVERAGE_GAPS.find(s=>s.id==='euro').status,'transport-pending');
});
test('timestamp cutoff is independent of visitor locale and rejects malformed/stale/future dates',()=>{
 for(const text of ['2026-02-30 10:00:00','2026-10-14 23:59:59','2026-10-22 10:00:00','hoy'])assert.equal(coverageTimestamp(text,{now}).accepted,false);
 assert.equal(coverageTimestamp('2026-10-20 08:00:00',{now}).accepted,true);
});
test('Más never treats response date as quote publication',()=>{
 const payload=JSON.parse(fixture('mas-matriz.json'));for(const date of ['2026-10-20 11:13:00','2099-01-01 00:00:00']){payload.fecha=date;const q=parseMas(payload,'USD','matriz')[0];assert.equal(q.sourceUpdatedLabel,null);assert.equal(q.sourceTimestampStatus,'unknown');assert.equal(q.buy,5850);}
 assert.throws(()=>parseMas(payload,'USD','invented'));assert.equal(MAS_BRANCHES.length,15);
});
test('HTML source contract uses documented format header, city filter and retrieval clock',async()=>{
 for(const source of COVERAGE_SOURCES.filter(s=>s.transport==='reader-html')){
  const calls=[];const rows=await source.fetch('USD',{...options,city:'Asunción',fetcher:async(url,opts)=>{calls.push({url,opts});return {ok:true,text:async()=>html[source.id]};}});
  assert.equal(calls.length,1);assert.equal(calls[0].opts.headers['X-Return-Format'],'html');assert.ok(calls[0].url.startsWith('https://r.jina.ai/'));
  assert.equal(rows.length,1);assert.equal(rows[0].city,'Asunción');assert.equal(rows[0].retrievedAt,new Date(now).toISOString());
 }
});
test('Más filters before read, bounds concurrency and preserves partial branches',async()=>{
 const source=COVERAGE_SOURCES.find(s=>s.id==='mas');let active=0,peak=0;const calls=[];
 const quotes=await source.fetch('USD',{...options,city:'Ciudad del Este',fetcher:async url=>{calls.push(url);active++;peak=Math.max(peak,active);await new Promise(r=>setTimeout(r,1));active--;return {ok:!url.endsWith('sucursal2'),status:503,text:async()=>fixture('mas-matriz.json')};}});
 assert.equal(calls.length,7);assert.ok(peak<=3);assert.equal(quotes.length,6);assert.ok(quotes.every(q=>q.city==='Ciudad del Este'));
});
test('Más does not swallow aborted requests',async()=>{
 const c=new AbortController();c.abort();await assert.rejects(COVERAGE_SOURCES.find(s=>s.id==='mas').fetch('USD',{signal:c.signal}),{name:'AbortError'});
});
test('verified catalog additions remain distinct from quote coverage',()=>{
 const p=id=>PROVIDERS.find(p=>p.id===id);assert.equal(p('uno').cities.length,8);assert.ok(p('uno').cities.includes('Minga Porá'));assert.ok(p('uno').cities.includes('Dr. Juan Eulogio Estigarribia'));
 assert.equal(p('oriente').cities.length,4);assert.ok(p('maxi').cities.includes('Luque'));assert.ok(p('maxi').cities.includes('Mariano Roque Alonso'));
 assert.equal(new Set(PROVIDERS.flatMap(p=>p.cities)).size,26);
});
