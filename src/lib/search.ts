import type { Video } from './types';

export function searchVideos(_videos: Video[], _query: string): Video[] {
  const terms = normalize(_query).split(' ').filter(Boolean);
  if (!terms.length) return [];

  return _videos.filter((video) => {
    const haystack = normalize(
      [
        video.title,
        video.channel,
        video.primaryTopic,
        ...video.tags,
        ...video.categories.flatMap((category) => [category.name, category.areaName]),
      ].join(' '),
    );
    return terms.every((term) => haystack.includes(term));
  });
}

function normalize(value: string): string {
  return value.toLocaleLowerCase().normalize('NFKC').replace(/\s+/g, ' ').trim();
}
