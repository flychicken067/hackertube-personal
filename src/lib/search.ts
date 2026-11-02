import { matchSearchTopics, normalizeSearchText, tokenizeSearch, type SearchTopicIndex } from './searchIndex';
import type { Video } from './types';

export interface SearchResult {
  video: Video;
  score: number;
  reason: string;
}

type SearchField = {
  reason: string;
  weight: number;
  terms: Set<string>;
};

export function searchVideos(videos: Video[], query: string, index?: SearchTopicIndex): SearchResult[] {
  const terms = tokenizeSearch(query);
  if (!terms.length) return [];
  const normalizedQuery = normalizeSearchText(query);
  const matchingTopics = index ? matchSearchTopics(index, query) : [];
  const matchingTopicsById = new Map(matchingTopics.map((topic) => [topic.id, topic]));

  return videos
    .map((video): SearchResult | null => {
      const fields: SearchField[] = [
        makeField(video.title, 12, '标题匹配'),
        makeField(video.channel, 6, '频道匹配'),
        makeField(video.primaryTopic, 9, '主题匹配'),
        makeField(video.tags.join(' '), 8, '标签匹配'),
        makeField(video.categories.flatMap((category) => [category.name, category.areaName]).join(' '), 8, '话题匹配'),
        makeField(video.summary, 3, '内容简介匹配'),
        makeField(video.whyHn, 3, 'HN 推荐理由匹配'),
      ];
      const strongestForTerms = terms.map((term) =>
        fields
          .filter((field) => field.terms.has(term))
          .sort((left, right) => right.weight - left.weight)[0],
      );
      const directMatch = strongestForTerms.every(Boolean);
      const topic = video.categories.map((category) => matchingTopicsById.get(category.id)).find(Boolean);
      if (!directMatch && !topic) return null;

      let score = directMatch
        ? strongestForTerms.reduce((sum, field) => sum + (field?.weight ?? 0), 0)
        : 0;
      const titleField = fields[0];
      const titleMatch = terms.every((term) => titleField.terms.has(term));
      if (normalizeSearchText(video.title).includes(normalizedQuery)) score += 12;
      if (topic) score += terms.length * 6;

      let reason = '相关内容匹配';
      if (titleMatch) reason = '标题匹配';
      else if (topic) reason = `话题匹配：${topic.name}`;
      else {
        reason = strongestForTerms
          .filter((field): field is SearchField => Boolean(field))
          .sort((left, right) => right.weight - left.weight)[0]?.reason ?? reason;
      }
      return { video, score, reason };
    })
    .filter((result): result is SearchResult => result !== null)
    .sort((left, right) =>
      right.score - left.score ||
      right.video.score - left.video.score ||
      left.video.vid.localeCompare(right.video.vid),
    );
}

function makeField(text: string, weight: number, reason: string): SearchField {
  return { reason, weight, terms: new Set(tokenizeSearch(text)) };
}
