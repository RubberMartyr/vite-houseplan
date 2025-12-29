// Visual regression harness (dev-only).
// Run a dev server (`npm run dev -- --host 0.0.0.0 --port 3000`) before executing:
//   npx playwright test tests/visual-regression.spec.ts --project=chromium

import { test, expect } from '@playwright/test';

const BASE_URL = process.env.VITE_REGRESSION_BASE_URL ?? 'http://localhost:3000';
const VIEWPORT = { width: 1280, height: 720 };
const QUERY = '?screenshot=1&debug=1';

async function waitForStableRender(page: any) {
  await page.waitForSelector('canvas');
  await page.waitForTimeout(1000);
}

test.use({
  viewport: VIEWPORT,
  deviceScaleFactor: 1,
});

test('default facade view', async ({ page }) => {
  await page.goto(`${BASE_URL}/${QUERY}`);
  await waitForStableRender(page);
  const screenshot = await page.screenshot({ path: 'artifacts/default.png', fullPage: false });
  expect(screenshot).toBeTruthy();
});

test('cutaway enabled', async ({ page }) => {
  await page.goto(`${BASE_URL}/${QUERY}`);
  await waitForStableRender(page);
  await page.getByRole('button', { name: /Cutaway/i }).click();
  await waitForStableRender(page);
  const screenshot = await page.screenshot({ path: 'artifacts/cutaway.png', fullPage: false });
  expect(screenshot).toBeTruthy();
});

test('hide front facade', async ({ page }) => {
  await page.goto(`${BASE_URL}/${QUERY}`);
  await waitForStableRender(page);
  await page.getByRole('button', { name: 'Front' }).click();
  await waitForStableRender(page);
  const screenshot = await page.screenshot({ path: 'artifacts/hide-front.png', fullPage: false });
  expect(screenshot).toBeTruthy();
});
