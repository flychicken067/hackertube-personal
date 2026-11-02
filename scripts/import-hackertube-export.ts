import fs from 'node:fs';
import path from 'node:path';
import readline from 'node:readline';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { commentBucket } from '../src/lib/comments';
import { createSearchIndex } from '../src/lib/searchIndex';
import { parseFloat16Npy } from '../src/lib/semanticSearch';
import type { HnComment } from '../src/lib/types';

type VideoRow = {
  vid: string;
  categories?: Array<{ id: string }>;
};

type MentionRow = {
  hn_comment_id: number;
  hn_url?: string;
  vid: string;
  author?: string;
  month?: string;
  story_title?: string;
  stance?: string;
  why?: string;
  quote?: string;
  text?: string;
};

type RelatedEntry = {
  vid: string;
  shared_recommenders: number;
};

type RelatedRow = {
  vid: string;
  related: RelatedEntry[];
};

type Taxonomy = {
  version: string | number;
  areas: Array<{
    id: string;
    name: string;
    categories: Array<{ id: string; name: string; description: string }>;
  }>;
};

export type ParityManifest = {
  version: 1;
  source: 'HackerTube public export';
  exportVersion: string;
  generated: string;
  counts: {
    videos: number;
    mentions: number;
    relatedSources: number;
    relatedEdges: number;
    embeddingIds: number;
    areas: number;
    topics: number;
  };
  yearRange: { first: number | null; last: number | null };
  validation: {
    duplicateVideoIds: number;
    invalidMentionReferences: number;
    invalidRelatedReferences: number;
    invalidCategoryReferences: number;
    duplicateEmbeddingIds: number;
    invalidEmbeddingReferences: number;
    missingEmbeddingIds: number;
  };
};

async function readJsonl<T>(filename: string): Promise<T[]> {
  const rows: T[] = [];
  const stream = fs.createReadStream(filename, { encoding: 'utf8' });
  const lines = readline.createInterface({ input: stream, crlfDelay: Infinity });
  let lineNumber = 0;

  try {
    for await (const line of lines) {
      lineNumber += 1;
      if (!line.trim()) continue;
      try {
        rows.push(JSON.parse(line) as T);
      } catch (error) {
        const message = error instanceof Error ? error.message : String(error);
        throw new Error(`${path.basename(filename)}:${lineNumber} JSON 无法解析：${message}`);
      }
    }
  } finally {
    lines.close();
  }

  return rows;
}

function duplicateCount(values: string[]) {
  return values.length - new Set(values).size;
}

function writeJson(filename: string, value: unknown) {
  fs.writeFileSync(filename, `${JSON.stringify(value)}\n`);
}

function buildCommentBuckets(mentions: MentionRow[]) {
  const buckets = new Map<string, Record<string, HnComment[]>>();
  for (const mention of mentions) {
    const bucketName = commentBucket(mention.vid);
    const bucket = buckets.get(bucketName) ?? {};
    const comments = bucket[mention.vid] ?? [];
    comments.push({
      hnCommentId: mention.hn_comment_id,
      hnUrl: mention.hn_url ?? `https://news.ycombinator.com/item?id=${mention.hn_comment_id}`,
      vid: mention.vid,
      author: mention.author ?? '',
      month: mention.month ?? '',
      storyTitle: mention.story_title ?? '',
      stance: mention.stance ?? 'reference',
      why: mention.why ?? '',
      quote: mention.quote ?? '',
      text: mention.text ?? '',
    });
    bucket[mention.vid] = comments;
    buckets.set(bucketName, bucket);
  }
  return buckets;
}

