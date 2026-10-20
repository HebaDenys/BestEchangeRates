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
 assert.ok(calls[0].options.signal instanceof AbortSignal);assert.equal(calls[0].options.signal.aborted,false);assert.deepEqual(headers,{'X-Return-Format':'html'});
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

test('Reader retries one 429 after Retry-After, timestamps only the successful completed body',async()=>{
 let clock=1000,calls=0;const waits=[];
 const reader=createSourceReader({force:true,now:()=>clock,wait:async(ms)=>{waits.push(ms);clock+=ms;},fetcher:async()=>{
  calls++;return calls===1 ? {ok:false,status:429,headers:new Headers({'Retry-After':'2'})} : {ok:true,status:200,text:async()=>{clock+=5;return 'updated';}};
 }});
 const url='https://r.jina.ai/https://example.org/retry-ok';
 assert.equal(await (await reader.read(url)).text(),'updated');assert.equal(calls,2);assert.deepEqual(waits,[2000]);assert.equal(reader.readings.get(url),3005);
});
test('retry delay parses seconds and HTTP dates, defaults missing header to sixty seconds, rejects excessive or malformed delays',async()=>{
 const {retryAfterDelay}=await import('../source-fetch.js');
 const now=Date.parse('Tue, 20 Oct 2026 12:00:00 GMT');
 assert.equal(retryAfterDelay('12',now),12000);
 assert.equal(retryAfterDelay('Tue, 20 Oct 2026 12:00:30 GMT',now),30000);
 assert.equal(retryAfterDelay(undefined,now),60000);
 for(const value of ['61','-1','garbage','Tue, 20 Oct 2026 12:02:00 GMT']) assert.equal(retryAfterDelay(value,now),null);
});
test('persistent 429 only retries once and no forbidden, excessive-delay, or direct API response retries',async()=>{
 for(const [url,status,retryAfter,expected] of [
  ['https://r.jina.ai/https://example.org/retry-limit',429,undefined,2],
  ['https://r.jina.ai/https://example.org/retry-forbidden',403,'1',1],
  ['https://r.jina.ai/https://example.org/retry-excessive',429,'120',1],
  ['https://example.org/direct-retry.json',429,'1',1]
 ]) {
  let calls=0,waits=0;const reader=createSourceReader({force:true,wait:async()=>{waits++;},fetcher:async()=>{calls++;return {ok:false,status,headers:retryAfter ? new Headers({'Retry-After':retryAfter}) : undefined};}});
  assert.equal((await reader.read(url)).status,status);assert.equal(calls,expected);assert.equal(waits,expected-1);assert.equal(reader.readings.size,0);
 }
});
test('abort during rate-limit wait prevents retry and old cached value is not restored',async()=>{
 const {waitForRetry}=await import('../source-fetch.js');const controller=new AbortController();let calls=0;
 const url='https://r.jina.ai/https://example.org/retry-abort';
 await createSourceReader({fetcher:async()=>({ok:true,text:async()=>'old'})}).read(url);
 const reader=createSourceReader({force:true,wait:(ms,options)=>{queueMicrotask(()=>controller.abort());return waitForRetry(ms,options);},fetcher:async()=>{calls++;return {ok:false,status:429};}});
 await assert.rejects(reader.read(url,{signal:controller.signal}),{name:'AbortError'});
 assert.equal(calls,1);assert.equal(reader.readings.size,0);
 let nextCalls=0;await createSourceReader({fetcher:async()=>{nextCalls++;return {ok:false,status:503};}}).read(url);assert.equal(nextCalls,1);
});
test('network and body timeouts abort attempt, never retry or publish late results',async()=>{
 for(const bodyStalls of [false,true]) {
  let calls=0,seenSignal,resolveLate;
  const late=new Promise(resolve=>{resolveLate=resolve;});
  const reader=createSourceReader({force:true,attemptTimeoutMs:10,fetcher:async(_url,{signal})=>{calls++;seenSignal=signal;if(!bodyStalls)await late;return {ok:true,text:async()=>{if(bodyStalls)await late;return 'too late';}};}});
  await assert.rejects(reader.read(`https://r.jina.ai/https://example.org/attempt-timeout-${bodyStalls}`),{name:'TimeoutError'});
  assert.equal(calls,1);assert.equal(seenSignal.aborted,true);assert.equal(reader.readings.size,0);
  resolveLate();await new Promise(resolve=>setTimeout(resolve,0));assert.equal(reader.readings.size,0);
 }
});
test('parent cancellation promptly aborts an in-flight network attempt',async()=>{
 const controller=new AbortController();let seenSignal;
 const reader=createSourceReader({fetcher:async(_url,{signal})=>{seenSignal=signal;queueMicrotask(()=>controller.abort());return new Promise(()=>{});}});
 await assert.rejects(reader.read('https://example.org/parent-abort',{signal:controller.signal}),{name:'AbortError'});
 assert.equal(seenSignal.aborted,true);assert.equal(reader.readings.size,0);
});

