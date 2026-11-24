import { test, expect } from '@playwright/test';

test('core FridgeMind journey remains linked', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  for (let step = 0; step < 2; step++) await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Open my kitchen' }).click();
  await expect(page.getByRole('heading', { name: 'Dinner, sorted.' })).toBeVisible();
  await page.getByRole('link', { name: 'Mushroom Pasta' }).first().click();
  await page.getByRole('button', { name: 'Increase portions' }).click();
  await expect(page.getByText('Missing 180g')).toBeVisible();
  await page.getByRole('button', { name: 'Add missing items' }).click();
  await page.getByRole('link', { name: 'View list' }).click();
  await expect(page.getByText('Mushrooms', { exact: true })).toBeVisible();
  await page.goto('/recipes/recipe-mushroom-pasta');
  await page.getByRole('button', { name: 'Increase portions' }).click();
  await page.getByRole('button', { name: 'Start cooking' }).click();
  await page.getByRole('button', { name: 'Finish cooking' }).click();
  await expect(page.getByRole('heading', { name: 'Did anything change?' })).toBeVisible();
  await page.getByRole('button', { name: 'Update My Fridge' }).click();
  await expect(page.getByRole('heading', { name: 'My Fridge' })).toBeVisible();
  await page.goto('/');
  await page.getByText('More options').click();
  await expect(page.getByText('The use-by date is tomorrow.')).toBeVisible();
  await page.getByRole('button', { name: 'Snooze one day' }).click();

  for (const route of ['/', '/fridge', '/recipes', '/shopping', '/settings', '/settings/research']) {
    await page.goto(route);
    const dimensions = await page.evaluate(() => ({ width: window.innerWidth, scrollWidth: document.documentElement.scrollWidth }));
    expect(dimensions.scrollWidth, `${route} should not overflow horizontally`).toBeLessThanOrEqual(dimensions.width);
  }

  for (const width of [320, 375, 390]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of ['/', '/fridge', '/recipes', '/recipes/recipe-mushroom-pasta', '/shopping']) {
      await page.goto(route);
      const dimensions = await page.evaluate(() => ({ width: window.innerWidth, scrollWidth: document.documentElement.scrollWidth }));
      expect(dimensions.scrollWidth, `${route} should fit ${width}px`).toBeLessThanOrEqual(dimensions.width);
    }
  }
});
