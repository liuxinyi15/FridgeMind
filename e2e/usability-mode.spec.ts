import { test, expect } from '@playwright/test';

async function completeOnboarding(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Explore a separate demo fridge' }).click();
}

async function launchTask(page: import('@playwright/test').Page, title: string) {
  await page.goto('/settings/research/usability');
  const card = page.getByRole('article').filter({ hasText: title });
  const launch = card.getByRole('button', { name: 'Launch task' });
  await launch.scrollIntoViewIfNeeded();
  await launch.click({ force: true });
}

async function latestRun(page: import('@playwright/test').Page) {
  return page.evaluate(() => {
    const data = JSON.parse(localStorage.getItem('fridgemind:v0.1:data')!);
    const session = data.usabilitySessions.find((item: { id: string }) => item.id === data.currentUsabilitySessionId);
    return { run: session.taskRuns.at(-1), events: session.events };
  });
}

test('researcher can run, measure and export local usability tasks', async ({ page }) => {
  await completeOnboarding(page);
  await page.goto('/settings/research/usability');
  await expect(page.getByRole('heading', { name: 'Usability Test' })).toBeVisible();
  await expect(page.getByText('No participant data is uploaded.')).toBeVisible();
  await page.getByRole('button', { name: 'Start new session' }).click();

  const taskOne = page.getByRole('article').filter({ hasText: 'Activation' });
  await taskOne.getByRole('button', { name: 'Launch task' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('complementary').getByText(/just started using FridgeMind/)).toBeVisible();
  await page.getByRole('link', { name: 'Quick add foods' }).click();
  await page.getByRole('button', { name: /Quick add foods/ }).click();
  await page.getByLabel('Food names').fill('spinach, mushrooms');
  await page.getByRole('button', { name: 'Review foods' }).click();
  await expect(page.getByText('Task complete')).toBeVisible();
  await page.getByRole('radio', { name: '5' }).first().check();
  await page.getByRole('button', { name: 'Submit feedback' }).click();
  await expect(page.getByText('Please return the device to the researcher.')).toBeVisible();

  await page.goto('/settings/research/usability');
  await expect(page.getByRole('row', { name: /1 Yes/ })).toBeVisible();
  await page.getByLabel('Hesitated on Today').check();

  const taskFour = page.getByRole('article').filter({ hasText: 'No-shopping decision' });
  const launchFour = taskFour.getByRole('button', { name: 'Launch task' });
  await launchFour.scrollIntoViewIfNeeded();
  await launchFour.click({ force: true });
  await page.getByRole('link', { name: 'Mushroom Pasta' }).first().click();
  await expect(page.getByText('Task complete')).toBeVisible();

  await page.goto('/settings/research/usability');
  const taskSeven = page.getByRole('article').filter({ hasText: 'Return the next day' });
  const launchSeven = taskSeven.getByRole('button', { name: 'Launch task' });
  await launchSeven.scrollIntoViewIfNeeded();
  await launchSeven.click({ force: true });
  await expect(page.getByText('Stored yesterday')).toBeVisible();
  await page.getByRole('button', { name: 'Eat 1 portion' }).click();
  await expect(page.getByText('Task complete')).toBeVisible();

  await page.goto('/settings/research/usability');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export JSON' }).click({ force: true });
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toMatch(/^fridgemind-usability-\d{4}-\d{2}-\d{2}\.json$/);
});

test('normal product UI has no research prompt outside a session', async ({ page }) => {
  await completeOnboarding(page);
  await expect(page.getByText('Your task')).toHaveCount(0);
  await expect(page.getByRole('heading', { name: /foods may be forgotten/ }).first()).toBeVisible();
});

test('task fixtures 2, 4, 5 and 6 reach their distinct success conditions', async ({ page }) => {
  await completeOnboarding(page);
  await page.goto('/settings/research/usability');
  await page.getByRole('button', { name: 'Start new session' }).click();

  await launchTask(page, 'Low-friction food entry');
  await page.getByRole('button', { name: /Quick add foods/ }).click();
  await page.getByLabel('Food names').fill('spinach, mushrooms, chicken, pasta');
  await page.getByRole('button', { name: 'Review foods' }).click();
  await expect(page.getByText('Task complete')).toHaveCount(0);
  await page.getByRole('button', { name: 'Add 4 foods' }).click();
  await expect(page.getByText('Task complete')).toBeVisible();

  await launchTask(page, 'No-shopping decision');
  await page.getByRole('link', { name: 'Mushroom Pasta' }).first().click();
  await expect(page.getByText('Task complete')).toBeVisible();

  await launchTask(page, 'Food attention');
  await page.getByRole('link', { name: /Find a recipe|Find a meal/ }).first().click();
  await page.locator('.recipe-card').first().getByRole('link').last().click();
  await expect(page.getByText('Task complete')).toBeVisible();

  await launchTask(page, 'Cooking loop');
  await page.getByRole('button', { name: 'Start cooking' }).click();
  await page.getByRole('button', { name: 'Finish cooking' }).click();
  await page.getByRole('button', { name: 'Yes, update my fridge' }).click();
  await page.getByRole('button', { name: 'Save 1 for later' }).click();
  await expect(page.getByText('Task complete')).toBeVisible();

  await page.goto('/settings/research/usability');
  await expect(page.getByRole('row', { name: /2 Yes/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /4 Yes/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /5 Yes/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /6 Yes/ })).toBeVisible();
});

test('Task 2 automatic evidence requires a persisted Quick Add batch', async ({ page }) => {
  await completeOnboarding(page);
  await page.goto('/settings/research/usability');
  await page.getByRole('button', { name: 'Start new session' }).click();
  await launchTask(page, 'Low-friction food entry');

  await page.getByRole('button', { name: /Quick add foods/ }).click();
  await page.getByRole('button', { name: 'Back', exact: true }).click();
  let evidence = await latestRun(page);
  expect(evidence.run.automaticSuccessAt).toBeUndefined();
  expect(evidence.events.some((event: { type: string }) => event.type === 'food_batch_added')).toBe(false);

  await page.getByRole('button', { name: /Quick add foods/ }).click();
  await page.getByLabel('Food names').fill('spinach, mushrooms, chicken, pasta');
  await page.getByRole('button', { name: 'Review foods' }).click();
  await expect(page.getByText('Task complete')).toHaveCount(0);
  evidence = await latestRun(page);
  expect(evidence.run.automaticSuccessAt).toBeUndefined();
  expect(evidence.events.some((event: { type: string }) => event.type === 'quick_add_parsed')).toBe(true);

  await page.getByRole('button', { name: 'Add 4 foods' }).click();
  await expect(page.getByText('Task complete')).toBeVisible();
  evidence = await latestRun(page);
  expect(evidence.run.automaticSuccessAt).toBeTruthy();
  expect(evidence.events.findLast((event: { type: string }) => event.type === 'food_batch_added')).toMatchObject({ metadata: { count: 4, source: 'quick' } });
});

test('Task 4 automatic evidence requires a genuinely READY recipe', async ({ page }) => {
  await completeOnboarding(page);
  await page.goto('/settings/research/usability');
  await page.getByRole('button', { name: 'Start new session' }).click();

  await launchTask(page, 'No-shopping decision');
  await page.goto('/recipes/recipe-chicken-stir-fry');
  await expect(page.getByText('Task complete')).toHaveCount(0);
  const missing = await latestRun(page);
  expect(missing.run.automaticSuccessAt).toBeUndefined();
  expect(missing.events.at(-1)).toMatchObject({ type: 'recipe_opened', metadata: { recipeId: 'recipe-chicken-stir-fry', availability: 'MISSING_ITEMS' } });
  await page.getByRole('button', { name: 'I’m finished' }).click();

  await launchTask(page, 'No-shopping decision');
  await page.getByRole('link', { name: 'Mushroom Pasta' }).first().click();
  await expect(page.getByText('Task complete')).toBeVisible();
  const ready = await latestRun(page);
  expect(ready.run.automaticSuccessAt).toBeTruthy();
  expect(ready.events.at(-2)).toMatchObject({ type: 'recipe_opened', metadata: { recipeId: 'recipe-mushroom-pasta', availability: 'READY' } });
});

test('Task 5 evidence requires an attention recipe or direct attention handling', async ({ page }) => {
  await completeOnboarding(page);
  await page.goto('/settings/research/usability');
  await page.getByRole('button', { name: 'Start new session' }).click();

  await launchTask(page, 'Food attention');
  await page.goto('/recipes/recipe-tomato-pasta');
  await expect(page.getByText('Task complete')).toHaveCount(0);
  const unrelated = await latestRun(page);
  expect(unrelated.run.automaticSuccessAt).toBeUndefined();
  expect(unrelated.events.at(-1)).toMatchObject({ type: 'recipe_opened', metadata: { recipeId: 'recipe-tomato-pasta', usesAttentionFood: false } });
  await page.getByRole('button', { name: 'I want to stop' }).click();

  await launchTask(page, 'Food attention');
  await page.goto('/recipes/recipe-spinach-pasta');
  await expect(page.getByText('Task complete')).toBeVisible();
  const relevant = await latestRun(page);
  expect(relevant.run.automaticSuccessAt).toBeTruthy();
  expect(relevant.events.at(-2)).toMatchObject({ type: 'recipe_opened', metadata: { recipeId: 'recipe-spinach-pasta', usesAttentionFood: true } });

  await launchTask(page, 'Food attention');
  await page.getByRole('article', { name: 'Make a plan for your spinach' }).getByRole('button', { name: 'I used it' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'I used it' }).click();
  await expect(page.getByText('Task complete')).toBeVisible();
  const handled = await latestRun(page);
  expect(handled.run.automaticSuccessAt).toBeTruthy();
  expect(handled.events.at(-2)).toMatchObject({ type: 'food_attention_handled', metadata: { outcome: 'used' } });
});
