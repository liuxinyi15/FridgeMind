import { expect, test } from '@playwright/test';
import path from 'node:path';

const studyImage = (name: string) => path.resolve('public/study', name);

test('study recipe image runs through real browser OCR into editable personal recipe review', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore a separate demo fridge' }).click();
  await page.goto('/settings/research/usability');
  await page.getByRole('button', { name: 'Start new session' }).click();
  const task = page.getByRole('article').filter({ hasText: 'Personal recipe import' });
  await task.getByRole('button', { name: 'Launch task' }).click();
  await expect(page.getByRole('img', { name: /Study recipe screenshot/ })).toBeVisible();
  await page.getByRole('button', { name: 'Scan this image' }).click();
  await expect(page.getByRole('heading', { name: 'Review what we found' })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByLabel('Recipe name')).toHaveValue(/Creamy Spinach Pasta/i);
  await expect(page.getByText('Original text')).toBeVisible();
  await page.getByLabel('Recipe name').fill('Creamy Spinach Pasta favourite');
  await page.getByRole('button', { name: 'Save recipe' }).click();
  await expect(page.getByRole('heading', { name: 'Creamy Spinach Pasta favourite' })).toBeVisible();
  await expect(page.getByText('Your recipe')).toBeVisible();
});

test('real receipt OCR proposes groceries and reconciles a shopping match', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.getByRole('button', { name: 'Skip' }).click();
  await page.evaluate(() => {
    const key = 'fridgemind:v0.1:data';
    const data = JSON.parse(localStorage.getItem(key)!);
    data.shopping = [{ id: 'ocr-shop-mushrooms', ingredientName: 'Mushrooms', canonicalName: 'mushroom', quantity: 250, unit: 'g', recipeId: 'recipe-mushroom-pasta', recipeName: 'Mushroom Pasta', reason: 'Needed for dinner.', bought: false }];
    localStorage.setItem(key, JSON.stringify(data));
  });
  await page.reload();
  await page.goto('/fridge/add');
  await page.getByRole('button', { name: /Scan receipt/ }).click();
  await page.getByLabel('Choose image to scan').setInputFiles(studyImage('receipt.png'));
  await expect(page.getByRole('heading', { name: 'Review receipt items' })).toBeVisible({ timeout: 60_000 });
  await expect(page.locator('.import-candidate')).toHaveCount(4);
  await expect(page.getByText('Matches your shopping list')).toBeVisible();
  await page.getByRole('button', { name: 'Add 4 foods' }).click();
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('fridgemind:v0.1:data')!));
  expect(saved.shopping[0].addedToFridge).toBe(true);
  expect(saved.inventory.filter((item: { canonicalName: string }) => item.canonicalName === 'mushroom')).toHaveLength(1);
});

test('real package OCR proposes the printed product name and weight', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto('/');
  await page.getByRole('button', { name: 'Skip' }).click();
  await page.goto('/fridge/add');
  await page.getByRole('button', { name: /Scan package/ }).click();
  await page.getByLabel('Choose image to scan').setInputFiles(studyImage('package.png'));
  await expect(page.getByRole('heading', { name: 'Review package' })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByLabel('Name')).toHaveValue('Spinach');
  await expect(page.getByLabel('Amount', { exact: true })).toHaveValue('200');
  await expect(page.getByRole('combobox', { name: 'Unit' })).toHaveValue('g');
  await page.getByRole('button', { name: 'Add 1 food' }).click();
  await expect(page.getByRole('heading', { name: 'Spinach' })).toBeVisible();
});
