import { test, expect, open, settled, select } from './fixtures.js';

const number = text => Number(text.replace(/[^\d,.-]/g, '').replaceAll('.', '').replace(',', '.'));

async function verifyRanking(page, operation) {
  const rows = await page.locator('#quotes .quote:not(.previous)').evaluateAll(nodes => nodes.map(node => ({
    total: node.querySelector('.comparison-total').textContent,
    rate: node.querySelector('.comparison-rate').firstChild.textContent,
    best: node.classList.contains('best-row'),
  })));
  expect(rows.length).toBeGreaterThan(0);
  const rates = rows.map(row => number(row.rate));
  expect(rates).toEqual([...rates].sort((a, b) => operation === 'sell' ? b - a : a - b));
  const amount = Number(await page.locator('#amount').inputValue());
  rows.forEach(row => expect(number(row.total)).toBeCloseTo(number(row.rate) * amount, 2));
  expect(await page.locator('#bestTotal').textContent()).toBe(rows[0].total);
  expect(rows.filter(row => row.best).length).toBe(rates.filter(rate => rate === rates[0]).length);
}

test('all 12 adapters flow through real browser modules, city filters and four currencies', async ({ page, sources }) => {
  await open(page);
  await select(page, '#citySelect', '');
  for (const currency of ['USD', 'EUR', 'BRL', 'ARS']) {
    await select(page, '#currencySelect', currency);
    await expect(page.locator('#rateCurrency')).toHaveText(currency);
    await verifyRanking(page, 'sell');
    const names = await page.locator('#quotes .quote h3').allTextContents();
    for (const name of ['Norte Cambios', 'Bonanza Cambios', 'Cambios Alberdi', 'Fortuna Cambios', 'Fe Cambios', 'Ita Cambios', 'Fénix Cambios', 'Uno Cambios', 'Valor Cambios', 'Cambios Río Paraná', 'Cambios Triple C', 'Mercosur Cambios']) expect(names).toContain(name);
  }
  await select(page, '#citySelect', 'Hernandarias');
  for (const branch of await page.locator('#quotes .quote .branch').allTextContents()) expect(branch).toContain('Hernandarias');
  await expect(page.locator('#directoryNote')).toContainText('Hernandarias');
});

test('buy/sell sorting, ties and tiny nonzero differences remain explicit', async ({ page, sources }) => {
  await open(page);
  await verifyRanking(page, 'sell');
  await expect(page.locator('#bestIdentity')).toContainText('Empate');
  const count = sources.requests.length;
  await page.locator('#amount').fill('0.000001');
  await expect(page.locator('#quotes .comparison-delta').filter({ hasText: 'menos de ₲ 0,01' }).first()).toBeVisible();
  await page.locator('#amount').fill('250');
  await page.locator('#operation').selectOption('buy');
  await verifyRanking(page, 'buy');
  await expect(page.locator('#bestLabel')).toHaveText('Pagás aproximadamente');
  expect(sources.requests).toHaveLength(count);
});

test('invalid, fractional and maximum amounts recalculate without network requests', async ({ page, sources }) => {
  await open(page);
  const count = sources.requests.length;
  for (const amount of ['', '0', '-1', '1000000000001']) {
    await page.locator('#amount').fill(amount);
    await expect(page.locator('#amount')).toHaveAttribute('aria-invalid', 'true');
    await expect(page.locator('#bestTotal')).toHaveText('—');
    await expect(page.locator('#quotes .comparison-total').first()).toHaveText('—');
  }
  for (const amount of ['0.5', '1000000000000']) {
    await page.locator('#amount').fill(amount);
    await expect(page.locator('#amount')).toHaveAttribute('aria-invalid', 'false');
    await verifyRanking(page, 'sell');
  }
  expect(sources.requests).toHaveLength(count);
});

