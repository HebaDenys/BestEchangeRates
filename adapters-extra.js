import {parseGuarani,proxyUrl,CURRENCIES} from './rates.js?v=20261020-4';
const strip=s=>s.replace(/!\[[^\]]*\]\([^)]*\)/g,'').trim();
const cells=s=>s.trim().split('|').slice(1,-1).map(strip);
function number(s,c){s=strip(s);if(c==='ARS' && /^\d+\.\d{1,3}$/.test(s))return Number(s);return parseGuarani(s);}
function pair(a,b,c){const buy=number(a,c),sell=number(b,c);if(!(buy>0&&sell>=buy))throw Error('Cotización inválida');return {buy,sell};}
function check(c){if(!CURRENCIES.includes(c))throw Error('Moneda no compatible');}
function finish(q){if(!q.length)throw Error('No hay cotizaciones verificables');return q;}
// Paraguay timestamps are UTC-03. Keep an explicit injectable clock for tests.
function recent(label,now=Date.now()){
 const m=label?.match(/(\d{2})[/-](\d{2})[/-](\d{4})\s*(?:-\s*)?(\d{2}):(\d{2})/);
 if(!m)return false;
 const time=Date.parse(`${m[3]}-${m[2]}-${m[1]}T${m[4]}:${m[5]}:00-03:00`);
 return Number.isFinite(time)&&time<=now+300000&&now-time<=4*86400000;
}
const names={USD:'Dolar',EUR:'Euro',ARS:'Peso',BRL:'Real'};
export function parseRioParana(text,currency,{now=Date.now()}={}){
 check(currency);const quotes=[];
 const locations={'Casa Matriz - PJC':'Pedro Juan Caballero','Caja auxiliar 1 - Villa Hayes':'Villa Hayes','Caja auxiliar 2 PJC':'Pedro Juan Caballero','Caja Auxiliar – Auto Cambios PJC':'Pedro Juan Caballero','Sucursal V PJC':'Pedro Juan Caballero','Sucursal 1 Salto del Guaira':'Salto del Guairá','Sucursal 2 CDE':'Ciudad del Este','Sucursal 4 PJC':'Pedro Juan Caballero','Sucursal 7 PJC':'Pedro Juan Caballero'};
 for(const section of text.split(/^## Cotización /m).slice(1)){
  const branch=section.split('\n')[0].trim(),city=locations[branch];if(!city)continue;
  const table=section.split(/^## /m)[0];const sourceUpdatedLabel=table.match(/Última Actualización [^|\n]+/)?.[0].trim();
  if(!recent(sourceUpdatedLabel,now))continue;
  const rows=table.split('\n').filter(x=>x.startsWith('|')).map(cells).filter(r=>r.length===4&&r[0]===names[currency]);
  if(rows.length!==1)throw Error('Formato Río Paraná no reconocido');
  if(quotes.some(q=>q.branch===branch))throw Error('Sucursal duplicada');
  quotes.push({branch,city,currency,...pair(rows[0][1],rows[0][2],currency),sourceUpdatedLabel});
 }return finish(quotes);
}
export function parseTripleC(text,currency,{now=Date.now()}={}){
 check(currency);
 if(!/PJC Matriz\s+PJC Sucursal\s+Asunción\s+Ciudad Del Este\s+San miguel\s+Shopping Dubai/.test(text))throw Error('Sucursales Triple C no verificadas');
 const sections=text.split(/^## Cotización del día\s*$/m).slice(1);if(sections.length!==6)throw Error('Formato Triple C no reconocido');
 const locations=[['PJC Matriz','Pedro Juan Caballero'],['PJC Sucursal','Pedro Juan Caballero'],['Asunción','Asunción'],['Ciudad Del Este','Ciudad del Este']];const quotes=[];
 locations.forEach(([branch,city],i)=>{
  const table=sections[i].split(/^## Arbitraje/m)[0],sourceUpdatedLabel=table.match(/Última actualizaci[oó]n:? [^|\n]+/i)?.[0].trim();
  if(!recent(sourceUpdatedLabel,now))return;
  const rows=table.split('\n').filter(x=>x.startsWith('|')).map(cells).filter(r=>r.length===4&&r[0]===(currency==='ARS'?'Peso Argentino':names[currency]));
  if(rows.length!==1)throw Error('Cotización Triple C ausente o duplicada');
  quotes.push({branch,city,currency,...pair(rows[0][1],rows[0][2],currency),sourceUpdatedLabel});
 });return finish(quotes);
}
export function parseValor(text,currency){
 check(currency);const locations={'CASA CENTRAL':'Ciudad del Este','CAJA AUXILIAR PARANÁ COUNTRY CLUB':'Hernandarias'},quotes=[];
 for(const section of text.split(/^# /m).slice(1)){
  const branch=section.split('\n')[0].trim(),city=locations[branch];if(!city)continue;
  if(quotes.some(q=>q.branch===branch))throw Error('Sucursal Valor duplicada');
  const label=currency==='USD'?'Dólar':names[currency];
  const matches=[...section.matchAll(new RegExp(`^${label}\\s*\\n\\s*([\\d.,]+)\\s*\\n\\s*([\\d.,]+)\\s*$`,'gm'))];
  if(matches.length!==1)throw Error('Cotización Valor ausente o duplicada');
  quotes.push({branch,city,currency,...pair(matches[0][1],matches[0][2],currency),sourceUpdatedLabel:section.match(/Última actualización[^\n]+/)?.[0]||null});
 }if(quotes.length!==2)throw Error('Sucursales Valor no verificadas');return quotes;
}
export function parseMercosur(text,currency,{now=Date.now()}={}){
 check(currency);const locations={'CENTRO MATRIZ':'Ciudad del Este','GRAN VIA KM 4':'Ciudad del Este','SAN ALBERTO':'San Alberto'},quotes=[];
 for(const section of text.split(/^## \*\*/m).slice(1)){
  const branch=section.split('**')[0].trim(),city=locations[branch];if(!city)continue;
  const sourceUpdatedLabel=section.match(/Actualizado [^|\n]+/)?.[0].trim();if(!recent(sourceUpdatedLabel,now))continue;
  const rows=section.split('\n').filter(x=>x.startsWith('|')).map(cells).filter(r=>r.length===5&&r[1]===`${names[currency]} X Guarani`);
  if(!rows.length)continue;
  const values=rows.map(r=>pair(r[3],r[4],currency));
  // The publisher exposes duplicate cash/other rows without labels in Reader.
  // Only return a rate when every published row for that pair agrees.
  if(values.some(q=>q.buy!==values[0].buy||q.sell!==values[0].sell))continue;
  if(quotes.some(q=>q.branch===branch))throw Error('Sucursal Mercosur duplicada');
  quotes.push({branch,city,currency,...values[0],sourceUpdatedLabel});
 }return finish(quotes);
}
export function parseUno(text,currency){
 check(currency);
 if(!text.includes('Uno Cambios S.A., Casa Matriz'))throw Error('Sucursal Uno no verificada');
 const table=text.split('## COTIZACIONES')[1]?.split('## ARBITRAJE')[0];if(!table)throw Error('Formato Uno no reconocido');
 const label={USD:'Dolar',EUR:'Euro',BRL:'Real',ARS:'Peso Arg\\.'}[currency];
 const rows=[...table.matchAll(new RegExp(`^${label}\\s*Compra:\\*\\*([\\d.,]+)\\*\\*Venta:\\*\\*([\\d.,]+)=?\\*\\*`,'gm'))];
 if(rows.length!==1)throw Error('Cotización Uno ausente o duplicada');
 return [{branch:'Casa Matriz - Regimiento Piribebuy y Paí Pérez',city:'Ciudad del Este',currency,...pair(rows[0][1],rows[0][2],currency),sourceUpdatedLabel:text.match(/Última actualización:\s*[^*\n]+/)?.[0].trim()||null}];
}
// Official select#cotizacion values and /sucursales city addresses audited
// 2026-10-20. These are individual public quote requests, not copied main rates.
export const UNO_BRANCHES = [
 ['1','Casa Matriz - Regimiento Piribebuy y Paí Pérez','Ciudad del Este'],
 ['2','SUCURSAL N° 4 - PJC','Pedro Juan Caballero'],
 ['3','SUCURSAL N° 7 - SANTA RITA','Santa Rita'],
 ['5','CAJA AUXILIAR N° 3 - SAN ALBERTO','San Alberto'],
 ['6','CAJA AUXILIAR N° 7 - PJC','Pedro Juan Caballero'],
 ['7','CAJA AUXILIAR N° 8 - CDE UNIAMERICA','Ciudad del Este'],
 ['8','CAJA AUXILIAR N° 10 - PJC','Pedro Juan Caballero'],
 ['9','CAJA AUXILIAR N° 11 - PJC','Pedro Juan Caballero'],
 ['10','CAJA AUXILIAR N° 12 - PJC','Pedro Juan Caballero'],
 ['11','CAJA AUXILIAR N° 13 - NUEVA ESPERANZA','Nueva Esperanza'],
 ['13','CAJA AUXILIAR N° 15 - MINGA PORA','Minga Porá'],
 ['14','SUCURSAL N° 16 - ASUNCION','Asunción'],
 ['15','CAJA AUXILIAR N° 17 - CDE KM4','Ciudad del Este'],
 ['16','CAJA AUXILIAR N° 18 - PJC','Pedro Juan Caballero'],
 ['17','CAJA AUXILIAR N° 19 - CDE','Ciudad del Este'],
 ['18','CAJA AUXILIAR N° 20 - CAMPO 9','Dr. Juan Eulogio Estigarribia'],
].map(([id,branch,city])=>({id,branch,city}));
export function parseUnoBranch(html,currency,branchId,{DOMParser:Parser=globalThis.DOMParser}={}){
 check(currency);
 const location=UNO_BRANCHES.find(b=>b.id===branchId);
 if(!location)throw Error('Sucursal Uno no verificada');
 if(!Parser||!/<table\b/i.test(html))throw Error('HTML Uno no disponible');
 const doc=new Parser().parseFromString(html,'text/html');
 // Reject a homepage/default-board fallback rather than relabeling it as a branch.
 if(doc.querySelector('select')||doc.querySelectorAll('table').length!==1)throw Error('Tabla Uno de sucursal no verificada');
 const label={USD:'Dolar',EUR:'Euro',BRL:'Real',ARS:'Peso Arg.'}[currency];
 const rows=[...doc.querySelectorAll('tr')].filter(row=>row.querySelector('td.moneda')?.textContent.trim()===label);
 if(rows.length!==1)throw Error('Cotización Uno ausente o duplicada');
 const buy=rows[0].querySelector('.desc-compra strong'),sell=rows[0].querySelector('.desc-venta strong');
 if(!buy||!sell)throw Error('Formato Uno no reconocido');
 const value=node=>[...node.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('').trim();
 return [{branch:location.branch,branchId,city:location.city,currency,...pair(value(buy),value(sell),currency),
  quoteScope:'branch',channel:'unspecified',sourceUpdatedLabel:null,sourceTimestampStatus:'unknown'}];
}
const uno={id:'uno',name:'Uno Cambios',url:'https://unocambios.com.py/',cities:[...new Set(UNO_BRANCHES.map(b=>b.city))],transport:'reader-html',quoteChannel:'unspecified'};
uno.fetch=async(currency,options={})=>{
 check(currency);
 const branches=UNO_BRANCHES.filter(b=>!options.city||options.city==='all'||b.city===options.city),quotes=[];
 // Three at a time, at most sixteen requests; filter before network access.
 for(let i=0;i<branches.length;i+=3){
  if(options.signal?.aborted)throw new DOMException('Aborted','AbortError');
  const results=await Promise.allSettled(branches.slice(i,i+3).map(async branch=>{
   // This exact public GET is called by the official homepage branch selector.
   const url=`${uno.url}modelos.php?cotizacion&id_sucursal=${branch.id}`;
   const response=await (options.fetcher||fetch)(proxyUrl(url),{signal:options.signal,headers:{'X-Return-Format':'html'}});
   if(!response.ok)throw Error(`La fuente no respondió (HTTP ${response.status})`);
   return parseUnoBranch(await response.text(),currency,branch.id,options).map(q=>({...q,sourceId:uno.id,sourceName:uno.name,url,retrievedAt:new Date(options.now??Date.now()).toISOString()}));
  }));
  quotes.push(...results.filter(r=>r.status==='fulfilled').flatMap(r=>r.value));
 }
 if(options.signal?.aborted)throw new DOMException('Aborted','AbortError');
 return finish(quotes);
};
function source(id,name,url,cities,parser){const s={id,name,url,cities};s.fetch=async(currency,options={})=>{
 const response=await (options.fetcher||fetch)(proxyUrl(url),{signal:options.signal});if(!response.ok)throw Error(`La fuente no respondió (HTTP ${response.status})`);
 return parser(await response.text(),currency,options).filter(q=>!options.city||options.city==='all'||q.city===options.city).map(q=>({...q,sourceId:id,sourceName:name,url,retrievedAt:new Date().toISOString()}));
};return s;}
export const MORE_SOURCES=[
 uno,
 source('valor','Valor Cambios','https://www.valor.com.py/',['Ciudad del Este','Hernandarias'],parseValor),
 source('rioparana','Cambios Río Paraná','https://cambiosrioparana.com.py/',['Pedro Juan Caballero','Villa Hayes','Salto del Guairá','Ciudad del Este'],parseRioParana),
 source('triplec','Cambios Triple C','https://cambiostriplec.com.py/',['Pedro Juan Caballero','Asunción','Ciudad del Este'],parseTripleC),
 source('mercosur','Mercosur Cambios','https://site.mercosurcambios.com/',['Ciudad del Este','San Alberto'],parseMercosur),
];
