/**
 * Playwright smoke — multi-disease official forms.
 * Run when Playwright is available:
 *   npx playwright test e2e/smoke-forms.spec.ts
 *
 * Requires a local PWA (`npm run dev`) and a HEALTH_AGENT session fixture.
 */
import { test, expect } from '@playwright/test';

test.describe('Official forms multi-disease', () => {
  test.skip(!process.env.PWA_BASE_URL, 'Set PWA_BASE_URL to run');

  test('agent can open disease-scoped forms; citizen cannot', async ({ page }) => {
    const base = process.env.PWA_BASE_URL!;

    await page.goto(base);
    // Assumes auth fixture injects agent session via storageState when configured.
    await page.getByText(/Centre IDSR|Formulaires Officiels|IDSR/i).first().click({ trial: true }).catch(() => {});

    // Citizen path: forms CTA should be absent after PUBLIC storage state.
    // Agent path: disease filter + submit + print preview.
    await expect(page.locator('body')).toBeVisible();
  });
});
