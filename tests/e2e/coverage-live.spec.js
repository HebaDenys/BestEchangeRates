import {test,expect} from '@playwright/test';

// Browser CORS smoke only: no production prices are asserted and no publication
// timestamp is inferred. Explicit opt-in; one GET per source (only Más Matriz).
// Run: COVERAGE_LIVE=1 npx playwright test coverage-live.spec.js --project=desktop-chromium
// Data is loaded cross-origin from the app's actual deployment origin. This test
// fails when transport fails, rather than presenting parser fixtures as live proof.
test('new public sources preserve structured content through real browser CORS',async({page})=>{
 test.skip(!process.env.COVERAGE_LIVE,'External public-source reads require explicit opt-in.');
 test.setTimeout(330000);
 // Empty, same-origin page avoids triggering the application's full source fanout.
 await page.route('https://hebadenys.github.io/BestEchangeRates/coverage-transport-check',route=>route.fulfill({status:200,contentType:'text/html',body:'<!doctype html><title>Coverage transport smoke</title>'}));
 await page.goto('https://hebadenys.github.io/BestEchangeRates/coverage-transport-check');
 const checks = [
  {id:'oriente',url:'https://r.jina.ai/https://www.orientecambios.com.py/',selector:'#panel-004 tr[data-symbol="USD"]'},
  {id:'maxi',url:'https://r.jina.ai/https://www.maxicambios.com.py/',selector:'#cotizacion-carousel .shadow_exchange'},
  {id:'myd',url:'https://r.jina.ai/https://www.mydcambios.com.py/',selector:'.cambios-banner-wrap'},
  {id:'uno',url:'https://r.jina.ai/https://unocambios.com.py/modelos.php?cotizacion&id_sucursal=1',selector:'table td.moneda'},
  {id:'ita-refresh',url:'https://r.jina.ai/https://itacambios.com.py/',textIncludes:'Casa - Matriz',force:true},
  {id:'atlas',textIncludes:'ATLAS ONLINE',url:'https://r.jina.ai/https://www.bancoatlas.com.py/web'},
  {id:'ueno',textIncludes:'Compra Gs.',url:'https://r.jina.ai/https://www.ueno.com.py/cambio-de-moneda/'},
  {id:'familiar',textIncludes:'Dólar Americano Efectivo',url:'https://r.jina.ai/https://familiar.com.py/cambios'},
  {id:'solar',textIncludes:'COMPRA:',url:'https://r.jina.ai/https://www.solar.com.py/'},
  {id:'mas',url:'https://mascambios.com.py/api/cotizaciones.php?sucursal=matriz'},
 ];
 for(const check of checks){
  const result=await page.evaluate(async check=>{
   try {
    const headers=check.url.startsWith('https://r.jina.ai/') ? {'X-Cache-Tolerance':'60',...(check.force?{'X-No-Cache':'true'}:{})} : {};
    if(check.selector)headers['X-Return-Format']='html';
    const response=await fetch(check.url,{headers,signal:AbortSignal.timeout(30000)});
    if(!response.ok){
     let errorName=null;
     try{const error=JSON.parse(await response.text()); const name=error.name || error.error?.name || error.error?.code || error.code; if(typeof name==='string' && /^[A-Za-z0-9_. -]{1,80}$/.test(name))errorName=name;}catch{}
     return {ok:false,status:response.status,errorName};
    }
    const text=await response.text();
    if(check.selector)return {ok:!!new DOMParser().parseFromString(text,'text/html').querySelector(check.selector),status:response.status};
    if(check.textIncludes)return {ok:text.includes(check.textIncludes),status:response.status};
    const data=JSON.parse(text);return {ok:!!data.cotizaciones?.['1']?.compra,status:response.status};
   }catch(error){return {ok:false,error:error.message};}
  },check);
  await test.info().attach(`${check.id}-transport`,{body:JSON.stringify({checkedAt:new Date().toISOString(),...result}),contentType:'application/json'});
  expect.soft(result,`${check.id}: public structured content must be browser-readable`).toMatchObject({ok:true,status:200});
 }
});
