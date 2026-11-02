import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { afterEach, describe, expect, test } from 'vitest';
import { importHackertubeExport } from './import-hackertube-export';

const temporaryDirectories: string[] = [];

function makeWorkspace() {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'hackertube-import-'));
  temporaryDirectories.push(root);
  const inputDir = path.join(root, 'input');
  const outputDir = path.join(root, 'output');
  fs.mkdirSync(inputDir);
  return { inputDir, outputDir };
}

function writeJsonl(filename: string, rows: unknown[]) {
  fs.writeFileSync(filename, `${rows.map((row) => JSON.stringify(row)).join('\n')}\n`);
}

function writeValidExport(inputDir: string) {
  writeJsonl(path.join(inputDir, 'videos.jsonl'), [
    {
      vid: 'abcdefghijk',
      title: 'First video',
      categories: [{ id: 'topic-one' }],
    },
    {
      vid: 'lmnopqrstuv',
      title: 'Second video',
      categories: [{ id: 'topic-two' }],
    },
  ]);
  writeJsonl(path.join(inputDir, 'mentions.jsonl'), [
    {
      hn_comment_id: 1,
      hn_url: 'https://news.ycombinator.com/item?id=1',
      vid: 'abcdefghijk',
      author: 'alice',
      month: '2018-10',
      story_title: 'First story',
      stance: 'rec',
      why: 'Clear explanation',
      quote: 'Worth watching',
      text: 'A detailed recommendation.',
    },
    {
      hn_comment_id: 2,
      hn_url: 'https://news.ycombinator.com/item?id=2',
      vid: 'lmnopqrstuv',
      author: 'bob',
      month: '2026-02',
      story_title: 'Second story',
      stance: 'reference',
      why: '',
      quote: '',
      text: 'A useful reference.',
    },
  ]);
  writeJsonl(path.join(inputDir, 'related.jsonl'), [
    { vid: 'abcdefghijk', related: [{ vid: 'lmnopqrstuv', shared_recommenders: 2 }] },
  ]);
  fs.writeFileSync(
    path.join(inputDir, 'taxonomy.json'),
    JSON.stringify({
      version: 'fixture-v1',
      areas: [
        {
          id: 'area-one',
          name: 'Area one',
          categories: [
            { id: 'topic-one', name: 'Topic one', description: 'First topic.' },
            { id: 'topic-two', name: 'Topic two', description: 'Second topic.' },
          ],
        },
      ],
    }),
  );
  fs.writeFileSync(path.join(inputDir, 'embedding_ids.json'), JSON.stringify(['abcdefghijk', 'lmnopqrstuv']));
  fs.writeFileSync(path.join(inputDir, 'embeddings.npy'), makeEmptyNpy(2, 384));
}

function makeEmptyNpy(rows: number, dimensions: number) {
  const prefixLength = 10;
  const shape = `{'descr': '<f2', 'fortran_order': False, 'shape': (${rows}, ${dimensions}), }`;
  const padding = (16 - ((prefixLength + shape.length + 1) % 16)) % 16;
  const header = Buffer.from(`${shape}${' '.repeat(padding)}\n`, 'ascii');
  const prefix = Buffer.alloc(prefixLength);
  prefix.set([0x93, 0x4e, 0x55, 0x4d, 0x50, 0x59, 1, 0]);
  prefix.writeUInt16LE(header.length, 8);
  return Buffer.concat([prefix, header, Buffer.alloc(rows * dimensions * 2)]);
}

afterEach(() => {
  for (const directory of temporaryDirectories.splice(0)) {
    fs.rmSync(directory, { recursive: true, force: true });
  }
});

