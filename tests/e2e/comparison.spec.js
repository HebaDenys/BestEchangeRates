import { test, expect, open, settled, select } from './fixtures.js';

const number = text => Number(text.replace(/[^\d,.-]/g, '').replaceAll('.', '').replace(',', '.'));

async function verifyRanking(page, operation) {
  const rows = await page.locator('.quote:not(.previous)').evaluateAll(nodes => nodes.map(node => ({
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
    const names = await page.locator('.quote h3').allTextContents();
    for (const name of ['Norte Cambios', 'Bonanza Cambios', 'Cambios Alberdi', 'Fortuna Cambios', 'Fe Cambios', 'Ita Cambios', 'Fénix Cambios', 'Uno Cambios', 'Valor Cambios', 'Cambios Río Paraná', 'Cambios Triple C', 'Mercosur Cambios']) expect(names).toContain(name);
  }
  await select(page, '#citySelect', 'Hernandarias');
  for (const branch of await page.locator('.quote .branch').allTextContents()) expect(branch).toContain('Hernandarias');
  await expect(page.locator('#directoryNote')).toContainText('Hernandarias');
});

test('buy/sell sorting, ties and tiny nonzero differences remain explicit', async ({ page, sources }) => {
  await open(page);
  await verifyRanking(page, 'sell');
  await expect(page.locator('#bestIdentity')).toContainText('Empate');
  const count = sources.requests.length;
  await page.locator('#amount').fill('0.000001');
  await expect(page.locator('.comparison-delta').filter({ hasText: 'menos de ₲ 0,01' }).first()).toBeVisible();
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
    await expect(page.locator('.comparison-total').first()).toHaveText('—');
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
  await expect(page.locator('.previous')).toHaveCount(1);
  await expect(page.locator('#bestTotal')).toHaveText('—');
  await expect(page.locator('.best-row')).toHaveCount(0);
  await expect(page.locator('.previous .comparison-delta')).toHaveText('No comparable');
  await select(page, '#citySelect', 'Bella Vista Norte');
  await expect(page.locator('.previous')).toHaveCount(0);
  await select(page, '#citySelect', 'Asunción');
  await expect(page.locator('.previous')).toHaveCount(1);
  await select(page, '#currencySelect', 'EUR');
  await expect(page.locator('.previous')).toHaveCount(0);
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
  await expect(page.locator('.quote')).toHaveCount(1);
});

test('cached page reads retain retrieval time; explicit refresh bypasses cache', async ({ page, sources }) => {
  await open(page);
  const initial = sources.requests.length;
  const timestamp = await page.locator('.quote-meta p').first().textContent();
  await select(page, '#citySelect', '');
  const allCities = sources.requests.length;
  expect(allCities).toBeGreaterThan(initial);
  await select(page, '#citySelect', 'Asunción');
  expect(sources.requests).toHaveLength(allCities);
  await expect(page.locator('.quote-meta p').first()).toHaveText(timestamp);
  await page.locator('#fetchBtn').click(); await settled(page);
  expect(sources.requests.length).toBeGreaterThan(allCities);
});

test('city without automatic prices offers directory instead of fake best quote', async ({ page, sources }) => {
  await open(page);
  // Luque has a verified directory entry but no automatic price source.
  await select(page, '#citySelect', 'Luque');
  await expect(page.locator('#bestTotal')).toHaveText('—');
  await expect(page.locator('.quote')).toHaveCount(0);
  await expect(page.locator('#quotes')).toContainText('Sin cotizaciones automáticas');
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
    await expect(page.locator('.comparison-total').first()).toBeVisible();
  }
});