export async function importHackertubeExport(inputDir: string, outputDir: string): Promise<ParityManifest> {
  const videos = await readJsonl<VideoRow>(path.join(inputDir, 'videos.jsonl'));
  const mentions = await readJsonl<MentionRow>(path.join(inputDir, 'mentions.jsonl'));
  const related = await readJsonl<RelatedRow>(path.join(inputDir, 'related.jsonl'));
  const taxonomy = JSON.parse(fs.readFileSync(path.join(inputDir, 'taxonomy.json'), 'utf8')) as Taxonomy;
  const embeddingIds = JSON.parse(fs.readFileSync(path.join(inputDir, 'embedding_ids.json'), 'utf8')) as string[];
  const embeddingsFilename = path.join(inputDir, 'embeddings.npy');

  if (!Array.isArray(taxonomy.areas) || !Array.isArray(embeddingIds)) {
    throw new Error('公开导出结构不正确');
  }

  const videoIds = videos.map((video) => video.vid);
  const knownVideoIds = new Set(videoIds);
  const knownTopicIds = new Set(taxonomy.areas.flatMap((area) => area.categories.map((category) => category.id)));
  const duplicateVideoIds = duplicateCount(videoIds);
  const invalidMentionReferences = mentions.filter((mention) => !knownVideoIds.has(mention.vid)).length;
  const invalidRelatedReferences = related.reduce(
    (count, row) =>
      count +
      Number(!knownVideoIds.has(row.vid)) +
      (Array.isArray(row.related) ? row.related.filter((entry) => !knownVideoIds.has(entry.vid)).length : 1),
    0,
  );
  const invalidCategoryReferences = videos.reduce(
    (count, video) =>
      count +
      (Array.isArray(video.categories)
        ? video.categories.filter((category) => !knownTopicIds.has(category.id)).length
        : 1),
    0,
  );
  const duplicateEmbeddingIds = duplicateCount(embeddingIds);
  const invalidEmbeddingReferences = embeddingIds.filter((vid) => !knownVideoIds.has(vid)).length;
  const embeddedVideoIds = new Set(embeddingIds);
  const missingEmbeddingIds = videoIds.filter((vid) => !embeddedVideoIds.has(vid)).length;
  const embeddingsBuffer = fs.readFileSync(embeddingsFilename);
  const parsedEmbeddings = parseFloat16Npy(
    embeddingsBuffer.buffer.slice(embeddingsBuffer.byteOffset, embeddingsBuffer.byteOffset + embeddingsBuffer.byteLength),
  );
  if (parsedEmbeddings.rows !== embeddingIds.length || parsedEmbeddings.dimensions !== 384) {
    throw new Error(`语义向量矩阵尺寸不正确：${parsedEmbeddings.rows} × ${parsedEmbeddings.dimensions}`);
  }

  if (duplicateVideoIds) {
    throw new Error(`公开导出包含 ${duplicateVideoIds} 个重复视频 ID`);
  }

  const invalidReferences =
    invalidMentionReferences +
    invalidRelatedReferences +
    invalidCategoryReferences +
    invalidEmbeddingReferences +
    missingEmbeddingIds;
  if (invalidReferences || duplicateEmbeddingIds) {
    throw new Error(
      `公开导出包含无效引用：评论 ${invalidMentionReferences}，关联 ${invalidRelatedReferences}，话题 ${invalidCategoryReferences}，向量 ${invalidEmbeddingReferences}，缺失向量 ${missingEmbeddingIds}，重复向量 ${duplicateEmbeddingIds}`,
    );
  }

  const years = mentions
    .map((mention) => Number(mention.month?.slice(0, 4)))
    .filter((year) => Number.isInteger(year) && year >= 1900 && year <= 3000);
  const relatedEdges = related.reduce(
    (count, row) => count + (Array.isArray(row.related) ? row.related.length : 0),
    0,
  );
  const manifest: ParityManifest = {
    version: 1,
    source: 'HackerTube public export',
    exportVersion: String(taxonomy.version),
    generated: new Date().toISOString(),
    counts: {
      videos: videos.length,
      mentions: mentions.length,
      relatedSources: related.length,
      relatedEdges,
      embeddingIds: embeddingIds.length,
      areas: taxonomy.areas.length,
      topics: knownTopicIds.size,
    },
    yearRange: {
      first: years.length ? Math.min(...years) : null,
      last: years.length ? Math.max(...years) : null,
    },
    validation: {
      duplicateVideoIds,
      invalidMentionReferences,
      invalidRelatedReferences,
      invalidCategoryReferences,
      duplicateEmbeddingIds,
      invalidEmbeddingReferences,
      missingEmbeddingIds,
    },
  };

  fs.mkdirSync(outputDir, { recursive: true });
  writeJson(path.join(outputDir, 'parity-manifest.json'), manifest);
  writeJson(
    path.join(outputDir, 'related.json'),
    Object.fromEntries(related.map((row) => [row.vid, row.related])),
  );
  writeJson(path.join(outputDir, 'parity-taxonomy.json'), taxonomy);
  writeJson(path.join(outputDir, 'search-index.json'), createSearchIndex(taxonomy.areas));
  writeJson(path.join(outputDir, 'embedding-ids.json'), embeddingIds);
  fs.copyFileSync(embeddingsFilename, path.join(outputDir, 'embeddings.npy'));
  const commentBuckets = buildCommentBuckets(mentions);
  const commentsDir = path.join(outputDir, 'comments');
  fs.rmSync(commentsDir, { recursive: true, force: true });
  fs.mkdirSync(commentsDir, { recursive: true });
  const bucketCounts: Record<string, number> = {};
  for (const [bucketName, bucket] of [...commentBuckets.entries()].sort(([left], [right]) => left.localeCompare(right))) {
    const count = Object.values(bucket).reduce((sum, comments) => sum + comments.length, 0);
    bucketCounts[bucketName] = count;
    writeJson(path.join(commentsDir, `${bucketName}.json`), bucket);
  }
  writeJson(path.join(commentsDir, 'index.json'), {
    version: 1,
    total: Object.values(bucketCounts).reduce((sum, count) => sum + count, 0),
    buckets: bucketCounts,
  });

  return manifest;
}

async function run() {
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const inputDir = path.resolve(
    process.argv[2] ?? process.env.HACKERTUBE_SOURCE_DIR ?? path.join(projectRoot, 'data/hackertube-export/hackertube-data'),
  );
  const outputDir = path.resolve(process.argv[3] ?? path.join(projectRoot, 'public/data'));
  const manifest = await importHackertubeExport(inputDir, outputDir);
  console.log(
    `HackerTube export ok: ${manifest.counts.videos} videos, ${manifest.counts.mentions} mentions, ${manifest.counts.relatedSources} related rows, ${manifest.counts.topics} topics`,
  );
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  run().catch((error) => {
    console.error(error instanceof Error ? error.message : error);
    process.exitCode = 1;
  });
}
