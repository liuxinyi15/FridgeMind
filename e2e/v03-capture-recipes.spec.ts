import { expect, test } from '@playwright/test';

async function completeOnboarding(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore a separate demo fridge' }).click();
}

const imageFile = { name: 'groceries.jpg', mimeType: 'image/jpeg', buffer: Buffer.from('prototype-image') };

test('grocery photo uses editable batch review, removal and explicit duplicate handling', async ({ page }) => {
  await completeOnboarding(page);
  await page.goto('/settings/research');
  await page.getByRole('button', { name: /V0.3 A · Grocery photo fixture/ }).click();
  await page.getByRole('link', { name: 'Open scenario' }).click();
  await expect(page.getByRole('heading', { name: 'Review simulated items' })).toBeVisible();
  await expect(page.getByText(/simulated recognition fixture/i)).toBeVisible();
  await expect(page.locator('.import-candidate')).toHaveCount(3);
  const mushrooms = page.locator('.import-candidate').filter({ hasText: 'Mushrooms' });
  await mushrooms.getByRole('button', { name: 'Remove' }).click();
  const chicken = page.locator('.import-candidate').filter({ hasText: 'Chicken' });
  await chicken.getByLabel('Quantity').selectOption('exact');
  await chicken.getByLabel('Amount', { exact: true }).fill('300');
  await expect(chicken.getByText(/already have chicken/i)).toBeVisible();
  await chicken.getByLabel('Add as new purchase').check();
  const spinach = page.locator('.import-candidate').filter({ hasText: /already have spinach/i });
  await spinach.getByLabel('Merge with existing stock').check();
  await page.getByRole('button', { name: 'Add 2 foods' }).click();
  await expect(page.getByText('2 items added to your fridge.')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Spinach' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Chicken' })).toBeVisible();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('fridgemind:v0.1:data')!));
  expect(stored.inventory.find((item: { canonicalName: string }) => item.canonicalName === 'spinach').batches).toHaveLength(1);
  expect(stored.inventory.find((item: { canonicalName: string }) => item.canonicalName === 'chicken').batches).toHaveLength(2);
});

test('receipt import reconciles a matching Shopping item without a duplicate record', async ({ page }) => {
  await completeOnboarding(page);
  await page.goto('/settings/research');
  await page.getByRole('button', { name: /V0.3 F · Shopping receipt/ }).click();
  await page.getByRole('link', { name: 'Open scenario' }).click();
  await expect(page.getByRole('heading', { name: 'Review simulated items' })).toBeVisible();
  await expect(page.getByText('Matches your shopping list')).toBeVisible();
  await page.getByRole('button', { name: 'Deselect' }).click();
  await page.locator('.import-candidate').first().getByRole('checkbox').check();
  await page.getByRole('button', { name: 'Add 1 food' }).click();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem('fridgemind:v0.1:data')!));
  expect(stored.inventory.find((item: { canonicalName: string }) => item.canonicalName === 'mushroom').batches.some((batch: { quantityMode: string; source: string }) => batch.quantityMode === 'unknown' && batch.source === 'shopping')).toBe(true);
  await page.getByRole('link', { name: 'Shopping' }).click();
  await expect(page.getByText('Added to My Fridge')).toBeVisible();
});

test('recipe image and text imports save editable personal recipes into normal matching', async ({ page }) => {
  await completeOnboarding(page);
  await page.goto('/recipes/import');
  await page.getByLabel('Choose recipe image').setInputFiles({ ...imageFile, name: 'recipe-screenshot.jpg' });
  await expect(page.getByRole('heading', { name: /couldn’t read enough text/i })).toBeVisible();
  await expect(page.getByText('Mushroom Pasta')).toHaveCount(0);
  await page.getByRole('button', { name: 'Create manually' }).click();
  await page.getByLabel('Recipe name').fill('Photo recipe');
  await page.getByLabel('Ingredient 1 name').fill('Spinach');
  await page.getByRole('button', { name: 'Save recipe' }).click();
  await expect(page.getByText('Your recipe')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Photo recipe' })).toBeVisible();
  await expect(page.getByText(/In your fridge|Running low|Check first|Need to buy/).first()).toBeVisible();
  await page.getByRole('link', { name: 'Recipes' }).click();
  await page.getByRole('button', { name: 'My recipes' }).click();
  await expect(page.getByRole('link', { name: 'Photo recipe' }).first()).toBeVisible();

  await page.goto('/recipes/import');
  await page.getByRole('button', { name: /Paste recipe text/ }).click();
  await page.getByLabel('Recipe text').fill('Spinach rice\n1 serving\n15 minutes\nIngredients\n80g rice\n60g spinach\nMethod\n1. Cook and combine.');
  await page.getByRole('button', { name: 'Review recipe' }).click();
  await page.getByRole('button', { name: 'Save recipe' }).click();
  await expect(page.getByRole('heading', { name: 'Spinach rice' })).toBeVisible();
  await expect(page.getByText('No shopping needed', { exact: true }).first()).toBeVisible();
});

test('quick corrections preserve approximate stock and Use Soon opens focused recipes', async ({ page }) => {
  await completeOnboarding(page);
  await page.goto('/fridge');
  const rice = page.locator('.food-card-shell').filter({ hasText: 'Rice' });
  await rice.getByRole('button', { name: 'More' }).click();
  await rice.getByRole('button', { name: 'Used some' }).click();
  await page.getByRole('button', { name: 'About half' }).click();
  await expect(rice.getByText('about half left')).toBeVisible();
  const chicken = page.locator('.food-card-shell').filter({ hasText: 'Chicken' });
  await chicken.getByRole('button', { name: 'More' }).click();
  await chicken.getByRole('button', { name: 'Finished' }).click();
  await expect(page.getByRole('heading', { name: 'Chicken' })).toHaveCount(0);

  await page.goto('/');
  await page.getByRole('link', { name: 'Find a recipe' }).first().click();
  await expect(page).toHaveURL(/recipes\?uses=spinach/);
  await expect(page.getByText(/Using/)).toContainText('spinach');
  const cards = page.locator('.recipe-card');
  await expect(cards.first()).toBeVisible();
  expect(await cards.count()).toBeGreaterThan(1);
});

test('V0.3 full-page flows fit 375px, 390px and 430px', async ({ page }) => {
  await completeOnboarding(page);
  for (const width of [375, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    for (const route of ['/fridge/add', '/fridge/add?fixture=grocery', '/fridge/add?fixture=receipt', '/recipes/import', '/recipes/import?fixture=image', '/fridge', '/recipes', '/']) {
      await page.goto(route);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
      expect(overflow, `${route} should fit ${width}px`).toBe(false);
    }
  }
});
