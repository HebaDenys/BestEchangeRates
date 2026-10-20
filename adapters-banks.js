import {CURRENCIES, parseGuarani, proxyUrl} from './rates.js?v=20261020-2';

export const BANK_CHANNEL_LABELS = Object.freeze({cash:'Efectivo', online:'Online', app:'App', transfer:'Transferencia', cheque:'Cheque', cheque_transfer:'Cheque / transferencia', unspecified:'Canal no especificado'});
const SCOPE='bank_publication_unspecified';
const names={USD:'Dólares',EUR:'Euros',BRL:'Reales',ARS:'Pesos Arg.'};
const tidy=s=>s.replace(/!\[[^\]]*\]\([^)]*\)/g,'').replace(/\*\*/g,'').trim();
const cells=s=>s.trim().split('|').slice(1,-1).map(tidy);
function check(currency){if(!CURRENCIES.includes(currency))throw Error('Moneda no compatible');}
function value(text){const clean=text.trim();return /^(?:N\/A|N\/D|—|-)$/i.test(clean)?null:parseGuarani(clean);}
function quote(currency,channel,a,b){
 const buy=value(a),sell=value(b);
 if(buy!==null&&sell!==null&&sell<buy)throw Error('Compra y venta inconsistentes');
 return {currency,quoteCurrency:'PYG',buy,sell,channel,channelLabel:BANK_CHANNEL_LABELS[channel],institutionType:'bank',geographicScope:SCOPE,city:null,branch:'Publicación del banco',sourceUpdatedLabel:null,availability:buy===null&&sell===null?'unavailable':buy===null||sell===null?'partial':'available'};
}
function unique(quotes){
 const result=new Map();
 for(const q of quotes){const key=`${q.currency}:${q.channel}`,old=result.get(key);
  if(old&&(old.buy!==q.buy||old.sell!==q.sell))throw Error('Cotizaciones duplicadas contradictorias');
  result.set(key,q);
 }
 if(!result.size)throw Error('No hay cotizaciones bancarias verificables para esta moneda');
 return [...result.values()];
}
export function parseAtlas(text,currency){
 check(currency);const quotes=[];
 // Use the explicitly labelled complete table, not the repeated mobile snippets.
 const tables=text.split(/^\| MONEDA \| EFECTIVO \| CHEQUE \| ATLAS ONLINE \|\s*$/m).slice(1);
 for(const table of tables){
  const lines=table.trim().split('\n');
  if(lines[1]?.trim()!=='| COMPRA | VENTA | COMPRA | VENTA | COMPRA | VENTA |')throw Error('Columnas Atlas no verificadas');
  for(const line of lines.slice(2)){if(!line.trim().startsWith('|'))break;const row=cells(line);if(row[0]!==names[currency])continue;
   if(row.length!==7)throw Error('Formato Atlas no reconocido');
   ['cash','cheque','online'].forEach((channel,i)=>quotes.push(quote(currency,channel,row[1+i*2],row[2+i*2])));
  }
 }
 return unique(quotes);
}
export function parseUeno(text,currency){
 check(currency);const quotes=[];
 const pattern=/^(Dólar|Euro)\s*\n\s*en (tu app|efectivo|transferencias)\s*\n\s*Compra Gs\.\s*([^\n]+)\n\s*Venta Gs\.\s*([^\n]+)/gm;
 for(const m of text.matchAll(pattern)){const code=m[1]==='Dólar'?'USD':'EUR';if(code!==currency)continue;
  const q=quote(currency,{'tu app':'app',efectivo:'cash',transferencias:'transfer'}[m[2]],m[3],m[4]);
  if(q.channel==='cash')q.serviceNote='Efectivo: locales ueno bank x; confirmar disponibilidad.';
  quotes.push(q);
 }
 return unique(quotes);
}
export function parseFamiliar(text,currency){
 check(currency);const quotes=[];
 const mapping={'Dólar Americano Efectivo':['USD','cash'],'Dólar Americano Cheque / Transf.':['USD','cheque_transfer'],'Euro Efectivo':['EUR','cash'],'Euro Cheque / Transf.':['EUR','cheque_transfer'],Peso:['ARS','unspecified'],Real:['BRL','unspecified']};
 // The canonical cambios page, unlike a generic ticker, explicitly identifies Peso Argentino.
 if(currency==='ARS'&&!/Monedas Disponibles:.*Peso Argentino/.test(text))throw Error('Identidad del peso no verificada');
 const pattern=/^(Dólar Americano Efectivo|Dólar Americano Cheque \/ Transf\.|Euro Efectivo|Euro Cheque \/ Transf\.|Peso|Real)\s*\n\s*Compra\s*\n\s*([^\n]+)\n\s*Venta\s*\n\s*([^\n]+)/gm;
 for(const m of text.matchAll(pattern)){const [code,channel]=mapping[m[1]];if(code===currency)quotes.push(quote(currency,channel,m[2],m[3]));}
 return unique(quotes);
}
export function parseSolar(text,currency){
 check(currency);const quotes=[],mapping={Euro:'EUR',Real:'BRL',Dolar:'USD','Dólar':'USD','Peso Argentino':'ARS'};
 for(const line of text.split('\n')){
  const m=tidy(line).match(/^(Euro|Real|Dólar|Dolar|Peso Argentino):\s*COMPRA:\s*(.+?)\s+-\s+VENTA:\s*(.+?)\s*$/);
  if(m&&mapping[m[1]]===currency)quotes.push(quote(currency,'unspecified',m[2],m[3]));
 }
 return unique(quotes);
}
function source(id,name,url,parser){
 const source={id,name,url,cities:[],supportedCurrencies:id==='ueno'?['USD','EUR']:[...CURRENCIES],institutionType:'bank',geographicScope:SCOPE,sourceUpdatedLabel:null};
 source.fetch=async(currency,{fetcher=fetch,signal,now=Date.now}={})=>{
  const response=await fetcher(proxyUrl(url),{signal});
  if(!response.ok)throw Error(`La fuente no respondió (HTTP ${response.status})`);
  const quotes=parser(await response.text(),currency),retrievedAt=new Date(now()).toISOString();
  return quotes.map(q=>({...q,sourceId:id,sourceName:name,url,retrievedAt}));
 };
 return source;
}
export const BANK_SOURCES=[
 source('atlas','Banco Atlas','https://www.bancoatlas.com.py/',parseAtlas),
 source('ueno','Ueno Bank','https://www.ueno.com.py/cambio-de-moneda/',parseUeno),
 source('familiar','Banco Familiar','https://familiar.com.py/cambios',parseFamiliar),
 source('solar','Solar Banco','https://www.solar.com.py/',parseSolar),
];
