import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import { importLibraryState, toggleId, updateHistory, updateReaction } from './storage';
import type { LibraryState } from './types';

const STORAGE_KEY = 'hackertube-personal:v2';
const LEGACY_STORAGE_KEY = 'hackertube-personal:v1';
const EMPTY_STATE: LibraryState = {
  version: 2,
  likes: [],
  dislikes: [],
  watchLater: [],
  history: [],
  topicPreferences: {},
  useVideoFrames: true,
};

interface LibraryValue {
  state: LibraryState;
  selectedId: string | null;
  setSelectedId: (vid: string | null) => void;
  toggleLike: (vid: string) => void;
  toggleDislike: (vid: string) => void;
  toggleLater: (vid: string) => void;
  markWatched: (vid: string) => void;
  setTopicPreference: (topic: string, value: number) => void;
  setUseVideoFrames: (value: boolean) => void;
  clear: () => void;
  importState: (raw: string) => void;
}

const LibraryContext = createContext<LibraryValue | null>(null);

function readState(): LibraryState {
  const raw = window.localStorage.getItem(STORAGE_KEY) ?? window.localStorage.getItem(LEGACY_STORAGE_KEY);
  if (!raw) return EMPTY_STATE;
  try {
    return importLibraryState(raw);
  } catch {
    return EMPTY_STATE;
  }
}

export function LibraryProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<LibraryState>(readState);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const commit = (next: LibraryState) => {
    setState(next);
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    window.localStorage.removeItem(LEGACY_STORAGE_KEY);
  };

  const value = useMemo<LibraryValue>(
    () => ({
      state,
      selectedId,
      setSelectedId,
      toggleLike: (vid) => commit(updateReaction(state, vid, state.likes.includes(vid) ? 'clear' : 'like')),
      toggleDislike: (vid) => commit(updateReaction(state, vid, state.dislikes.includes(vid) ? 'clear' : 'dislike')),
      toggleLater: (vid) => commit({ ...state, watchLater: toggleId(state.watchLater, vid) }),
      markWatched: (vid) =>
        commit({ ...state, history: updateHistory(state.history, vid, new Date().toISOString()) }),
      setTopicPreference: (topic, preference) => {
        const topicPreferences = { ...state.topicPreferences };
        if (preference === 0) delete topicPreferences[topic];
        else topicPreferences[topic] = preference;
        commit({ ...state, topicPreferences });
      },
      setUseVideoFrames: (useVideoFrames) => commit({ ...state, useVideoFrames }),
      clear: () => commit(EMPTY_STATE),
      importState: (raw) => commit(importLibraryState(raw)),
    }),
    [selectedId, state],
  );

  return <LibraryContext.Provider value={value}>{children}</LibraryContext.Provider>;
}

export function useLibrary(): LibraryValue {
  const value = useContext(LibraryContext);
  if (!value) throw new Error('useLibrary must be used inside LibraryProvider');
  return value;
}

export { LEGACY_STORAGE_KEY, STORAGE_KEY };
