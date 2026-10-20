/** Amounts are PYG per one foreign currency unit. No reference FX conversion. */
export const CURRENCIES = ['USD', 'EUR', 'ARS', 'BRL'];
export const SOURCES = [{ id: 'norte', name: 'Norte Cambios', url: 'https://www.nortecambios.com.py/' }];

export function parseGuarani(value) {
  // Paraguay display convention: period groups thousands, comma marks decimals.
  const clean = value.trim().replace(/\s*(?:arrow_upward|arrow_downward|drag_handle)\s*$/u, '').trim();
  if (!/^(?:\d+|\d{1,3}(?:\.\d{3})+)(?:,\d{1,4})?$/.test(clean)) throw new Error('Formato de cotización no reconocido');
  const number = Number(clean.replaceAll('.', '').replace(',', '.'));
  if (!Number.isFinite(number) || number <= 0) throw new Error('Cotización inválida');
  return number;
}

export function proxyUrl(url) {
  const target = new URL(url);
  if (target.protocol !== 'https:') throw new Error('La fuente debe usar HTTPS');
  return `https://r.jina.ai/${target.href}`;
}

export function parseNorte(text, currency) {
  if (!CURRENCIES.includes(currency)) throw new Error('Moneda no compatible');
  let branch = null;
  const quotes = [];
  const update = text.match(/^Actualizado[^\n]*$/im)?.[0]?.trim() || null;
  for (const line of text.split('\n')) {
    const heading = line.match(/^##\s+\[([^\]]+)\]\(https:\/\/www\.nortecambios\.com\.py\/sucursales\/[^)]+\)/);
    if (heading) branch = heading[1].replace(/\s*chevron_forward\s*$/, '').trim();
    if (!branch || !line.trim().startsWith('|')) continue;
    const cells = line.trim().split('|').slice(1, -1).map(cell => cell.trim());
    if (cells.length !== 3) continue;
    // Currency can appear in image alt text, link and label. Reject cross-currency pairs.
    const codes = [...new Set(cells[0].match(/\b(?:USD|EUR|ARS|BRL|PYG)\b/g) || [])];
    if (codes.length !== 1 || codes[0] !== currency) continue;
    const buy = parseGuarani(cells[1]);
    const sell = parseGuarani(cells[2]);
    if (sell < buy) throw new Error('Compra y venta inconsistentes');
    if (quotes.some(quote => quote.branch === branch)) throw new Error('Cotización duplicada: revisar fuente');
    quotes.push({ branch, currency, buy, sell, sourceUpdatedLabel: update });
  }
  if (!quotes.length) throw new Error(`No hay una cotización verificable para ${currency}`);
  return quotes;
}

export function calculate(amount, quote, operation) {
  if (!Number.isFinite(amount) || amount <= 0 || amount > 1e12) return null;
  if (!quote || !['sell', 'buy'].includes(operation)) return null;
  const rate = operation === 'sell' ? quote.buy : quote.sell;
  if (!Number.isFinite(rate) || rate <= 0) return null;
  const total = amount * rate;
  return Number.isFinite(total) ? total : null;
}

export function parseNorteCurrency(text, currency) {
  if (!CURRENCIES.includes(currency)) throw new Error('Moneda no compatible');
  // Require the page's currency identity, not just a currency elsewhere in navigation.
  const lines = text.split('\n');
  const headingIndex = lines.findIndex(line => line.startsWith('## ') && line.includes('flag-'));
  const heading = lines[headingIndex] || '';
  const identities = [...new Set([...heading.matchAll(/flag-([a-z]+)\.png/g)].map(match => match[1].toUpperCase()))];
  if (identities.length !== 1 || identities[0] !== currency) throw new Error('La fuente no confirma la moneda solicitada');
  const header = lines.findIndex((line, index) => index > headingIndex && /^\| Sucursal \| Compra \| Venta \|/.test(line.trim()));
  if (header < 0) throw new Error('Formato de sucursales no reconocido');
  const quotes = [];
  for (const line of lines.slice(header + 2)) {
    if (!line.trim().startsWith('|')) break;
    const cells = line.trim().split('|').slice(1, -1).map(cell => cell.trim());
    if (cells.length !== 3) continue;
    const branch = cells[0].match(/^\[([^\]]+)\]\(/)?.[1];
    if (branch !== 'Asunción') continue;
    const buy = parseGuarani(cells[1]);
    const sell = parseGuarani(cells[2]);
    if (sell < buy) throw new Error('Compra y venta inconsistentes');
    quotes.push({ branch, currency, buy, sell, sourceUpdatedLabel: text.match(/^Actualizado[^\n]*$/im)?.[0]?.trim() || null });
  }
  if (quotes.length !== 1) throw new Error('No hay una cotización única y verificable de Asunción');
  return quotes;
}

export async function fetchSource(source, currency, { signal, fetcher = fetch } = {}) {
  const sourceUrl = `${source.url}currency/${currency}`;
  const response = await fetcher(proxyUrl(sourceUrl), { signal });
  if (!response.ok) throw new Error(`La fuente no respondió (HTTP ${response.status})`);
  const quotes = parseNorteCurrency(await response.text(), currency);
  return quotes.map(quote => ({ ...quote, sourceId: source.id, sourceName: source.name, url: sourceUrl, retrievedAt: new Date().toISOString() }));
}
