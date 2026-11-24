import { test, expect } from '@playwright/test';

async function completeOnboarding(page: import('@playwright/test').Page) {
  await page.goto('/');
  await page.getByRole('button', { name: 'Get started' }).click();
  for (let step = 0; step < 2; step++) await page.getByRole('button', { name: 'Continue' }).click();
  await page.getByRole('button', { name: 'Open my kitchen' }).click();
}

async function launchTask(page: import('@playwright/test').Page, title: string) {
  await page.goto('/settings/research/usability');
  const card = page.getByRole('article').filter({ hasText: title });
  const launch = card.getByRole('button', { name: 'Launch task' });
  await launch.scrollIntoViewIfNeeded();
  await launch.click({ force: true });
}

test('researcher can run, measure and export local usability tasks', async ({ page }) => {
  await completeOnboarding(page);
  await page.goto('/settings/research/usability');
  await expect(page.getByRole('heading', { name: 'Usability Test' })).toBeVisible();
  await expect(page.getByText('No participant data is uploaded.')).toBeVisible();
  await page.getByRole('button', { name: 'Start new session' }).click();

  const taskOne = page.getByRole('article').filter({ hasText: 'Decide what to cook' });
  await taskOne.getByRole('button', { name: 'Launch task' }).click();
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByRole('complementary').getByText("You've just got home and want to make dinner.")).toBeVisible();
  await page.getByRole('link', { name: 'Mushroom Pasta' }).first().click();
  await expect(page.getByText('Task complete')).toBeVisible();
  await page.getByRole('radio', { name: '5' }).first().check();
  await page.getByRole('button', { name: 'Submit feedback' }).click();
  await expect(page.getByText('Please return the device to the researcher.')).toBeVisible();

  await page.goto('/settings/research/usability');
  await expect(page.getByRole('row', { name: /1 Yes/ })).toBeVisible();
  await page.getByLabel('Hesitated on Today').check();

  const taskFour = page.getByRole('article').filter({ hasText: 'Add purchased food back' });
  const launchFour = taskFour.getByRole('button', { name: 'Launch task' });
  await launchFour.scrollIntoViewIfNeeded();
  await launchFour.click({ force: true });
  await page.getByRole('link', { name: 'Shopping' }).click();
  await expect(page.getByText('Mushrooms purchased')).toBeVisible();
  await page.getByRole('button', { name: 'Add to fridge' }).click();
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
  await expect(page.getByRole('heading', { name: 'Dinner, sorted.' })).toBeVisible();
});

test('task fixtures 2, 3, 5 and 6 reach their distinct success conditions', async ({ page }) => {
  await completeOnboarding(page);
  await page.goto('/settings/research/usability');
  await page.getByRole('button', { name: 'Start new session' }).click();

  await launchTask(page, 'Handle uncertain stock');
  await page.getByRole('button', { name: 'Start cooking' }).click();
  await page.getByRole('button', { name: 'Yes' }).click();
  await expect(page.getByText('Task complete')).toBeVisible();

  await launchTask(page, 'Resolve a missing ingredient');
  await page.getByRole('button', { name: 'Add missing items' }).click();
  await expect(page.getByText('Task complete')).toBeVisible();

  await launchTask(page, 'Cook and update inventory');
  await page.getByRole('button', { name: 'Start cooking' }).click();
  await page.getByRole('button', { name: 'Finish cooking' }).click();
  await page.getByRole('button', { name: 'Yes, update my fridge' }).click();
  await page.getByRole('button', { name: 'No leftovers' }).click();
  await expect(page.getByText('Task complete')).toBeVisible();

  await launchTask(page, 'Save leftovers');
  await page.getByRole('button', { name: 'Start cooking' }).click();
  await page.getByRole('button', { name: 'Finish cooking' }).click();
  await page.getByRole('button', { name: 'Yes, update my fridge' }).click();
  await page.getByRole('button', { name: 'Save 1 for later' }).click();
  await expect(page.getByText('Task complete')).toBeVisible();

  await page.goto('/settings/research/usability');
  await expect(page.getByRole('row', { name: /2 Yes/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /3 Yes/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /5 Yes/ })).toBeVisible();
  await expect(page.getByRole('row', { name: /6 Yes/ })).toBeVisible();
});
