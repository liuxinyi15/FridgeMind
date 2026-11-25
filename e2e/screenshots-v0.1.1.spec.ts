import { test, expect } from '@playwright/test';
import path from 'node:path';

const output = (name: string) => path.resolve('docs/evidence/redesign', `${name}.png`);

test('capture polished mobile redesign', async ({ page }) => {
  await page.goto('/');
  await page.screenshot({ path: output('01_onboarding') });
  await page.getByRole('button', { name: 'Explore a separate demo fridge' }).click();
  await page.screenshot({ path: output('02_today') });
  await page.locator('.use-soon-card').screenshot({ path: output('03_food_rescue') });

  await page.getByRole('link', { name: 'Fridge' }).click();
  await page.screenshot({ path: output('04_fridge') });
  await page.getByRole('link', { name: 'Add food' }).click();
  await page.screenshot({ path: output('05_add_food') });
  await page.getByRole('button', { name: /Photo \+ item names/ }).click();
  await page.getByRole('button', { name: 'Take a photo' }).click();
  await expect(page.getByRole('dialog', { name: 'Open your camera?' })).toBeVisible();
  await page.screenshot({ path: output('06_photo_permission') });
  await page.getByRole('button', { name: 'Cancel', exact: true }).last().click();

  await page.goto('/recipes');
  await page.screenshot({ path: output('07_recipes') });
  await page.getByRole('link', { name: 'Mushroom Pasta' }).first().click();
  await page.screenshot({ path: output('08_recipe_detail') });
  await page.getByRole('button', { name: 'Add missing items' }).click();
  await page.goto('/shopping');
  await page.screenshot({ path: output('09_shopping') });

  await page.goto('/settings');
  await page.screenshot({ path: output('10_settings') });
  await page.locator('summary').filter({ hasText: 'Device notifications' }).click();
  await page.locator('.native-capability-card').scrollIntoViewIfNeeded();
  await page.screenshot({ path: output('11_settings_notifications') });
});