test('reference/manual calculator cannot replace comparison winner and resets across selections', async ({ page, sources }) => {
  await open(page);
  await page.locator('.reference > summary').click();
  const best = await page.locator('#bestTotal').textContent();
  await page.locator('#quoteSelect').selectOption('manual');
  await page.locator('#manualRate').fill('99999');
  await expect(page.locator('#result')).toHaveText('₲ 9.999.900');
  await expect(page.locator('#calculationDetail')).toContainText('no verificada');
  await expect(page.locator('#bestTotal')).toHaveText(best);
  await page.locator('#manualRate').fill('-1');
  await expect(page.locator('#result')).toHaveText('—');
  for (const [selector, value] of [['#operation', 'buy'], ['#currencySelect', 'EUR'], ['#citySelect', 'Ciudad del Este']]) {
    await page.locator('#manualRate').fill('6000');
    await select(page, selector, value);
    await expect(page.locator('#manualRate')).toHaveValue('');
    await expect(page.locator('#result')).toHaveText('—');
    await expect(page.locator('#bestTotal')).not.toHaveText('—');
  }
});

test('failure excludes previous readings from best, preserves selection cache isolation and recovers', async ({ page, sources }) => {
  sources.norteOnly = true;
  await open(page);
  await expect(page.locator('#bestTotal')).toHaveText('₲ 565.000');
  sources.fail = true;
  await page.locator('#fetchBtn').click(); await settled(page);
  await expect(page.locator('#quotes .previous')).toHaveCount(1);
  await expect(page.locator('#bestTotal')).toHaveText('—');
  await expect(page.locator('#quotes .best-row')).toHaveCount(0);
  await expect(page.locator('#quotes .previous .comparison-delta')).toHaveText('No comparable');
  await select(page, '#citySelect', 'Bella Vista Norte');
  await expect(page.locator('#quotes .previous')).toHaveCount(0);
  await select(page, '#citySelect', 'Asunción');
  await expect(page.locator('#quotes .previous')).toHaveCount(1);
  await select(page, '#currencySelect', 'EUR');
  await expect(page.locator('#quotes .previous')).toHaveCount(0);
  sources.fail = false;
  await page.locator('#fetchBtn').click(); await settled(page);
  await expect(page.locator('#bestTotal')).toHaveText('₲ 630.000');
  await expect(page.locator('#status')).not.toHaveClass(/error/);
});

test('rapid currency changes ignore delayed obsolete requests', async ({ page, sources }) => {
  sources.norteOnly = true;
  await open(page);
  sources.delayEUR = true;
  await page.locator('#currencySelect').selectOption('EUR');
  await expect.poll(() => sources.requests.some(url => url.endsWith('/EUR'))).toBe(true);
  await page.locator('#currencySelect').selectOption('BRL');
  await settled(page);
  await page.waitForTimeout(450); // Delayed obsolete EUR response must not overwrite BRL.
  await expect(page.locator('#currencySelect')).toHaveValue('BRL');
  await expect(page.locator('#bestTotal')).toHaveText('₲ 111.500');
  await expect(page.locator('#amountCurrency')).toHaveText('BRL');
  await expect(page.locator('#quotes .quote')).toHaveCount(1);
});

test('cached page reads retain retrieval time; explicit refresh bypasses cache', async ({ page, sources }) => {
  await open(page);
  const initialRequests = [...sources.requests];
  const timestamp = await page.locator('#quotes .quote-meta p').first().textContent();
  await select(page, '#citySelect', '');
  const allCities = sources.requests.length;
  expect(allCities).toBeGreaterThan(initialRequests.length);
  await select(page, '#citySelect', 'Asunción');
  // Successful pages must all remain cached. The real Más fixture only covers
  // Matriz: its Asunción HTTP503 is deliberately not cached and must be retried.
  expect(sources.requests.slice(allCities)).toEqual([
    'https://mascambios.com.py/api/cotizaciones.php?sucursal=sucursal1',
  ]);
  await expect(page.locator('#quotes .quote-meta p').first()).toHaveText(timestamp);
  const beforeRefresh = sources.requests.length;
  await page.locator('#fetchBtn').click(); await settled(page);
  // Refresh refetches precisely the original city sources, including the failure.
  expect(sources.requests.slice(beforeRefresh).sort()).toEqual([...initialRequests].sort());
});

