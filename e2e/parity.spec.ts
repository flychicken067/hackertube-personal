import { expect, test } from '@playwright/test';

const classicId = 'fNk_zzaMoSs';
const classicTitle = 'Vectors | Chapter 1, Essence of linear algebra';

test('home exposes multiple recommendation lanes and browse parity controls', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByText('Karpathy 精选').first()).toBeVisible();
  await expect(page.getByText('Hacker News 长期经典').first()).toBeVisible();
  await expect(page.getByText('最近在 HN 被推荐').first()).toBeVisible();

  await page.goto('/#/browse');
  await expect(page.getByRole('combobox', { name: '上传日期' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: '类型' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: '时长' })).toBeVisible();
  await expect(page.getByRole('combobox', { name: '排序' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: '冷门佳作' })).toBeVisible();
  await expect(page.getByRole('checkbox', { name: '只看常青内容' })).toBeVisible();
});

test('video page loads all exported comments and related recommendations lazily', async ({ page }) => {
  const responses: string[] = [];
  page.on('response', (response) => {
    if (response.url().includes('/data/comments/')) responses.push(response.url());
  });

  await page.goto(`/#/watch/${classicId}`);
  await expect(page.getByRole('heading', { name: classicTitle })).toBeVisible();
  await expect(page.getByRole('heading', { name: '来自 Hacker News 的讨论' })).toBeVisible();
  await expect(page.locator('.hn-comment')).toHaveCount(20);
  await expect(page.getByRole('heading', { name: 'HN 用户也推荐' })).toBeVisible();
  await expect(page.locator('.watch-related [data-video-card]').first()).toBeVisible();
  expect(responses).toHaveLength(1);
});

test('dislike feedback removes the video from the home feed', async ({ page }) => {
  await page.goto(`/#/watch/${classicId}`);
  await page.getByRole('button', { name: '不喜欢' }).click();

  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('hackertube-personal:v2') ?? '{}'));
  expect(saved.dislikes).toContain(classicId);
  expect(saved.likes).not.toContain(classicId);

  await page.goto('/#/');
  await expect(page.locator(`[data-video-id="${classicId}"]`)).toHaveCount(0);
});

test('thumbnail preference switches every card from video frames to uploader art', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('.thumbnail').first()).toHaveAttribute('src', /hq2\.jpg$/);

  await page.goto('/#/settings');
  await page.getByRole('checkbox', { name: '使用视频中段自动帧' }).uncheck();
  await page.goto('/#/');
  await expect(page.locator('.thumbnail').first()).toHaveAttribute('src', /hqdefault\.jpg$/);
});

test('local data exports and imports without an account', async ({ page }) => {
  await page.goto('/#/settings');
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: '导出我的数据' }).click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toBe('hackertube-personal-data.json');

  const imported = {
    version: 2,
    likes: [classicId],
    dislikes: [],
    watchLater: [],
    history: [],
    topicPreferences: {},
    useVideoFrames: true,
  };
  await page.locator('input[type="file"]').setInputFiles({
    name: 'library.json',
    mimeType: 'application/json',
    buffer: Buffer.from(JSON.stringify(imported)),
  });
  await expect(page.getByText('导入完成。')).toBeVisible();
  await page.goto('/#/liked');
  await expect(page.getByRole('heading', { name: classicTitle })).toBeVisible();
});

test('Karpathy remains a first-class 37-video source', async ({ page }) => {
  await page.goto('/#/karpathy');
  await expect(page.getByRole('heading', { name: 'Andrej Karpathy', exact: true })).toBeVisible();
  await expect(page.locator('[data-video-card]')).toHaveCount(37);
  await expect(page.getByText('37 videos')).toBeVisible();
});
