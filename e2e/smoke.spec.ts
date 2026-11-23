import { test, expect } from '@playwright/test';

test('core FridgeMind journey remains linked', async ({ page }) => {
  await page.goto('/');
  for (let step = 0; step < 3; step++) await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Start planning' }).click();
  await expect(page.getByRole('heading', { name: 'What should I cook?' })).toBeVisible();
  await page.getByRole('link', { name: 'Mushroom Pasta' }).first().click();
  await page.getByRole('button', { name: '3' }).click();
  await expect(page.getByText('Missing 180g')).toBeVisible();
  await page.getByRole('button', { name: 'Add gaps to shopping' }).click();
  await page.getByRole('link', { name: 'View list' }).click();
  await expect(page.getByText('Mushrooms')).toBeVisible();
  await page.goto('/recipes/recipe-mushroom-pasta?servings=3');
  await page.getByRole('button', { name: 'Start cooking' }).click();
  await page.getByRole('button', { name: 'I’ve finished cooking' }).click();
  await expect(page.getByRole('heading', { name: 'Did anything change?' })).toBeVisible();
  await page.getByRole('button', { name: 'Update My Fridge' }).click();
  await expect(page.getByRole('heading', { name: 'My Fridge' })).toBeVisible();
  await page.goto('/');
  await page.getByText('Why am I seeing this?').click();
  await expect(page.getByText('The use-by date is tomorrow.')).toBeVisible();
  await page.getByRole('button', { name: 'Snooze 1 day' }).click();

  for (const route of ['/', '/fridge', '/recipes', '/shopping', '/settings', '/settings/research']) {
    await page.goto(route);
    const dimensions = await page.evaluate(() => ({ width: window.innerWidth, scrollWidth: document.documentElement.scrollWidth }));
    expect(dimensions.scrollWidth, `${route} should not overflow horizontally`).toBeLessThanOrEqual(dimensions.width);
  }
});
