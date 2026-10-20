import {parseGuarani,proxyUrl,CURRENCIES} from './rates.js?v=20261020-1';
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
function source(id,name,url,cities,parser){const s={id,name,url,cities};s.fetch=async(currency,options={})=>{
 const response=await (options.fetcher||fetch)(proxyUrl(url),{signal:options.signal});if(!response.ok)throw Error(`La fuente no respondió (HTTP ${response.status})`);
 return parser(await response.text(),currency,options).filter(q=>!options.city||options.city==='all'||q.city===options.city).map(q=>({...q,sourceId:id,sourceName:name,url,retrievedAt:new Date().toISOString()}));
};return s;}
export const MORE_SOURCES=[
 source('uno','Uno Cambios','https://unocambios.com.py/',['Ciudad del Este'],parseUno),
 source('valor','Valor Cambios','https://www.valor.com.py/',['Ciudad del Este','Hernandarias'],parseValor),
 source('rioparana','Cambios Río Paraná','https://cambiosrioparana.com.py/',['Pedro Juan Caballero','Villa Hayes','Salto del Guairá','Ciudad del Este'],parseRioParana),
 source('triplec','Cambios Triple C','https://cambiostriplec.com.py/',['Pedro Juan Caballero','Asunción','Ciudad del Este'],parseTripleC),
 source('mercosur','Mercosur Cambios','https://site.mercosurcambios.com/',['Ciudad del Este','San Alberto'],parseMercosur),
];
