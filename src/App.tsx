import { useEffect, useState } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';
import { Layout } from './components/Layout';
import { ShortcutHelp } from './components/ShortcutHelp';
import { CatalogProvider } from './lib/CatalogContext';
import { LibraryProvider, useLibrary } from './lib/LibraryContext';
import { mergeKarpathySource } from './lib/dataSources';
import type { Catalog, ChannelSource } from './lib/types';
import { CategoriesPage } from './pages/CategoriesPage';
import { HomePage } from './pages/HomePage';
import { KarpathyPage } from './pages/KarpathyPage';
import { LongsPage } from './pages/LongsPage';
import { PlaylistsPage } from './pages/PlaylistsPage';
import { SavedPage } from './pages/SavedPage';
import { SearchPage } from './pages/SearchPage';
import { SettingsPage } from './pages/SettingsPage';
import { TopicPage } from './pages/TopicPage';
import { VideoPage } from './pages/VideoPage';

export function App({ initialCatalog }: { initialCatalog?: Catalog }) {
  const [catalog, setCatalog] = useState<Catalog | null>(initialCatalog ?? null);
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialCatalog) return;
    Promise.all([
      fetch(new URL('data/catalog.json', document.baseURI)),
      fetch(new URL('data/karpathy.json', document.baseURI)),
    ])
      .then(async ([catalogResponse, karpathyResponse]) => {
        if (!catalogResponse.ok || !karpathyResponse.ok) throw new Error('数据文件不可用');
        const base = await catalogResponse.json() as Catalog;
        const karpathy = await karpathyResponse.json() as ChannelSource;
        return mergeKarpathySource(base, karpathy);
      })
      .then(setCatalog)
      .catch(() => setError('数据加载失败，请刷新页面重试。'));
  }, [initialCatalog]);

  if (error) return <main className="boot-state"><h1>无法打开放映室</h1><p>{error}</p></main>;
  if (!catalog) return <main className="boot-state"><p>正在整理放映清单…</p></main>;

  return (
    <CatalogProvider catalog={catalog}>
      <LibraryProvider>
        <HashRouter>
          <KeyboardShortcuts />
          <Routes>
            <Route element={<Layout />}>
              <Route index element={<HomePage />} />
              <Route path="karpathy" element={<KarpathyPage />} />
              <Route path="longs" element={<LongsPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="playlists" element={<PlaylistsPage />} />
              <Route path="search" element={<SearchPage />} />
              <Route path="topic/:id" element={<TopicPage />} />
              <Route path="watch/:vid" element={<VideoPage />} />
              <Route path="liked" element={<SavedPage type="liked" />} />
              <Route path="history" element={<SavedPage type="history" />} />
              <Route path="later" element={<SavedPage type="later" />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="*" element={<p className="empty-state">这个页面不存在。</p>} />
            </Route>
          </Routes>
        </HashRouter>
      </LibraryProvider>
    </CatalogProvider>
  );
}

function KeyboardShortcuts() {
  const [showHelp, setShowHelp] = useState(false);
  const { selectedId, setSelectedId, toggleLike, toggleLater } = useLibrary();

  useEffect(() => {
    const openHelp = () => setShowHelp(true);
    window.addEventListener('open-shortcuts', openHelp);
    return () => window.removeEventListener('open-shortcuts', openHelp);
  }, []);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      const target = event.target;
      const isTyping = target instanceof Element && !!target.closest('input, textarea, select, [contenteditable="true"]');
      if (event.key === 'Escape') { setShowHelp(false); return; }
      if (isTyping) return;

      if (event.key === '?') { event.preventDefault(); setShowHelp(true); return; }
      if (event.key === '/') {
        event.preventDefault();
        document.querySelector<HTMLInputElement>('#global-search')?.focus();
        return;
      }

      const cards = [...document.querySelectorAll<HTMLElement>('[data-video-card]')];
      const focused = (document.activeElement as HTMLElement | null)?.dataset.videoId;
      const activeId = focused ?? selectedId;
      if (event.key === 'j' || event.key === 'k') {
        event.preventDefault();
        if (!cards.length) return;
        const current = cards.findIndex((card) => card.dataset.videoId === activeId);
        const next = event.key === 'j'
          ? current < 0 ? 0 : Math.min(current + 1, cards.length - 1)
          : current < 0 ? cards.length - 1 : Math.max(current - 1, 0);
        const card = cards[next];
        setSelectedId(card.dataset.videoId ?? null);
        card.focus();
        card.scrollIntoView?.({ block: 'nearest', behavior: 'smooth' });
        return;
      }

      const vid = (document.activeElement as HTMLElement | null)?.dataset.videoId ?? selectedId;
      if (!vid) return;
      if (event.key === 'Enter') {
        const card = cards.find((item) => item.dataset.videoId === vid);
        card?.querySelector<HTMLAnchorElement>('[data-open-video]')?.click();
      } else if (event.key.toLocaleLowerCase() === 'l') {
        event.preventDefault();
        toggleLike(vid);
      }
    };
    const onKeyUp = (event: KeyboardEvent) => {
      const target = event.target;
      const isTyping = target instanceof Element && !!target.closest('input, textarea, select, [contenteditable="true"]');
      if (isTyping || event.key.toLocaleLowerCase() !== 'w') return;

      const vid = (document.activeElement as HTMLElement | null)?.dataset.videoId ?? selectedId;
      if (!vid) return;
      event.preventDefault();
      toggleLater(vid);
    };
    window.addEventListener('keydown', onKeyDown, true);
    window.addEventListener('keyup', onKeyUp, true);
    return () => {
      window.removeEventListener('keydown', onKeyDown, true);
      window.removeEventListener('keyup', onKeyUp, true);
    };
  }, [selectedId, setSelectedId, toggleLater, toggleLike]);

  return showHelp ? <ShortcutHelp onClose={() => setShowHelp(false)} /> : null;
}
