import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test, vi } from 'vitest';
import { buildYoutubeMetadataUrl, fetchYoutubeMetadata, requireYoutubeApiKey, splitIntoBatches } from './fetch-youtube-meta';

const temporaryDirectories: string[] = [];

function temporaryOutput() {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'youtube-meta-'));
  temporaryDirectories.push(directory);
  return path.join(directory, 'youtube_meta.jsonl');
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) fs.rmSync(directory, { recursive: true, force: true });
});

describe('YouTube metadata fetch helpers', () => {
  test('splits video ids into API-safe groups of at most 50', () => {
    const ids = Array.from({ length: 51 }, (_, index) => `video-${index}`);
    expect(splitIntoBatches(ids, 50).map((batch) => batch.length)).toEqual([50, 1]);
  });

  test('requests all metadata needed by browse, video facts and playback checks', () => {
    const url = new URL(buildYoutubeMetadataUrl(['abc', 'def'], 'test-key'));
    expect(url.origin + url.pathname).toBe('https://www.googleapis.com/youtube/v3/videos');
    expect(url.searchParams.get('part')).toBe('snippet,contentDetails,statistics,status');
    expect(url.searchParams.get('id')).toBe('abc,def');
    expect(url.searchParams.get('key')).toBe('test-key');
  });

  test('skips cached ids and appends only missing records', async () => {
    const outputFile = temporaryOutput();
    fs.writeFileSync(outputFile, `${JSON.stringify({ vid: 'cached-id', item: { id: 'cached-id' } })}\n`);
    const fetcher = vi.fn(async (input: string | URL) => {
      const ids = new URL(String(input)).searchParams.get('id')?.split(',') ?? [];
      return { ok: true, status: 200, json: async () => ({ items: ids.map((id) => ({ id })) }) };
    });

    const result = await fetchYoutubeMetadata({
      ids: ['cached-id', 'new-id'],
      outputFile,
      key: 'secret-key',
      fetcher,
      sleep: async () => undefined,
    });

    expect(result).toEqual({ total: 2, cached: 1, fetched: 1 });
    expect(new URL(String(fetcher.mock.calls[0][0])).searchParams.get('id')).toBe('new-id');
    expect(fs.readFileSync(outputFile, 'utf8').trim().split('\n')).toHaveLength(2);
  });

  test('keeps completed batches when a later request hits quota', async () => {
    const outputFile = temporaryOutput();
    const ids = Array.from({ length: 51 }, (_, index) => `video-${index}`);
    const fetcher = vi.fn()
      .mockResolvedValueOnce({ ok: true, status: 200, json: async () => ({ items: ids.slice(0, 50).map((id) => ({ id })) }) })
      .mockResolvedValueOnce({ ok: false, status: 403, json: async () => ({ error: { errors: [{ reason: 'quotaExceeded' }] } }) });

    await expect(fetchYoutubeMetadata({
      ids,
      outputFile,
      key: 'secret-key',
      fetcher,
      sleep: async () => undefined,
    })).rejects.toThrow('配额');

    expect(fs.readFileSync(outputFile, 'utf8').trim().split('\n')).toHaveLength(50);
  });

  test('gives a safe environment-variable instruction when the key is missing', () => {
    expect(() => requireYoutubeApiKey(undefined)).toThrow('YOUTUBE_API_KEY');
    expect(() => requireYoutubeApiKey('')).toThrow('不要把密钥写进代码');
  });
});
