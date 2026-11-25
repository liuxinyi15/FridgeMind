import { expect, test, type Page } from '@playwright/test';

async function rasterRecipe(page: Page, name: string, width: number, height: number, body: string) {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><rect width="100%" height="100%" fill="#fffdf8"/>${body}</svg>`;
  const base64 = await page.evaluate(async ({ svg, width, height }) => {
    const image = new Image();
    image.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(svg)}`;
    await image.decode();
    const canvas = document.createElement('canvas'); canvas.width = width; canvas.height = height;
    canvas.getContext('2d')!.drawImage(image, 0, 0);
    return canvas.toDataURL('image/png').split(',')[1];
  }, { svg, width, height });
  return { name: `${name}.png`, mimeType: 'image/png', buffer: Buffer.from(base64, 'base64') };
}

async function scan(page: Page, file: Awaited<ReturnType<typeof rasterRecipe>>) {
  await page.goto('/recipes/import');
  await page.getByLabel('Choose recipe image').setInputFiles(file);
}

test('recipe OCR handles varied document layouts and fails safely without recipe text', async ({ page }) => {
  test.setTimeout(180_000);
  await page.goto('/');
  await page.getByRole('button', { name: 'Skip' }).click();

  await scan(page, await rasterRecipe(page, 'illustrated-recipe', 1200, 900, `
    <g font-family="Arial" fill="#172f28"><text x="70" y="85" font-size="48" font-weight="700">Lemon Herb Couscous</text><text x="70" y="145" font-size="27">Serves 3</text><text x="70" y="205" font-size="34" font-weight="700">Ingredients</text><text x="70" y="255" font-size="27">1 cup couscous</text><text x="70" y="300" font-size="27">2 tablespoons olive oil</text><text x="70" y="345" font-size="27">1 lemon</text><text x="70" y="410" font-size="34" font-weight="700">Method</text><text x="70" y="460" font-size="25">1. Soak the couscous.</text><text x="70" y="505" font-size="25">2. Add lemon and olive oil.</text></g><circle cx="920" cy="410" r="190" fill="#f4cf62"/><path d="M790 410c80-110 190-110 260 0-90 100-180 100-260 0" fill="#7aaa6d"/>`));
  await expect(page.getByRole('heading', { name: 'Review what we found' })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByLabel('Recipe name')).toHaveValue(/Lemon Herb Couscous/i);
  await expect(page.locator('.ingredient-edit')).toHaveCount(3);

  await scan(page, await rasterRecipe(page, 'two-column-recipe', 1400, 900, `
    <g font-family="Arial" fill="#182b25"><text x="65" y="75" font-size="48" font-weight="700">Tomato Bean Skillet</text><text x="65" y="140" font-size="34" font-weight="700">Ingredients</text><text x="65" y="195" font-size="28">2 cups tomatoes</text><text x="65" y="245" font-size="28">1 can white beans</text><text x="65" y="295" font-size="28">1 teaspoon paprika</text><text x="730" y="140" font-size="34" font-weight="700">Directions</text><text x="730" y="195" font-size="27">1. Warm the tomatoes.</text><text x="730" y="245" font-size="27">2. Stir in the beans.</text><text x="730" y="295" font-size="27">3. Season and serve.</text></g>`));
  await expect(page.getByRole('heading', { name: 'Review what we found' })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByLabel('Recipe name')).toHaveValue(/Tomato Bean Skillet/i);
  await expect(page.locator('.ingredient-edit')).toHaveCount(3);
  await expect(page.getByLabel('Instructions')).toHaveValue(/Warm the tomatoes/);

  await scan(page, await rasterRecipe(page, 'low-resolution-recipe', 420, 560, `
    <g font-family="Arial" fill="#111"><text x="24" y="38" font-size="22" font-weight="700">Apple Oat Bowl</text><text x="24" y="72" font-size="16" font-weight="700">Ingredients</text><text x="24" y="100" font-size="14">1 cup oats</text><text x="24" y="124" font-size="14">1 apple</text><text x="24" y="148" font-size="14">1/2 cup milk</text><text x="24" y="188" font-size="16" font-weight="700">Instructions</text><text x="24" y="216" font-size="14">1. Simmer the oats and milk.</text><text x="24" y="240" font-size="14">2. Add the sliced apple.</text></g>`));
  await expect(page.getByRole('heading', { name: 'Review what we found' })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByLabel('Recipe name')).toHaveValue(/Apple Oat Bowl/i);
  await expect(page.locator('.ingredient-edit')).toHaveCount(3);

  await scan(page, await rasterRecipe(page, 'bullet-recipe', 1000, 1000, `
    <g font-family="Arial" fill="#191919"><text x="70" y="85" font-size="46" font-weight="700">Sesame Noodle Salad</text><text x="70" y="155" font-size="32" font-weight="700">What you'll need</text><text x="70" y="210" font-size="27">• 200 g noodles</text><text x="70" y="255" font-size="27">• 1 cucumber</text><text x="70" y="300" font-size="27">• 2 tablespoons sesame oil</text><text x="70" y="365" font-size="32" font-weight="700">Steps</text><text x="70" y="420" font-size="26">1. Cook and cool the noodles.</text><text x="70" y="465" font-size="26">2. Toss everything together.</text></g>`));
  await expect(page.getByRole('heading', { name: 'Review what we found' })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByLabel('Recipe name')).toHaveValue(/Sesame Noodle Salad/i);
  await expect(page.locator('.ingredient-edit')).toHaveCount(3);

  await scan(page, await rasterRecipe(page, 'no-recipe-text', 1000, 800, '<circle cx="300" cy="380" r="210" fill="#d8b36a"/><rect x="560" y="170" width="280" height="420" rx="50" fill="#7a9d82"/><path d="M170 600L430 180" stroke="#fff" stroke-width="34"/>'));
  await expect(page.getByRole('heading', { name: /couldn’t read this recipe clearly enough/i })).toBeVisible({ timeout: 60_000 });
  await expect(page.getByLabel('Recipe name')).toHaveCount(0);
});
