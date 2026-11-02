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
  source?: 'hackernews' | 'karpathy';
  viewsLabel?: string;
  publishedLabel?: string;
  publishedAt?: string | null;
  viewCount?: number | null;
  likeCount?: number | null;
  sourceLabel?: string;
  startSeconds?: number;
  sourceOrder?: number;
}

export interface ChannelSourceVideo {
  vid: string;
  title: string;
  channel?: string;
  duration: string | null;
  viewsLabel?: string;
  publishedLabel: string;
  sourceLabel?: string;
  startSeconds?: number;
}

export interface ChannelSource {
  version: number;
  generated: string;
  source: {
    id: 'karpathy';
    name: string;
    channelId: string;
    url: string;
  };
  videos: ChannelSourceVideo[];
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

export type HnCommentStance = 'strong_rec' | 'rec' | 'reference' | 'joke' | 'critical' | string;

export interface HnComment {
  hnCommentId: number;
  hnUrl: string;
  vid: string;
  author: string;
  month: string;
  storyTitle: string;
  stance: HnCommentStance;
  why: string;
  quote: string;
  text: string;
}

export interface HistoryEntry {
  vid: string;
  watchedAt: string;
  count: number;
}

export interface LibraryState {
  version: 2;
  likes: string[];
  dislikes: string[];
  watchLater: string[];
  history: HistoryEntry[];
  topicPreferences: Record<string, number>;
  useVideoFrames: boolean;
}
