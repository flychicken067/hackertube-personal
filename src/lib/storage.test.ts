import { describe, expect, test } from 'vitest';
import { exportLibraryState, importLibraryState, toggleId, updateHistory, updateReaction } from './storage';

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

  test('migrates a valid v1 state to v2 defaults', () => {
    const legacy = JSON.stringify({
      version: 1,
      likes: ['abc'],
      watchLater: [],
      history: [],
      topicPreferences: { databases: 2 },
    });

    expect(importLibraryState(legacy)).toEqual({
      version: 2,
      likes: ['abc'],
      dislikes: [],
      watchLater: [],
      history: [],
      topicPreferences: { databases: 2 },
      useVideoFrames: true,
    });
  });

  test('keeps likes and dislikes mutually exclusive', () => {
    const state = {
      version: 2 as const,
      likes: ['abc'],
      dislikes: [],
      watchLater: [],
      history: [],
      topicPreferences: {},
      useVideoFrames: true,
    };

    const disliked = updateReaction(state, 'abc', 'dislike');
    expect(disliked.likes).toEqual([]);
    expect(disliked.dislikes).toEqual(['abc']);
    const likedAgain = updateReaction(disliked, 'abc', 'like');
    expect(likedAgain.likes).toEqual(['abc']);
    expect(likedAgain.dislikes).toEqual([]);
  });

  test('rejects malformed imports without mutating the current state', () => {
    const current = {
      version: 2 as const,
      likes: ['keep-me'],
      dislikes: [],
      watchLater: [],
      history: [],
      topicPreferences: {},
      useVideoFrames: true,
    };

    expect(() => importLibraryState('{"likes":"wrong"}')).toThrow('无法识别');
    expect(current.likes).toEqual(['keep-me']);
  });

  test('exports every v2 feedback field and can import it unchanged', () => {
    const state = {
      version: 2 as const,
      likes: ['liked'],
      dislikes: ['disliked'],
      watchLater: ['later'],
      history: [{ vid: 'watched', watchedAt: '2026-11-02T00:00:00.000Z', count: 2 }],
      topicPreferences: { databases: 2 },
      useVideoFrames: false,
    };

    const exported = exportLibraryState(state);
    expect(JSON.parse(exported)).toEqual(state);
    expect(importLibraryState(exported)).toEqual(state);
  });
});
