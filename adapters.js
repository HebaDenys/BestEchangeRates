import { parseGuarani, proxyUrl, CURRENCIES } from './rates.js?v=20261020-4';

const BONANZA_BRANCHES = [
  ['Casa Matriz', 'Ciudad del Este'], ['Jebai', 'Ciudad del Este'],
  ['Paraná Country', 'Hernandarias'], ['Asunción', 'Asunción'],
];
export const ALBERDI_BRANCHES = [
  { key: 'villamorra', branch: 'Asunción', city: 'Asunción' },
  { key: 'saltodelguaira', branch: 'Salto del Guairá', city: 'Salto del Guairá' },
  { key: 'ciudaddeleste', branch: 'Ciudad del Este', city: 'Ciudad del Este' },
  { key: 'km4', branch: 'KM4 CDE', city: 'Ciudad del Este' },
  { key: 'encarnacion', branch: 'Encarnación', city: 'Encarnación' },
];
function supported(currency) {
  if (!CURRENCIES.includes(currency)) throw new Error('Moneda no compatible');
}
function pair(buyText, sellText) {
  const buy = parseGuarani(buyText), sell = parseGuarani(sellText);
  if (sell < buy) throw new Error('Compra y venta inconsistentes');
  return { buy, sell };
}
function cells(line) { return line.trim().split('|').slice(1,-1).map(s => s.trim()); }
function currencyName(label) {
  const name = label.replace(/!\[[^\]]*\]\([^)]*\)/g, '').trim().normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
  return ({'dolar americano':'USD','euro':'EUR','peso argentino':'ARS','peso arg':'ARS','real':'BRL','real brasileno':'BRL'})[name] || null;
}
export function parseBonanza(text, currency) {
  supported(currency);
  // Jina flattens tabs: verify all tab labels and exactly four ordered table groups.
  const headings = [...text.matchAll(/^#### (CASA MATRIZ|JEBAI|PARANÁ COUNTRY|ASUNCIÓN)\s*$/gm)].map(m=>m[1]);
  if (headings.join('|') !== 'CASA MATRIZ|JEBAI|PARANÁ COUNTRY|ASUNCIÓN') throw new Error('Sucursales Bonanza no verificadas');
  const sections = text.split(/^#### COTIZACIONES\s*$/m).slice(1);
  if (sections.length !== 4) throw new Error('Formato Bonanza no reconocido');
  return sections.map((section, index) => {
    const table = section.split(/^#### COTIZACIONES DE ARBITRAJE/m)[0];
    const rows = table.split('\n').filter(l=>l.trim().startsWith('|')).map(cells).filter(c=>c.length===6 && currencyName(c[1])===currency);
    if (rows.length!==1) throw new Error('Cotización Bonanza ausente o duplicada');
    const [branch,city] = BONANZA_BRANCHES[index];
    const sourceUpdatedLabel = section.match(/^actualizado el [^\n]+$/im)?.[0]?.trim() || null;
    return {branch,city,currency,...pair(rows[0][2],rows[0][4]),sourceUpdatedLabel};
  });
}
export function parseAlberdi(text, currency, key) {
  supported(currency);
  const location = ALBERDI_BRANCHES.find(b=>b.key===key);
  if (!location || !text.includes(`URL Source: https://www.cambiosalberdi.com/langes/index.php?suc=${key}\n`)) throw new Error('Sucursal Alberdi no verificada');
  const table = text.split('| Moneda | Compra | Venta |')[1]?.split(/Última actualización/)[0];
  if (!table) throw new Error('Formato Alberdi no reconocido');
  const rows = table.split('\n').filter(l=>l.trim().startsWith('|')).map(cells).filter(c=>c.length===3 && currencyName(c[0])===currency);
  if (rows.length!==1) throw new Error('Cotización Alberdi ausente o duplicada');
  return [{branch:location.branch,city:location.city,currency,...pair(rows[0][1],rows[0][2]),sourceUpdatedLabel:text.match(/^Última actualización[^\n]*$/m)?.[0]?.trim() || null}];
}
async function read(url,{signal,fetcher=fetch}={}) {
  const response = await fetcher(proxyUrl(url),{signal});
  if (!response.ok) throw new Error(`La fuente no respondió (HTTP ${response.status})`);
  return response.text();
}
function stamp(quotes,source,url) {
  return quotes.map(q=>({...q,sourceId:source.id,sourceName:source.name,url,retrievedAt:new Date().toISOString()}));
}
const bonanza = {id:'bonanza',name:'Bonanza Cambios',url:'https://www.bonanzacambios.com.py/',cities:['Ciudad del Este','Hernandarias','Asunción']};
bonanza.fetch = async(currency,options={})=>stamp(parseBonanza(await read(bonanza.url,options),currency),bonanza,bonanza.url);
const alberdi = {id:'alberdi',name:'Cambios Alberdi',url:'https://www.cambiosalberdi.com/langes/index.php',cities:[...new Set(ALBERDI_BRANCHES.map(b=>b.city))]};
alberdi.fetch = async(currency,options={})=>{
  const results = await Promise.allSettled(ALBERDI_BRANCHES.filter(b=>!options.city || b.city===options.city).map(async b=> {
    const url = `${alberdi.url}?suc=${b.key}`;
    return stamp(parseAlberdi(await read(url,options),currency,b.key),alberdi,url);
  }));
  const quotes = results.filter(r=>r.status==='fulfilled').flatMap(r=>r.value);
  if (!quotes.length) throw new Error('No hay cotizaciones verificables de Alberdi');
  // Partial branch success remains useful; no missing branch is synthesized.
  return quotes;
};
export function parseFe(text, currency) {
  supported(currency);
  const branchCities = {'ASUNCIÓN - MATRIZ':'Asunción','CIUDAD DEL ESTE':'Ciudad del Este','ASUNCIÓN - VILLA MORRA':'Asunción','SAN LORENZO':'San Lorenzo'};
  let branch=null; const quotes=[];
  const sourceUpdatedLabel=text.match(/Última actualización: [^\n]+/)?.[0] || null;
  for(const line of text.split('\n')) {
    if(branchCities[line.trim()]) branch=line.trim();
    if(!branch || !line.startsWith('|')) continue;
    const row=cells(line);
    if(row.length!==3 || !row[0].startsWith(`[${currency}](`)) continue;
    const values=pair(row[1],row[2]);
    // Do not propagate the source's apparent USD San Lorenzo typo (560 vs 5800).
    if(values.sell/values.buy>3) continue;
    if(quotes.some(q=>q.branch===branch)) throw new Error('Sucursal FE duplicada');
    quotes.push({branch,city:branchCities[branch],currency,...values,sourceUpdatedLabel});
  }
  if(!quotes.length) throw new Error('No hay cotizaciones verificables de FE');
  return quotes;
}
export function parseIta(text,currency) {
  supported(currency);
  const locations={'Casa - Matriz':'Ciudad del Este','Caja Aux - Edificio Saba':'Ciudad del Este','Sucursal - Asunción':'Asunción','Caja Auxiliar KM4':'Ciudad del Este'};
  const names={USD:'Dólar',EUR:'Euro',ARS:'Peso Arg.',BRL:'Real'};
  const quotes=[];
  for(const section of text.split(/^## /m).slice(1)) {
    const branch=section.split('\n')[0].trim(),city=locations[branch];
    if(!city) continue;
    if(quotes.some(q=>q.branch===branch)) throw new Error('Sucursal Ita duplicada');
    const table=section.split('| Arbitrajes |')[0];
    const rows=table.split('\n').filter(l=>l.startsWith('|')).map(cells).filter(c=>c.length===3 && c[0].replace(/!\[[^\]]*\]\([^)]*\)/g,'').trim()===names[currency]);
    if(rows.length!==1) throw new Error('Cotización Ita ausente o duplicada');
    const values=rows[0].slice(1).map(c=>c.split(/[▼▲–]/)[0].trim());
    quotes.push({branch,city,currency,...pair(...values),sourceUpdatedLabel:section.match(/^Última act\.: [^\n]+/m)?.[0] || null});
  }
  if(quotes.length!==4) throw new Error('Sucursales Ita no verificadas');
  return quotes;
}
export function parseFenix(text,currency) {
  supported(currency);
  const names={USD:'Dólar',EUR:'Euro',ARS:'Peso',BRL:'Real'};
  const quotes=[];
  for(const section of text.split(/^### /m).slice(1)) {
    const branch=section.split('\n')[0].trim();
    const city=section.match(/^(Pedro Juan Caballero|Ciudad del Este|San Lorenzo|Asunción) - Paraguay$/m)?.[1];
    if(!city) continue;
    const start=section.indexOf(`\n${names[currency]} x Guaraní\n`);
    if(start<0) continue; // Not all branches quote every currency.
    const rows=section.slice(start).split('\n').slice(0,5);
    const row=rows.find(l=>/^\| [0-9]/.test(l));
    if(!row) throw new Error('Cotización Fénix no reconocida');
    if(quotes.some(q=>q.branch===branch)) throw new Error('Sucursal Fénix duplicada');
    if(cells(row).length!==2) throw new Error('Columnas Fénix no reconocidas');
    const values=cells(row).map(value=> {
      if(!/^\d+(?:\.\d{1,4})?$/.test(value)) throw new Error("Formato numérico Fénix no reconocido");
      return value.replace(".",","); // Fénix publishes ungrouped decimal-dot numbers.
    });
    quotes.push({branch,city,currency,...pair(...values),sourceUpdatedLabel:section.match(/^Última actualización: [^\n]+/m)?.[0] || null});
  }
  if(!quotes.length) throw new Error('No hay cotizaciones verificables de Fénix');
  return quotes;
}
export function parseFortuna(text,currency) {
  supported(currency);
  const locations={
    'Main Office':['Casa Matriz','Ciudad del Este'], 'Casa Matríz':['Casa Matriz','Ciudad del Este'],
    'Saltos del Guairá Branch':['Salto del Guairá','Salto del Guairá'], 'Suc. Saltos del Guairá':['Salto del Guairá','Salto del Guairá'],
    'Aux. Box Jebai':['Jebai','Ciudad del Este'], 'Caja Aux. Jebai':['Jebai','Ciudad del Este'],
    'PJC Branch':['Pedro Juan Caballero','Pedro Juan Caballero'], 'Sucursal PJC':['Pedro Juan Caballero','Pedro Juan Caballero'],
  };
  const names={USD:'Dólar',EUR:'Euro',ARS:'Peso Arg.',BRL:'Real'}, quotes=[];
  for(const section of text.split(/^## /m).slice(1)) {
    const location=locations[section.split('\n')[0].trim()];
    if(!location) continue;
    const [branch,city]=location;
    if(quotes.some(q=>q.branch===branch)) throw new Error('Sucursal Fortuna duplicada');
    const rows=section.split('\n').filter(l=>l.startsWith('|')).map(cells).filter(c=>c.length===4 && c[0].replace(/!\[[^\]]*\]\([^)]*\)/g,'').trim()===names[currency]);
    if(rows.length!==1) throw new Error('Cotización Fortuna no reconocida');
    quotes.push({branch,city,currency,...pair(rows[0][1],rows[0][2]),sourceUpdatedLabel:section.match(/^(?:Last update|Última actualización): [^\n]+/m)?.[0] || null});
  }
  if(quotes.length!==4) throw new Error('Sucursales Fortuna no verificadas');
  return quotes;
}
function simpleSource(id,name,url,cities,parser) {
 const source={id,name,url,cities};
 source.fetch=async(currency,options={})=>stamp(parser(await read(url,options),currency),source,url);
 return source;
}
export const EXTRA_SOURCES = [bonanza,alberdi,
 simpleSource('fortuna','Fortuna Cambios','https://www.fortunacambios.com.py/',['Ciudad del Este','Salto del Guairá','Pedro Juan Caballero'],parseFortuna),
 simpleSource('fe','Fe Cambios','https://www.fecambios.com.py/',['Asunción','Ciudad del Este','San Lorenzo'],parseFe),
 simpleSource('ita','Ita Cambios','https://itacambios.com.py/',['Asunción','Ciudad del Este'],parseIta),
 simpleSource('fenix','Fénix Cambios','https://fenixexchange.com.py/',['Pedro Juan Caballero','Ciudad del Este','San Lorenzo','Asunción'],parseFenix),
];
