import { VideoGrid } from '../components/VideoGrid';
import { useCatalog } from '../lib/CatalogContext';
import { useLibrary } from '../lib/LibraryContext';

export function SavedPage({ type }: { type: 'liked' | 'history' | 'later' }) {
  const catalog = useCatalog();
  const { state } = useLibrary();
  const config = {
    liked: { title: 'Liked', ids: state.likes, empty: '你点赞的视频会出现在这里。' },
    later: { title: 'Watch later', ids: state.watchLater, empty: '收藏几个想以后看的视频吧。' },
    history: { title: 'History', ids: state.history.map((entry) => entry.vid), empty: '打开过的视频会出现在这里。' },
  }[type];
  const byId = new Map(catalog.videos.map((video) => [video.vid, video]));
  const videos = config.ids.map((id) => byId.get(id)).filter((video) => video !== undefined);
  return <><header className="page-heading"><h1>{config.title}</h1><p>Saved only in this browser.</p></header><VideoGrid videos={videos} empty={config.empty} /></>;
}
