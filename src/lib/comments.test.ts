import { describe, expect, test, vi } from 'vitest';
import { commentBucket, loadVideoComments } from './comments';

describe('commentBucket', () => {
  test('uses a case-safe hexadecimal bucket for an ordinary video id', () => {
    expect(commentBucket('abcdefghijk')).toBe('61');
    expect(commentBucket('Abcdefghijk')).toBe('41');
  });

  test('keeps leading hyphen and underscore video ids URL-safe and distinct', () => {
    expect(commentBucket('-bcdefghijk')).toBe('2d');
    expect(commentBucket('_bcdefghijk')).toBe('5f');
  });

  test('rejects an empty video id', () => {
    expect(() => commentBucket('')).toThrow('视频 ID');
  });
});

describe('loadVideoComments', () => {
  test('loads only the matching bucket and returns the requested video comments', async () => {
    const comments = [
      {
        hnCommentId: 42,
        hnUrl: 'https://news.ycombinator.com/item?id=42',
        vid: 'abcdefghijk',
        author: 'alice',
        month: '2024-01',
        storyTitle: 'Story',
        stance: 'rec',
        why: 'Useful explanation',
        quote: 'Worth watching',
        text: 'A longer comment.',
      },
    ];
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ abcdefghijk: comments }) });

    await expect(loadVideoComments('abcdefghijk', fetcher, 'https://example.com/app/')).resolves.toEqual(comments);
    expect(fetcher).toHaveBeenCalledWith('https://example.com/app/data/comments/61.json');
  });

  test('returns an empty list when the video has no records in an existing bucket', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ anotherVid: [] }) });

    await expect(loadVideoComments('abcdefghijk', fetcher, 'https://example.com/')).resolves.toEqual([]);
  });

  test('returns an empty list for a missing bucket', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 404 });

    await expect(loadVideoComments('_bcdefghijk', fetcher, 'https://example.com/')).resolves.toEqual([]);
  });

  test('surfaces other loading failures', async () => {
    const fetcher = vi.fn().mockResolvedValue({ ok: false, status: 503 });

    await expect(loadVideoComments('abcdefghijk', fetcher, 'https://example.com/')).rejects.toThrow('503');
  });
});
