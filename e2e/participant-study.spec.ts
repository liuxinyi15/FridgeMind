import { expect, test } from '@playwright/test';

async function answerRatings(page: import('@playwright/test').Page, final = false) {
  await page.getByRole('radio', { name: '5 — Very easy' }).check();
  await page.getByRole('group', { name: /How confident/ }).getByLabel('4').check();
  await page.getByRole('button', { name: final ? 'Finish study' : 'Next task' }).click();
}

test('participant query ID runs all seven tasks and exports one local session', async ({ page }) => {
  await page.goto('/test?participant=P01');
  await expect(page.getByRole('heading', { name: 'FridgeMind usability study' })).toBeVisible();
  await expect(page.getByLabel('Participant ID')).toHaveValue('P01');
  await expect(page.getByText(/stored only in this browser/)).toBeVisible();
  await expect(page.getByText(/success criteria|fixture|Research Mode/i)).toHaveCount(0);
  await page.getByRole('button', { name: 'Start study' }).click();

  for (let task = 1; task <= 7; task += 1) {
    await expect(page.getByText(`Task ${task} of 7`).first()).toBeVisible();
    if (task === 3) {
      await expect(page.getByRole('heading', { name: 'Personal recipe import' })).toBeVisible();
      await expect(page.getByRole('img', { name: 'Test recipe screenshot' })).toBeVisible();
      await expect(page.getByRole('link', { name: 'Open image' })).toHaveAttribute('href', /\/study\/recipe-screenshot\.png$/);
      await expect(page.getByRole('link', { name: 'Download image' })).toHaveAttribute('download', '');
      await expect(page.getByText(/upload|OCR|scan this/i)).toHaveCount(0);
    }
    await page.getByRole('button', { name: 'Begin task' }).click();
    await expect(page.getByRole('complementary', { name: 'Study task controls' })).toBeVisible();
    if (task === 1) {
      await page.reload();
      await expect(page.getByRole('complementary', { name: 'Study task controls' })).toBeVisible();
      await page.goto('/test?participant=P01');
      await expect(page.getByRole('heading', { name: 'Task in progress' })).toBeVisible();
      await page.getByRole('button', { name: 'Continue task' }).click();
      await page.getByRole('link', { name: 'Quick add foods' }).click();
      await page.getByRole('button', { name: /Quick add foods/ }).click();
      await page.getByLabel('Food names').fill('spinach, mushrooms');
      await page.getByRole('button', { name: 'Review foods' }).click();
      await expect(page.getByRole('complementary', { name: 'Study task controls' })).toBeVisible();
      await expect(page.getByText('Task complete')).toHaveCount(0);
    }
    if (task === 3) {
      await expect(page).toHaveURL(/\/recipes\/import$/);
      await expect(page.getByText(/simulated recognition|Research Mode|fixture/i)).toHaveCount(0);
    }
    if (task === 4) {
      await expect(page.locator('body')).not.toContainText(/Research fixture|Research Mode|simulated recognition|fixture/i);
      await page.goto('/settings/research/usability');
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByText(/Success:|Researcher observation|task metrics/i)).toHaveCount(0);
    }
    await page.getByRole('button', { name: 'I’m finished' }).click();
    await expect(page.getByRole('heading', { name: 'Quick task feedback' })).toBeVisible();
    if (task === 2) await page.getByLabel('Anything confusing or unexpected?').fill('The wording was unexpected.');
    await answerRatings(page, task === 7);
  }

  await expect(page.getByRole('heading', { name: /completed the FridgeMind study/ })).toBeVisible();
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Download study results' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('FridgeMind_P01_results.json');
  await expect(page.getByText('Results downloaded')).toBeVisible();
  const stream = await download.createReadStream();
  let json = '';
  for await (const chunk of stream) json += chunk.toString();
  const payload = JSON.parse(json);
  expect(payload.format).toBe('fridgemind-usability-v1');
  expect(payload.sessions).toHaveLength(1);
  expect(payload.sessions[0].participantId).toBe('P01');
  expect(payload.sessions[0].taskRuns).toHaveLength(7);
  expect(payload.sessions[0].responses).toHaveLength(7);
  expect(payload.sessions[0].taskRuns[0].automaticSuccess).toBe(true);
  expect(payload.sessions[0].taskRuns.every((run: { participantDeclaredCompletion: boolean }) => run.participantDeclaredCompletion)).toBe(true);
});

