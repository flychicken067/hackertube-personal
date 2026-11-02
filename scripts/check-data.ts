import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mergeKarpathySource } from '../src/lib/dataSources';
import { parseFloat16Npy } from '../src/lib/semanticSearch';
import type { Catalog, ChannelSource } from '../src/lib/types';
import type { ParityManifest } from './import-hackertube-export';

export function validateCatalog(catalog: Catalog) {
  if (!catalog || !Array.isArray(catalog.videos) || !Array.isArray(catalog.areas)) {
    throw new Error('数据文件结构不正确');
  }
  const topicIds = new Set(catalog.areas.flatMap((area) => area.categories.map((category) => category.id)));
  const ids = catalog.videos.map((video) => video.vid);
  const missingCoreFields = catalog.videos.filter(
    (video) => !video.vid || !video.title || !video.channel || !video.url || !video.categories.length,
  ).length;
  const duplicateIds = ids.length - new Set(ids).size;
  const unknownTopicReferences = catalog.videos.reduce(
    (count, video) => count + video.categories.filter((category) => !topicIds.has(category.id)).length,
    0,
  );
  const invalidDurations = catalog.videos.filter(
    (video) => video.duration !== null && !/^\d+:[0-5]\d(?::[0-5]\d)?$/.test(video.duration),
  ).length;
  const report = {
    videos: catalog.videos.length,
    topics: topicIds.size,
    missingCoreFields,
    duplicateIds,
    unknownTopicReferences,
    invalidDurations,
  };
  if (missingCoreFields) throw new Error(`有 ${missingCoreFields} 条视频缺少核心字段`);
  if (duplicateIds) throw new Error(`有 ${duplicateIds} 个重复视频 ID`);
  if (unknownTopicReferences) throw new Error(`有 ${unknownTopicReferences} 个未知话题引用`);
  if (invalidDurations) throw new Error(`有 ${invalidDurations} 条视频的时长格式无法用于筛选`);
  return report;
}

export function validateChannelSource(source: ChannelSource) {
  if (source.source?.id !== 'karpathy' || !Array.isArray(source.videos)) throw new Error('Karpathy 数据结构不正确');
  const ids = source.videos.map((video) => video.vid);
  const missingCoreFields = source.videos.filter(
    (video) => !video.vid || !video.title || (video.duration !== null && !video.duration),
  ).length;
  const duplicateIds = ids.length - new Set(ids).size;
  if (source.videos.length === 0) throw new Error('Karpathy 数据没有视频');
  if (missingCoreFields) throw new Error(`Karpathy 数据有 ${missingCoreFields} 条缺少核心字段`);
  if (duplicateIds) throw new Error(`Karpathy 数据有 ${duplicateIds} 个重复视频 ID`);
  return { videos: source.videos.length, duplicateIds, missingCoreFields };
}

export function validateParityManifest(
  manifest: ParityManifest,
  catalogReport: { videos: number; topics: number },
) {
  if (
    !manifest ||
    manifest.version !== 1 ||
    manifest.source !== 'HackerTube public export' ||
    !manifest.counts ||
    !manifest.validation
  ) {
    throw new Error('公开导出清单结构不正确');
  }
  const brokenReferences = Object.values(manifest.validation).reduce((sum, value) => sum + value, 0);
  if (brokenReferences) throw new Error(`公开导出仍有 ${brokenReferences} 个数据问题`);
  if (
    manifest.counts.videos !== catalogReport.videos ||
    manifest.counts.topics !== catalogReport.topics ||
    manifest.counts.embeddingIds !== manifest.counts.videos
  ) {
    throw new Error('公开导出清单与目录不一致');
  }
  return {
    videos: manifest.counts.videos,
    mentions: manifest.counts.mentions,
    topics: manifest.counts.topics,
    brokenReferences,
  };
}

function run() {
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const filename = path.join(projectRoot, 'public/data/catalog.json');
  const karpathyFilename = path.join(projectRoot, 'public/data/karpathy.json');
  const parityManifestFilename = path.join(projectRoot, 'public/data/parity-manifest.json');
  const embeddingIdsFilename = path.join(projectRoot, 'public/data/embedding-ids.json');
  const embeddingsFilename = path.join(projectRoot, 'public/data/embeddings.npy');
  const catalog = JSON.parse(fs.readFileSync(filename, 'utf8')) as Catalog;
  const karpathy = JSON.parse(fs.readFileSync(karpathyFilename, 'utf8')) as ChannelSource;
  const parityManifest = JSON.parse(fs.readFileSync(parityManifestFilename, 'utf8')) as ParityManifest;
  const embeddingIds = JSON.parse(fs.readFileSync(embeddingIdsFilename, 'utf8')) as unknown[];
  const embeddingsBuffer = fs.readFileSync(embeddingsFilename);
  const embeddings = parseFloat16Npy(
    embeddingsBuffer.buffer.slice(embeddingsBuffer.byteOffset, embeddingsBuffer.byteOffset + embeddingsBuffer.byteLength),
  );
  const report = validateCatalog(catalog);
  const karpathyReport = validateChannelSource(karpathy);
  const parityReport = validateParityManifest(parityManifest, report);
  const merged = mergeKarpathySource(catalog, karpathy);
  const mergedIds = new Set(merged.videos.map((video) => video.vid));
  if (report.videos === 0) throw new Error('数据文件没有视频');
  if (mergedIds.size !== merged.videos.length) throw new Error('合并后的数据仍有重复视频 ID');
  if (embeddings.rows !== embeddingIds.length || embeddings.dimensions !== 384) throw new Error('语义向量矩阵与视频编号不一致');
  console.log(`data ok: ${report.videos} HN videos + ${karpathyReport.videos} Karpathy videos = ${merged.videos.length} unique videos, ${report.topics} topics, ${parityReport.mentions} HN comments, 0 broken references`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  run();
}
