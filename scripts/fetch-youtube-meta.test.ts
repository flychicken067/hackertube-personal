import { describe, expect, test } from 'vitest';
import { buildYoutubeMetadataUrl, splitIntoBatches } from './fetch-youtube-meta';

describe('YouTube metadata fetch helpers', () => {
  test('splits video ids into API-safe groups of at most 50', () => {
    const ids = Array.from({ length: 51 }, (_, index) => `video-${index}`);
    expect(splitIntoBatches(ids, 50).map((batch) => batch.length)).toEqual([50, 1]);
  });

  test('requests only duration and embed status for the selected ids', () => {
    const url = new URL(buildYoutubeMetadataUrl(['abc', 'def'], 'test-key'));
    expect(url.origin + url.pathname).toBe('https://www.googleapis.com/youtube/v3/videos');
    expect(url.searchParams.get('part')).toBe('contentDetails,status');
    expect(url.searchParams.get('id')).toBe('abc,def');
    expect(url.searchParams.get('key')).toBe('test-key');
  });
});
