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

export function importLibraryState(_raw: string): LibraryState {
  let value: unknown;
  try {
    value = JSON.parse(_raw);
  } catch {
    throw new Error('无法识别这个文件');
  }
  if (!isLibraryState(value)) throw new Error('无法识别这个文件');
  return value;
}

function isLibraryState(value: unknown): value is LibraryState {
  if (!value || typeof value !== 'object') return false;
  const state = value as Partial<LibraryState>;
  return (
    state.version === 1 &&
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