test('manual ID and abandonment progress without exposing researcher UI', async ({ page }) => {
  await page.goto('/test');
  await page.getByLabel('Participant ID').fill('P02');
  await page.getByRole('button', { name: 'Start study' }).click();
  await page.getByRole('button', { name: 'Begin task' }).click();
  await page.getByRole('button', { name: 'I can’t complete this task' }).click();
  await answerRatings(page);
  await expect(page.getByText('Task 2 of 7').first()).toBeVisible();
  await expect(page.getByText('Research Mode')).toHaveCount(0);
  await page.goto('/settings');
  await expect(page.getByRole('link', { name: /research|usability/i })).toHaveCount(0);
  await page.goto('/settings/research/usability');
  await expect(page).toHaveURL(/\/$/);
  await expect(page.getByText(/Research Mode|Success:|Researcher observation/i)).toHaveCount(0);
});

test('participant screens have no horizontal overflow at study phone widths', async ({ page }) => {
  const expectNoOverflow = async () => {
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
    expect(overflow).toBe(false);
  };
  for (const width of [375, 390, 430]) {
    await page.setViewportSize({ width, height: 844 });
    await page.goto(`/test?participant=M${width}`);
    await expect(page.getByRole('heading', { name: 'FridgeMind usability study' })).toBeVisible();
    await expectNoOverflow();
    await page.getByRole('button', { name: 'Start study' }).click();
    await expect(page.getByRole('button', { name: 'Begin task' })).toBeVisible();
    await expectNoOverflow();
    await page.getByRole('button', { name: 'Begin task' }).click();
    await expect(page.getByRole('navigation', { name: 'Primary navigation' })).toBeVisible();
    await expect(page.getByRole('complementary', { name: 'Study task controls' })).toBeVisible();
    await page.getByRole('link', { name: 'Shopping' }).click();
    await expectNoOverflow();
    await page.getByRole('button', { name: 'I’m finished' }).click();
    await expect(page.getByRole('heading', { name: 'Quick task feedback' })).toBeVisible();
    await expectNoOverflow();
    await answerRatings(page);
    await page.getByRole('button', { name: 'Begin task' }).click();
    await page.getByRole('button', { name: 'I’m finished' }).click();
    await answerRatings(page);
    await expect(page.getByRole('heading', { name: 'Personal recipe import' })).toBeVisible();
    await expect(page.getByRole('img', { name: 'Test recipe screenshot' })).toBeVisible();
    const imagePopupPromise = page.waitForEvent('popup');
    await page.getByRole('link', { name: 'Open image' }).click();
    const imagePopup = await imagePopupPromise;
    await expect(imagePopup).toHaveURL(/\/study\/recipe-screenshot\.png$/);
    await imagePopup.close();
    const imageDownloadPromise = page.waitForEvent('download');
    await page.getByRole('link', { name: 'Download image' }).click();
    expect((await imageDownloadPromise).suggestedFilename()).toBe('recipe-screenshot.png');
    await expectNoOverflow();
    await page.getByRole('button', { name: 'Begin task' }).click();
    await expect(page).toHaveURL(/\/recipes\/import$/);
    await expect(page.getByRole('complementary', { name: 'Study task controls' })).toBeVisible();
    await expectNoOverflow();
    await page.getByRole('button', { name: 'I’m finished' }).click();
    await expectNoOverflow();
    await answerRatings(page);

    for (const task of [4, 5]) {
      await expect(page.getByText(`Task ${task} of 7`).first()).toBeVisible();
      await page.getByRole('button', { name: 'Begin task' }).click();
      await expect(page).toHaveURL(/\/$/);
      await expect(page.getByRole('complementary', { name: 'Study task controls' })).toBeVisible();
      await expect(page.locator('body')).not.toContainText(/Research fixture|Research Mode|simulated recognition|fixture/i);
      await expectNoOverflow();
      await page.getByRole('button', { name: 'I’m finished' }).click();
      await expectNoOverflow();
      await answerRatings(page);
    }

    for (const task of [6, 7]) {
      await expect(page.getByText(`Task ${task} of 7`).first()).toBeVisible();
      await page.getByRole('button', { name: 'Begin task' }).click();
      await expect(page.getByRole('complementary', { name: 'Study task controls' })).toBeVisible();
      await expectNoOverflow();
      await page.getByRole('button', { name: 'I’m finished' }).click();
      await expectNoOverflow();
      await answerRatings(page, task === 7);
    }

    await expect(page.getByRole('heading', { name: /completed the FridgeMind study/ })).toBeVisible();
    await expectNoOverflow();
    const resultsDownloadPromise = page.waitForEvent('download');
    await page.getByRole('button', { name: 'Download study results' }).click();
    expect((await resultsDownloadPromise).suggestedFilename()).toBe(`FridgeMind_M${width}_results.json`);
    page.once('dialog', (dialog) => dialog.accept());
    await page.getByRole('button', { name: 'Clear study data' }).click();
    await expect(page.getByRole('heading', { name: 'FridgeMind usability study' })).toBeVisible();
  }
});
