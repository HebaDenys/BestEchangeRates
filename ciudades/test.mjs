// Static regression checks. Run: node --test ciudades/test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync,readdirSync} from 'node:fs';
import {fileURLToPath} from 'node:url';
import {resolve,dirname} from 'node:path';
import {JSDOM} from 'jsdom';
import {PROVIDERS} from '../providers.js';
const root=fileURLToPath(new URL('../',import.meta.url));
const base='https://hebadenys.github.io/BestEchangeRates/';
const cities={'asuncion.html':'Asunción','ciudad-del-este.html':'Ciudad del Este','encarnacion.html':'Encarnación'};
for(const file of readdirSync(root+'ciudades').filter(file=>file.endsWith('.html'))){
 test(`${file}: metadata, working local links, filter contract, coverage`,()=>{
  const doc=new JSDOM(readFileSync(root+'ciudades/'+file,'utf8')).window.document;
  assert.equal(doc.documentElement.lang,'es-PY');
  assert.equal(doc.querySelectorAll('h1').length,1);
  assert.equal(doc.querySelector('link[rel="canonical"]').href,base+'ciudades/'+(file==='index.html'?'':file));
  assert.ok(doc.querySelector('meta[name="viewport"]'));
  assert.equal(doc.querySelectorAll('script,iframe').length,0);
  for(const element of doc.querySelectorAll('[href]')){
   const href=element.getAttribute('href');
   if(href.startsWith('#')){assert.ok(doc.querySelector(href));continue;}
   if(/^[a-z]+:/i.test(href))continue;
   const url=new URL(href,base+'ciudades/'+file);
   const target=resolve(root,url.pathname.slice('/BestEchangeRates/'.length));
   assert.ok(existsSync(target)||existsSync(resolve(target,'index.html')),href);
   if(url.search && element.matches('a')){
    assert.equal(url.searchParams.get('city'),cities[file]);
    assert.ok(['USD','BRL','ARS','EUR'].includes(url.searchParams.get('currency')));
    assert.ok(['buy','sell'].includes(url.searchParams.get('operation')));
    assert.equal(url.searchParams.get('amount'),'100');
    assert.equal(url.searchParams.get('channel'),'unspecified');
   }
  }
  if(cities[file]){
   const listed=[...doc.querySelectorAll('.provider-list a')].map(link=>link.textContent).sort();
   assert.deepEqual(listed,PROVIDERS.filter(provider=>provider.cities.includes(cities[file])).map(provider=>provider.name).sort());
  }
 });
}
test('sitemap includes only real canonical pages',()=>{
 const xml=new JSDOM(readFileSync(root+'sitemap.xml','utf8'),{contentType:'application/xml'}).window.document;
 const urls=[...xml.querySelectorAll('loc')].map(loc=>loc.textContent);
 assert.equal(urls.length,5);assert.equal(new Set(urls).size,5);
 for(const url of urls){assert.ok(url.startsWith(base));const relative=url.slice(base.length);const target=resolve(root,relative.endsWith('/')||!relative?relative+'index.html':relative);assert.ok(existsSync(target));}
});
