import {CURRENCIES, proxyUrl} from './rates.js?v=20261020-5';

// Public structured pages, checked 2026-10-20. Never infer branch prices from
// directory presence. DOMParser is native in browsers; tests inject jsdom's parser.
const clean = value => String(value ?? '').replace(/\s+/g, ' ').trim();
function documentOf(html, {DOMParser: Parser = globalThis.DOMParser} = {}) {
  if (!Parser || !/<(?:html|div|table)\b/i.test(html)) throw Error('HTML de la fuente no disponible');
  return new Parser().parseFromString(html, 'text/html');
}
function supported(currency) { if (!CURRENCIES.includes(currency)) throw Error('Moneda no compatible'); }
function pair(buy, sell) {
  const number = value => /^\d+(?:\.\d+)?$/.test(clean(value)) ? Number(clean(value)) : NaN;
  buy = number(buy); sell = number(sell);
  if (!(buy > 0 && sell >= buy && Number.isFinite(sell))) return null;
  return {buy, sell};
}
function finish(quotes) { if (!quotes.length) throw Error('No hay cotizaciones verificables vigentes'); return quotes; }
// Publishers omit their timezone. Use the entire civil-time offset range instead
// of silently interpreting dates in the visitor's timezone. Only accept dates
// whose oldest possible age is within four days and that could already have
// occurred. This is a conservative age cutoff, NOT a verified freshness claim.
export function coverageTimestamp(label, {now = Date.now()} = {}) {
  const iso = clean(label).match(/^(\d{4})-(\d{2})-(\d{2})[ T](\d{2}):(\d{2})(?::(\d{2}))?$/);
  const local = clean(label).match(/(\d{2})\/(\d{2})\/(\d{4})\s*(?:-\s*)?(\d{2}):(\d{2})/);
  const parts = iso ? [iso[1],iso[2],iso[3],iso[4],iso[5],iso[6] || '00'] : local ? [local[3],local[2],local[1],local[4],local[5],'00'] : null;
  if (!parts) return {accepted:false};
  const utc = Date.parse(`${parts[0]}-${parts[1]}-${parts[2]}T${parts[3]}:${parts[4]}:${parts[5]}Z`);
  if (!Number.isFinite(utc) || new Date(utc).toISOString().slice(0,19) !== `${parts[0]}-${parts[1]}-${parts[2]}T${parts[3]}:${parts[4]}:${parts[5]}`) return {accepted:false};
  const earliest = utc - 14 * 3600000, latest = utc + 12 * 3600000;
  return {accepted: earliest >= now - 4 * 86400000 && earliest <= now + 300000,
    sourceUpdatedLabel: `${clean(label)} (zona horaria no publicada)`, sourceTimestampStatus:'timezone-unverified'};
}
export const ORIENTE_BRANCHES = [
  ['004','Casa Matriz - Km 4','Ciudad del Este'], ['001','Caja Aux. Shop. Hwu 2','Ciudad del Este'],
  ['002','Suc. Itiban - Frente Barcelona','Ciudad del Este'], ['005','Suc. Asunción','Asunción'],
  ['006','Suc. 1 Pedro J. Caballero','Pedro Juan Caballero'], ['007','Suc. Encarnación','Encarnación'],
  ['009','Caja Aux1 P.J.C','Pedro Juan Caballero'], ['008','Suc. 2 Pedro Juan Caballero','Pedro Juan Caballero'],
].map(([id,branch,city])=>({id,branch,city}));
export function parseOriente(html, currency, options = {}) {
  supported(currency); const doc = documentOf(html, options), quotes = [];
  for (const location of ORIENTE_BRANCHES) {
    const panels = doc.querySelectorAll(`#panel-${location.id}`), tab = doc.getElementById(`tab-${location.id}`);
    if (!panels.length) continue;
    if (panels.length !== 1 || clean(tab?.textContent) !== location.branch) throw Error('Sucursal Oriente no verificada');
    const panel = panels[0], stamp = coverageTimestamp(clean(panel.querySelector('.update-time')?.textContent), options);
    if (!stamp.accepted) continue;
    const rows = [...panel.querySelectorAll('tr[data-symbol]')].filter(row => row.dataset.symbol === currency);
    if (rows.length > 1) throw Error('Cotización Oriente duplicada');
    if (!rows.length) continue;
    const row = rows[0]; if (row.dataset.sucursal !== location.id) throw Error('Sucursal Oriente inconsistente');
    const rates = pair(row.dataset.compra, row.dataset.venta); if (!rates) continue;
    const {accepted, ...time} = stamp;
    quotes.push({branch:location.branch, branchId:location.id, city:location.city, currency, ...rates, ...time, quoteScope:'branch', channel:'unspecified'});
  }
  return finish(quotes);
}
export function parseMaxi(html, currency, options = {}) {
  supported(currency); const doc = documentOf(html, options), quotes = [];
  const label = clean([...doc.querySelectorAll('.info')].find(node => /[UÚ]ltima actualizaci[oó]n/i.test(node.textContent))?.textContent);
  const stamp = coverageTimestamp(label, options); if (!stamp.accepted) return finish([]);
  for (const [id, city, sourceLabel] of [['cotizacion-carousel','Asunción','Asunción'],['cotizacion-cd','Ciudad del Este','CDE']]) {
    if (!Array.from(doc.querySelectorAll(`a[data-panel="${id}"]`)).some(node => clean(node.textContent) === sourceLabel)) throw Error('Ciudad Maxi no verificada');
    const panels = doc.querySelectorAll(`#${id}`); if (panels.length !== 1) throw Error('Panel Maxi no verificado');
    // Ignore Owl carousel cloned cards, mobile boards, cheques and arbitrage.
    const cards = [...panels[0].querySelectorAll('.shadow_exchange')].filter(node => !node.closest('.cloned') && [...node.querySelectorAll('img')].some(img => img.getAttribute('src')?.endsWith(`/flags/${currency}.png`)));
    if (cards.length !== 1) throw Error('Cotización Maxi ausente o duplicada');
    const values = clean(cards[0].textContent).match(/Compra\s+(\d+(?:\.\d+)?)\s+Venta\s+(\d+(?:\.\d+)?)$/);
    const rates = values && pair(values[1], values[2]); if (!rates) continue;
    const {accepted, ...time} = stamp;
    quotes.push({branch:`Tablero ${city}`, city, currency, ...rates, ...time, quoteScope:'city', channel:'unspecified'});
  }
  return finish(quotes);
}
export function parseMyd(html, currency, options = {}) {
  supported(currency); const doc = documentOf(html, options), byCity = new Map();
  const flags = {USD:['us-1.png'],EUR:['640px-Flag_of_Europe.svg.png'],ARS:['ar.png'],BRL:['br.png','descarga.png']};
  for (const panel of doc.querySelectorAll('.cambios-banner-wrap')) {
    const city = {Asuncion:'Asunción',CDE:'Ciudad del Este'}[clean(panel.querySelector('h2')?.textContent)]; if (!city) continue;
    const rows = [...panel.querySelectorAll('ul')].filter(row => {
      const images = [...row.querySelectorAll('img')];
      return images.length === 1 && flags[currency].some(flag => images[0].getAttribute('src')?.endsWith(`/uploads/${flag}`));
    });
    if (rows.length > 1) throw Error('Cotización M&D duplicada'); if (!rows.length) continue;
    const cells = rows[0].querySelectorAll('li'); if (cells.length !== 3) throw Error('Formato M&D no reconocido');
    const rates = pair(cells[1].textContent,cells[2].textContent); if (!rates) continue;
    const old = byCity.get(city);
    if (old && (old.buy !== rates.buy || old.sell !== rates.sell)) throw Error('Tableros M&D inconsistentes');
    byCity.set(city, {branch:`Tablero ${city}`,city,currency,...rates,quoteScope:'city',channel:'unspecified',sourceUpdatedLabel:null,sourceTimestampStatus:'unknown'});
  }
  return finish([...byCity.values()]);
}
export function parseEuro(rows, currency, {branchId = '1', ...options} = {}) {
  supported(currency); if (!['1','2'].includes(branchId)) throw Error('Sucursal Euro desconocida');
  if (typeof rows === 'string') rows = JSON.parse(rows);
  if (!Array.isArray(rows)) throw Error('Formato Euro no reconocido');
  const matching = rows.filter(row => row.id === {USD:'US',EUR:'EU',ARS:'PA',BRL:'RS'}[currency]);
  if (matching.length !== 1) throw Error('Cotización Euro ausente o duplicada');
  const row = matching[0], stamp = coverageTimestamp(row.fecha, options), rates = pair(row.compra,row.venta);
  if (!stamp.accepted || !rates) return finish([]);
  const {accepted, ...time} = stamp;
  return [{branch:branchId === '1' ? 'Central' : 'Sucursal (oficina no identificada)',branchId,city:'Asunción',currency,...rates,...time,quoteScope:branchId === '1' ? 'branch':'unresolved-branch',channel:'unspecified'}];
}
export const MAS_BRANCHES = [
 ['matriz','Matriz-Ciudad del Este','Ciudad del Este'], ['sucursal1','Asunción','Asunción'],
 ...[2,3,4,5].map(n=>[`sucursal${n}`,`Agencia ${n}-Ciudad del Este`,'Ciudad del Este']),
 ['sucursal6','Agencia 6-Saltos del Guairá','Salto del Guairá'],
 ...[7,8,9].map(n=>[`sucursal${n}`,`Agencia ${n}-Pedro Juan Caballero`,'Pedro Juan Caballero']),
 ['sucursal10','Caja Auxiliar 2-Ciudad del Este','Ciudad del Este'], ['sucursal11','Caja Auxiliar 3-Ciudad del Este','Ciudad del Este'],
 ['sucursal12','Caja Auxiliar -Pedro Juan Caballero','Pedro Juan Caballero'],
 ['sucursal13','Caja Auxiliar 2 -Pedro Juan Caballero','Pedro Juan Caballero'], ['sucursal14','Caja Auxiliar 3-Pedro Juan Caballero','Pedro Juan Caballero'],
].map(([id,branch,city])=>({id,branch,city}));
export function parseMas(payload, currency, branchId) {
 supported(currency); const location = MAS_BRANCHES.find(branch=>branch.id===branchId); if (!location) throw Error('Sucursal Más no verificada');
 if (typeof payload === 'string') payload = JSON.parse(payload);
 const row = payload?.cotizaciones?.[{USD:'1',BRL:'2',ARS:'4',EUR:'5'}[currency]], rates = row && pair(row.compra,row.venta);
 if (!rates) return finish([]);
 // `fecha` tracks response-generation time, NOT quote publication. Deliberately
 // do not pass it to sourceUpdatedLabel or any freshness calculation.
 return [{branch:location.branch,branchId,city:location.city,currency,...rates,quoteScope:'branch',channel:'unspecified',sourceUpdatedLabel:null,sourceTimestampStatus:'unknown'}];
}
function enrich(quotes, source, url, options) {
 return quotes.filter(q=>!options.city || options.city==='all' || q.city===options.city).map(q=>({...q,sourceId:source.id,sourceName:source.name,url,retrievedAt:new Date(options.now ?? Date.now()).toISOString()}));
}
function htmlSource(id,name,url,cities,parser) {
 const source = {id,name,url,cities,transport:'reader-html',transportVerification:'cors-preflight-and-http-200',quoteChannel:'unspecified'};
 source.fetch = async(currency,options={}) => {
  const response = await (options.fetcher || fetch)(proxyUrl(url),{signal:options.signal,headers:{'X-Return-Format':'html'}});
  if (!response.ok) throw Error(`La fuente no respondió (HTTP ${response.status})`);
  return enrich(parser(await response.text(),currency,options),source,url,options);
 }; return source;
}
const mas = {id:'mas',name:'Más Cambios',url:'https://mascambios.com.py/',cities:[...new Set(MAS_BRANCHES.map(b=>b.city))],transport:'direct-cors-json',transportVerification:'cors-header-and-http-200',quoteChannel:'unspecified'};
mas.fetch = async(currency, options = {}) => {
 supported(currency);
 const branches = MAS_BRANCHES.filter(b=>!options.city || options.city==='all' || b.city===options.city), quotes=[];
 // Bounded batches avoid a simultaneous fifteen-request burst on the provider.
 for (let i=0;i<branches.length;i+=3) {
  if (options.signal?.aborted) throw new DOMException('Aborted','AbortError');
  const results = await Promise.allSettled(branches.slice(i,i+3).map(async branch => {
   const url = `${mas.url}api/cotizaciones.php?sucursal=${branch.id}`;
   const response = await (options.fetcher || fetch)(url,{signal:options.signal});
   if (!response.ok) throw Error(`La fuente no respondió (HTTP ${response.status})`);
   return enrich(parseMas(await response.text(),currency,branch.id),mas,url,options);
  }));
  quotes.push(...results.filter(result=>result.status==='fulfilled').flatMap(result=>result.value));
 }
 if (options.signal?.aborted) throw new DOMException('Aborted','AbortError');
 return finish(quotes);
};
export const COVERAGE_SOURCES = [
 htmlSource('oriente','Oriente Cambios','https://www.orientecambios.com.py/',['Ciudad del Este','Asunción','Pedro Juan Caballero','Encarnación'],parseOriente),
 htmlSource('maxi','Maxicambios','https://www.maxicambios.com.py/',['Asunción','Ciudad del Este'],parseMaxi),
 htmlSource('myd','M & D Cambios','https://www.mydcambios.com.py/',['Asunción','Ciudad del Este'],parseMyd), mas,
];
export const COVERAGE_GAPS = [
 {id:'euro',status:'transport-pending',reason:'JSON público por POST sin CORS; parser por fecha individual probado, no integrado como fuente automática.',url:'https://eurocambios.com.py/v2/'},
 {id:'oriente',status:'partial-branches',reason:'Ocho tableros con precios; Vendome figura en el directorio sin tablero. Zona horaria no publicada.'},
 {id:'maxi',status:'city-boards-only',reason:'Solo tableros Asunción/CDE, no precios por oficina ni para todas las ciudades del directorio.'},
 {id:'myd',status:'publication-time-unknown',reason:'Solo tableros Asunción/CDE; hora de publicación no disponible.'},
 {id:'mas',status:'publication-time-unknown',reason:'Quince sucursales identificadas; la fecha de respuesta no es la fecha de publicación del precio.'},
 ...['chaco','lamoneda','yrendague','mundial'].map(id=>({id,status:'restricted',reason:'Fuente previamente restringida; no se intentan rutas alternativas.'})),
 {id:'ceteg',status:'token-required',reason:'Sin fuente pública verificada libre de token.'},
 {id:'santarita',status:'maintenance',reason:'Sitio en mantenimiento; se omiten marcadores y tablas antiguas.'},
];
