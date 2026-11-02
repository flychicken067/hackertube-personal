import { describe, expect, test } from 'vitest';
import { makeCatalog, makeVideo } from '../src/test/fixtures';
import { applyYoutubeMetadata, formatIsoDuration } from './apply-youtube-meta';

describe('applyYoutubeMetadata', () => {
  test('merges duration, publication, counts and embed status into the catalog', () => {
    const catalog = makeCatalog([
      makeVideo({ vid: 'available01' }),
      makeVideo({ vid: 'deleted0001' }),
    ]);
    const result = applyYoutubeMetadata(catalog, [
      {
        vid: 'available01',
        item: {
          id: 'available01',
          snippet: { publishedAt: '2024-05-06T07:08:09Z' },
          contentDetails: { duration: 'PT1H2M3S' },
          statistics: { viewCount: '12345', likeCount: '678' },
          status: { embeddable: true },
        },
      },
      { vid: 'deleted0001', item: null },
    ]);

    expect(result.videos[0]).toMatchObject({
      duration: '1:02:03',
      publishedAt: '2024-05-06T07:08:09Z',
      viewCount: 12345,
      likeCount: 678,
      available: true,
      embeddable: true,
    });
    expect(result.videos[1]).toMatchObject({ available: false, embeddable: null });
  });

  test('preserves existing metadata for ids absent from the cache', () => {
    const video = makeVideo({ vid: 'untouched01', duration: '12:34', viewCount: 99 });

    expect(applyYoutubeMetadata(makeCatalog([video]), []).videos[0]).toMatchObject({
      duration: '12:34',
      viewCount: 99,
    });
  });
});

describe('formatIsoDuration', () => {
  test('formats YouTube ISO durations', () => {
    expect(formatIsoDuration('PT3M4S')).toBe('3:04');
    expect(formatIsoDuration('PT2H0M9S')).toBe('2:00:09');
  });
});
