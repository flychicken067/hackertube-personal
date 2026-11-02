import type { Video } from './types';

const MODEL_ID = 'onnx-community/bge-small-en-v1.5-ONNX';
const DEFAULT_DIMENSIONS = 384;

export interface EmbeddingIndex {
  ids: string[];
  rowById: Map<string, number>;
  vectors: Float32Array;
  dimensions: number;
}

export interface SemanticHit {
  vid: string;
  similarity: number;
}

export type SimilarityIndex = Record<string, SemanticHit[]>;

type BinaryResponse = {
  ok: boolean;
  status?: number;
  arrayBuffer: () => Promise<ArrayBuffer>;
  json?: () => Promise<unknown>;
};

type Fetcher = (url: string) => Promise<BinaryResponse>;
type QueryExtractor = (
  text: string,
  options: { pooling: 'cls'; normalize: true },
) => Promise<{ data: ArrayLike<number> }>;

let defaultIndexPromise: Promise<EmbeddingIndex> | null = null;
let extractorPromise: Promise<QueryExtractor> | null = null;

export function parseFloat16Npy(buffer: ArrayBuffer): { vectors: Float32Array; rows: number; dimensions: number } {
  const bytes = new Uint8Array(buffer);
  if (bytes.length < 12 || bytes[0] !== 0x93 || new TextDecoder().decode(bytes.slice(1, 6)) !== 'NUMPY') {
    throw new Error('语义向量文件格式不正确');
  }

  const major = bytes[6];
  const view = new DataView(buffer);
  const headerStart = major === 1 ? 10 : 12;
  const headerLength = major === 1 ? view.getUint16(8, true) : view.getUint32(8, true);
  const header = new TextDecoder().decode(bytes.slice(headerStart, headerStart + headerLength));
  const shape = header.match(/'shape':\s*\(\s*(\d+)\s*,\s*(\d+)\s*\)/);
  const descriptor = header.match(/'descr':\s*'([^']+)'/);
  if (!shape || descriptor?.[1] !== '<f2') throw new Error('只支持二维 little-endian float16 向量');

  const rows = Number(shape[1]);
  const dimensions = Number(shape[2]);
  const count = rows * dimensions;
  const dataStart = headerStart + headerLength;
  if (dataStart + count * 2 > buffer.byteLength) throw new Error('语义向量文件不完整');

  const source = new Uint16Array(buffer, dataStart, count);
  const vectors = new Float32Array(count);
  for (let index = 0; index < count; index += 1) vectors[index] = float16ToNumber(source[index]);
  return { vectors, rows, dimensions };
}

export async function loadEmbeddingIndex(
  fetcher: Fetcher = fetch,
  baseUrl = typeof document === 'undefined' ? 'http://localhost/' : document.baseURI,
): Promise<EmbeddingIndex> {
  const isDefault = fetcher === fetch && baseUrl === (typeof document === 'undefined' ? 'http://localhost/' : document.baseURI);
  if (isDefault && defaultIndexPromise) return defaultIndexPromise;

  const load = async () => {
    const [vectorsResponse, idsResponse] = await Promise.all([
      fetcher(new URL('data/embeddings.npy', baseUrl).href),
      fetcher(new URL('data/embedding-ids.json', baseUrl).href),
    ]);
    if (!vectorsResponse.ok || !idsResponse.ok || !idsResponse.json) {
      throw new Error(`语义向量加载失败（${vectorsResponse.status ?? idsResponse.status ?? '网络错误'}）`);
    }
    const [{ vectors, rows, dimensions }, rawIds] = await Promise.all([
      vectorsResponse.arrayBuffer().then(parseFloat16Npy),
      idsResponse.json(),
    ]);
    if (!Array.isArray(rawIds) || rawIds.some((id) => typeof id !== 'string') || rawIds.length !== rows) {
      throw new Error('语义向量与视频编号不一致');
    }
    const ids = rawIds as string[];
    return { ids, rowById: new Map(ids.map((id, row) => [id, row])), vectors, dimensions };
  };

  const promise = load();
  if (isDefault) {
    defaultIndexPromise = promise.catch((error) => {
      defaultIndexPromise = null;
      throw error;
    });
    return defaultIndexPromise;
  }
  return promise;
}

