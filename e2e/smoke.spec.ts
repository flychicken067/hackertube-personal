import { expect, test } from '@playwright/test';

test('data loads, home opens, search and shortcuts work without page errors', async ({ page }, testInfo) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });

  await page.goto('/');
  await expect(page.getByRole('heading', { name: '为你放映' })).toBeVisible();
  await expect(page.locator('[data-video-card]').first()).toBeVisible();

  const search = page.getByRole('searchbox', { name: '搜索视频和话题' });
  await search.fill('linear algebra');
  await search.press('Enter');
  await expect(page.getByRole('heading', { name: '搜索结果' })).toBeVisible();
  await expect(page.locator('[data-video-card]').first()).toBeVisible();

  await page.keyboard.press('Escape');
  await page.locator('body').click({ position: { x: 4, y: 4 } });
  await page.keyboard.press('?');
  await expect(page.getByRole('dialog', { name: '键盘快捷键' })).toBeVisible();
  await page.keyboard.press('Escape');

  expect(errors, `console/page errors in ${testInfo.project.name}`).toEqual([]);
});

test('keyboard like is saved locally', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('[data-video-card]').first()).toBeVisible();
  await page.keyboard.press('j');
  const selectedId = await page.locator('[data-video-card]:focus').getAttribute('data-video-id');
  await page.keyboard.press('l');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('hackertube-personal:v1') ?? '{}'));
  expect(saved.likes).toContain(selectedId);
});

test('layout has no horizontal overflow', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '为你放映' })).toBeVisible();
  const sizes = await page.evaluate(() => ({ scroll: document.documentElement.scrollWidth, client: document.documentElement.clientWidth }));
  expect(sizes.scroll).toBeLessThanOrEqual(sizes.client + 1);
});
