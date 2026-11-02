import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Catalog, TopicArea, Video } from '../src/lib/types';
import { youtubeMetadataMap, type ParsedYoutubeMetadata, type YoutubeMetadataRow } from './apply-youtube-meta';

interface SourceVideo {
  vid: string;
  url: string;
  title: string;
  channel: string;
  summary: string;
  why_hn: string;
  content_type: string;
  level: string;
  shelf_life: string;
  primary_topic: string;
  tags: string[];
  categories: Array<{ id: string; name: string; area: string; area_name: string }>;
  quote: { text: string; hn_comment_id: number; year: string } | null;
  hn: {
    mentions: number;
    recommenders: number;
    rec_months: number;
    strong_recs: number;
    stances: Record<string, number>;
    first_year: number;
    last_year: number;
  };
  score: number;
}

type VideoMetadata = Partial<ParsedYoutubeMetadata>;

interface SourceTaxonomy {
  areas: TopicArea[];
}

export function mapVideo(source: SourceVideo, meta: VideoMetadata = {}): Video {
  return {
    vid: source.vid,
    url: source.url,
    title: source.title,
    channel: source.channel,
    summary: source.summary,
    whyHn: source.why_hn,
    contentType: source.content_type,
    level: source.level,
    shelfLife: source.shelf_life,
    primaryTopic: source.primary_topic,
    tags: source.tags,
    categories: source.categories.map((category) => ({
      id: category.id,
      name: category.name,
      area: category.area,
      areaName: category.area_name,
    })),
    quote: source.quote
      ? {
          text: source.quote.text,
          hnCommentId: source.quote.hn_comment_id,
          year: source.quote.year,
        }
      : null,
    hn: {
      mentions: source.hn.mentions,
      recommenders: source.hn.recommenders,
      recMonths: source.hn.rec_months,
      strongRecs: source.hn.strong_recs,
      stances: source.hn.stances,
      firstYear: source.hn.first_year,
      lastYear: source.hn.last_year,
    },
    score: source.score,
    duration: meta.duration ?? null,
    available: meta.available ?? null,
    embeddable: meta.embeddable ?? null,
    publishedAt: meta.publishedAt ?? null,
    viewCount: meta.viewCount ?? null,
    likeCount: meta.likeCount ?? null,
  };
}

export function buildCatalog(
  videos: SourceVideo[],
  taxonomy: SourceTaxonomy,
  metadata: Map<string, VideoMetadata>,
  generated = new Date().toISOString().slice(0, 10),
): Catalog {
  return {
    version: 1,
    generated,
    areas: taxonomy.areas,
    videos: videos.map((video) => mapVideo(video, metadata.get(video.vid))),
  };
}

function readJsonLines<T>(filename: string): T[] {
  return fs
    .readFileSync(filename, 'utf8')
    .split('\n')
    .filter(Boolean)
    .map((line) => JSON.parse(line) as T);
}

function readMetadata(filename: string): Map<string, VideoMetadata> {
  if (!fs.existsSync(filename)) return new Map();
  return youtubeMetadataMap(readJsonLines<YoutubeMetadataRow>(filename));
}

function run() {
  const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
  const sourceDir = process.env.HACKERTUBE_SOURCE_DIR
    ? path.resolve(process.env.HACKERTUBE_SOURCE_DIR)
    : path.resolve(projectRoot, 'data/hackertube-export/hackertube-data');
  const output = path.resolve(projectRoot, 'public/data/catalog.json');
  const dataGuide = fs.readFileSync(path.join(sourceDir, 'DATA.md'), 'utf8');
  const generated = dataGuide.match(/Exported (\d{4}-\d{2}-\d{2})/)?.[1] ?? new Date().toISOString().slice(0, 10);
  const videos = readJsonLines<SourceVideo>(path.join(sourceDir, 'videos.jsonl'));
  const taxonomy = JSON.parse(fs.readFileSync(path.join(sourceDir, 'taxonomy.json'), 'utf8')) as SourceTaxonomy;
  const projectMetadata = process.env.YOUTUBE_METADATA_FILE
    ? path.resolve(process.env.YOUTUBE_METADATA_FILE)
    : path.join(projectRoot, 'data/youtube-meta.jsonl');
  const metadataFile = fs.existsSync(projectMetadata) ? projectMetadata : path.join(sourceDir, 'youtube_meta.jsonl');
  const metadata = readMetadata(metadataFile);
  const catalog = buildCatalog(videos, taxonomy, metadata, generated);

  fs.mkdirSync(path.dirname(output), { recursive: true });
  fs.writeFileSync(output, JSON.stringify(catalog));
  console.log(`catalog: ${catalog.videos.length} videos -> ${output}`);
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  run();
}