describe('importHackertubeExport', () => {
  test('validates counts and writes the compact indexes used by the browser', async () => {
    const { inputDir, outputDir } = makeWorkspace();
    writeValidExport(inputDir);

    const manifest = await importHackertubeExport(inputDir, outputDir);

    expect(manifest).toMatchObject({
      version: 1,
      source: 'HackerTube public export',
      exportVersion: 'fixture-v1',
      counts: {
        videos: 2,
        mentions: 2,
        relatedSources: 1,
        relatedEdges: 1,
        embeddingIds: 2,
        areas: 1,
        topics: 2,
      },
      yearRange: { first: 2018, last: 2026 },
      validation: {
        duplicateVideoIds: 0,
        invalidMentionReferences: 0,
        invalidRelatedReferences: 0,
        invalidCategoryReferences: 0,
        duplicateEmbeddingIds: 0,
        invalidEmbeddingReferences: 0,
      },
    });
    expect(JSON.parse(fs.readFileSync(path.join(outputDir, 'parity-manifest.json'), 'utf8'))).toEqual(manifest);
    expect(JSON.parse(fs.readFileSync(path.join(outputDir, 'related.json'), 'utf8'))).toEqual({
      abcdefghijk: [{ vid: 'lmnopqrstuv', shared_recommenders: 2 }],
    });
    expect(JSON.parse(fs.readFileSync(path.join(outputDir, 'parity-taxonomy.json'), 'utf8'))).toMatchObject({
      version: 'fixture-v1',
    });
    expect(JSON.parse(fs.readFileSync(path.join(outputDir, 'search-index.json'), 'utf8'))).toMatchObject({
      version: 1,
      topics: [
        expect.objectContaining({ id: 'topic-one', areaName: 'Area one' }),
        expect.objectContaining({ id: 'topic-two', areaName: 'Area one' }),
      ],
    });
    expect(JSON.parse(fs.readFileSync(path.join(outputDir, 'embedding-ids.json'), 'utf8'))).toEqual([
      'abcdefghijk',
      'lmnopqrstuv',
    ]);
    expect(fs.readFileSync(path.join(outputDir, 'embeddings.npy'))).toEqual(fs.readFileSync(path.join(inputDir, 'embeddings.npy')));
    expect(JSON.parse(fs.readFileSync(path.join(outputDir, 'comments/index.json'), 'utf8'))).toEqual({
      version: 1,
      total: 2,
      buckets: { '61': 1, '6c': 1 },
    });
    expect(JSON.parse(fs.readFileSync(path.join(outputDir, 'comments/61.json'), 'utf8'))).toEqual({
      abcdefghijk: [
        expect.objectContaining({
          hnCommentId: 1,
          storyTitle: 'First story',
          stance: 'rec',
          text: 'A detailed recommendation.',
        }),
      ],
    });
  });

  test('reports the file and line for malformed JSONL', async () => {
    const { inputDir, outputDir } = makeWorkspace();
    writeValidExport(inputDir);
    fs.appendFileSync(path.join(inputDir, 'videos.jsonl'), '{broken json}\n');

    await expect(importHackertubeExport(inputDir, outputDir)).rejects.toThrow('videos.jsonl:3');
    expect(fs.existsSync(outputDir)).toBe(false);
  });

  test('rejects duplicate video ids without publishing partial output', async () => {
    const { inputDir, outputDir } = makeWorkspace();
    writeValidExport(inputDir);
    writeJsonl(path.join(inputDir, 'videos.jsonl'), [
      { vid: 'abcdefghijk', categories: [{ id: 'topic-one' }] },
      { vid: 'abcdefghijk', categories: [{ id: 'topic-one' }] },
    ]);

    await expect(importHackertubeExport(inputDir, outputDir)).rejects.toThrow('重复视频 ID');
    expect(fs.existsSync(outputDir)).toBe(false);
  });

  test.each([
    ['mention', (inputDir: string) => writeJsonl(path.join(inputDir, 'mentions.jsonl'), [{ hn_comment_id: 3, vid: 'missing-id', month: '2024-01' }])],
    ['related', (inputDir: string) => writeJsonl(path.join(inputDir, 'related.jsonl'), [{ vid: 'abcdefghijk', related: [{ vid: 'missing-id', shared_recommenders: 1 }] }])],
    ['category', (inputDir: string) => writeJsonl(path.join(inputDir, 'videos.jsonl'), [{ vid: 'abcdefghijk', categories: [{ id: 'missing-topic' }] }])],
    ['embedding', (inputDir: string) => fs.writeFileSync(path.join(inputDir, 'embedding_ids.json'), JSON.stringify(['abcdefghijk', 'missing-id']))],
  ])('rejects an invalid %s reference', async (_kind, corrupt) => {
    const { inputDir, outputDir } = makeWorkspace();
    writeValidExport(inputDir);
    corrupt(inputDir);

    await expect(importHackertubeExport(inputDir, outputDir)).rejects.toThrow('无效引用');
    expect(fs.existsSync(outputDir)).toBe(false);
  });
});
