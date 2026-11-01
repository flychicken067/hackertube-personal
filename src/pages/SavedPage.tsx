import { VideoGrid } from '../components/VideoGrid';
import { useCatalog } from '../lib/CatalogContext';
import { useLibrary } from '../lib/LibraryContext';

export function SavedPage({ type }: { type: 'liked' | 'history' | 'later' }) {
  const catalog = useCatalog();
  const { state } = useLibrary();
  const config = {
    liked: { title: '已点赞', ids: state.likes, empty: '你点赞的视频会出现在这里。' },
    later: { title: '稍后看', ids: state.watchLater, empty: '收藏几个想以后看的视频吧。' },
    history: { title: '观看历史', ids: state.history.map((entry) => entry.vid), empty: '打开过的视频会出现在这里。' },
  }[type];
  const byId = new Map(catalog.videos.map((video) => [video.vid, video]));
  const videos = config.ids.map((id) => byId.get(id)).filter((video) => video !== undefined);
  return <><section className="page-intro compact"><div><p className="eyebrow">YOUR LIBRARY</p><h1>{config.title}</h1></div><p>所有记录都只存在当前浏览器。</p></section><VideoGrid videos={videos} empty={config.empty} /></>;
}
