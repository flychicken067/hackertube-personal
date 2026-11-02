import { describe, expect, test } from 'vitest';
import { makeVideo } from '../test/fixtures';
import { getRelatedVideos } from './related';

describe('getRelatedVideos', () => {
  test('ranks co-recommended videos by shared recommenders', () => {
    const source = makeVideo({ vid: 'source00001' });
    const first = makeVideo({ vid: 'first000001' });
    const second = makeVideo({ vid: 'second00001' });
    const index = {
      source00001: [
        { vid: first.vid, shared_recommenders: 2 },
        { vid: second.vid, shared_recommenders: 5 },
      ],
    };

    expect(getRelatedVideos(source.vid, index, [source, first, second]).map((item) => item.video.vid)).toEqual([
      second.vid,
      first.vid,
    ]);
  });

  test('ignores unknown ids, the source video and duplicate related ids', () => {
    const source = makeVideo({ vid: 'source00001' });
    const valid = makeVideo({ vid: 'valid000001' });
    const index = {
      source00001: [
        { vid: 'missing0001', shared_recommenders: 99 },
        { vid: source.vid, shared_recommenders: 10 },
        { vid: valid.vid, shared_recommenders: 3 },
        { vid: valid.vid, shared_recommenders: 1 },
      ],
    };

    expect(getRelatedVideos(source.vid, index, [source, valid])).toEqual([
      { video: valid, sharedRecommenders: 3 },
    ]);
  });
});
