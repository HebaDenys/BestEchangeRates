import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {parseBonanza,parseAlberdi,EXTRA_SOURCES} from '../adapters.js';
const fixture = name=>readFileSync(new URL(`fixtures/${name}.txt`,import.meta.url),'utf8');
test('Bonanza: four branch tables, correct cities and no arbitrage',()=>{
  const quotes=parseBonanza(fixture('bonanza'),'USD');
  assert.equal(quotes.length,4);assert.equal(quotes[0].buy,5650);assert.equal(quotes[3].sell,5750);
  assert.equal(quotes[2].city,'Hernandarias');assert.match(quotes[0].sourceUpdatedLabel,/19 de Octubre/);
  for(const c of ['EUR','ARS','BRL']) assert.equal(parseBonanza(fixture('bonanza'),c).length,4);
});
test('Alberdi: branch URL identity and comma decimals',()=>{
  const q=parseAlberdi(fixture('alberdi-encarnacion'),'ARS','encarnacion')[0];
  assert.equal(q.buy,3.45);assert.equal(q.sell,3.6);assert.equal(q.city,'Encarnación');
  assert.throws(()=>parseAlberdi(fixture('alberdi-encarnacion'),'USD','villamorra'));
});
test('Bonanza: fail closed for missing branch or reversed spread',()=>{
 assert.throws(()=>parseBonanza(fixture('bonanza').replace('#### JEBAI','#### OTHER'),'USD'));
 assert.throws(()=>parseBonanza(fixture('bonanza').replace('5.650 |  | 5.720','5.750 |  | 5.720'),'USD'));
});
test('Source fetch records URL and retrieval separately',async()=>{
 const quotes=await EXTRA_SOURCES[0].fetch('BRL',{fetcher:async()=>({ok:true,text:async()=>fixture('bonanza')})});
 assert.equal(quotes[0].sourceId,'bonanza');assert.equal(quotes[0].buy,1110);assert.ok(quotes[0].retrievedAt);
});
import {parseFe,parseIta,parseFenix} from '../adapters.js';
test('FE: four cities/branches, reject suspicious USD typo without fixing it',()=>{
 assert.equal(parseFe(fixture('fe'),'USD').length,3);
 assert.equal(parseFe(fixture('fe'),'ARS').length,4);
 assert.equal(parseFe(fixture('fe'),'ARS')[1].buy,3.4);
});
test('Ita: strips trend annotation, preserves published time, four exact branches',()=>{
 for(const c of ['USD','EUR','ARS','BRL']) assert.equal(parseIta(fixture('ita'),c).length,4);
 const q=parseIta(fixture('ita'),'USD')[0];assert.equal(q.buy,5650);assert.equal(q.sell,5730);assert.match(q.sourceUpdatedLabel,/19 Oct 2026/);
});
test('Fénix: no arbitrage, omit currencies not offered by a branch',()=>{
 assert.equal(parseFenix(fixture('fenix'),'USD').length,8);
 assert.equal(parseFenix(fixture('fenix'),'ARS').length,4);
 assert.equal(parseFenix(fixture('fenix'),'BRL')[0].buy,1100);
});
test('Ita and Fénix reject duplicate branches and shifted columns',()=>{
 assert.throws(()=>parseIta(fixture('ita').replace('## Caja Aux - Edificio Saba','## Casa - Matriz'),'USD'));
 assert.throws(()=>parseFenix(fixture('fenix').replace('### Sucursal 1 (PJC)','### Casa Matriz'),'USD'));
 assert.throws(()=>parseFenix(fixture('fenix').replace('| 5610 | 5780 |','| 5610 | 5780 | 9000 |'),'USD'));
});
test('Alberdi fetch limits requests to chosen city',async()=>{
 const urls=[];
 const q=await EXTRA_SOURCES[1].fetch('USD',{city:'Encarnación',fetcher:async url=>{urls.push(url);return {ok:true,text:async()=>fixture('alberdi-encarnacion')};}});
 assert.equal(urls.length,1);assert.match(urls[0],/suc=encarnacion$/);assert.equal(q[0].city,'Encarnación');
});
import {parseFortuna} from '../adapters.js';
test('Fortuna four branch tables, no mobile duplicate or historical rate',()=>{
 for(const c of ['USD','EUR','ARS','BRL']) assert.equal(parseFortuna(fixture('fortuna'),c).length,4);
 const q=parseFortuna(fixture('fortuna'),'ARS');assert.equal(q[0].buy,2.5);assert.equal(q[1].city,'Salto del Guairá');assert.equal(q[2].buy,4);
 assert.match(q[0].sourceUpdatedLabel,/2:13 PM/);
 assert.throws(()=>parseFortuna(fixture('fortuna').replace('## Aux. Box Jebai','## Main Office'),'USD'));
});
