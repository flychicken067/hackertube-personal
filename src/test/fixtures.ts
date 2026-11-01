import type { Catalog, Video } from '../lib/types';

export function makeVideo(overrides: Partial<Video> = {}): Video {
  return {
    vid: 'abcdefghijk',
    url: 'https://www.youtube.com/watch?v=abcdefghijk',
    title: 'A thoughtful systems talk',
    channel: 'Example Channel',
    summary: 'A complete fixture that mirrors the exported video shape.',
    whyHn: 'HN readers recommend it for its clear explanations.',
    contentType: 'talk',
    level: 'general',
    shelfLife: 'evergreen',
    primaryTopic: 'distributed systems',
    tags: ['systems', 'reliability'],
    categories: [
      {
        id: 'distributed-systems',
        name: 'Distributed systems',
        area: 'software',
        areaName: 'Software Engineering',
      },
    ],
    quote: {
      text: 'This changed how I think about systems.',
      hnCommentId: 123,
      year: '2024',
    },
    hn: {
      mentions: 6,
      recommenders: 5,
      recMonths: 5,
      strongRecs: 2,
      stances: { rec: 3, strong_rec: 2, reference: 1 },
      firstYear: 2020,
      lastYear: 2025,
    },
    score: 6,
    duration: null,
    ...overrides,
  };
}

export function makeCatalog(videos: Video[]): Catalog {
  return {
    version: 1,
    generated: '2026-10-31',
    areas: [
      {
        id: 'software',
        name: 'Software Engineering',
        categories: [
          {
            id: 'distributed-systems',
            name: 'Distributed systems',
            description: 'Distributed computing, consensus and reliability.',
          },
        ],
      },
    ],
    videos,
  };
}
