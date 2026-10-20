import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseUno,parseValor,parseRioParana,parseTripleC,parseMercosur,MORE_SOURCES} from '../adapters-extra.js';
const fixture=n=>readFileSync(new URL(`fixtures/extra-${n}.txt`,import.meta.url),'utf8');
const now=Date.parse('2026-10-20T00:28:00Z');
test('Valor city exact and mixed thousands/decimal syntax',()=>{
 assert.equal(parseValor(fixture('valor'),'USD')[0].buy,5640);
 assert.equal(parseValor(fixture('valor'),'BRL')[0].buy,1100);
 assert.equal(parseValor(fixture('valor'),'ARS')[0].buy,3.45);
 assert.equal(parseValor(fixture('valor'),'EUR')[1].city,'Hernandarias');
 assert.throws(()=>parseValor(fixture('valor').replace('CASA CENTRAL','UNVERIFIED'),'USD'));
});
test('Rio Paraná only fresh confirmed branches, no stale winner',()=>{
 for(const c of ['USD','EUR','ARS','BRL'])assert.equal(parseRioParana(fixture('rioparana'),c,{now}).length,1);
 assert.equal(parseRioParana(fixture('rioparana'),'ARS',{now})[0].buy,2.5);
 assert.throws(()=>parseRioParana(fixture('rioparana'),'USD',{now:now+10*86400000}));
});
test('Triple C excludes stale and unverified branches, preserves city',()=>{
 const q=parseTripleC(fixture('triplec'),'ARS',{now});assert.equal(q.length,3);assert.equal(q[2].buy,3.5);assert.equal(q[2].city,'Asunción');
 assert.throws(()=>parseTripleC(fixture('triplec').replace('PJC Matriz  PJC Sucursal','UNKNOWN'),'USD',{now}));
});
test('Mercosur omits conflicting USD at Matriz; identical duplicates safe',()=>{
 const q=parseMercosur(fixture('mercosur'),'USD',{now});assert.equal(q.length,2);assert.equal(q[0].branch,'GRAN VIA KM 4');assert.equal(q[1].city,'San Alberto');
 assert.equal(parseMercosur(fixture('mercosur'),'BRL',{now}).length,3);
 assert.equal(parseMercosur(fixture('mercosur'),'ARS',{now})[0].buy,3);
});
test('Extra source retrieval provenance and city filter',async()=>{
 const q=await MORE_SOURCES.find(s=>s.id==='valor').fetch('USD',{city:'Hernandarias',fetcher:async()=>({ok:true,text:async()=>fixture('valor')})});
 assert.equal(q.length,1);assert.equal(q[0].sourceId,'valor');assert.ok(q[0].retrievedAt);assert.match(q[0].sourceUpdatedLabel,/19\/10/);
});

test('Uno main branch verified CDE, decimals and arbitrage excluded',()=>{
 for(const c of ['USD','EUR','ARS','BRL'])assert.equal(parseUno(fixture('uno'),c).length,1);
 assert.equal(parseUno(fixture('uno'),'USD')[0].buy,5645);
 assert.equal(parseUno(fixture('uno'),'ARS')[0].buy,3.41);
 assert.equal(parseUno(fixture('uno'),'BRL')[0].sell,1145);
 assert.throws(()=>parseUno(fixture('uno').replace('Uno Cambios S.A., Casa Matriz','Unknown'),'USD'));
});
