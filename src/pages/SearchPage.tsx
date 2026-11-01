import { useLocation } from 'react-router-dom';
import { VideoGrid } from '../components/VideoGrid';
import { useCatalog } from '../lib/CatalogContext';
import { searchVideos } from '../lib/search';

export function SearchPage() {
  const { search } = useLocation();
  const query = new URLSearchParams(search).get('q') ?? '';
  const videos = searchVideos(useCatalog().videos, query).slice(0, 100);
  return (
    <>
      <section className="page-intro compact"><div><p className="eyebrow">SEARCH</p><h1>搜索结果</h1></div><p>“{query}”，找到 {videos.length} 条结果。</p></section>
      <VideoGrid videos={videos} empty="没找到匹配的标题或话题。" />
    </>
  );
}
