import { describe, expect, test } from 'vitest';
import { searchVideos } from './search';
import { makeVideo } from '../test/fixtures';

describe('searchVideos', () => {
  test('finds a video by words in its title', () => {
    const result = searchVideos(
      [
        makeVideo({ vid: 'titlematch1', title: 'The Soul of a New Machine' }),
        makeVideo({ vid: 'othervideo1', title: 'Geometry for Artists' }),
      ],
      'new machine',
    );

    expect(result.map((video) => video.vid)).toEqual(['titlematch1']);
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

    expect(result.map((video) => video.vid)).toEqual(['topicmatch1']);
  });

  test('returns an empty list for a blank query', () => {
    expect(searchVideos([makeVideo()], '   ')).toEqual([]);
  });
});
