import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';

export function splitIntoBatches<T>(items: T[], size: number): T[][] {
  if (size < 1) throw new Error('batch size must be positive');
  const result: T[][] = [];
  for (let index = 0; index < items.length; index += size) result.push(items.slice(index, index + size));
  return result;
}

export function buildYoutubeMetadataUrl(ids: string[], key: string): string {
  const url = new URL('https://www.googleapis.com/youtube/v3/videos');
  url.search = new URLSearchParams({
    part: 'contentDetails,status',
    id: ids.join(','),
    key,
  }).toString();
  return url.toString();
}

async function run() {
  const key = process.env.YOUTUBE_API_KEY;
  if (!key) throw new Error('请先在终端设置 YOUTUBE_API_KEY，不要把密钥写进代码。');
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const sourceDir = process.env.HACKERTUBE_SOURCE_DIR
    ? path.resolve(process.env.HACKERTUBE_SOURCE_DIR)
    : path.resolve(projectRoot, '../source-data/hackertube-data/hackertube-data');
  const source = path.join(sourceDir, 'videos.jsonl');
  const output = path.join(sourceDir, 'youtube_meta.jsonl');
  const ids = fs.readFileSync(source, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line).vid as string);
  const done = new Set<string>();
  if (fs.existsSync(output)) {
    for (const line of fs.readFileSync(output, 'utf8').split('\n').filter(Boolean)) done.add(JSON.parse(line).vid as string);
  }
  const pending = ids.filter((vid) => !done.has(vid));
  let completed = done.size;
  for (const batch of splitIntoBatches(pending, 50)) {
    const response = await fetch(buildYoutubeMetadataUrl(batch, key));
    if (!response.ok) throw new Error(`YouTube API 返回 HTTP ${response.status}`);
    const payload = (await response.json()) as { items: Array<{ id: string; [key: string]: unknown }> };
    const items = new Map(payload.items.map((item) => [item.id, item]));
    const rows = batch.map((vid) => JSON.stringify({ vid, item: items.get(vid) ?? null })).join('\n') + '\n';
    fs.appendFileSync(output, rows);
    completed += batch.length;
    console.log(`metadata: ${completed}/${ids.length}`);
    await new Promise((resolve) => setTimeout(resolve, 200));
  }
  console.log(`metadata complete: ${ids.length} videos. Run npm run data:build next.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
