import { isHiddenGem } from './browse';
import { dailyJitter, rankVideos } from './recommendation';
import type { RelatedIndex } from './related';
import type { SimilarityIndex } from './semanticSearch';
import type { LibraryState, Video } from './types';

export type FeedLane =
  | 'liked-similarity'
  | 'co-recommenders'
  | 'karpathy'
  | 'classics'
  | 'hidden-gems'
  | 'recent'
  | 'unexplored'
  | 'discovery';

export interface FeedItem {
  video: Video;
  lane: FeedLane;
  reason: string;
}

function relatedLane(
  seeds: string[],
  lane: FeedLane,
  reason: (shared: number) => string,
  related: RelatedIndex,
  videosById: Map<string, Video>,
  excluded: Set<string>,
): FeedItem[] {
  const scores = new Map<string, number>();
  for (const seed of seeds) {
    for (const entry of related[seed] ?? []) {
      if (excluded.has(entry.vid) || !videosById.has(entry.vid)) continue;
      scores.set(entry.vid, (scores.get(entry.vid) ?? 0) + entry.shared_recommenders);
    }
  }
  return [...scores.entries()]
    .sort(([leftVid, left], [rightVid, right]) => right - left || leftVid.localeCompare(rightVid))
    .map(([vid, shared]) => ({ video: videosById.get(vid)!, lane, reason: reason(shared) }));
}

function similarityLane(
  seeds: string[],
  similarity: SimilarityIndex,
  videosById: Map<string, Video>,
  excluded: Set<string>,
): FeedItem[] {
  const scores = new Map<string, number>();
  for (const seed of seeds) {
    for (const entry of similarity[seed] ?? []) {
      if (excluded.has(entry.vid) || !videosById.has(entry.vid)) continue;
      scores.set(entry.vid, Math.max(scores.get(entry.vid) ?? 0, entry.similarity));
    }
  }
  return [...scores.entries()]
    .sort(([leftVid, left], [rightVid, right]) => right - left || leftVid.localeCompare(rightVid))
    .map(([vid, score]) => ({
      video: videosById.get(vid)!,
      lane: 'liked-similarity' as const,
      reason: `与你喜欢的视频内容相似 · ${Math.round(score * 100)}%`,
    }));
}

function sortWithDailyVariety(videos: Video[], day: string) {
  return [...videos].sort((left, right) =>
    right.score - left.score ||
    dailyJitter(right.vid, day) - dailyJitter(left.vid, day) ||
    left.vid.localeCompare(right.vid),
  );
}

export function buildHomeFeed(
  videos: Video[],
  state: LibraryState,
  related: RelatedIndex,
  day: string,
  limit = 60,
  similarity: SimilarityIndex = {},
): FeedItem[] {
  const ranked = rankVideos(videos, state, day).filter((video) => !state.dislikes.includes(video.vid));
  const videosById = new Map(ranked.map((video) => [video.vid, video]));
  const excludedLiked = new Set([...state.likes, ...state.dislikes]);
  const excludedHistory = new Set(state.history.map((entry) => entry.vid));
  const exploredTopics = new Set(
    [...state.likes, ...state.dislikes, ...state.history.map((entry) => entry.vid)]
      .flatMap((vid) => videos.find((video) => video.vid === vid)?.categories ?? [])
      .map((category) => category.id),
  );
  const currentYear = Number(day.slice(0, 4));

  const lanes: FeedItem[][] = [
    Object.keys(similarity).length
      ? similarityLane(
          state.likes,
          similarity,
          videosById,
          new Set([...excludedLiked, ...excludedHistory]),
        )
      : relatedLane(
          state.likes,
          'liked-similarity',
          (shared) => `与你喜欢的视频相似 · ${shared} 位共同推荐者`,
          related,
          videosById,
          new Set([...excludedLiked, ...excludedHistory]),
        ),
    relatedLane(
      state.history.slice(0, 20).map((entry) => entry.vid),
      'co-recommenders',
      (shared) => `看过这些的 HN 用户也推荐 · ${shared} 位共同推荐者`,
      related,
      videosById,
      new Set([...excludedLiked, ...excludedHistory]),
    ),
    ranked
      .filter((video) => video.source === 'karpathy')
      .sort((left, right) => (left.sourceOrder ?? 9999) - (right.sourceOrder ?? 9999))
      .map((video) => ({ video, lane: 'karpathy' as const, reason: 'Karpathy 精选' })),
    ranked
      .filter((video) => video.source !== 'karpathy' && video.hn.recommenders >= 8 && video.score >= 8)
      .map((video) => ({ video, lane: 'classics' as const, reason: 'Hacker News 长期经典' })),
    sortWithDailyVariety(ranked.filter((video) => video.source !== 'karpathy' && isHiddenGem(video)), day)
      .map((video) => ({ video, lane: 'hidden-gems' as const, reason: '少有人看，但被 HN 反复推荐' })),
    ranked
      .filter((video) => video.source !== 'karpathy' && video.hn.lastYear >= currentYear)
      .sort((left, right) => right.hn.lastYear - left.hn.lastYear || right.score - left.score)
      .map((video) => ({ video, lane: 'recent' as const, reason: '最近在 HN 被推荐' })),
    sortWithDailyVariety(
      ranked.filter((video) =>
        video.source !== 'karpathy' &&
        video.categories.some((category) => !exploredTopics.has(category.id)),
      ),
      day,
    ).map((video) => ({ video, lane: 'unexplored' as const, reason: '探索一个还没看过的话题' })),
    ranked.map((video) => ({ video, lane: 'discovery' as const, reason: '为你精选' })),
  ];

  const result: FeedItem[] = [];
  const seen = new Set<string>();
  let cursor = 0;
  while (result.length < limit && lanes.some((lane) => cursor < lane.length)) {
    for (const lane of lanes) {
      const candidate = lane[cursor];
      if (!candidate || seen.has(candidate.video.vid)) continue;
      seen.add(candidate.video.vid);
      result.push(candidate);
      if (result.length >= limit) break;
    }
    cursor += 1;
  }
  return result;
}
