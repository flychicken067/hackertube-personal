import { useLocation } from 'react-router-dom';
import { VideoGrid } from '../components/VideoGrid';
import { useCatalog } from '../lib/CatalogContext';
import { searchVideos } from '../lib/search';
import { createSearchIndex } from '../lib/searchIndex';

export function SearchPage() {
  const { search } = useLocation();
  const query = new URLSearchParams(search).get('q') ?? '';
  const catalog = useCatalog();
  const results = searchVideos(catalog.videos, query, createSearchIndex(catalog.areas)).slice(0, 100);
  const videos = results.map((result) => result.video);
  const reasons = Object.fromEntries(results.map((result) => [result.video.vid, result.reason]));
  return (
    <>
      <header className="page-heading"><h1>Search results</h1><p>“{query}” · {videos.length} results</p></header>
      <VideoGrid videos={videos} reasons={reasons} empty="没找到匹配的标题或话题。" />
    </>
  );
}
