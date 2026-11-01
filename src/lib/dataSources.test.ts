import { describe, expect, test } from 'vitest';
import { makeCatalog, makeVideo } from '../test/fixtures';
import { mergeKarpathySource } from './dataSources';
import type { ChannelSource } from './types';

const source: ChannelSource = {
  version: 1,
  generated: '2026-11-01',
  source: { id: 'karpathy', name: 'Andrej Karpathy', channelId: 'official', url: 'https://youtube.com/@AndrejKarpathy' },
  videos: [
    { vid: 'existing001', title: 'Existing', duration: '1:00:00', viewsLabel: '1M', publishedLabel: '1 year ago' },
    { vid: 'karpathy001', title: 'New lesson', duration: '2:00:00', viewsLabel: '2M', publishedLabel: '2 years ago' },
  ],
};

describe('mergeKarpathySource', () => {
  test('deduplicates by YouTube id and preserves Hacker News metadata', () => {
    const merged = mergeKarpathySource(makeCatalog([makeVideo({ vid: 'existing001', hn: { ...makeVideo().hn, recommenders: 9 } })]), source);
    expect(merged.videos).toHaveLength(2);
    expect(merged.videos.find((video) => video.vid === 'existing001')).toMatchObject({ source: 'karpathy', duration: '1:00:00', hn: { recommenders: 9 } });
    expect(merged.videos.find((video) => video.vid === 'karpathy001')).toMatchObject({ channel: 'Andrej Karpathy', source: 'karpathy' });
  });
});
