import { useEffect, useMemo, useState } from 'react';
import { useLocation } from 'react-router-dom';
import { VideoGrid } from '../components/VideoGrid';
import { useCatalog } from '../lib/CatalogContext';
import { mergeSemanticResults, searchVideos } from '../lib/search';
import { createSearchIndex } from '../lib/searchIndex';
import { searchByMeaning, type SemanticHit } from '../lib/semanticSearch';

export function SearchPage() {
  const { search } = useLocation();
  const query = new URLSearchParams(search).get('q') ?? '';
  const catalog = useCatalog();
  const [semanticHits, setSemanticHits] = useState<SemanticHit[]>([]);
  const [semanticStatus, setSemanticStatus] = useState('');
  const lexicalResults = useMemo(
    () => searchVideos(catalog.videos, query, createSearchIndex(catalog.areas)),
    [catalog.areas, catalog.videos, query],
  );

  useEffect(() => {
    let active = true;
    setSemanticHits([]);
    if (!query.trim() || import.meta.env.MODE === 'test') {
      setSemanticStatus('');
      return () => { active = false; };
    }
    setSemanticStatus('正在启动语义搜索…');
    searchByMeaning(query, (message) => {
      if (active) setSemanticStatus(message);
    }).then((hits) => {
      if (!active) return;
      setSemanticHits(hits);
      setSemanticStatus('语义搜索已完成');
    }).catch(() => {
      if (!active) return;
      setSemanticStatus('语义模型暂时无法加载，已保留关键词搜索结果');
    });
    return () => { active = false; };
  }, [query]);

  const results = mergeSemanticResults(catalog.videos, lexicalResults, semanticHits).slice(0, 100);
  const videos = results.map((result) => result.video);
  const reasons = Object.fromEntries(results.map((result) => [result.video.vid, result.reason]));
  return (
    <>
      <header className="page-heading"><h1>Search results</h1><p>“{query}” · {videos.length} results</p>{semanticStatus && <p className="semantic-status" aria-live="polite">{semanticStatus}</p>}</header>
      <VideoGrid videos={videos} reasons={reasons} empty="没找到匹配的标题或话题。" />
    </>
  );
}
