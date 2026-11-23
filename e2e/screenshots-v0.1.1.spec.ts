import { test, expect } from '@playwright/test';
import path from 'node:path';

const output = (name: string) => path.resolve('docs/evidence/v0.1.1', `${name}.png`);

test('capture V0.1.1 mobile migration evidence', async ({ page }) => {
  await page.goto('/');
  await page.screenshot({ path: output('native_onboarding') });
  for (let step = 0; step < 3; step++) await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start planning' }).click();
  await page.screenshot({ path: output('native_today') });
  await page.locator('.use-soon-card').screenshot({ path: output('native_food_rescue') });

  await page.getByRole('link', { name: 'My Fridge' }).click();
  await page.screenshot({ path: output('native_fridge') });
  await page.getByRole('link', { name: 'Add food' }).click();
  await page.screenshot({ path: output('native_add_food') });
  await page.getByRole('button', { name: /Take a photo/ }).click();
  await expect(page.getByRole('dialog', { name: 'You stay in control' })).toBeVisible();
  await page.screenshot({ path: output('permission_explanation') });
  await page.getByRole('button', { name: 'Use manual entry' }).click();

  await page.goto('/recipes');
  await page.screenshot({ path: output('native_recipe') });
  await page.getByRole('link', { name: 'Mushroom Pasta' }).first().click();
  await page.screenshot({ path: output('native_recipe_match') });
  await page.getByRole('button', { name: 'Add gaps to shopping' }).click();
  await page.goto('/shopping');
  await page.screenshot({ path: output('native_shopping') });

  await page.goto('/settings');
  await page.locator('.native-capability-card').scrollIntoViewIfNeeded();
  await page.screenshot({ path: output('native_settings') });
});
