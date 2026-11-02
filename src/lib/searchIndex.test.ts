import { describe, expect, test } from 'vitest';
import { createSearchIndex, matchSearchTopics } from './searchIndex';

const areas = [
  {
    id: 'software',
    name: 'Software Engineering',
    categories: [
      {
        id: 'databases-storage',
        name: 'Databases & storage',
        description: 'SQL, SQLite, Postgres, transactions, indexing, filesystems and storage engines.',
      },
      {
        id: 'web-development',
        name: 'Web development',
        description: 'JavaScript, TypeScript, React, CSS, browsers and frontend frameworks.',
      },
    ],
  },
];

describe('search topic index', () => {
  test('flattens taxonomy descriptions into a compact searchable index', () => {
    expect(createSearchIndex(areas)).toEqual({
      version: 1,
      topics: [
        expect.objectContaining({ id: 'databases-storage', areaName: 'Software Engineering' }),
        expect.objectContaining({ id: 'web-development', areaName: 'Software Engineering' }),
      ],
    });
  });

  test('matches a topic by related words from its description', () => {
    const index = createSearchIndex(areas);

    expect(matchSearchTopics(index, 'storage engine').map((topic) => topic.id)).toEqual(['databases-storage']);
    expect(matchSearchTopics(index, 'react browser').map((topic) => topic.id)).toEqual(['web-development']);
  });

  test('returns no topic for a blank query', () => {
    expect(matchSearchTopics(createSearchIndex(areas), '  ')).toEqual([]);
  });
});
