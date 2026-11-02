import { useEffect, useMemo, useState } from 'react';
import { Icon } from '../components/Icon';
import { VideoGrid } from '../components/VideoGrid';
import { useCatalog } from '../lib/CatalogContext';
import { useLibrary } from '../lib/LibraryContext';
import { buildHomeFeed } from '../lib/feed';
import { loadRelatedIndex, type RelatedIndex } from '../lib/related';
import { buildSimilarityIndex, loadEmbeddingIndex, type SimilarityIndex } from '../lib/semanticSearch';

type SourceFilter = 'all' | 'hackernews' | 'karpathy';

export function HomePage() {
  const catalog = useCatalog();
  const { state } = useLibrary();
  const [showFilters, setShowFilters] = useState(false);
  const [source, setSource] = useState<SourceFilter>('all');
  const [related, setRelated] = useState<RelatedIndex>({});
  const [similarity, setSimilarity] = useState<SimilarityIndex>({});
  const day = new Date().toISOString().slice(0, 10);
  const similaritySeeds = useMemo(
    () => [...new Set([...state.likes, ...state.history.slice(0, 20).map((entry) => entry.vid)])],
    [state.history, state.likes],
  );
  useEffect(() => {
    let active = true;
    loadRelatedIndex().then((index) => {
      if (active) setRelated(index);
    }).catch(() => undefined);
    return () => { active = false; };
  }, []);
  useEffect(() => {
    let active = true;
    if (!similaritySeeds.length) {
      setSimilarity({});
      return () => { active = false; };
    }
    loadEmbeddingIndex().then((index) => {
      if (active) setSimilarity(buildSimilarityIndex(similaritySeeds, index));
    }).catch(() => {
      if (active) setSimilarity({});
    });
    return () => { active = false; };
  }, [similaritySeeds]);
  const feed = useMemo(
    () => buildHomeFeed(catalog.videos, state, related, day, 60, similarity),
    [catalog.videos, day, related, similarity, state],
  );
  const visible = feed.filter((item) => source === 'all' || (source === 'karpathy' ? item.video.source === 'karpathy' : item.video.source !== 'karpathy')).slice(0, 60);
  const videos = visible.map((item) => item.video);
  const reasons = Object.fromEntries(visible.map((item) => [item.video.vid, item.reason]));
  return (
    <>
      <h1 className="sr-only">Home</h1>
      <div className="feed-toolbar">
        <button className={showFilters ? 'is-active' : ''} type="button" aria-expanded={showFilters} onClick={() => setShowFilters((value) => !value)}><Icon name="filter" size={18} />Filters</button>
        {showFilters && <div className="filter-pills" aria-label="数据源筛选">
          {([['all', 'All'], ['hackernews', 'Hacker News'], ['karpathy', 'Karpathy']] as const).map(([value, label]) => <button type="button" key={value} className={source === value ? 'is-selected' : ''} onClick={() => setSource(value)}>{label}</button>)}
        </div>}
      </div>
      <VideoGrid videos={videos} reasons={reasons} />
    </>
  );
}
