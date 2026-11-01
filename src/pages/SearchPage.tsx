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
      <header className="page-heading"><h1>Search results</h1><p>“{query}” · {videos.length} results</p></header>
      <VideoGrid videos={videos} empty="没找到匹配的标题或话题。" />
    </>
  );
}
