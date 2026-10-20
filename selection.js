/** Local-only preferences and explicitly scoped comparison channels. */
export const CHANNELS = Object.freeze({
  unspecified: 'Sin canal indicado', cash: 'Efectivo', online: 'Online', app: 'App',
  transfer: 'Transferencia', cheque: 'Cheque', cheque_transfer: 'Cheque / transferencia'
});
export const PREFERENCE_KEY = 'cambio-claro:preferences:v1';
export const isBankQuote = quote => quote.institutionType === 'bank' || quote.geographicScope === 'bank_publication_unspecified';
export const quoteChannel = quote => Object.hasOwn(CHANNELS, quote.channel) ? quote.channel : 'unspecified';
export const matchesChannel = (quote, channel) => quoteChannel(quote) === channel;
export const matchesCity = (quote, city) => isBankQuote(quote) || !city || quote.city === city;
export function readSelection({search = '', storage, cities = []} = {}) {
  let saved = {};
  try { const parsed = JSON.parse(storage?.getItem(PREFERENCE_KEY) || '{}'); if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) saved = parsed; } catch {}
  const params = new URLSearchParams(search);
  const valid = {
    city: value => typeof value === 'string' && (value === '' || cities.includes(value)),
    currency: value => ['USD','EUR','BRL','ARS'].includes(value),
    operation: value => ['sell','buy'].includes(value),
    channel: value => Object.hasOwn(CHANNELS,value),
    amount: value => typeof value === 'string' && value.trim() !== '' && Number.isFinite(Number(value)) && Number(value)>0 && Number(value)<=1e12
  };
  const defaults = {city:cities.includes('Asunción')?'Asunción':'', currency:'USD', operation:'sell', amount:'100', channel:'unspecified'};
  return Object.fromEntries(Object.keys(defaults).map(key => {
    const fromUrl=params.get(key);
    return [key, valid[key](fromUrl) ? fromUrl : ['city','currency'].includes(key) && valid[key](saved[key]) ? saved[key] : defaults[key]];
  }));
}
export function savePreferences(storage, {city, currency}) {
  try { storage?.setItem(PREFERENCE_KEY, JSON.stringify({city,currency})); return Boolean(storage); } catch { return false; }
}
export function shareUrl(base, selection) {
  const url=new URL(base); url.search=''; url.hash='';
  for (const key of ['city','currency','operation','amount','channel']) url.searchParams.set(key, selection[key]);
  return url.href;
}
