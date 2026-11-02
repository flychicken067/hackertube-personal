import { describe, expect, test } from 'vitest';
import { makeVideo } from '../test/fixtures';
import { filterAndSortVideos, type BrowseFilters, type BrowseSort } from './browse';

const baseFilters: BrowseFilters = {
  uploadDate: 'all',
  type: 'all',
  duration: 'all',
  hiddenGems: false,
  evergreenOnly: false,
  sort: 'best',
};

describe('filterAndSortVideos', () => {
  test('filters by past year and upload decades', () => {
    const videos = [
      makeVideo({ vid: 'year2026001', publishedAt: '2026-06-01T00:00:00Z' }),
      makeVideo({ vid: 'year2024001', publishedAt: '2024-06-01T00:00:00Z' }),
      makeVideo({ vid: 'year2015001', publishedAt: '2015-06-01T00:00:00Z' }),
      makeVideo({ vid: 'year2008001', publishedAt: '2008-06-01T00:00:00Z' }),
    ];

    expect(filterAndSortVideos(videos, { ...baseFilters, uploadDate: 'past-year' }, new Date('2026-11-02')).map((v) => v.vid)).toEqual(['year2026001']);
    expect(filterAndSortVideos(videos, { ...baseFilters, uploadDate: '2020s' }).map((v) => v.vid)).toEqual(expect.arrayContaining(['year2026001', 'year2024001']));
    expect(filterAndSortVideos(videos, { ...baseFilters, uploadDate: '2010s' }).map((v) => v.vid)).toEqual(['year2015001']);
    expect(filterAndSortVideos(videos, { ...baseFilters, uploadDate: '2000s' }).map((v) => v.vid)).toEqual(['year2008001']);
  });

  test('filters original public content types and maps courses into lectures', () => {
    const talk = makeVideo({ vid: 'talk0000001', contentType: 'talk' });
    const course = makeVideo({ vid: 'course00001', contentType: 'course' });
    const music = makeVideo({ vid: 'music000001', contentType: 'music' });

    expect(filterAndSortVideos([talk, course, music], { ...baseFilters, type: 'talk' }).map((v) => v.vid)).toEqual([talk.vid]);
    expect(filterAndSortVideos([talk, course, music], { ...baseFilters, type: 'lecture' }).map((v) => v.vid)).toEqual([course.vid]);
    expect(filterAndSortVideos([talk, course, music], { ...baseFilters, type: 'music' }).map((v) => v.vid)).toEqual([music.vid]);
  });

  test('filters the four duration bands at their boundaries', () => {
    const videos = [
      makeVideo({ vid: 'short000001', duration: '3:59' }),
      makeVideo({ vid: 'medium00001', duration: '4:00' }),
      makeVideo({ vid: 'long0000001', duration: '20:00' }),
      makeVideo({ vid: 'hour0000001', duration: '1:00:00' }),
    ];

    expect(filterAndSortVideos(videos, { ...baseFilters, duration: 'under-4' }).map((v) => v.vid)).toEqual(['short000001']);
    expect(filterAndSortVideos(videos, { ...baseFilters, duration: '4-20' }).map((v) => v.vid)).toEqual(['medium00001']);
    expect(filterAndSortVideos(videos, { ...baseFilters, duration: '20-60' }).map((v) => v.vid)).toEqual(['long0000001']);
    expect(filterAndSortVideos(videos, { ...baseFilters, duration: 'over-60' }).map((v) => v.vid)).toEqual(['hour0000001']);
  });

  test('filters hidden gems and evergreen videos', () => {
    const hidden = makeVideo({ vid: 'hidden00001', viewCount: 9_000, shelfLife: 'evergreen', hn: { ...makeVideo().hn, recommenders: 4 } });
    const popular = makeVideo({ vid: 'popular0001', viewCount: 2_000_000, shelfLife: 'evergreen' });
    const dated = makeVideo({ vid: 'dated000001', viewCount: 2_000, shelfLife: 'dated', hn: { ...makeVideo().hn, recommenders: 4 } });

    expect(filterAndSortVideos([hidden, popular, dated], { ...baseFilters, hiddenGems: true }).map((v) => v.vid)).toEqual(expect.arrayContaining([hidden.vid, dated.vid]));
    expect(filterAndSortVideos([hidden, popular, dated], { ...baseFilters, evergreenOnly: true }).map((v) => v.vid)).toEqual(expect.arrayContaining([hidden.vid, popular.vid]));
  });

  test('supports all six public sort orders', () => {
    const a = makeVideo({ vid: 'sort-a00001', score: 10, publishedAt: '2010-01-01', viewCount: 100, likeCount: 90, hn: { ...makeVideo().hn, lastYear: 2020 } });
    const b = makeVideo({ vid: 'sort-b00001', score: 5, publishedAt: '2025-01-01', viewCount: 10_000, likeCount: 1_000, hn: { ...makeVideo().hn, lastYear: 2026 } });
    const c = makeVideo({ vid: 'sort-c00001', score: 1, publishedAt: '2008-01-01', viewCount: 1_000, likeCount: 500, hn: { ...makeVideo().hn, lastYear: 2024 } });
    const videos = [c, b, a];
    const expected: Record<BrowseSort, string[]> = {
      best: [a.vid, b.vid, c.vid],
      'recently-recommended': [b.vid, c.vid, a.vid],
      'upload-date': [b.vid, a.vid, c.vid],
      oldest: [c.vid, a.vid, b.vid],
      'view-count': [b.vid, c.vid, a.vid],
      'like-ratio': [a.vid, c.vid, b.vid],
    };

    for (const [sort, ids] of Object.entries(expected) as Array<[BrowseSort, string[]]>) {
      expect(filterAndSortVideos(videos, { ...baseFilters, sort }).map((v) => v.vid)).toEqual(ids);
    }
  });
});
