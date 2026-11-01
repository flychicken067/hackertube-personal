import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { mergeKarpathySource } from '../src/lib/dataSources';
import type { Catalog, ChannelSource } from '../src/lib/types';

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
  const report = {
    videos: catalog.videos.length,
    topics: topicIds.size,
    missingCoreFields,
    duplicateIds,
    unknownTopicReferences,
  };
  if (missingCoreFields) throw new Error(`有 ${missingCoreFields} 条视频缺少核心字段`);
  if (duplicateIds) throw new Error(`有 ${duplicateIds} 个重复视频 ID`);
  if (unknownTopicReferences) throw new Error(`有 ${unknownTopicReferences} 个未知话题引用`);
  return report;
}

export function validateChannelSource(source: ChannelSource) {
  if (source.source?.id !== 'karpathy' || !Array.isArray(source.videos)) throw new Error('Karpathy 数据结构不正确');
  const ids = source.videos.map((video) => video.vid);
  const missingCoreFields = source.videos.filter((video) => !video.vid || !video.title || !video.duration).length;
  const duplicateIds = ids.length - new Set(ids).size;
  if (source.videos.length !== 17) throw new Error(`Karpathy 数据应有 17 条，实际 ${source.videos.length} 条`);
  if (missingCoreFields) throw new Error(`Karpathy 数据有 ${missingCoreFields} 条缺少核心字段`);
  if (duplicateIds) throw new Error(`Karpathy 数据有 ${duplicateIds} 个重复视频 ID`);
  return { videos: source.videos.length, duplicateIds, missingCoreFields };
}

function run() {
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const filename = path.join(projectRoot, 'public/data/catalog.json');
  const karpathyFilename = path.join(projectRoot, 'public/data/karpathy.json');
  const catalog = JSON.parse(fs.readFileSync(filename, 'utf8')) as Catalog;
  const karpathy = JSON.parse(fs.readFileSync(karpathyFilename, 'utf8')) as ChannelSource;
  const report = validateCatalog(catalog);
  const karpathyReport = validateChannelSource(karpathy);
  const merged = mergeKarpathySource(catalog, karpathy);
  const mergedIds = new Set(merged.videos.map((video) => video.vid));
  if (report.videos === 0) throw new Error('数据文件没有视频');
  if (mergedIds.size !== merged.videos.length) throw new Error('合并后的数据仍有重复视频 ID');
  console.log(`data ok: ${report.videos} HN videos + ${karpathyReport.videos} Karpathy videos = ${merged.videos.length} unique videos, ${report.topics} topics, 0 broken references`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  run();
}
