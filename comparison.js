import {calculate} from './rates.js?v=20261020-4';
/** Only current, valid published quotes compete. Manual references never enter here. */
export function compareQuotes(quotes, amount, operation) {
  if (!['sell','buy'].includes(operation)) return [];
  const rows = quotes.filter(q => q && !q.stale && calculate(1,q,operation) !== null)
    .map(quote => ({quote, total: calculate(amount,quote,operation), rate: operation === 'sell' ? quote.buy : quote.sell}))
    .sort((a,b) => (operation === 'sell' ? b.rate-a.rate : a.rate-b.rate) || `${a.quote.sourceName}:${a.quote.branch}`.localeCompare(`${b.quote.sourceName}:${b.quote.branch}`, 'es'));
  return rows.map(row => ({...row, best: row.rate === rows[0].rate, difference: row.total === null ? null : Math.abs(row.total-rows[0].total)}));
}
