import { describe, expect, test } from 'vitest';
import { validateCatalog } from './check-data';
import { makeCatalog, makeVideo } from '../src/test/fixtures';

describe('validateCatalog', () => {
  test('reports a loadable catalog with unique video ids and known topic references', () => {
    expect(validateCatalog(makeCatalog([makeVideo()]))).toEqual({
      videos: 1,
      topics: 1,
      missingCoreFields: 0,
      duplicateIds: 0,
      unknownTopicReferences: 0,
    });
  });

  test('rejects a catalog with a missing video id', () => {
    const catalog = makeCatalog([makeVideo({ vid: '' })]);
    expect(() => validateCatalog(catalog)).toThrow('核心字段');
  });
});
