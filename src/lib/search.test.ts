import { describe, expect, test } from 'vitest';
import { searchVideos } from './search';
import { makeVideo } from '../test/fixtures';
import { createSearchIndex } from './searchIndex';

const index = createSearchIndex([
  {
    id: 'software',
    name: 'Software',
    categories: [
      {
        id: 'databases-storage',
        name: 'Databases & storage',
        description: 'SQL, Postgres, transactions, indexing, filesystems and storage engines.',
      },
    ],
  },
]);

describe('searchVideos', () => {
  test('finds a video by words in its title', () => {
    const result = searchVideos(
      [
        makeVideo({ vid: 'titlematch1', title: 'The Soul of a New Machine' }),
        makeVideo({ vid: 'othervideo1', title: 'Geometry for Artists' }),
      ],
      'new machine',
    );

    expect(result.map((entry) => entry.video.vid)).toEqual(['titlematch1']);
    expect(result[0].reason).toBe('标题匹配');
  });

  test('finds a video by topic, tag, or category text', () => {
    const result = searchVideos(
      [
        makeVideo({
          vid: 'topicmatch1',
          primaryTopic: 'linear algebra',
          tags: ['vectors', 'visual intuition'],
          categories: [
            {
              id: 'pure-mathematics',
              name: 'Pure mathematics',
              area: 'math',
              areaName: 'Mathematics',
            },
          ],
        }),
      ],
      'visual mathematics',
    );

    expect(result.map((entry) => entry.video.vid)).toEqual(['topicmatch1']);
  });

  test('finds a semantic topic match when the query words are absent from the video fields', () => {
    const result = searchVideos(
      [
        makeVideo({
          vid: 'semantic001',
          title: 'Under the hood',
          summary: 'A deep technical session.',
          whyHn: 'HN readers value the implementation detail.',
          primaryTopic: 'data systems',
          tags: [],
          categories: [
            {
              id: 'databases-storage',
              name: 'Databases',
              area: 'software',
              areaName: 'Software',
            },
          ],
        }),
      ],
      'storage engine',
      index,
    );

    expect(result.map((entry) => entry.video.vid)).toEqual(['semantic001']);
    expect(result[0].reason).toBe('话题匹配：Databases & storage');
  });

  test('ranks a multi-word title match above a taxonomy-only match', () => {
    const direct = makeVideo({ vid: 'direct00001', title: 'Storage engine internals' });
    const semantic = makeVideo({
      vid: 'semantic001',
      title: 'Under the hood',
      categories: [{ id: 'databases-storage', name: 'Databases', area: 'software', areaName: 'Software' }],
    });

    expect(searchVideos([semantic, direct], 'storage engine', index).map((entry) => entry.video.vid)).toEqual([
      direct.vid,
      semantic.vid,
    ]);
  });

  test('returns an empty list for a blank query', () => {
    expect(searchVideos([makeVideo()], '   ')).toEqual([]);
  });
});
