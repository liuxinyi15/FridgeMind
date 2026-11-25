import { expect, test, type Page } from '@playwright/test';
import path from 'node:path';

const studyImage = (name: string) => path.resolve('public/study', name);
const repositoryName = process.env.GITHUB_REPOSITORY?.split('/')[1];
const pagesBase = process.env.GITHUB_ACTIONS && repositoryName && !repositoryName.endsWith('.github.io') ? `/${repositoryName}` : '';
const appRoute = (route: string) => `${pagesBase}${route}`;

async function rasterOcrImage(page: Page, name: string, width: number, height: number, body: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#fff"/>${body}</svg>`;
  const base64 = await page.evaluate(async ({ svg, width, height }) => {
    const image = new Image(); image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`; await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height; canvas.getContext('2d')!.drawImage(image, 0, 0);
    return canvas.toDataURL('image/png').split(',')[1];
  }, { svg, width, height });
  return { name: `${name}.png`, mimeType: 'image/png', buffer: Buffer.from(base64, 'base64') };
}

async function launchResearchAddFood(page: Page) {
  await page.goto(appRoute('/'));
  await page.getByRole('button', { name: 'Explore a separate demo fridge' }).click();
  await page.goto(appRoute('/settings/research/usability'));
  await page.getByRole('button', { name: 'Start new session' }).click();
  const task = page.getByRole('article').filter({ hasText: 'Low-friction food entry' });
  await task.getByRole('button', { name: 'Launch task' }).click();
}

async function latestOcrRuntime(page: Page, flow: 'receipt' | 'package') {
  return page.evaluate((expectedFlow) => {
    const data = JSON.parse(localStorage.getItem('fridgemind:v0.1:data')!);
    return data.usabilitySessions.flatMap((session: { events: Array<{ type: string; metadata?: { flow?: string } }> }) => session.events)
      .findLast((event: { type: string; metadata?: { flow?: string } }) => event.type === 'ocr_completed' && event.metadata?.flow === expectedFlow)?.metadata;
  }, flow);
}

test('study recipe image runs through real browser OCR into editable personal recipe review', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto(appRoute('/'));
  await page.getByRole('button', { name: 'Explore a separate demo fridge' }).click();
  await page.goto(appRoute('/settings/research/usability'));
  await page.getByRole('button', { name: 'Start new session' }).click();
  const task = page.getByRole('article').filter({ hasText: 'Personal recipe import' });
  await task.getByRole('button', { name: 'Launch task' }).click();
  const recipeInput = page.getByLabel('Choose recipe image');
  await expect(recipeInput).toHaveAttribute('accept', 'image/*');
  await expect(recipeInput).not.toHaveAttribute('capture');
  await recipeInput.setInputFiles(studyImage('recipe-screenshot.png'));
  await expect(page.getByRole('heading', { name: 'Review what we found' })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByText('Task complete')).toHaveCount(0);
  await expect(page.getByLabel('Recipe name')).toHaveValue(/Creamy Spinach Pasta/i);
  await expect(page.getByText('Original text')).toBeVisible();
  const ingredients = await page.locator('.ingredient-edit').evaluateAll((rows) => rows.map((row) => ({
    name: (row.querySelector('input[aria-label*=name]') as HTMLInputElement).value,
    quantity: (row.querySelector('input[type=number]') as HTMLInputElement).value,
    unit: (row.querySelector('select') as HTMLSelectElement).value,
  })));
  expect(ingredients).toEqual([
    { name: 'pasta', quantity: '180', unit: 'g' },
    { name: 'spinach', quantity: '150', unit: 'g' },
    { name: 'cream', quantity: '120', unit: 'ml' },
    { name: 'onion', quantity: '1', unit: 'item' },
    { name: 'garlic', quantity: '2', unit: 'item' },
  ]);
  await expect(page.getByLabel('Servings')).toHaveValue('2');
  await expect(page.getByLabel('Preparation time')).toHaveValue('20');
  await expect(page.getByLabel('Instructions')).toHaveValue('Cook the pasta until tender.\nFry the onion and garlic.\nAdd spinach and cream.\nCombine with pasta and serve.');
  await expect(page.locator('.recipe-review')).not.toContainText(/ANC AK|RE CIPI|\+ ec|:\\/i);
  await page.getByLabel('Recipe name').fill('Creamy Spinach Pasta favourite');
  await page.getByRole('button', { name: 'Save recipe' }).click();
  await expect(page.getByRole('heading', { name: 'Creamy Spinach Pasta favourite' })).toBeVisible();
  await expect(page.getByText('Your recipe')).toBeVisible();
  await expect(page.getByText('Task complete')).toBeVisible();
  const evidence = await page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('fridgemind:v0.1:data')!);
    const session = data.usabilitySessions.find((item: { id: string }) => item.id === data.currentUsabilitySessionId);
    return { run: session.taskRuns.at(-1), saved: session.events.findLast((event: { type: string }) => event.type === 'personal_recipe_saved') };
  });
  expect(evidence.run.automaticSuccessAt).toBeTruthy();
  expect(evidence.saved).toMatchObject({ metadata: { source: 'ocr' } });
  expect(evidence.saved.metadata.recipeId).toMatch(/^imported-/);
});

test('real receipt OCR proposes groceries and reconciles a shopping match', async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto(appRoute('/'));
  await page.getByRole('button', { name: 'Skip' }).click();
  await page.evaluate(() => {
    const key = 'fridgemind:v0.1:data';
    const data = JSON.parse(localStorage.getItem(key)!);
    data.shopping = [{ id: 'ocr-shop-mushrooms', ingredientName: 'Mushrooms', canonicalName: 'mushroom', quantity: 250, unit: 'g', recipeId: 'recipe-mushroom-pasta', recipeName: 'Mushroom Pasta', reason: 'Needed for dinner.', bought: false }];
    localStorage.setItem(key, JSON.stringify(data));
  });
  await page.reload();
  await page.goto(appRoute('/fridge/add'));
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
  await page.goto(appRoute('/'));
  await page.getByRole('button', { name: 'Skip' }).click();
  await page.goto(appRoute('/fridge/add'));
  await page.getByRole('button', { name: /Scan package/ }).click();
  await page.getByLabel('Choose image to scan').setInputFiles(studyImage('package.png'));
  await expect(page.getByRole('heading', { name: 'Review package' })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByLabel('Name')).toHaveValue('Spinach');
  await expect(page.getByLabel('Amount', { exact: true })).toHaveValue('200');
  await expect(page.getByRole('combobox', { name: 'Unit' })).toHaveValue('g');
  await page.getByRole('button', { name: 'Add 1 food' }).click();
  await expect(page.getByRole('heading', { name: 'Spinach' })).toBeVisible();
});

test('a realistic 1080 × 5000 receipt stays rendered, tiles safely and resolves', async ({ page }) => {
  test.setTimeout(180_000);
  const pageErrors: Error[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await launchResearchAddFood(page);
  const receipt = await rasterOcrImage(page, 'large-realistic-receipt', 1080, 5000, `<g font-family="Arial" fill="#111" text-anchor="middle">
    <text x="540" y="170" font-size="64" font-weight="700">MARKET RECEIPT</text><text x="540" y="280" font-size="34">25 NOVEMBER 2026</text>
    <text x="540" y="620" font-size="52">MUSHROOMS 250G</text><text x="540" y="820" font-size="52">BABY SPINACH 200G</text>
    <text x="540" y="1020" font-size="52">CHICKEN BREAST 500G</text><text x="540" y="1220" font-size="52">PENNE PASTA 500G</text>
    <path d="M120 1450h840" stroke="#222" stroke-width="5"/><text x="540" y="1680" font-size="38">THANK YOU FOR SHOPPING</text>
    <text x="540" y="3220" font-size="48">MUSHROOMS 250G</text><text x="540" y="3420" font-size="48">BABY SPINACH 200G</text>
    <text x="540" y="4100" font-size="40">SUBTOTAL 12.50</text><text x="540" y="4300" font-size="40">TOTAL 12.50</text>
  </g>`);
  await page.getByRole('button', { name: /Scan receipt/ }).click();
  await page.getByLabel('Choose image to scan').setInputFiles(receipt);
  await expect(page.locator('.processing-card').getByRole('heading', { name: /Preparing image|Reading receipt|Checking items/ })).toBeVisible();
  await expect(page.locator('.app-header').getByText('FridgeMind')).toBeVisible();
  await expect(page.locator('body')).not.toBeEmpty();
  await expect(page).toHaveURL(/\/fridge\/add/);
  await expect(page.getByRole('heading', { name: /Review receipt items|couldn’t/i })).toBeVisible({ timeout: 120_000 });
  const runtime = await latestOcrRuntime(page, 'receipt');
  expect(runtime).toMatchObject({ inputWidth: 1080, inputHeight: 5000, scaledWidth: 1080, scaledHeight: 5000, tiled: true, tileCount: 2 });
  expect(runtime.maxTilePixels).toBeLessThanOrEqual(5_500_000);
  console.log(`[receipt-ocr-runtime] ${JSON.stringify(runtime)}`);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});

test('a realistic 3000 × 4000 package stays rendered and extracts spinach 200g', async ({ page }) => {
  test.setTimeout(180_000);
  const pageErrors: Error[] = [];
  const consoleErrors: string[] = [];
  page.on('pageerror', (error) => pageErrors.push(error));
  page.on('console', (message) => { if (message.type() === 'error') consoleErrors.push(message.text()); });
  await launchResearchAddFood(page);
  const packageImage = await rasterOcrImage(page, 'large-phone-package', 3000, 4000, `<rect x="260" y="240" width="2480" height="3520" rx="180" fill="#e7f0df" stroke="#315b40" stroke-width="28"/>
    <g font-family="Arial" fill="#173d2a" text-anchor="middle"><text x="1500" y="1250" font-size="260" font-weight="700">BABY</text><text x="1500" y="1600" font-size="300" font-weight="700">SPINACH</text><text x="1500" y="2250" font-size="210">WASHED LEAVES</text><text x="1500" y="3020" font-size="300" font-weight="700">200G</text></g>`);
  await page.getByRole('button', { name: /Scan package/ }).click();
  await page.getByLabel('Choose image to scan').setInputFiles(packageImage);
  await expect(page.locator('.processing-card').getByRole('heading', { name: /Preparing image|Reading package|Checking product/ })).toBeVisible();
  await expect(page.locator('.app-header').getByText('FridgeMind')).toBeVisible();
  await expect(page.locator('body')).not.toBeEmpty();
  await expect(page).toHaveURL(/\/fridge\/add/);
  await expect(page.getByRole('heading', { name: /Review package|couldn’t/i })).toBeVisible({ timeout: 120_000 });
  await expect(page.getByLabel('Name')).toHaveValue('Spinach');
  await expect(page.getByLabel('Amount', { exact: true })).toHaveValue('200');
  const runtime = await latestOcrRuntime(page, 'package');
  expect(runtime).toMatchObject({ inputWidth: 3000, inputHeight: 4000, scaledWidth: 1800, scaledHeight: 2400, tiled: false, tileCount: 1 });
  expect(runtime.maxTilePixels).toBeLessThanOrEqual(5_500_000);
  console.log(`[package-ocr-runtime] ${JSON.stringify(runtime)}`);
  expect(pageErrors).toEqual([]);
  expect(consoleErrors).toEqual([]);
});
