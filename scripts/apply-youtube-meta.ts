import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Catalog, Video } from '../src/lib/types';

export interface YoutubeMetadataRow {
  vid: string;
  item: {
    id?: string;
    snippet?: { publishedAt?: string };
    contentDetails?: { duration?: string };
    statistics?: { viewCount?: string; likeCount?: string };
    status?: { embeddable?: boolean };
  } | null;
}

export type ParsedYoutubeMetadata = Pick<
  Video,
  'duration' | 'available' | 'embeddable' | 'publishedAt' | 'viewCount' | 'likeCount'
>;

export function formatIsoDuration(value: string) {
  const match = value.match(/^P(?:(\d+)D)?(?:T(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?)?$/);
  if (!match) return value;
  const days = Number(match[1] ?? 0);
  const hours = days * 24 + Number(match[2] ?? 0);
  const minutes = Number(match[3] ?? 0);
  const seconds = Number(match[4] ?? 0);
  return hours
    ? `${hours}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
    : `${minutes}:${String(seconds).padStart(2, '0')}`;
}

function count(value: string | undefined) {
  if (value === undefined) return null;
  const parsed = Number(value);
  return Number.isSafeInteger(parsed) && parsed >= 0 ? parsed : null;
}

export function parseYoutubeMetadata(row: YoutubeMetadataRow): ParsedYoutubeMetadata {
  const item = row.item;
  if (!item) {
    return {
      duration: null,
      available: false,
      embeddable: null,
      publishedAt: null,
      viewCount: null,
      likeCount: null,
    };
  }
  return {
    duration: item.contentDetails?.duration ? formatIsoDuration(item.contentDetails.duration) : null,
    available: true,
    embeddable: typeof item.status?.embeddable === 'boolean' ? item.status.embeddable : null,
    publishedAt: item.snippet?.publishedAt ?? null,
    viewCount: count(item.statistics?.viewCount),
    likeCount: count(item.statistics?.likeCount),
  };
}

export function youtubeMetadataMap(rows: YoutubeMetadataRow[]) {
  return new Map(rows.map((row) => [row.vid, parseYoutubeMetadata(row)]));
}

export function applyYoutubeMetadata(catalog: Catalog, rows: YoutubeMetadataRow[]): Catalog {
  const metadata = youtubeMetadataMap(rows);
  return {
    ...catalog,
    videos: catalog.videos.map((video) => {
      const meta = metadata.get(video.vid);
      return meta ? { ...video, ...meta } : video;
    }),
  };
}

function readRows(filename: string) {
  if (!fs.existsSync(filename)) return [];
  return fs.readFileSync(filename, 'utf8').split('\n').filter(Boolean).map((line) => JSON.parse(line) as YoutubeMetadataRow);
}

function run() {
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const catalogFile = path.resolve(process.argv[2] ?? path.join(projectRoot, 'public/data/catalog.json'));
  const metadataFile = path.resolve(process.argv[3] ?? path.join(projectRoot, 'data/youtube-meta.jsonl'));
  const outputFile = path.resolve(process.argv[4] ?? catalogFile);
  const catalog = JSON.parse(fs.readFileSync(catalogFile, 'utf8')) as Catalog;
  const rows = readRows(metadataFile);
  const updated = applyYoutubeMetadata(catalog, rows);
  fs.writeFileSync(outputFile, JSON.stringify(updated));
  console.log(`YouTube metadata applied: ${rows.length}/${catalog.videos.length} records -> ${outputFile}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  run();
}
