import { test } from '@playwright/test';
import path from 'node:path';

const output = (name: string) => path.resolve('docs/evidence/screenshots', name);

test('capture reproducible HCI evidence', async ({ page }) => {
  await page.goto('/');
  await page.screenshot({ path: output('01_onboarding.png'), fullPage: true });
  await page.getByRole('button', { name: 'Explore a separate demo fridge' }).click();
  await page.screenshot({ path: output('02_today_initial.png'), fullPage: true });
  await page.locator('.use-soon-card').screenshot({ path: output('03_use_soon.png') });
  await page.goto('/fridge');
  await page.screenshot({ path: output('04_fridge_inventory.png'), fullPage: true });
  await page.goto('/fridge/add');
  await page.screenshot({ path: output('05_add_food.png'), fullPage: true });
  await page.goto('/recipes/import');
  await page.screenshot({ path: output('06_recipe_import.png'), fullPage: true });
  await page.goto('/recipes/recipe-mushroom-pasta');
  await page.screenshot({ path: output('07_recipe_match.png'), fullPage: true });
  await page.getByRole('button', { name: 'Increase portions' }).click();
  await page.screenshot({ path: output('08_serving_adjustment.png'), fullPage: true });
  await page.getByRole('button', { name: 'Add missing items' }).click();
  await page.goto('/shopping');
  await page.screenshot({ path: output('09_shopping_list.png'), fullPage: true });
  await page.goto('/settings');
  await page.screenshot({ path: output('14_notification_settings.png'), fullPage: true });
  await page.goto('/fridge/food-cream');
  await page.screenshot({ path: output('15_uncertain_inventory.png'), fullPage: true });
});
