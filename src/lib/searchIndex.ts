import type { TopicArea } from './types';

export interface SearchTopic {
  id: string;
  name: string;
  areaName: string;
  description: string;
  terms: string[];
}

export interface SearchTopicIndex {
  version: 1;
  topics: SearchTopic[];
}

function stem(token: string) {
  if (token.endsWith('ies') && token.length > 4) return `${token.slice(0, -3)}y`;
  if (token.endsWith('ing') && token.length > 5) return token.slice(0, -3);
  if (token.endsWith('s') && !token.endsWith('ss') && token.length > 3) return token.slice(0, -1);
  return token;
}

export function normalizeSearchText(value: string) {
  return value
    .toLocaleLowerCase()
    .normalize('NFKC')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function tokenizeSearch(value: string) {
  return normalizeSearchText(value).split(' ').filter(Boolean).map(stem);
}

export function createSearchIndex(areas: TopicArea[]): SearchTopicIndex {
  return {
    version: 1,
    topics: areas.flatMap((area) =>
      area.categories.map((category) => {
        const description = category.description ?? '';
        return {
          id: category.id,
          name: category.name,
          areaName: area.name,
          description,
          terms: [...new Set(tokenizeSearch(`${category.name} ${area.name} ${description}`))],
        };
      }),
    ),
  };
}

export function matchSearchTopics(index: SearchTopicIndex, query: string) {
  const queryTerms = tokenizeSearch(query);
  if (!queryTerms.length) return [];
  return index.topics.filter((topic) => queryTerms.every((term) => topic.terms.includes(term)));
}
