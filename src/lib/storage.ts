import type { HistoryEntry, LibraryState } from './types';

export function toggleId(ids: string[], _id: string): string[] {
  return ids.includes(_id) ? ids.filter((id) => id !== _id) : [...ids, _id];
}

export function updateHistory(history: HistoryEntry[], _vid: string, _watchedAt: string): HistoryEntry[] {
  const previous = history.find((entry) => entry.vid === _vid);
  return [
    { vid: _vid, watchedAt: _watchedAt, count: (previous?.count ?? 0) + 1 },
    ...history.filter((entry) => entry.vid !== _vid),
  ].slice(0, 1000);
}

export function updateReaction(
  state: LibraryState,
  vid: string,
  reaction: 'like' | 'dislike' | 'clear',
): LibraryState {
  return {
    ...state,
    likes: reaction === 'like' ? [...state.likes.filter((id) => id !== vid), vid] : state.likes.filter((id) => id !== vid),
    dislikes: reaction === 'dislike' ? [...state.dislikes.filter((id) => id !== vid), vid] : state.dislikes.filter((id) => id !== vid),
  };
}

export function exportLibraryState(state: LibraryState) {
  return JSON.stringify(state, null, 2);
}

export function importLibraryState(_raw: string): LibraryState {
  let value: unknown;
  try {
    value = JSON.parse(_raw);
  } catch {
    throw new Error('无法识别这个文件');
  }
  if (isV2LibraryState(value)) return value;
  if (isV1LibraryState(value)) {
    return {
      ...value,
      version: 2,
      dislikes: [],
      useVideoFrames: true,
    };
  }
  throw new Error('无法识别这个文件');
}

interface V1LibraryState {
  version: 1;
  likes: string[];
  watchLater: string[];
  history: HistoryEntry[];
  topicPreferences: Record<string, number>;
}

function hasValidBaseFields(value: unknown): value is Omit<V1LibraryState, 'version'> & { version: number } {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<LibraryState>;
  return (
    typeof state.version === 'number' &&
    Array.isArray(state.likes) &&
    state.likes.every((item) => typeof item === 'string') &&
    Array.isArray(state.watchLater) &&
    state.watchLater.every((item) => typeof item === 'string') &&
    Array.isArray(state.history) &&
    state.history.every(
      (item) =>
        item &&
        typeof item.vid === 'string' &&
        typeof item.watchedAt === 'string' &&
        typeof item.count === 'number',
    ) &&
    !!state.topicPreferences &&
    typeof state.topicPreferences === 'object' &&
    Object.values(state.topicPreferences).every((item) => typeof item === 'number')
  );
}

function isV1LibraryState(value: unknown): value is V1LibraryState {
  return hasValidBaseFields(value) && value.version === 1;
}

function isV2LibraryState(value: unknown): value is LibraryState {
  if (!hasValidBaseFields(value) || value.version !== 2) return false;
  const state = value as Partial<LibraryState>;
  return (
    Array.isArray(state.dislikes) &&
    state.dislikes.every((item) => typeof item === 'string') &&
    !state.likes?.some((id) => state.dislikes?.includes(id)) &&
    typeof state.useVideoFrames === 'boolean'
  );
}