export async function searchByMeaning(
  query: string,
  onStatus?: (message: string) => void,
  limit = 120,
): Promise<SemanticHit[]> {
  if (!query.trim()) return [];
  onStatus?.('正在加载语义向量…');
  const indexPromise = loadEmbeddingIndex();
  const extractor = await loadExtractor(onStatus);
  onStatus?.('正在理解搜索内容…');
  const output = await extractor(query, { pooling: 'cls', normalize: true });
  const queryVector = Float32Array.from(output.data);
  if (queryVector.length !== DEFAULT_DIMENSIONS) throw new Error('搜索模型返回了意外的向量长度');
  const index = await indexPromise;
  onStatus?.('正在查找语义相近的视频…');
  return rankVector(index, queryVector, limit);
}

export function findSimilarVideos(
  video: Video,
  index: EmbeddingIndex,
  videos: Video[],
  limit = 12,
): Array<{ video: Video; similarity: number }> {
  const row = index.rowById.get(video.vid);
  if (row === undefined) return [];
  const start = row * index.dimensions;
  const queryVector = index.vectors.subarray(start, start + index.dimensions);
  const videosById = new Map(videos.map((item) => [item.vid, item]));
  return rankVector(index, queryVector, limit + 1, video.vid)
    .map((hit) => ({ video: videosById.get(hit.vid), similarity: hit.similarity }))
    .filter((item): item is { video: Video; similarity: number } => Boolean(item.video))
    .slice(0, limit);
}

export function buildSimilarityIndex(
  seedIds: string[],
  index: EmbeddingIndex,
  limit = 20,
): SimilarityIndex {
  return Object.fromEntries(
    [...new Set(seedIds)].flatMap((vid) => {
      const row = index.rowById.get(vid);
      if (row === undefined) return [];
      const offset = row * index.dimensions;
      const vector = index.vectors.subarray(offset, offset + index.dimensions);
      return [[vid, rankVector(index, vector, limit, vid)] as const];
    }),
  );
}

export function rankVector(
  index: EmbeddingIndex,
  queryVector: ArrayLike<number>,
  limit: number,
  excludedVid?: string,
): SemanticHit[] {
  if (queryVector.length !== index.dimensions) throw new Error('查询向量长度不正确');
  const hits: SemanticHit[] = [];
  for (let row = 0; row < index.ids.length; row += 1) {
    const vid = index.ids[row];
    if (vid === excludedVid) continue;
    const offset = row * index.dimensions;
    let similarity = 0;
    for (let column = 0; column < index.dimensions; column += 1) {
      similarity += index.vectors[offset + column] * queryVector[column];
    }
    hits.push({ vid, similarity });
  }
  return hits
    .sort((left, right) => right.similarity - left.similarity || left.vid.localeCompare(right.vid))
    .slice(0, limit);
}

async function loadExtractor(onStatus?: (message: string) => void): Promise<QueryExtractor> {
  if (!extractorPromise) {
    onStatus?.('首次语义搜索需下载约 60 MB 本地模型…');
    extractorPromise = import('@huggingface/transformers')
      .then(async ({ pipeline }) => {
        const extractor = await pipeline('feature-extraction', MODEL_ID, { dtype: 'q8' });
        return extractor as unknown as QueryExtractor;
      })
      .catch((error) => {
        extractorPromise = null;
        throw error;
      });
  }
  return extractorPromise;
}

function float16ToNumber(value: number): number {
  const sign = value & 0x8000 ? -1 : 1;
  const exponent = (value >> 10) & 0x1f;
  const fraction = value & 0x03ff;
  if (exponent === 0) return sign * 2 ** -14 * (fraction / 1024);
  if (exponent === 0x1f) return fraction ? Number.NaN : sign * Number.POSITIVE_INFINITY;
  return sign * 2 ** (exponent - 15) * (1 + fraction / 1024);
}
