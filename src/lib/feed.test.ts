import { describe, expect, test } from 'vitest';
import { makeVideo } from '../test/fixtures';
import type { LibraryState, Video } from './types';
import { buildHomeFeed } from './feed';

const emptyState: LibraryState = {
  version: 2,
  likes: [],
  dislikes: [],
  watchLater: [],
  history: [],
  topicPreferences: {},
  useVideoFrames: true,
};

function item(feed: ReturnType<typeof buildHomeFeed>, vid: string) {
  return feed.find((entry) => entry.video.vid === vid);
}

describe('buildHomeFeed', () => {
  test('uses related data to explain similarity to liked videos', () => {
    const liked = makeVideo({ vid: 'liked000001', title: 'Liked video' });
    const similar = makeVideo({ vid: 'similar0001', title: 'Similar video' });
    const state = { ...emptyState, likes: [liked.vid] };
    const feed = buildHomeFeed(
      [liked, similar],
      state,
      { [liked.vid]: [{ vid: similar.vid, shared_recommenders: 4 }] },
      '2026-11-02',
    );

    expect(item(feed, similar.vid)).toMatchObject({ lane: 'liked-similarity' });
    expect(item(feed, similar.vid)?.reason).toContain('喜欢');
  });

  test('uses recent history for a co-recommender lane', () => {
    const watched = makeVideo({ vid: 'watched0001', title: 'Watched video' });
    const related = makeVideo({ vid: 'related0001', title: 'Related video' });
    const state: LibraryState = {
      ...emptyState,
      history: [{ vid: watched.vid, watchedAt: '2026-11-01T08:00:00.000Z', count: 1 }],
    };
    const feed = buildHomeFeed(
      [watched, related],
      state,
      { [watched.vid]: [{ vid: related.vid, shared_recommenders: 3 }] },
      '2026-11-02',
    );

    expect(item(feed, related.vid)).toMatchObject({ lane: 'co-recommenders' });
    expect(item(feed, related.vid)?.reason).toContain('HN 用户也推荐');
  });

  test('mixes Karpathy, classics, hidden gems, recent and unexplored topics without duplicates', () => {
    const explored = makeVideo({
      vid: 'explored0001',
      title: 'Already watched',
      categories: [{ id: 'known', name: 'Known', area: 'a', areaName: 'A' }],
    });
    const videos: Video[] = [
      explored,
      makeVideo({ vid: 'karpathy001', title: 'Karpathy lesson', source: 'karpathy', sourceOrder: 1 }),
      makeVideo({
        vid: 'classic0001',
        title: 'HN classic',
        score: 25,
        viewCount: 2_000_000,
        hn: { ...makeVideo().hn, recommenders: 20, lastYear: 2018 },
      }),
      makeVideo({
        vid: 'hiddengem01',
        title: 'Hidden gem',
        score: 5,
        viewCount: 4_000,
        hn: { ...makeVideo().hn, recommenders: 4, lastYear: 2017 },
      }),
      makeVideo({
        vid: 'recent00001',
        title: 'Recently recommended',
        score: 2,
        viewCount: 500_000,
        hn: { ...makeVideo().hn, recommenders: 2, lastYear: 2026 },
      }),
      makeVideo({
        vid: 'unexplored01',
        title: 'New topic',
        score: 1,
        viewCount: 500_000,
        hn: { ...makeVideo().hn, recommenders: 1, lastYear: 2012 },
        categories: [{ id: 'new-topic', name: 'New topic', area: 'b', areaName: 'B' }],
      }),
    ];
    const state: LibraryState = {
      ...emptyState,
      history: [{ vid: explored.vid, watchedAt: '2026-11-01T00:00:00.000Z', count: 1 }],
    };

    const feed = buildHomeFeed(videos, state, {}, '2026-11-02', 20);
    const lanes = new Set(feed.map((entry) => entry.lane));

    expect([...lanes]).toEqual(expect.arrayContaining([
      'karpathy',
      'classics',
      'hidden-gems',
      'recent',
      'unexplored',
    ]));
    expect(new Set(feed.map((entry) => entry.video.vid)).size).toBe(feed.length);
  });

  test('is stable for repeated builds on the same day', () => {
    const videos = Array.from({ length: 20 }, (_, index) =>
      makeVideo({ vid: `stable${String(index).padStart(5, '0')}`, title: `Stable ${index}` }),
    );

    const first = buildHomeFeed(videos, emptyState, {}, '2026-11-02').map((entry) => entry.video.vid);
    const second = buildHomeFeed(videos, emptyState, {}, '2026-11-02').map((entry) => entry.video.vid);

    expect(second).toEqual(first);
  });

  test('does not recommend a video the user marked as disliked', () => {
    const disliked = makeVideo({
      vid: 'disliked001',
      title: 'Do not show this',
      score: 30,
      hn: { ...makeVideo().hn, recommenders: 30 },
    });
    const state = { ...emptyState, dislikes: [disliked.vid] };

    expect(buildHomeFeed([disliked], state, {}, '2026-11-02')).toEqual([]);
  });
});
