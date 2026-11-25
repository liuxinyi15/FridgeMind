import { expect, test } from '@playwright/test';

const imageFile = { name: 'arbitrary.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('not-a-real-recognition-fixture') };

test('new consumer starts empty and arbitrary images never fabricate content', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: /Remember what needs using/ })).toBeVisible();
  await page.getByRole('button', { name: 'Skip' }).click();
  await expect(page.getByRole('heading', { name: 'Choose a quick start' })).toBeVisible();
  await expect(page.getByText(/0 foods need attention|0 meals without shopping|0 meals already prepared/)).toHaveCount(0);
  const initial = await page.evaluate(() => JSON.parse(localStorage.getItem('fridgemind:v0.1:data')!));
  expect(initial.experienceMode).toBe('consumer');
  expect(initial.inventory).toEqual([]);

  await page.goto('/fridge/add');
  await page.getByRole('button', { name: /Scan package/ }).click();
  await page.getByLabel('Choose image to scan').setInputFiles(imageFile);
  await expect(page.getByRole('heading', { name: /couldn’t read enough text/i })).toBeVisible();
  await expect(page.getByText(/Spinach|Mushrooms|Chicken/)).toHaveCount(0);

  await page.goto('/fridge/add');
  await page.getByRole('button', { name: /Quick add foods/ }).click();
  await page.getByLabel('Food names').fill('spinach, mushrooms; chicken\npasta');
  await page.getByRole('button', { name: 'Review foods' }).click();
  await expect(page.locator('.import-candidate')).toHaveCount(4);
  await page.getByRole('button', { name: 'Add 4 foods' }).click();
  await expect(page.getByRole('heading', { name: 'My Fridge' })).toBeVisible();
  await page.getByRole('link', { name: 'Today' }).click();
  await expect(page.getByRole('heading', { name: 'Start with something useful.' })).toHaveCount(0);

  await page.goto('/recipes/import');
  await page.getByLabel('Choose recipe image').setInputFiles({ ...imageFile, name: 'recipe-anything.jpg' });
  await expect(page.getByRole('heading', { name: /couldn’t read this recipe clearly enough/i })).toBeVisible();
  await expect(page.getByText('Mushroom Pasta')).toHaveCount(0);
});

test('real text imports create editable personal content and conservative receipt items', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Add a recipe I like' }).click();
  await page.getByRole('button', { name: /Paste recipe text/ }).click();
  await page.getByLabel('Recipe text').fill(`Creamy mushroom pasta

Serves 2
Ready in 25 minutes

Ingredients
180 g spaghetti
200g mushrooms
1 small onion
120 ml double cream
2 cloves garlic
Salt and pepper

Method
1. Cook the pasta.
2. Fry mushrooms and onion.
3. Add cream.
4. Combine and serve.`);
  await page.getByRole('button', { name: 'Review recipe' }).click();
  await expect(page.getByLabel('Recipe name')).toHaveValue('Creamy mushroom pasta');
  await expect(page.getByLabel('Ingredient 5 name')).toHaveValue('garlic');
  await expect(page.getByLabel('Preparation time')).toHaveValue('25');
  await expect(page.getByText('Original text')).toBeVisible();
  await page.getByRole('button', { name: 'Save recipe' }).click();
  await page.getByRole('link', { name: 'Recipes' }).click();
  await expect(page.getByRole('heading', { name: 'My recipes' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Creamy mushroom pasta' }).first()).toBeVisible();

  await page.goto('/fridge/add');
  await page.getByRole('button', { name: /Scan receipt/ }).click();
  await page.getByRole('button', { name: /Paste receipt text instead/ }).click();
  await page.getByLabel('Receipt text').fill('TESCO\nMUSHROOMS 250G\nBABY SPINACH\nCHICKEN BREAST\nPENNE PASTA\nTOTAL £9.40');
  await page.getByRole('button', { name: 'Review items' }).click();
  await expect(page.locator('.import-candidate')).toHaveCount(4);
  await expect(page.getByText('Amount unknown')).toHaveCount(3);
});

test('V0.4 core pages fit common phone widths', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore a separate demo fridge' }).click();
  for (const width of [375, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of ['/', '/fridge', '/fridge/add', '/recipes', '/recipes/import', '/settings']) {
      await page.goto(route);
      expect(await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth), `${route} at ${width}px`).toBe(false);
    }
  }
});
