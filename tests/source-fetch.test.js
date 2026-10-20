import test from 'node:test';
import assert from 'node:assert/strict';
import {createSourceReader} from '../source-fetch.js';
test('raw page cache preserves actual retrieval time, expires, and refresh bypasses',async()=>{
 let calls=0,clock=1000;const url='https://example.org/cache-test';
 const fetcher=async()=>{calls++;return {ok:true,text:async()=>`page${calls}`};};
 const options={fetcher,now:()=>clock};
 let reader=createSourceReader(options);assert.equal(await (await reader.read(url)).text(),'page1');assert.equal(reader.readings.get(url),1000);
 clock=2000;reader=createSourceReader(options);assert.equal(await (await reader.read(url)).text(),'page1');assert.equal(reader.readings.get(url),1000);assert.equal(calls,1);
 reader=createSourceReader({...options,force:true});assert.equal(await (await reader.read(url)).text(),'page2');assert.equal(reader.readings.get(url),2000);
 clock=63000;reader=createSourceReader(options);await reader.read(url);assert.equal(calls,3);
});
test('failed explicit refresh invalidates cache and abort never publishes a new reading',async()=>{
 const url='https://example.org/cache-failure-test';let fail=false,calls=0;
 const fetcher=async()=>{calls++;return {ok:!fail,status:fail?503:200,text:async()=>'page'};};
 await createSourceReader({fetcher}).read(url); fail=true;
 const forced=createSourceReader({fetcher,force:true});assert.equal((await forced.read(url)).ok,false);assert.equal(forced.readings.size,0);
 assert.equal((await createSourceReader({fetcher}).read(url)).ok,false);assert.equal(calls,3);
 const controller=new AbortController();controller.abort();await assert.rejects(createSourceReader({fetcher}).read(url,{signal:controller.signal}),/Aborted/);assert.equal(calls,3);
});
test('interrupted response body cannot revive pre-refresh cached page',async()=>{
 const url='https://example.org/cache-body-test';let broken=false,calls=0;
 const fetcher=async()=>{calls++;return {ok:true,text:async()=>{if(broken)throw Error('Body interrupted');return 'page';}};};
 await createSourceReader({fetcher}).read(url);broken=true;
 await assert.rejects(createSourceReader({fetcher,force:true}).read(url),/Body interrupted/);
 await assert.rejects(createSourceReader({fetcher}).read(url),/Body interrupted/);assert.equal(calls,3);
});

test('HTML and markdown representations do not share cached bodies',async()=>{
 const url='https://example.org/format-cache-test';let calls=0;
 const fetcher=async(_url,options)=>{calls++;return {ok:true,text:async()=>new Headers(options.headers).get('x-return-format')||'markdown'};};
 const reader=createSourceReader({fetcher,now:()=>12345});
 assert.equal(await (await reader.read(url)).text(),'markdown');
 assert.equal(await (await reader.read(url,{headers:{'X-Return-Format':'html'}})).text(),'html');
 assert.equal(await (await reader.read(url,{headers:{'x-return-format':'html'}})).text(),'html');
 assert.equal(calls,2);assert.equal(reader.readings.get(url),12345);
});

test('Reader refresh bypasses upstream cache, preserves HTML headers and signal, and does not mutate caller headers',async()=>{
 const calls=[];const fetcher=async(url,options)=>{calls.push({url,options});return {ok:true,text:async()=>'fresh'};};
 const controller=new AbortController(),headers={'X-Return-Format':'html'};
 const url='https://r.jina.ai/https://example.org/upstream-freshness';
 await createSourceReader({fetcher,force:true}).read(url,{signal:controller.signal,headers});
 assert.equal(calls[0].options.headers.get('x-no-cache'),'true');
 assert.equal(calls[0].options.headers.get('x-cache-tolerance'),'60');
 assert.equal(calls[0].options.headers.get('x-return-format'),'html');
 assert.equal(calls[0].options.signal,controller.signal);assert.deepEqual(headers,{'X-Return-Format':'html'});
 await createSourceReader({fetcher}).read(url+'-normal');
 assert.equal(calls[1].options.headers.get('x-cache-tolerance'),'60');
 assert.equal(calls[1].options.headers.has('x-no-cache'),false);
});
test('direct JSON endpoints and lookalike hosts never receive Reader cache headers',async()=>{
 for(const url of ['https://example.org/rates.json','https://r.jina.ai.example.org/rates.json','https://example.org/?proxy=r.jina.ai']) {
  const headers={'Accept':'application/json'};let sent;
  await createSourceReader({force:true,fetcher:async(_url,options)=>{sent=options;return {ok:true,text:async()=>'[]'};}}).read(url,{headers});
  assert.equal(sent.headers,headers);assert.equal(new Headers(sent.headers).has('x-no-cache'),false);assert.equal(new Headers(sent.headers).has('x-cache-tolerance'),false);
 }
});
test('failure diagnostics use safe categories and fair queue cannot starve banks behind all houses',async()=>{
 const {sourceFailureReason,fairSourceQueue}=await import('../source-fetch.js');
 assert.equal(sourceFailureReason(Error('La fuente no respondió (HTTP 429)')),'HTTP 429 · Límite temporal de consultas');
 assert.equal(sourceFailureReason(Error('<script>secret body</script>')),'Formato de fuente no verificable');
 assert.equal(sourceFailureReason(new TypeError('Failed to fetch')),'Error de conexión');
 assert.equal(sourceFailureReason(Error('No hay cotizaciones verificables')),'Sin cotización verificable');
 assert.equal(sourceFailureReason(Error('Aborted'),{timedOut:true}),'Tiempo de espera agotado');
 assert.equal(sourceFailureReason(Error('Aborted'),{aborted:true}),'Tiempo de espera agotado');
 const sources=['house1','house2','house3','bank1','bank2'];
 assert.deepEqual(fairSourceQueue(sources,value=>value.startsWith('bank')),['house1','bank1','house2','bank2','house3']);
 assert.deepEqual(sources,['house1','house2','house3','bank1','bank2']);
});