test('city without automatic prices offers directory instead of fake best quote', async ({ page, sources }) => {
  await open(page);
  // Luque has a verified directory entry but no automatic price source.
  await select(page, '#citySelect', 'Luque');
  await expect(page.locator('#bestTotal')).toHaveText('—');
  await expect(page.locator('#quotes .quote')).toHaveCount(0);
  await expect(page.locator('#quotes')).toContainText('Sin cotizaciones locales');
  await expect(page.locator('#directory .directory-item').first()).toBeVisible();
  await expect(page.locator('#fetchBtn')).toBeEnabled();
});

test('keyboard controls, official links and 320px layout stay usable', async ({ page, sources }) => {
  await open(page);
  await page.keyboard.press('Tab');
  await expect(page.locator('.skip-link')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);
  const summary = page.locator('.reference > summary');
  await summary.focus(); await page.keyboard.press('Enter');
  await expect(page.locator('#quoteSelect')).toBeVisible();
  await page.locator('#amount').focus();
  await page.keyboard.press('ControlOrMeta+A'); await page.keyboard.type('42');
  await expect(page.locator('#amount')).toHaveValue('42');
  await verifyRanking(page, 'sell');
  const links = await page.locator('a[target="_blank"]').evaluateAll(nodes => nodes.map(node => ({ href: node.href, rel: node.rel })));
  expect(links.length).toBeGreaterThan(10);
  for (const link of links) { expect(link.href).toMatch(/^https:\/\//); expect(link.rel).toContain('noopener'); expect(link.rel).toContain('noreferrer'); }
  await expect(page.locator('#bestDirections a')).toHaveAttribute('href', /^https:\/\//);
  for (const width of [390, 320]) {
    await page.setViewportSize({ width, height: 844 });
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    await expect(page.locator('#amount')).toBeVisible();
    await expect(page.locator('#quotes .comparison-total').first()).toBeVisible();
  }
});

test('bank channels never enter local ranking or acquire the selected city', async ({ page, sources }) => {
  await open(page);
  await expect(page.locator('#bankQuotes .quote h3')).toHaveText(['Solar Banco']);
  await expect(page.locator('#bestIdentity')).not.toContainText('Solar');
  await expect(page.locator('#bankQuotes')).toContainText('Sin ciudad ni sucursal asignada');
  const bankBefore = await page.locator('#bankQuotes .quote').allTextContents();
  await select(page, '#citySelect', 'Luque');
  await expect(page.locator('#bestTotal')).toHaveText('—');
  await expect(page.locator('#quotes .quote')).toHaveCount(0);
  expect(await page.locator('#bankQuotes .quote').allTextContents()).toEqual(bankBefore);
  await expect(page.locator('#bankQuotes')).not.toContainText('Luque');
  const calls = sources.requests.length;
  await select(page, '#channelSelect', 'cash');
  await expect(page.locator('#bankQuotes .quote')).toHaveCount(3);
  for (const label of await page.locator('#bankQuotes .branch').allTextContents()) expect(label).toContain('Efectivo');
  await expect(page.locator('#bestTotal')).toHaveText('—');
  await select(page, '#channelSelect', 'app');
  await expect(page.locator('#bankQuotes .quote h3')).toHaveText(['Ueno Bank']);
  await expect(page.locator('#bankQuotes .comparison-total')).toHaveText('₲ 565.000');
  await expect(page.locator('#bestTotal')).toHaveText('—');
  await expect(page.locator('#quotes .best-row')).toHaveCount(0);
  expect(sources.requests).toHaveLength(calls);
});

test('unavailable bank currency/channel is not converted to zero or another channel', async ({ page, sources }) => {
  await open(page);
  await select(page, '#currencySelect', 'BRL');
  await select(page, '#channelSelect', 'online');
  await expect(page.locator('#bankQuotes .best-row')).toHaveCount(0);
  expect(await page.locator('#bankQuotes .comparison-total').allTextContents()).not.toContain('₲ 0');
  await expect(page.locator('#bestTotal')).toHaveText('—');
  await select(page, '#channelSelect', 'app');
  await expect(page.locator('#bankQuotes .quote')).toHaveCount(0);
  await expect(page.locator('#bankQuotes')).toContainText('Sin precios bancarios');
  await select(page, '#channelSelect', 'cash');
  await expect(page.locator('#bankQuotes .quote h3')).toHaveText(['Banco Atlas']);
});

test('city and currency preferences survive reload without persisting amount or operation', async ({ page, sources }) => {
  await open(page);
  await select(page, '#citySelect', 'Hernandarias');
  await select(page, '#currencySelect', 'EUR');
  await page.locator('#amount').fill('420');
  await page.locator('#operation').selectOption('buy');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('cambio-claro:preferences:v1')));
  expect(saved).toEqual({ city: 'Hernandarias', currency: 'EUR' });
  await page.reload(); await settled(page);
  await expect(page.locator('#citySelect')).toHaveValue('Hernandarias');
  await expect(page.locator('#currencySelect')).toHaveValue('EUR');
  await expect(page.locator('#amount')).toHaveValue('100');
  await expect(page.locator('#operation')).toHaveValue('sell');
  await verifyRanking(page, 'sell');
});

test('valid URL overrides saved preferences including all-cities and bank channel', async ({ page, sources }) => {
  await page.addInitScript(() => localStorage.setItem('cambio-claro:preferences:v1', JSON.stringify({ city:'Hernandarias', currency:'EUR' })));
  await page.goto('/?city=&currency=USD&operation=buy&amount=250.5&channel=app'); await settled(page);
  for (const [id, value] of [['citySelect',''], ['currencySelect','USD'], ['operation','buy'], ['amount','250.5'], ['channelSelect','app']]) await expect(page.locator(`#${id}`)).toHaveValue(value);
  await expect(page.locator('#bankQuotes .quote h3')).toHaveText(['Ueno Bank']);
  await expect(page.locator('#bankQuotes .comparison-total')).toHaveText('₲ 1.465.425');
  await expect(page.locator('#bestTotal')).toHaveText('—');
});

test('invalid URL filters safely fall back to validated saved preferences and defaults', async ({ page, sources }) => {
  await page.addInitScript(() => localStorage.setItem('cambio-claro:preferences:v1', JSON.stringify({ city:'Hernandarias', currency:'EUR', operation:'buy', amount:'999', channel:'cash' })));
  await page.goto('/?city=Atlantis&currency=JPY&operation=hack&amount=-1&channel=all'); await settled(page);
  for (const [id, value] of [['citySelect','Hernandarias'], ['currencySelect','EUR'], ['operation','sell'], ['amount','100'], ['channelSelect','unspecified']]) await expect(page.locator(`#${id}`)).toHaveValue(value);
  await verifyRanking(page, 'sell');
  await expect(page.locator('#channelNote')).toContainText('No asumimos que sea efectivo');
});

test('corrupt or blocked local storage cannot prevent a usable comparison', async ({ page, sources }) => {
  await page.addInitScript(() => { try { localStorage.setItem('cambio-claro:preferences:v1', '{not-json'); } catch {} });
  await open(page);
  await expect(page.locator('#citySelect')).toHaveValue('Asunción');
  await verifyRanking(page, 'sell');
  await page.addInitScript(() => {
    Storage.prototype.getItem = () => { throw new DOMException('Storage blocked', 'SecurityError'); };
    Storage.prototype.setItem = () => { throw new DOMException('Storage blocked', 'SecurityError'); };
  });
  await page.reload(); await settled(page);
  await select(page, '#currencySelect', 'BRL');
  await verifyRanking(page, 'sell');
});

test('share fallback round-trips the exact selection without leaking unrelated URL parameters', async ({ page, sources }) => {
  await page.addInitScript(() => Object.defineProperty(navigator, 'clipboard', { configurable:true, value:{writeText:async () => { throw new DOMException('Denied','NotAllowedError'); }} }));
  await page.goto('/?tracking=private#old'); await settled(page);
  await select(page, '#citySelect', 'Ciudad del Este');
  await select(page, '#currencySelect', 'EUR');
  await page.locator('#amount').fill('125.5');
  await page.locator('#operation').selectOption('buy');
  await select(page, '#channelSelect', 'cash');
  await page.locator('#shareBtn').click();
  await expect(page.locator('#shareLink')).toBeVisible();
  const shared = await page.locator('#shareLink').inputValue();
  const url = new URL(shared);
  expect(Object.fromEntries(url.searchParams)).toEqual({ city:'Ciudad del Este', currency:'EUR', operation:'buy', amount:'125.5', channel:'cash' });
  expect(url.hash).toBe('');
  await page.goto(shared); await settled(page);
  for (const [id,value] of [['citySelect','Ciudad del Este'], ['currencySelect','EUR'], ['operation','buy'], ['amount','125.5'], ['channelSelect','cash']]) await expect(page.locator(`#${id}`)).toHaveValue(value);
  await page.locator('#amount').fill('0'); await page.locator('#shareBtn').click();
  await expect(page.locator('#shareStatus')).toContainText('importe válido');
});

test('reference quote changes with channel and cannot retain a hidden cross-channel selection', async ({ page, sources }) => {
  await open(page);
  await page.locator('.reference > summary').click();
  const norte = await page.locator('#quoteSelect option').evaluateAll(options => options.find(o => o.textContent.includes('Norte')).value);
  await page.locator('#quoteSelect').selectOption(norte);
  await expect(page.locator('#calculationDetail')).toContainText('Asunción');
  await select(page, '#channelSelect', 'app');
  expect(await page.locator('#quoteSelect option').allTextContents()).toEqual([
    expect.stringContaining('Ueno Bank'), 'Introducir mi cotización',
  ]);
  await expect(page.locator('#calculationDetail')).not.toContainText('Asunción');
  await expect(page.locator('#result')).toHaveText('₲ 565.000');
  await expect(page.locator('#bestTotal')).toHaveText('—');
});

test('four additional sources preserve unspecified channel, branch geography and bank separation', async ({ page, sources }) => {
  await open(page);
  await select(page, '#citySelect', '');
  await select(page, '#channelSelect', 'unspecified');
  for (const currency of ['USD','EUR','BRL','ARS']) {
    await select(page, '#currencySelect', currency);
    const names=await page.locator('#quotes .quote h3').allTextContents();
    for(const name of ['Oriente Cambios','Maxicambios','M & D Cambios','Más Cambios']) expect(names).toContain(name);
    expect(names.some(name=>/Banco|Ueno/.test(name))).toBe(false);
    await verifyRanking(page, 'sell');
    await page.locator('#operation').selectOption('buy');
    await verifyRanking(page, 'buy');
    await page.locator('#operation').selectOption('sell');
  }
  await select(page, '#citySelect', 'Encarnación');
  await select(page, '#currencySelect', 'USD');
  expect((await page.locator('#quotes .quote h3').allTextContents()).sort()).toEqual(['Cambios Alberdi','Oriente Cambios']);
  for(const branch of await page.locator('#quotes .branch').allTextContents()) expect(branch).toContain('Encarnación');
  await expect(page.locator('#bankQuotes')).toContainText('Sin ciudad ni sucursal asignada');
  await select(page, '#channelSelect', 'cash');
  await expect(page.locator('#quotes .quote')).toHaveCount(0);
  await expect(page.locator('#bestTotal')).toHaveText('—');
});

test('direct JSON source keeps its retrieval timestamp when served from cache', async ({ page, sources }) => {
  await page.clock.setFixedTime(new Date('2026-10-20T01:00:45Z'));
  await open(page);
  await select(page, '#citySelect', 'Ciudad del Este');
  const mas = page.locator('#quotes .quote').filter({ has:page.getByRole('heading',{name:'Más Cambios',exact:true}) });
  await expect(mas).toHaveCount(1);
  const timestamp=await mas.locator('.quote-meta p').textContent();
  const requests=()=>sources.requests.filter(url=>url.startsWith('https://mascambios.com.py/api/') && url.endsWith('sucursal=matriz')).length;
  const before=requests();
  await page.clock.setFixedTime(new Date('2026-10-20T01:01:15Z'));
  await select(page, '#citySelect', 'Asunción');
  await select(page, '#citySelect', 'Ciudad del Este');
  await expect(mas.locator('.quote-meta p')).toHaveText(timestamp);
  expect(requests()).toBe(before);
  await page.locator('#fetchBtn').click(); await settled(page);
  expect(requests()).toBeGreaterThan(before);
  await expect(mas.locator('.quote-meta p')).not.toHaveText(timestamp);
});
