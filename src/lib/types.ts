export interface VideoCategory {
  id: string;
  name: string;
  area: string;
  areaName: string;
}

export interface VideoQuote {
  text: string;
  hnCommentId: number;
  year: string;
}

export interface Video {
  vid: string;
  url: string;
  title: string;
  channel: string;
  summary: string;
  whyHn: string;
  contentType: string;
  level: string;
  shelfLife: 'evergreen' | 'dated' | 'news' | string;
  primaryTopic: string;
  tags: string[];
  categories: VideoCategory[];
  quote: VideoQuote | null;
  hn: {
    mentions: number;
    recommenders: number;
    recMonths: number;
    strongRecs: number;
    stances: Record<string, number>;
    firstYear: number;
    lastYear: number;
  };
  score: number;
  duration: string | null;
  available?: boolean | null;
  embeddable?: boolean | null;
}

export interface TopicCategory {
  id: string;
  name: string;
  description: string;
}

export interface TopicArea {
  id: string;
  name: string;
  categories: TopicCategory[];
}

export interface Catalog {
  version: number;
  generated: string;
  areas: TopicArea[];
  videos: Video[];
}

export interface HistoryEntry {
  vid: string;
  watchedAt: string;
  count: number;
}

export interface LibraryState {
  version: 1;
  likes: string[];
  watchLater: string[];
  history: HistoryEntry[];
  topicPreferences: Record<string, number>;
}
