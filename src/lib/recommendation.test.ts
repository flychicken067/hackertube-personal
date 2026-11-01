import { describe, expect, test } from 'vitest';
import { rankVideos } from './recommendation';
import { makeVideo } from '../test/fixtures';
import type { LibraryState } from './types';

const emptyState: LibraryState = {
  version: 1,
  likes: [],
  watchLater: [],
  history: [],
  topicPreferences: {},
};

describe('rankVideos', () => {
  test('uses distinct recommender count as a base ranking signal', () => {
    const popular = makeVideo({
      vid: 'popular0001',
      title: 'Popular systems talk',
      hn: { ...makeVideo().hn, recommenders: 12 },
    });
    const niche = makeVideo({
      vid: 'nichevideo1',
      title: 'Niche systems talk',
      hn: { ...makeVideo().hn, recommenders: 2 },
    });

    expect(rankVideos([niche, popular], emptyState, '2026-11-01')[0].vid).toBe('popular0001');
  });

  test('raises videos from topics the user prefers', () => {
    const preferred = makeVideo({
      vid: 'preferred01',
      title: 'A database internals lecture',
      hn: { ...makeVideo().hn, recommenders: 3 },
      categories: [
        { id: 'databases', name: 'Databases', area: 'software', areaName: 'Software Engineering' },
      ],
    });
    const popular = makeVideo({
      vid: 'popular0001',
      title: 'A popular networking lecture',
      hn: { ...makeVideo().hn, recommenders: 6 },
    });
    const state = { ...emptyState, topicPreferences: { databases: 2 } };

    expect(rankVideos([popular, preferred], state, '2026-11-01')[0].vid).toBe('preferred01');
  });

  test('penalizes recently watched videos and excludes non-recommendations and news', () => {
    const watched = makeVideo({
      vid: 'watched0001',
      title: 'A recently watched classic',
      hn: { ...makeVideo().hn, recommenders: 30 },
    });
    const unseen = makeVideo({
      vid: 'unseen00001',
      title: 'An unseen recommendation',
      hn: { ...makeVideo().hn, recommenders: 5 },
    });
    const referenceOnly = makeVideo({
      vid: 'reference01',
      title: 'A neutral reference',
      hn: { ...makeVideo().hn, recommenders: 0 },
    });
    const news = makeVideo({ vid: 'newsvid0001', title: 'A dated news clip', shelfLife: 'news' });
    const state: LibraryState = {
      ...emptyState,
      history: [{ vid: watched.vid, watchedAt: '2026-11-01T08:00:00.000Z', count: 1 }],
    };

    expect(rankVideos([watched, unseen, referenceOnly, news], state, '2026-11-01').map((v) => v.vid)).toEqual([
      'unseen00001',
      'watched0001',
    ]);
  });

  test('keeps only the strongest exact-title duplicate in the feed', () => {
    const weaker = makeVideo({ vid: 'duplicate01', title: 'Simple Made Easy', score: 3 });
    const stronger = makeVideo({ vid: 'duplicate02', title: 'Simple Made Easy', score: 8 });

    expect(rankVideos([weaker, stronger], emptyState, '2026-11-01').map((v) => v.vid)).toEqual([
      'duplicate02',
    ]);
  });
});
