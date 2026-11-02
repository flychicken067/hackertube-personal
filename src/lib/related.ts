import type { Video } from './types';

export interface RelatedEntry {
  vid: string;
  shared_recommenders: number;
}

export type RelatedIndex = Record<string, RelatedEntry[]>;

export interface RelatedVideo {
  video: Video;
  sharedRecommenders: number;
}

type Fetcher = (url: string) => Promise<{ ok: boolean; status?: number; json: () => Promise<unknown> }>;

export function getRelatedVideos(
  vid: string,
  index: RelatedIndex,
  videos: Video[],
  limit = 20,
): RelatedVideo[] {
  const videosById = new Map(videos.map((video) => [video.vid, video]));
  const strongest = new Map<string, number>();
  for (const entry of index[vid] ?? []) {
    if (entry.vid === vid || !videosById.has(entry.vid)) continue;
    strongest.set(entry.vid, Math.max(strongest.get(entry.vid) ?? 0, entry.shared_recommenders));
  }
  return [...strongest.entries()]
    .map(([relatedVid, sharedRecommenders]) => ({ video: videosById.get(relatedVid)!, sharedRecommenders }))
    .sort((left, right) =>
      right.sharedRecommenders - left.sharedRecommenders ||
      right.video.score - left.video.score ||
      left.video.vid.localeCompare(right.video.vid),
    )
    .slice(0, limit);
}

export async function loadRelatedIndex(
  fetcher: Fetcher = fetch,
  baseUrl = typeof document === 'undefined' ? 'http://localhost/' : document.baseURI,
): Promise<RelatedIndex> {
  const response = await fetcher(new URL('data/related.json', baseUrl).href);
  if (!response.ok) throw new Error(`关联推荐加载失败（${response.status ?? '网络错误'}）`);
  const payload = await response.json();
  if (!payload || typeof payload !== 'object' || Array.isArray(payload)) throw new Error('关联推荐数据结构不正确');
  return payload as RelatedIndex;
}
