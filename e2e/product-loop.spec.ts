import { test, expect } from '@playwright/test';

test('complete everyday product loop persists through leftovers', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  for (let step = 0; step < 2; step++) await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Open my kitchen' }).click();

  await page.getByRole('link', { name: 'Fridge' }).click();
  await page.getByRole('link', { name: /Add food/ }).click();
  await page.getByRole('button', { name: 'Enter manually' }).click();
  await page.getByLabel('Food name').fill('Egg');
  await page.getByLabel('Quantity', { exact: true }).fill('6');
  await page.getByLabel('Unit').selectOption('item');
  await page.getByRole('button', { name: 'Save to My Fridge' }).click();
  await expect(page.getByRole('heading', { name: 'My Fridge' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Egg' })).toBeVisible();

  await page.getByRole('link', { name: 'Today' }).click();
  await page.getByRole('button', { name: 'Cooking tonight' }).click();
  await expect(page.getByRole('button', { name: 'Cooking tonight' })).toHaveAttribute('aria-pressed', 'true');

  await page.goto('/recipes/recipe-mushroom-pasta');
  await page.getByRole('button', { name: 'Start cooking' }).click();
  await expect(page.getByRole('heading', { name: 'Cream amount is uncertain' })).toBeVisible();
  await page.getByRole('button', { name: 'Yes' }).click();
  await page.getByRole('button', { name: 'Add missing items' }).click();
  await page.getByRole('button', { name: 'List updated' }).click();
  await page.getByRole('link', { name: 'View list' }).click();
  await expect(page.getByText('Mushrooms', { exact: true })).toHaveCount(1);

  await page.getByRole('checkbox').check();
  await expect(page.getByText('Mushrooms purchased')).toBeVisible();
  await expect(page.getByLabel('Amount')).toHaveValue('250');
  await page.getByRole('button', { name: 'Add to fridge' }).click();
  await expect(page.getByText('Added to My Fridge')).toBeVisible();

  await page.reload();
  await expect(page.getByText('Added to My Fridge')).toBeVisible();
  await page.goto('/recipes/recipe-mushroom-pasta');
  await expect(page.getByText('Everything you need', { exact: true }).first()).toBeVisible();
  await page.getByRole('button', { name: 'Start cooking' }).click();
  await page.getByRole('button', { name: 'Finish cooking' }).click();
  await expect(page.getByRole('heading', { name: 'Dinner done?' })).toBeVisible();
  await page.getByRole('button', { name: 'Yes, update my fridge' }).click();
  await expect(page.getByRole('heading', { name: 'Save the rest?' })).toBeVisible();
  await page.getByRole('button', { name: 'Save 1 for later' }).click();

  await expect(page.getByRole('heading', { name: 'Dinner is already sorted.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Mushroom Pasta' })).toBeVisible();
  await expect(page.getByText('1 portion left · Stored today')).toBeVisible();

  await page.reload();
  await expect(page.getByRole('heading', { name: 'Dinner is already sorted.' })).toBeVisible();
  await page.getByRole('link', { name: 'Fridge' }).click();
  await expect(page.getByText('Mushroom Pasta')).toBeVisible();
  await expect(page.locator('body')).not.toContainText('-1');
});

test('meal context suppresses cooking recommendations without hiding rescue', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  for (let step = 0; step < 2; step++) await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Open my kitchen' }).click();
  await page.getByRole('button', { name: 'Eating out' }).click();
  await expect(page.getByRole('heading', { name: 'Enjoy your evening out.' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'One quick fridge check' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Cook this' })).toHaveCount(0);
  await page.reload();
  await expect(page.getByRole('button', { name: 'Eating out' })).toHaveAttribute('aria-pressed', 'true');
});
