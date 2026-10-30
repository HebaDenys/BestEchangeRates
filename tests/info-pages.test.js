import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {JSDOM} from 'jsdom';
const root=new URL('../',import.meta.url);
const base='https://hebadenys.github.io/BestEchangeRates/';
for(const file of ['ayuda.html','transparencia.html','privacidad.html','contacto.html']) test(`${file}: useful indexable static page and real links`,()=>{
 const dom=new JSDOM(readFileSync(new URL(file,root),'utf8')); const doc=dom.window.document;
 assert.equal(doc.documentElement.lang,'es-PY');assert.equal(doc.querySelectorAll('h1').length,1);
 assert.equal(doc.querySelector('link[rel="canonical"]').href,base+file);assert.ok(doc.querySelector('meta[name="description"]').content.length>40);
 assert.equal(doc.querySelectorAll('script,iframe,form').length,0);assert.ok(doc.querySelector('main').textContent.length>600);
 for(const a of doc.querySelectorAll('a[href]')){ const url=new URL(a.getAttribute('href'),base+file);if(url.origin!==new URL(base).origin)continue; const path=url.pathname.slice(new URL(base).pathname.length);assert.ok(existsSync(new URL(path.endsWith('/')||!path?path+'index.html':path,root)),a.href); }
 dom.window.close();
});
