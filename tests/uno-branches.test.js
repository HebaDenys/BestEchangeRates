import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {JSDOM} from 'jsdom';
import {UNO_BRANCHES,parseUnoBranch,MORE_SOURCES} from '../adapters-extra.js';
const DOMParser=new JSDOM('').window.DOMParser;
const fixture=name=>readFileSync(new URL(`fixtures/uno/${name}`,import.meta.url),'utf8');
const html=id=>fixture(`branch-${id}.html`);
const uno=MORE_SOURCES.find(s=>s.id==='uno');
const options={DOMParser};
const saved=['1','2','3','7','8','15','18'];
test('Uno exact official selector IDs and eight directory-backed cities',()=>{
 const doc=new DOMParser().parseFromString(fixture('home-2026-10-20.html'),'text/html');
 assert.deepEqual([...doc.querySelectorAll('select#cotizacion option')].map(o=>o.value),UNO_BRANCHES.map(b=>b.id));
 assert.equal(UNO_BRANCHES.length,16);assert.equal(uno.cities.length,8);
 assert.deepEqual(uno.cities.slice().sort(),['Asunción','Ciudad del Este','Dr. Juan Eulogio Estigarribia','Minga Porá','Nueva Esperanza','Pedro Juan Caballero','San Alberto','Santa Rita'].sort());
 assert.match(fixture('branches-2026-10-20.html'),/DR\. JUAN EULOGIO ESTIGARRIBIA - CAAGUAZU - PARAGUAY/);
 assert.equal(UNO_BRANCHES.find(b=>b.id==='18').city,'Dr. Juan Eulogio Estigarribia');
});
test('Uno saved real branches retain independent prices and unknown publication dates',()=>{
 const expected={1:5645,2:6800,3:5630,7:5650,8:5600,15:5650,18:5580};
 for(const id of saved){
  const [q]=parseUnoBranch(html(id),'USD',id,options);
  assert.equal(q.buy,expected[id]);assert.equal(q.branchId,id);assert.equal(q.sourceUpdatedLabel,null);assert.equal(q.sourceTimestampStatus,'unknown');
 }
 assert.equal(parseUnoBranch(html('2'),'ARS','2',options)[0].buy,3.5);
 assert.equal(parseUnoBranch(html('1'),'ARS','1',options)[0].buy,3.41);
});
test('Uno missing branch currency is not substituted with main-board rate',()=>{
 for(const id of saved)for(const currency of ['USD','BRL','ARS','EUR']){
  if(id==='7'&&['ARS','EUR'].includes(currency))assert.throws(()=>parseUnoBranch(html(id),currency,id,options),/ausente/);
  else assert.equal(parseUnoBranch(html(id),currency,id,options).length,1);
 }
});
test('Uno rejects unknown identity, homepage fallback, duplicates and invalid prices',()=>{
 assert.throws(()=>parseUnoBranch(html('2'),'USD','999',options),/Sucursal/);
 assert.throws(()=>parseUnoBranch(html('2'),'GBP','2',options),/Moneda/);
 assert.throws(()=>parseUnoBranch(fixture('home-2026-10-20.html'),'USD','2',options),/Tabla/);
 const d=new DOMParser().parseFromString(html('2'),'text/html');const row=d.querySelector('tr');row.after(row.cloneNode(true));
 assert.throws(()=>parseUnoBranch(d.documentElement.outerHTML,'USD','2',options),/duplicada/);
 assert.throws(()=>parseUnoBranch(html('2').replace('6.980,00','1,00'),'USD','2',options),/inválida/);
});
test('Uno filters city before fetch and retains endpoint provenance',async()=>{
 const calls=[];
 const q=await uno.fetch('USD',{...options,city:'Dr. Juan Eulogio Estigarribia',fetcher:async(url,init)=>{
  calls.push(url);assert.equal(init.headers['X-Return-Format'],'html');return {ok:true,text:async()=>html('18')};
 }});
 assert.equal(calls.length,1);assert.match(calls[0],/id_sucursal=18$/);assert.equal(q[0].sourceId,'uno');assert.match(q[0].url,/id_sucursal=18$/);assert.ok(q[0].retrievedAt);
});
test('Uno bounds concurrency and never fabricates failed or rate-limited branches',async()=>{
 let running=0,max=0;const called=[];
 const q=await uno.fetch('USD',{...options,city:'all',fetcher:async(url)=>{
  const id=new URL(url).searchParams.get('id_sucursal');called.push(id);running++;max=Math.max(max,running);
  await new Promise(resolve=>setTimeout(resolve,1));running--;
  return saved.includes(id)?{ok:true,text:async()=>html(id)}:{ok:false,status:429};
 }});
 assert.equal(max,3);assert.equal(called.length,16);assert.deepEqual(q.map(r=>r.branchId).sort(),saved.slice().sort());
 assert.equal(q.length,7);assert.ok(q.every(r=>r.sourceUpdatedLabel===null));
});
test('Uno makes no calls for unsupported city or already aborted request',async()=>{
 let calls=0;const fetcher=async()=>{calls++;throw Error('Unexpected fetch');};
 await assert.rejects(uno.fetch('USD',{...options,city:'Unknown',fetcher}));
 const controller=new AbortController();controller.abort();await assert.rejects(uno.fetch('USD',{...options,signal:controller.signal,fetcher}),{name:'AbortError'});
 assert.equal(calls,0);
});
