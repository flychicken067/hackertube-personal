import { describe, expect, test } from 'vitest';
import { validateCatalog, validateParityManifest } from './check-data';
import { makeCatalog, makeVideo } from '../src/test/fixtures';

describe('validateCatalog', () => {
  test('reports a loadable catalog with unique video ids and known topic references', () => {
    expect(validateCatalog(makeCatalog([makeVideo()]))).toEqual({
      videos: 1,
      topics: 1,
      missingCoreFields: 0,
      duplicateIds: 0,
      unknownTopicReferences: 0,
      invalidDurations: 0,
    });
  });

  test('rejects a catalog with a missing video id', () => {
    const catalog = makeCatalog([makeVideo({ vid: '' })]);
    expect(() => validateCatalog(catalog)).toThrow('核心字段');
  });

  test('rejects catalog durations that the browser filters cannot parse', () => {
    const catalog = makeCatalog([makeVideo({ duration: 'P1DT1S' })]);
    expect(() => validateCatalog(catalog)).toThrow('时长格式');
  });
});

describe('validateParityManifest', () => {
  const manifest = {
    version: 1 as const,
    source: 'HackerTube public export' as const,
    exportVersion: 'fixture-v1',
    generated: '2026-11-02T00:00:00.000Z',
    counts: {
      videos: 1,
      mentions: 2,
      relatedSources: 1,
      relatedEdges: 1,
      embeddingIds: 1,
      areas: 1,
      topics: 1,
    },
    yearRange: { first: 2018, last: 2026 },
    validation: {
      duplicateVideoIds: 0,
      invalidMentionReferences: 0,
      invalidRelatedReferences: 0,
      invalidCategoryReferences: 0,
      duplicateEmbeddingIds: 0,
      invalidEmbeddingReferences: 0,
      missingEmbeddingIds: 0,
    },
  };

  test('accepts a fully referenced export matching the catalog', () => {
    expect(validateParityManifest(manifest, { videos: 1, topics: 1 })).toMatchObject({
      videos: 1,
      mentions: 2,
      topics: 1,
      brokenReferences: 0,
    });
  });

  test('rejects a stale manifest whose video count does not match the catalog', () => {
    expect(() => validateParityManifest(manifest, { videos: 2, topics: 1 })).toThrow('清单与目录不一致');
  });

  test('rejects any non-zero validation issue', () => {
    expect(() =>
      validateParityManifest(
        { ...manifest, validation: { ...manifest.validation, invalidMentionReferences: 1 } },
        { videos: 1, topics: 1 },
      ),
    ).toThrow('公开导出仍有 1 个数据问题');
  });
});
