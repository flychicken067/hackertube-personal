import type { LibraryState, Video } from './types';

export function rankVideos(videos: Video[], _state: LibraryState, _day: string): Video[] {
  const seen = new Set(_state.history.map((entry) => entry.vid));
  const deduped = new Map<string, Video>();

  for (const video of videos) {
    if ((video.hn.recommenders <= 0 && video.source !== 'karpathy') || video.shelfLife === 'news') continue;
    const key = video.title.toLocaleLowerCase().normalize('NFKC').replace(/\s+/g, ' ').trim();
    const current = deduped.get(key);
    if (!current || video.score > current.score) deduped.set(key, video);
  }

  return [...deduped.values()]
    .map((video) => ({
      video,
      rank:
        Math.log2(1 + video.hn.recommenders) * 4 +
        video.score * 0.35 +
        (video.source === 'karpathy' ? 8 : 0) +
        video.categories.reduce(
          (total, category) => total + (_state.topicPreferences[category.id] ?? 0) * 5,
          0,
        ) +
        (seen.has(video.vid) ? -20 : 1.5) +
        (_state.likes.includes(video.vid) ? 2 : 0) +
        dailyJitter(video.vid, _day),
    }))
    .sort((a, b) => b.rank - a.rank || b.video.score - a.video.score || a.video.vid.localeCompare(b.video.vid))
    .map(({ video }) => video);
}

export function dailyJitter(vid: string, day: string): number {
  let hash = 2166136261;
  for (const char of `${day}:${vid}`) {
    hash ^= char.charCodeAt(0);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 1000) / 2500 - 0.2;
}
