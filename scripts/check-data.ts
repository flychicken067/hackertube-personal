import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Catalog } from '../src/lib/types';

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

function run() {
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const filename = path.join(projectRoot, 'public/data/catalog.json');
  const catalog = JSON.parse(fs.readFileSync(filename, 'utf8')) as Catalog;
  const report = validateCatalog(catalog);
  if (report.videos === 0) throw new Error('数据文件没有视频');
  console.log(`data ok: ${report.videos} videos, ${report.topics} topics, 0 broken references`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  run();
}
