import { test, expect } from '@playwright/test';

// Opt-in: one initial city fetch only, no synthetic success requirement for live providers.
test('published site renders and settles honestly without JavaScript errors', async ({ page }) => {
  test.skip(!process.env.LIVE_SMOKE, 'Run explicitly with LIVE_SMOKE=1; never contacts providers in normal CI.');
  test.setTimeout(65000);
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('https://hebadenys.github.io/BestEchangeRates/');
  await expect(page.getByRole('heading', { name: 'Tu cambio, en tu ciudad.' })).toBeVisible();
  await expect(page.locator('#fetchBtn')).toBeEnabled({ timeout: 50000 });
  await expect(page.locator('#quotes')).toHaveAttribute('aria-busy', 'false');
  const rows = await page.locator('.quote:not(.previous)').count();
  if (rows) await expect(page.locator('#bestTotal')).not.toHaveText('—');
  else { await expect(page.locator('#bestTotal')).toHaveText('—'); await expect(page.locator('#status')).toContainText('Sin precios'); }
  expect(errors).toEqual([]);
});
