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
    part: 'snippet,contentDetails,statistics,status',
    id: ids.join(','),
    key,
  }).toString();
  return url.toString();
}

type FetchResponse = {
  ok: boolean;
  status: number;
  json: () => Promise<unknown>;
};

type Fetcher = (input: string | URL) => Promise<FetchResponse>;

interface FetchYoutubeMetadataOptions {
  ids: string[];
  outputFile: string;
  key: string;
  fetcher?: Fetcher;
  sleep?: (milliseconds: number) => Promise<void>;
  onProgress?: (completed: number, total: number) => void;
}

export function requireYoutubeApiKey(value: string | undefined) {
  if (!value?.trim()) throw new Error('请先在终端设置 YOUTUBE_API_KEY，不要把密钥写进代码。');
  return value;
}

function readCachedIds(filename: string) {
  const done = new Set<string>();
  if (!fs.existsSync(filename)) return done;
  for (const [index, line] of fs.readFileSync(filename, 'utf8').split('\n').entries()) {
    if (!line.trim()) continue;
    try {
      const row = JSON.parse(line) as { vid?: unknown };
      if (typeof row.vid !== 'string') throw new Error('vid missing');
      done.add(row.vid);
    } catch {
      throw new Error(`${path.basename(filename)}:${index + 1} 缓存损坏，请修复后重试`);
    }
  }
  return done;
}

export async function fetchYoutubeMetadata({
  ids,
  outputFile,
  key,
  fetcher = fetch as Fetcher,
  sleep = (milliseconds) => new Promise((resolve) => setTimeout(resolve, milliseconds)),
  onProgress = () => undefined,
}: FetchYoutubeMetadataOptions) {
  requireYoutubeApiKey(key);
  const uniqueIds = [...new Set(ids)];
  const done = readCachedIds(outputFile);
  const pending = uniqueIds.filter((vid) => !done.has(vid));
  let fetched = 0;
  fs.mkdirSync(path.dirname(outputFile), { recursive: true });

  for (const batch of splitIntoBatches(pending, 50)) {
    const response = await fetcher(buildYoutubeMetadataUrl(batch, key));
    if (!response.ok) {
      let payload: any = null;
      try { payload = await response.json(); } catch { /* no JSON body */ }
      const reasons = payload?.error?.errors?.map((item: any) => item?.reason).filter(Boolean) ?? [];
      if (reasons.some((reason: string) => /quota/i.test(reason))) {
        throw new Error(`YouTube API 配额已用尽；已完成的 ${done.size + fetched} 条缓存已保留，可稍后继续。`);
      }
      throw new Error(`YouTube API 返回 HTTP ${response.status}；已完成的缓存已保留。`);
    }
    const payload = (await response.json()) as { items?: Array<{ id: string; [key: string]: unknown }> };
    const items = new Map((payload.items ?? []).map((item) => [item.id, item]));
    const rows = batch.map((vid) => JSON.stringify({ vid, item: items.get(vid) ?? null })).join('\n') + '\n';
    fs.appendFileSync(outputFile, rows);
    fetched += batch.length;
    onProgress(done.size + fetched, uniqueIds.length);
    if (fetched < pending.length) await sleep(200);
  }
  return { total: uniqueIds.length, cached: uniqueIds.length - pending.length, fetched };
}

async function run() {
  const key = requireYoutubeApiKey(process.env.YOUTUBE_API_KEY);
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const sourceDir = process.env.HACKERTUBE_SOURCE_DIR
    ? path.resolve(process.env.HACKERTUBE_SOURCE_DIR)
    : path.resolve(projectRoot, 'data/hackertube-export/hackertube-data');
  const source = path.join(sourceDir, 'videos.jsonl');
  const output = process.env.YOUTUBE_METADATA_FILE
    ? path.resolve(process.env.YOUTUBE_METADATA_FILE)
    : path.join(projectRoot, 'data/youtube-meta.jsonl');
  const ids = fs.readFileSync(source, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line).vid as string);
  const result = await fetchYoutubeMetadata({
    ids,
    outputFile: output,
    key,
    onProgress: (completed, total) => console.log(`metadata: ${completed}/${total}`),
  });
  console.log(`metadata cache: ${result.cached} reused, ${result.fetched} fetched. Run npm run data:build next.`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
