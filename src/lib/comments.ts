import type { HnComment } from './types';

type CommentBucket = Record<string, HnComment[]>;
type FetchResponse = {
  ok: boolean;
  status?: number;
  json?: () => Promise<unknown>;
};
type Fetcher = (url: string) => Promise<FetchResponse>;

export function commentBucket(vid: string) {
  if (!vid) throw new Error('视频 ID 不能为空');
  return vid.charCodeAt(0).toString(16).padStart(2, '0');
}

function defaultBaseUrl() {
  if (typeof document !== 'undefined') return document.baseURI;
  return 'http://localhost/';
}

export async function loadVideoComments(
  vid: string,
  fetcher: Fetcher = fetch,
  baseUrl = defaultBaseUrl(),
): Promise<HnComment[]> {
  const filename = new URL(`data/comments/${commentBucket(vid)}.json`, baseUrl).href;
  const response = await fetcher(filename);
  if (!response.ok) {
    if (response.status === 404) return [];
    throw new Error(`HN 评论加载失败（${response.status ?? '网络错误'}）`);
  }
  if (!response.json) throw new Error('HN 评论响应无法读取');
  const payload = (await response.json()) as CommentBucket;
  if (!payload || typeof payload !== 'object') throw new Error('HN 评论数据结构不正确');
  const comments = payload[vid];
  return Array.isArray(comments) ? comments : [];
}
