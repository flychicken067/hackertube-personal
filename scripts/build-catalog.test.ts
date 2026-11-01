import { describe, expect, test } from 'vitest';
import { buildCatalog, mapVideo } from './build-catalog';

const sourceVideo = {
  vid: 'abcdefghijk',
  url: 'https://www.youtube.com/watch?v=abcdefghijk',
  title: 'A source video',
  channel: 'Source Channel',
  summary: 'Summary from the export.',
  why_hn: 'Why HN points people to it.',
  content_type: 'talk',
  level: 'general',
  shelf_life: 'evergreen',
  primary_topic: 'databases',
  tags: ['storage'],
  categories: [
    { id: 'databases', name: 'Databases', area: 'software', area_name: 'Software Engineering' },
  ],
  quote: { text: 'Worth watching.', hn_comment_id: 42, year: '2024' },
  hn: {
    mentions: 4,
    recommenders: 3,
    rec_months: 3,
    strong_recs: 1,
    stances: { rec: 2, strong_rec: 1, reference: 1 },
    first_year: 2020,
    last_year: 2024,
  },
  score: 3.5,
};

describe('catalog builder', () => {
  test('maps the official snake-case export into the browser catalog shape', () => {
    expect(mapVideo(sourceVideo, { duration: '1:02:03', available: true, embeddable: false })).toMatchObject({
      vid: 'abcdefghijk',
      whyHn: 'Why HN points people to it.',
      categories: [{ areaName: 'Software Engineering' }],
      quote: { hnCommentId: 42 },
      hn: { recMonths: 3, strongRecs: 1 },
      duration: '1:02:03',
      available: true,
      embeddable: false,
    });
  });

  test('builds one catalog and preserves the official video count', () => {
    const taxonomy = {
      version: 1,
      areas: [{ id: 'software', name: 'Software Engineering', categories: [] }],
    };

    const result = buildCatalog([sourceVideo], taxonomy, new Map());

    expect(result).toEqual({
      version: 1,
      generated: expect.any(String),
      areas: taxonomy.areas,
      videos: [expect.objectContaining({ vid: 'abcdefghijk', duration: null })],
    });
  });
});