test('Reader 422 retains bounded JSON diagnostics without retry or a fresh reading',async()=>{
 const url='https://r.jina.ai/https://example.org/diagnostic-422';let calls=0;
 const reader=createSourceReader({force:true,fetcher:async()=>{calls++;return new Response(JSON.stringify({name:'AssertionFailureError',code:42202,message:'Failed to goto https://example.org/?token=secret: Error: net::ERR_CONNECTION_RESET',stack:'private stack',headers:{authorization:'secret'}}),{status:422});}});
 const response=await reader.read(url);
 assert.equal(response.ok,false);assert.equal(response.status,422);assert.equal(calls,1);assert.equal(reader.readings.size,0);
 assert.deepEqual(reader.failures.get(url),{status:422,name:'AssertionFailureError',code:'42202',message:'Upstream fetch failed · ERR_CONNECTION_RESET'});
 assert.doesNotMatch(JSON.stringify([...reader.failures.values()]),/secret|https|stack|authorization/);
});
test('diagnostics reject HTML, malformed and oversized JSON and unknown message prose',async()=>{
 const {readerFailureDetails}=await import('../source-fetch.js');
 for(const text of ['<html>secret</html>','{','null','[]','x'.repeat(8193)]) assert.equal(readerFailureDetails(text),null);
 assert.deepEqual(readerFailureDetails(JSON.stringify({error:{name:'SecurityCompromiseError',code:'ACCESS_DENIED',message:'Access denied: secret user@example.com'}})),{name:'SecurityCompromiseError',code:'ACCESS_DENIED',message:'Access/security restriction'});
 assert.equal(readerFailureDetails(JSON.stringify({name:'<script>secret</script>',code:'private credential value',message:'arbitrary private text'})),null);
 let cancelled=false;
 const response=new Response(new ReadableStream({start(c){c.enqueue(new Uint8Array(8193));},cancel(){cancelled=true;}}),{status:422});
 const reader=createSourceReader({fetcher:async()=>response});
 assert.equal((await reader.read('https://r.jina.ai/https://example.org/diagnostic-oversize')).status,422);
 assert.equal(reader.failures.size,0);assert.equal(cancelled,true);
});
test('diagnostic errors never read direct endpoints and are cleared after successful Reader recovery',async()=>{
 let readDirect=false;
 const direct=createSourceReader({fetcher:async()=>({ok:false,status:422,get body(){readDirect=true;throw Error('must not inspect');}})});
 assert.equal((await direct.read('https://example.org/private')).status,422);assert.equal(readDirect,false);
 let calls=0;const url='https://r.jina.ai/https://example.org/diagnostic-recovery';
 const reader=createSourceReader({force:true,fetcher:async()=>++calls===1 ? new Response('{"name":"AssertionFailureError","message":"Timeout"}',{status:422}) : new Response('recovered')});
 await reader.read(url);assert.equal(reader.failures.size,1);await reader.read(url);assert.equal(reader.failures.size,0);
});
test('error-body diagnostics stay within attempt timeout and do not publish late state',async()=>{
 let release;
 const response=new Response(new ReadableStream({start(c){release=()=>{c.enqueue(new TextEncoder().encode('{"name":"AssertionFailureError"}'));c.close();};}}),{status:422});
 const reader=createSourceReader({attemptTimeoutMs:10,fetcher:async()=>response});
 await assert.rejects(reader.read('https://r.jina.ai/https://example.org/diagnostic-stall'),{name:'TimeoutError'});
 release();await new Promise(r=>setTimeout(r,0));assert.equal(reader.failures.size,0);assert.equal(reader.readings.size,0);
});
test('429 JSON diagnostic capture preserves a single retry and clears recovered failure',async()=>{
 let calls=0,waits=0;
 const reader=createSourceReader({force:true,wait:async()=>{waits++;},fetcher:async()=>++calls===1 ? new Response('{"name":"RateLimitError","message":"Too many requests"}',{status:429,headers:{'Retry-After':'0'}}) : new Response('fresh')});
 const response=await reader.read('https://r.jina.ai/https://example.org/diagnostic-retry');
 assert.equal(response.ok,true);assert.equal(calls,2);assert.equal(waits,1);assert.equal(reader.failures.size,0);
});
