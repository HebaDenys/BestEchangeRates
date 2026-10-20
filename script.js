import {compareQuotes} from './comparison.js?v=20261020-2';
import {branchLocation} from './branch-locations.js?v=20261020-2';
import { SOURCES, NORTE_CITIES, fetchSource, calculate, proxyUrl } from './rates.js?v=20261020-2';
import { PROVIDERS, REGISTER } from './providers.js?v=20261020-2';
import { EXTRA_SOURCES } from './adapters.js?v=20261020-2';
import {MORE_SOURCES} from './adapters-extra.js?v=20261020-2';
import {COVERAGE_SOURCES} from './adapters-coverage.js?v=20261020-2';
import {BANK_SOURCES} from './adapters-banks.js?v=20261020-2';
import {BANK_PROVIDERS} from './bank-providers.js?v=20261020-2';
import {CHANNELS, isBankQuote, quoteChannel, matchesChannel, matchesCity, readSelection, savePreferences, shareUrl} from './selection.js?v=20261020-2';
import {createSourceReader,sourceFailureReason,fairSourceQueue} from './source-fetch.js?v=20261020-2';
const $ = id => document.getElementById(id);
const format = value => new Intl.NumberFormat('es-PY', { maximumFractionDigits: 2 }).format(value);
const differenceLabel = value => value > 0 && value < 0.01 ? 'menos de ₲ 0,01' : `₲ ${format(value)}`;
const time = value => new Intl.DateTimeFormat('es-PY', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Asuncion' }).format(new Date(value));
const sources = [...SOURCES.map(source => ({...source,cities:NORTE_CITIES,fetch:(currency,options)=>fetchSource(source,currency,options)})), ...EXTRA_SOURCES, ...MORE_SOURCES, ...COVERAGE_SOURCES, ...BANK_SOURCES];
let quotes = [], displayedQuotes = [], selectedQuoteKey = '', controller, request = 0;
const branchLabel = quote => quote.city && !quote.branch?.toLocaleLowerCase('es').endsWith(quote.city.toLocaleLowerCase('es')) ? `${quote.branch} · ${quote.city}` : quote.branch || 'Cotización general';
const quoteKey = quote => quote ? `${quote.sourceId}:${quote.branch}:${quoteChannel(quote)}` : '';
const view = document.defaultView;
const localStorageSafe = () => { try { return view?.localStorage; } catch { return undefined; } };
const selection = () => ({city:$('citySelect').value,currency:$('currencySelect').value,operation:$('operation').value,amount:$('amount').value,channel:$('channelSelect').value});
const previous = new Map();
let refreshStatus = () => {};
function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function link(text,url) {
  const node = element('a',text); node.href=url; node.target='_blank'; node.rel='noopener noreferrer'; return node;
}
function renderDirectory() {
  const city = $('citySelect').value;
  $('bankDirectory').replaceChildren(...BANK_PROVIDERS.map(provider=>{
    const item=element('article',undefined,'directory-item');
    item.append(link(`${provider.name}${provider.officialWebsite ? '' : ' · Registro BCP'} ↗`,provider.url),element('p',provider.feedStatus==='public_adapter' ? 'Consulta automática · Sin sucursal asignada' : 'Solo directorio · Sin precio automático','hint'));
    const locations=(provider.locationEvidence || []).filter(record=>!city || record.city===city);
    if(locations.length) {
      const detail=element('details',undefined,'quote-meta'); detail.append(element('summary',city ? `Presencia en ${city}` : `${locations.length} ciudades verificadas`));
      for(const record of locations) { const line=element('p',`${record.city}: ${record.fxServiceExplicit ? 'Servicio de cambio indicado' : 'Sede bancaria; cambio no confirmado'} · `); line.append(link('Directorio oficial',record.officialUrl)); detail.append(line); }
      detail.append(element('p','La publicación bancaria no confirma el precio de esta sede.','hint')); item.append(detail);
    }
    return item;
  }));
  const items = PROVIDERS.filter(provider => city === '' || provider.cities.includes(city));
  $('directoryCount').textContent = `${items.length} ${items.length===1 ? 'casa' : 'casas'}`;
  $('directoryNote').textContent = city ? `Sitios oficiales en ${city}.` : 'Casas verificadas de Paraguay · Sitios oficiales';
  $('directory').replaceChildren(...items.map(provider => {
    const item=element('article',undefined,'directory-item');
    item.append(provider.url ? link(`${provider.name} ↗`,provider.url) : element('strong',provider.name));
    item.append(element('p',provider.cities.length ? provider.cities.join(' · ') : 'Localidades por verificar','hint'));
    if (!provider.url) item.append(element('p','Sitio oficial por verificar','hint'));
    return item;
  }));
}
function directions(quote) {
  if(isBankQuote(quote)) { const box=element('div',undefined,'directions'); box.append(link('Ver banco ↗',quote.url)); return box; }
  const location = branchLocation(quote);
  const box = element('div', undefined, 'directions');
  if (location?.address && location.evidenceStatus === 'official-page') {
    const address=element('details',undefined,'address-details');
    address.append(element('summary','Dirección'),element('p',location.address,'branch-address'));
    box.append(address);
  }
  const official = location?.officialUrl || PROVIDERS.find(provider=>provider.id===quote.sourceId)?.url || quote.url;
  box.append(link(location?.mapUrl ? (location.mapKind === 'official-directions-link' ? 'Cómo llegar ↗' : 'Ver mapa ↗') : 'Ver sucursales ↗',location?.mapUrl || official));
  return box;
}
function renderBest(rows) {
  const operation = $('operation').value;
  const best = rows[0];
  $('bestTitle').textContent = `${$('citySelect').value ? 'MEJOR PRECIO LOCAL' : 'MEJOR ENTRE CIUDADES'} · ${CHANNELS[$('channelSelect').value].toLocaleUpperCase('es')}`;
  $('bestDirections').replaceChildren();
  $('bestLabel').textContent = operation === 'sell' ? 'Recibís aproximadamente' : 'Pagás aproximadamente';
  $('bestTotal').textContent = best?.total != null ? `₲ ${format(best.total)}` : '—';
  const ties = rows.filter(row=>row.best).length;
  $('bestIdentity').textContent = best ? `${best.quote.sourceName} · ${branchLabel(best.quote)}${ties>1 ? ` · Empate entre ${ties} opciones` : ''}` : 'Sin cotizaciones disponibles para esta selección.';
  const next = rows.find(row=>!row.best);
  $('bestExplanation').textContent = !best ? 'Probá otro canal, ciudad o moneda. Las publicaciones bancarias se muestran por separado abajo.' : best.total === null ? 'Ingresá un importe mayor que cero y de hasta 1 billón para comparar los totales.' : next ? `${operation==='sell' ? 'Recibís' : 'Pagás'} ${differenceLabel(next.difference)} ${operation==='sell' ? 'más' : 'menos'} que con la siguiente cotización distinta.${ties>1 ? ' Las primeras opciones tienen el mismo precio.' : ''}` : ties>1 ? 'Las opciones disponibles tienen el mismo precio.' : 'Solo hay una cotización disponible: todavía no hay otra con la que comparar.';
  let freshness=$('bestFreshness');
  if(!freshness) { freshness=element('p',undefined,'hint'); freshness.id='bestFreshness'; $('bestIdentity').after(freshness); }
  freshness.hidden=!best;
  freshness.textContent=best ? (best.quote.sourceUpdatedLabel || 'Fecha de publicación no indicada') : '';
  if(best) $('bestDirections').append(directions(best.quote));
}
function renderQuotes(items) {
  displayedQuotes = items;
  const channel = $('channelSelect').value;
  const selected = items.filter(quote=>matchesChannel(quote,channel));
  const local = selected.filter(quote=>!isBankQuote(quote));
  const banks = selected.filter(isBankQuote);
  $('channelNote').textContent = channel === 'unspecified' ? 'La fuente no indica el canal. No asumimos que sea efectivo; confirmalo antes de cambiar.' : `Solo ${CHANNELS[channel].toLocaleLowerCase('es')}. No se mezclan precios de otros canales.`;
  renderBest(compareQuotes(local, $('amount').value === '' ? NaN : Number($('amount').value), $('operation').value));
  renderTable(local,$('quotes'));
  renderTable(banks,$('bankQuotes'),true);
}
function renderTable(items, target, bank=false) {
  target.replaceChildren();
  const operation = $('operation').value;
  const amount = $('amount').value === '' ? NaN : Number($('amount').value);
  const rows = compareQuotes(items,amount,operation);
  if(!items.length) { target.append(element('p', bank ? 'Sin precios bancarios para este canal y moneda.' : 'Sin cotizaciones locales para este canal y moneda. Probá otro canal o consultá las fuentes oficiales.', 'empty')); return; }
  const table = element('table',undefined,'comparison-table');
  const caption = element('caption',`${operation==='sell' ? 'Venta' : 'Compra'} de ${$('currencySelect').value}: totales estimados antes de comisiones.`,'sr-only');
  const head = element('thead'); const header = element('tr');
  for (const title of [bank ? 'Banco / canal' : 'Casa / sucursal',operation==='sell' ? 'Recibís' : 'Pagás','Diferencia','Cotización','Ubicación']) {const th=element('th',title); th.scope='col'; header.append(th);}
  head.append(header);const body=element('tbody');
  const entries=[...rows,...items.filter(quote=>quote.stale || calculate(1,quote,operation)===null).map(quote=>({quote,total:null,difference:null,best:false}))];
  for (const row of entries) {
    const {quote}=row;
    const tr=element('tr',undefined,`quote${quote.stale ? ' previous' : ''}${row.best ? ' best-row' : ''}`);
    const identity=element('th',undefined,'quote-identity');identity.scope='row';
    const heading=element('h3');heading.append(link(quote.sourceName,quote.url));
    identity.append(heading,element('p',bank ? `Publicación del banco · ${quote.channelLabel || CHANNELS[quoteChannel(quote)]}` : branchLabel(quote),'branch'));
    if(bank) identity.append(element('p','Sin ciudad ni sucursal asignada','hint'));
    if(row.best) identity.append(element('span',bank ? 'Mejor de este grupo bancario' : 'Mejor precio local','best-badge'));
    const disclosure=element('details',undefined,'quote-meta');disclosure.append(element('summary',quote.stale ? 'Lectura anterior · Ver fuente' : 'Fuente y hora'),element('p',`Consulta: ${time(quote.retrievedAt)} · Fuente: ${quote.sourceUpdatedLabel || 'sin hora publicada'}`));if(quote.serviceNote) disclosure.append(element('p',quote.serviceNote));identity.append(disclosure);
    const cell=(label,text,cls)=>{const td=element('td',text,cls);td.dataset.label=label;return td;};
    const total=cell(operation==='sell'?'Recibís':'Pagás',row.total===null ? '—' : `₲ ${format(row.total)}`,'comparison-total');
    const delta=cell('Diferencia',row.difference===null ? 'No comparable' : row.best ? 'Mejor resultado' : `${differenceLabel(row.difference)} ${operation==='sell' ? 'menos' : 'más'}`,'comparison-delta');
    const rate=cell(operation==='sell'?'Compra':'Venta',calculate(1,quote,operation)===null ? 'Sin precio' : `₲ ${format(operation==='sell'?quote.buy:quote.sell)}`,'comparison-rate');
    rate.append(element('small',operation==='sell'?'Compra de la entidad':'Venta de la entidad'));
    const place=cell('Ubicación',undefined,'comparison-location');place.append(directions(quote));
    tr.append(identity,total,delta,rate,place);body.append(tr);
  }
  table.append(caption,head,body);target.append(table);
}
function renderCalculator() {
  const currency = $('currencySelect').value;
  $('amountCurrency').textContent = currency; $('rateCurrency').textContent=currency;
  $('operation').options[0].textContent=`Vender ${currency}`; $('operation').options[1].textContent=`Comprar ${currency}`;
  const manual = $('quoteSelect').value === 'manual';
  const manualRate = Number($('manualRate').value);
  $('manualRateGroup').hidden = !manual;
  const selected = manual ? (Number.isFinite(manualRate) && manualRate > 0 ? {buy: manualRate, sell: manualRate, branch: 'Cotización introducida por ti · no verificada'} : null) : ($('quoteSelect').value === '' ? null : quotes[Number($('quoteSelect').value)]);
  const amount = $('amount').value === '' ? NaN : Number($('amount').value);
  const operation = $('operation').value;
  const total = calculate(amount, selected, operation);
  $('resultLabel').textContent = operation === 'sell' ? 'Recibirías' : 'Pagarías';
  $('result').textContent = total === null ? '—' : `₲ ${format(total)}`;
  $('amount').setAttribute('aria-invalid', String(!Number.isFinite(amount) || amount <= 0 || amount > 1e12));
  $('calculationDetail').textContent = !selected ? (manual ? 'Introduce tu cotización.' : 'Elige una cotización disponible.') : total === null ? 'Introduce una cantidad válida.' : `${format(amount)} ${currency} × ₲ ${format(operation === 'sell' ? selected.buy : selected.sell)} · ${branchLabel(selected)}`;
}
function updateOptions() {
  const wasManual = $('quoteSelect').value === 'manual';
  $('quoteSelect').replaceChildren();
  const filteredQuotes=quotes.filter(quote=>matchesChannel(quote,$('channelSelect').value) && calculate(1,quote,$('operation').value)!==null);
  if (!filteredQuotes.length) $('quoteSelect').append(new Option('Sin cotización disponible', ''));
  quotes.forEach((quote, index) => {if(matchesChannel(quote,$('channelSelect').value) && calculate(1,quote,$('operation').value)!==null) $('quoteSelect').append(new Option(`${quote.sourceName} · ${branchLabel(quote)}`, String(index)));});
  $('quoteSelect').append(new Option('Introducir mi cotización', 'manual'));
  if (wasManual) $('quoteSelect').value = 'manual';
  else { const index=quotes.findIndex(quote=>quoteKey(quote)===selectedQuoteKey && matchesChannel(quote,$('channelSelect').value) && calculate(1,quote,$('operation').value)!==null); if(index>=0) $('quoteSelect').value=String(index); }
  renderCalculator();
}
async function refresh(force=false) {
  controller?.abort(); controller = new AbortController();
  const current = ++request, currency = $('currencySelect').value, city = $('citySelect').value;
  const signal=controller.signal, currentController=controller;
  const timeout = setTimeout(() => currentController.abort(), 90000);
  const active = sources.filter(source => (!source.supportedCurrencies || source.supportedCurrencies.includes(currency)) && (BANK_SOURCES.includes(source) || !city || source.cities?.includes(city)));
  const resultBySource = new Map();
  quotes=[]; updateOptions(); renderDirectory(); renderQuotes([]);
  $('bankQuotes').setAttribute('aria-busy','true'); $('quotes').setAttribute('aria-busy','true'); $('fetchBtn').disabled=true; $('fetchBtn').textContent='Consultando…';
  $('status').className='status'; $('status').textContent=`Consultando ${currency}…`;
  let diagnostics=$('sourceDiagnostics');
  if(!diagnostics) { diagnostics=element('details',undefined,'quote-meta'); diagnostics.id='sourceDiagnostics'; $('status').after(diagnostics); }
  diagnostics.hidden=true; diagnostics.replaceChildren();
  $('bestIdentity').textContent='Consultando las fuentes de tu selección…';
  $('bestExplanation').textContent='Los resultados aparecen a medida que responden las fuentes.';
  function showResults() {
    const displayed=[]; quotes=[];
    for (const source of active) {
      const key=`${source.id}:${currency}:${city}`;
      const result=resultBySource.get(source.id);
      if (result?.ok) { quotes.push(...result.items); displayed.push(...result.items); }
      else if (result && previous.has(key)) displayed.push(...previous.get(key).map(quote=>({...quote,stale:true})));
    }
    renderQuotes(displayed); updateOptions();
    const failed=active.filter(source=>resultBySource.get(source.id)?.ok===false);
    diagnostics.hidden=!failed.length;
    diagnostics.replaceChildren(element('summary',`Detalle de ${failed.length} fuentes sin precio`));
    for(const source of failed) {
      const result=resultBySource.get(source.id),line=element('p');
      const url=source.url || PROVIDERS.find(provider=>provider.id===source.id)?.url;
      line.append(url ? link(source.name,url) : element('span',source.name),document.createTextNode(`: ${result.skipped ? 'Sin consultar · Tiempo total agotado' : result.reason}`));
      diagnostics.append(line);
    }
    const pending=active.length-resultBySource.size;
    const failures=[...resultBySource.values()].filter(result=>!result.ok && !result.skipped).length;
    const skipped=[...resultBySource.values()].filter(result=>result.skipped).length;
    const chosen=quotes.filter(quote=>matchesChannel(quote,$('channelSelect').value) && calculate(1,quote,$('operation').value)!==null);
    const localCount=chosen.filter(quote=>!isBankQuote(quote)).length, bankCount=chosen.filter(isBankQuote).length;
    $('status').textContent=`${localCount} locales${city ? ` · ${city}` : ''} · ${bankCount} publicaciones bancarias sin ciudad${pending ? ' · Consultando…' : skipped ? ` · ${skipped} sin consultar` : failures ? ` · ${failures} ${failures===1 ? 'fuente' : 'fuentes'} sin precio` : ''}`;
    if (!pending && !quotes.length) { $('status').className='status error'; $('status').textContent=displayed.length ? 'No se pudo actualizar · Lecturas anteriores' : 'Sin precios automáticos disponibles'; }
  }
  refreshStatus=showResults;
  try {
    const queue=fairSourceQueue(active,source=>BANK_SOURCES.includes(source));
    await Promise.allSettled(Array.from({length:Math.min(3,active.length)},async()=>{
     while(queue.length && !signal.aborted && current===request) {
      const source=queue.shift();
      const sourceController=new AbortController();
      const cancelSource=()=>sourceController.abort();
      signal.addEventListener('abort',cancelSource,{once:true});
      let timedOut=false;
      const sourceTimeout=setTimeout(()=>{timedOut=true;cancelSource();},25000);
      try {
        const reader=createSourceReader({force});
        const items=(await source.fetch(currency,{signal:sourceController.signal,city:BANK_SOURCES.includes(source)?undefined:city,fetcher:reader.read})).map(quote=>({...quote,retrievedAt: reader.readings.has(quote.url) ? new Date(reader.readings.get(quote.url)).toISOString() : reader.readings.has(proxyUrl(quote.url)) ? new Date(reader.readings.get(proxyUrl(quote.url))).toISOString() : quote.retrievedAt})).filter(quote => quote.currency===currency && matchesCity(quote,city));
        if(current!==request) return;
        if(!items.length) throw new Error('Sin cotización para esta ciudad');
        resultBySource.set(source.id,{ok:true,items});
        previous.set(`${source.id}:${currency}:${city}`,items);
      } catch(error) { if(current!==request) return; resultBySource.set(source.id,{ok:false,reason:sourceFailureReason(error,{timedOut,aborted:signal.aborted})}); }
      finally { clearTimeout(sourceTimeout); signal.removeEventListener('abort',cancelSource); }
      if(current===request) showResults();
     }
    }));
    if(current===request) { for(const source of active) if(!resultBySource.has(source.id)) resultBySource.set(source.id,{ok:false,skipped:true}); showResults(); }
  } finally {
    clearTimeout(timeout);
    if(current===request) { $('bankQuotes').setAttribute('aria-busy','false'); $('quotes').setAttribute('aria-busy','false'); $('fetchBtn').disabled=false; $('fetchBtn').textContent='Actualizar'; }
  }
}
const cities=[...new Set([...NORTE_CITIES,...PROVIDERS.flatMap(provider=>provider.cities),...BANK_PROVIDERS.flatMap(provider=>provider.cities),...sources.flatMap(source=>source.cities||[])])].sort((a,b)=>a.localeCompare(b,'es'));
$('citySelect').replaceChildren(new Option('Todas las ciudades',''),...cities.map(city=>new Option(city,city)));
$('channelSelect').replaceChildren(...Object.entries(CHANNELS).map(([value,label])=>new Option(label,value)));
const initial=readSelection({search:view?.location?.search,storage:localStorageSafe(),cities});
for(const [key,id] of Object.entries({city:'citySelect',currency:'currencySelect',operation:'operation',amount:'amount',channel:'channelSelect'})) $(id).value=initial[key];
if(REGISTER?.url) $('registerInfo').append(link(`Registro BCP${REGISTER.date ? ` · ${REGISTER.date}` : ''}`,REGISTER.url));
$('fetchBtn').addEventListener('click',()=>refresh(true));
for(const id of ['currencySelect','citySelect']) $(id).addEventListener('change',()=>{ $('manualRate').value=''; selectedQuoteKey=''; savePreferences(localStorageSafe(),selection()); refresh(); });
$('channelSelect').addEventListener('change',()=>{selectedQuoteKey=''; renderQuotes(displayedQuotes); updateOptions(); refreshStatus();});
$('shareBtn').addEventListener('click',async()=>{
  const state=selection();
  if(!Number.isFinite(Number(state.amount)) || Number(state.amount)<=0 || Number(state.amount)>1e12) { $('shareStatus').textContent='Ingresá un importe válido antes de compartir.'; return; }
  const url=shareUrl(view.location.href,state);
  try { await view.navigator.clipboard.writeText(url); $('shareStatus').textContent='Enlace copiado. Comparte tu selección, no un precio fijo.'; $('shareFallback').hidden=true; }
  catch { $('shareFallback').hidden=false; $('shareLink').value=url; $('shareLink').focus(); $('shareLink').select(); $('shareStatus').textContent='Copiá el enlace seleccionado. Los precios se consultan al abrirlo.'; }
});
$('operation').addEventListener('input',()=>{if($('quoteSelect').value==='manual') $('manualRate').value=''; renderQuotes(displayedQuotes); updateOptions(); refreshStatus();});
$('quoteSelect').addEventListener('input',()=>{selectedQuoteKey=quoteKey(quotes[Number($('quoteSelect').value)]);});
$('amount').addEventListener('input',()=>renderQuotes(displayedQuotes));
for(const id of ['operation','amount','quoteSelect','manualRate']) $(id).addEventListener('input',renderCalculator);
refresh();
