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
