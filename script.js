import { SOURCES, fetchSource, calculate } from './rates.js';
const $ = id => document.getElementById(id);
const format = value => new Intl.NumberFormat('es-PY', { maximumFractionDigits: 2 }).format(value);
const time = value => new Intl.DateTimeFormat('es-PY', { dateStyle: 'short', timeStyle: 'short', timeZone: 'America/Asuncion' }).format(new Date(value));
let quotes = [];
let controller;
let request = 0;
const previous = new Map();

function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}
function renderQuotes(items, stale = false) {
  $('quotes').replaceChildren();
  for (const quote of items) {
    const card = element('article', undefined, `quote${stale ? ' previous' : ''}`);
    const heading = element('h3');
    const link = element('a', quote.sourceName);
    link.href = quote.url; link.target = '_blank'; link.rel = 'noopener noreferrer';
    heading.append(link);
    card.append(heading, element('p', quote.branch, 'branch'));
    const prices = element('div', undefined, 'prices');
    for (const [label, value] of [['Compra · tú vendes', quote.buy], ['Venta · tú compras', quote.sell]]) {
      const price = element('div');
      price.append(element('span', label, 'price-label'), element('span', `₲ ${format(value)}`, 'price-value'));
      prices.append(price);
    }
    card.append(prices, element('p', `${stale ? 'Lectura anterior · ' : ''}Consultado: ${time(quote.retrievedAt)} (Paraguay).`, 'quote-meta'), element('p', quote.sourceUpdatedLabel ? `Texto de la fuente al consultar: “${quote.sourceUpdatedLabel}”. No es una hora verificada.` : 'La fuente no indica una fecha de actualización verificable.', 'quote-meta'));
    $('quotes').append(card);
  }
  if (!items.length) $('quotes').append(element('p', 'No hay cotizaciones disponibles. Puedes reintentar o consultar directamente la fuente.', 'empty'));
}
function renderCalculator() {
  const currency = $('currencySelect').value;
  $('amountCurrency').textContent = currency;
  const manual = $('quoteSelect').value === 'manual';
  const manualRate = Number($('manualRate').value);
  $('manualRateGroup').hidden = !manual;
  const selected = manual ? (Number.isFinite(manualRate) && manualRate > 0 ? {buy: manualRate, sell: manualRate, branch: 'Cotización introducida por ti · no verificada'} : null) : ($('quoteSelect').value === '' ? null : quotes[Number($('quoteSelect').value)]);
  const amount = $('amount').value === '' ? NaN : Number($('amount').value);
  const operation = $('operation').value;
  const total = calculate(amount, selected, operation);
  $('resultLabel').textContent = operation === 'sell' ? 'Recibirías aproximadamente' : 'Pagarías aproximadamente';
  $('result').textContent = total === null ? '—' : `₲ ${format(total)}`;
  $('amount').setAttribute('aria-invalid', String(!Number.isFinite(amount) || amount <= 0 || amount > 1e12));
  $('calculationDetail').textContent = !selected ? (manual ? 'Introduce una cotización válida, mayor que cero, sin separadores de miles.' : 'Sin una lectura disponible no calculamos estimaciones.') : total === null ? 'Introduce una cantidad válida, mayor que cero y hasta un billón.' : `${format(amount)} ${currency} × ₲ ${format(operation === 'sell' ? selected.buy : selected.sell)} · ${selected.branch}`;
}
function updateOptions() {
  const wasManual = $('quoteSelect').value === 'manual';
  $('quoteSelect').replaceChildren();
  if (!quotes.length) $('quoteSelect').append(new Option('Sin cotización disponible', ''));
  quotes.forEach((quote, index) => $('quoteSelect').append(new Option(`${quote.sourceName} · ${quote.branch}`, String(index))));
  $('quoteSelect').append(new Option('Introducir mi propia cotización', 'manual'));
  if (wasManual) $('quoteSelect').value = 'manual';
  renderCalculator();
}
async function refresh() {
  controller?.abort();
  controller = new AbortController();
  const current = ++request;
  const currency = $('currencySelect').value;
  const signal = controller.signal;
  const controllerForRequest = controller;
  const timeout = setTimeout(() => controllerForRequest.abort(), 18000);
  quotes = [];
  updateOptions();
  $('quotes').replaceChildren();
  $('quotes').setAttribute('aria-busy', 'true');
  $('fetchBtn').disabled = true;
  $('fetchBtn').textContent = 'Consultando…';
  $('status').className = 'status';
  $('status').textContent = `Consultando ${currency} en las fuentes…`;
  $('locationNote').hidden = true;
  try {
    const results = await Promise.allSettled(SOURCES.map(source => fetchSource(source, currency, { signal })));
    if (current !== request) return;
    quotes = results.filter(result => result.status === 'fulfilled').flatMap(result => result.value);
    const failures = results.filter(result => result.status === 'rejected').length;
    if (quotes.length) {
      previous.set(currency, quotes);
      renderQuotes(quotes);
      $('status').textContent = `${SOURCES.length - failures} de ${SOURCES.length} fuentes consultadas. ${failures ? 'Algunas no están disponibles.' : 'Lectura disponible; confirma la vigencia con la fuente.'}`;
      const hasAsuncion = quotes.some(quote => /asunci[oó]n/i.test(quote.branch));
      $('locationNote').textContent = hasAsuncion ? 'Verifica la sucursal antes de cambiar: los precios pueden variar entre localidades.' : 'Sin cotización verificada de Asunción. Las cifras siguientes corresponden a la localidad indicada, no a Asunción.';
      $('locationNote').hidden = false;
    } else {
      const stored = previous.get(currency) || [];
      renderQuotes(stored, true);
      $('status').className = 'status error';
      $('status').textContent = `No se pudo obtener una cotización de ${currency}. ${stored.length ? 'Se muestra la lectura anterior, sin cálculo automático disponible.' : 'Reintenta o abre la fuente oficial.'}`;
    }
    updateOptions();
  } finally {
    clearTimeout(timeout);
    if (current === request) {
      $('quotes').setAttribute('aria-busy', 'false');
      $('fetchBtn').disabled = false;
      $('fetchBtn').textContent = 'Actualizar';
    }
  }
}
$('fetchBtn').addEventListener('click', refresh);
$('currencySelect').addEventListener('change', () => { $('manualRate').value = ''; refresh(); });
$('operation').addEventListener('input', () => { if ($('quoteSelect').value === 'manual') $('manualRate').value = ''; });
for (const id of ['operation', 'amount', 'quoteSelect', 'manualRate']) $(id).addEventListener('input', renderCalculator);
refresh();
