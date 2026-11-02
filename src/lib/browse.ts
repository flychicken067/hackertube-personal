import type { Video } from './types';

export type UploadDateFilter = 'all' | 'past-year' | '2020s' | '2010s' | '2000s';
export type ContentTypeFilter = 'all' | 'talk' | 'lecture' | 'explainer' | 'tutorial' | 'documentary' | 'interview' | 'demo' | 'commentary' | 'comedy' | 'music';
export type DurationFilter = 'all' | 'under-4' | '4-20' | '20-60' | 'over-60';
export type BrowseSort = 'best' | 'recently-recommended' | 'upload-date' | 'oldest' | 'view-count' | 'like-ratio';

export interface BrowseFilters {
  uploadDate: UploadDateFilter;
  type: ContentTypeFilter;
  duration: DurationFilter;
  hiddenGems: boolean;
  evergreenOnly: boolean;
  sort: BrowseSort;
}

function publishedTimestamp(video: Video) {
  const timestamp = video.publishedAt ? Date.parse(video.publishedAt) : Number.NaN;
  return Number.isFinite(timestamp) ? timestamp : null;
}

function durationSeconds(duration: string | null) {
  if (!duration) return null;
  const parts = duration.split(':').map(Number);
  if (parts.some((part) => !Number.isFinite(part)) || parts.length < 2 || parts.length > 3) return null;
  return parts.reduce((total, part) => total * 60 + part, 0);
}

function matchesUploadDate(video: Video, filter: UploadDateFilter, now: Date) {
  if (filter === 'all') return true;
  const timestamp = publishedTimestamp(video);
  if (timestamp === null) return false;
  if (filter === 'past-year') return timestamp >= now.getTime() - 365 * 24 * 60 * 60 * 1000 && timestamp <= now.getTime();
  const year = new Date(timestamp).getUTCFullYear();
  if (filter === '2020s') return year >= 2020 && year <= 2029;
  if (filter === '2010s') return year >= 2010 && year <= 2019;
  return year >= 2000 && year <= 2009;
}

function matchesType(video: Video, filter: ContentTypeFilter) {
  if (filter === 'all') return true;
  if (filter === 'lecture') return video.contentType === 'lecture' || video.contentType === 'course';
  return video.contentType === filter;
}

function matchesDuration(video: Video, filter: DurationFilter) {
  if (filter === 'all') return true;
  const seconds = durationSeconds(video.duration);
  if (seconds === null) return false;
  if (filter === 'under-4') return seconds < 4 * 60;
  if (filter === '4-20') return seconds >= 4 * 60 && seconds < 20 * 60;
  if (filter === '20-60') return seconds >= 20 * 60 && seconds < 60 * 60;
  return seconds >= 60 * 60;
}

export function isHiddenGem(video: Video) {
  return video.hn.recommenders >= 3 && video.viewCount !== null && video.viewCount !== undefined && video.viewCount < 100_000;
}

function likeRatio(video: Video) {
  if (!video.viewCount || video.likeCount === null || video.likeCount === undefined) return -1;
  return video.likeCount / video.viewCount;
}

function compareOptionalNumbers(left: number | null, right: number | null, descending: boolean) {
  if (left === null && right === null) return 0;
  if (left === null) return 1;
  if (right === null) return -1;
  return descending ? right - left : left - right;
}

export function filterAndSortVideos(videos: Video[], filters: BrowseFilters, now = new Date()): Video[] {
  return videos
    .filter((video) => matchesUploadDate(video, filters.uploadDate, now))
    .filter((video) => matchesType(video, filters.type))
    .filter((video) => matchesDuration(video, filters.duration))
    .filter((video) => !filters.hiddenGems || isHiddenGem(video))
    .filter((video) => !filters.evergreenOnly || video.shelfLife === 'evergreen')
    .sort((left, right) => {
      let difference = 0;
      if (filters.sort === 'best') difference = right.score - left.score;
      else if (filters.sort === 'recently-recommended') difference = right.hn.lastYear - left.hn.lastYear || right.score - left.score;
      else if (filters.sort === 'upload-date') difference = compareOptionalNumbers(publishedTimestamp(left), publishedTimestamp(right), true);
      else if (filters.sort === 'oldest') difference = compareOptionalNumbers(publishedTimestamp(left), publishedTimestamp(right), false);
      else if (filters.sort === 'view-count') difference = compareOptionalNumbers(left.viewCount ?? null, right.viewCount ?? null, true);
      else if (filters.sort === 'like-ratio') difference = likeRatio(right) - likeRatio(left);
      return difference || left.vid.localeCompare(right.vid);
    });
}
