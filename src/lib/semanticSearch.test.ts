import fs from 'node:fs';
import path from 'node:path';
import { describe, expect, test } from 'vitest';
import { buildSimilarityIndex, findSimilarVideos, parseFloat16Npy, rankVector, type EmbeddingIndex } from './semanticSearch';
import { makeVideo } from '../test/fixtures';

describe('semantic search vectors', () => {
  test('parses the official float16 matrix with all exported videos', () => {
    const file = fs.readFileSync(path.join(process.cwd(), 'public/data/embeddings.npy'));
    const buffer = file.buffer.slice(file.byteOffset, file.byteOffset + file.byteLength);
    const parsed = parseFloat16Npy(buffer);

    expect(parsed.rows).toBe(6454);
    expect(parsed.dimensions).toBe(384);
    expect(parsed.vectors).toHaveLength(6454 * 384);
  });

  test('ranks vectors by cosine similarity and excludes the seed video', () => {
    const index: EmbeddingIndex = {
      ids: ['source00001', 'close000001', 'far0000001'],
      rowById: new Map([['source00001', 0], ['close000001', 1], ['far0000001', 2]]),
      vectors: new Float32Array([1, 0, 0.9, 0.1, 0, 1]),
      dimensions: 2,
    };
    expect(rankVector(index, new Float32Array([1, 0]), 2).map((hit) => hit.vid)).toEqual([
      'source00001',
      'close000001',
    ]);

    const videos = index.ids.map((vid) => makeVideo({ vid }));
    expect(findSimilarVideos(videos[0], index, videos, 2).map((hit) => hit.video.vid)).toEqual([
      'close000001',
      'far0000001',
    ]);
    expect(buildSimilarityIndex(['source00001'], index, 1)).toEqual({
      source00001: [{ vid: 'close000001', similarity: expect.closeTo(0.9) }],
    });
  });
});
