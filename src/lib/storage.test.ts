import { describe, expect, test } from 'vitest';
import { importLibraryState, toggleId, updateHistory } from './storage';

describe('library state helpers', () => {
  test('toggleId adds a missing id and removes an existing id', () => {
    expect(toggleId(['a'], 'b')).toEqual(['a', 'b']);
    expect(toggleId(['a', 'b'], 'a')).toEqual(['b']);
  });

  test('updateHistory places the newest item first and increments repeat watches', () => {
    const initial = [{ vid: 'first', watchedAt: '2026-10-01T00:00:00.000Z', count: 1 }];

    expect(updateHistory(initial, 'second', '2026-11-01T00:00:00.000Z')).toEqual([
      { vid: 'second', watchedAt: '2026-11-01T00:00:00.000Z', count: 1 },
      initial[0],
    ]);
    expect(updateHistory(initial, 'first', '2026-11-01T00:00:00.000Z')[0]).toEqual({
      vid: 'first',
      watchedAt: '2026-11-01T00:00:00.000Z',
      count: 2,
    });
  });

  test('imports a valid state while rejecting malformed data', () => {
    const valid = JSON.stringify({
      version: 1,
      likes: ['abc'],
      watchLater: [],
      history: [],
      topicPreferences: { databases: 2 },
    });

    expect(importLibraryState(valid).likes).toEqual(['abc']);
    expect(() => importLibraryState('{"likes":"wrong"}')).toThrow('无法识别');
  });
});
