import { useState } from 'react';
import { Icon } from '../components/Icon';
import { VideoGrid } from '../components/VideoGrid';
import { useCatalog } from '../lib/CatalogContext';
import { useLibrary } from '../lib/LibraryContext';
import { rankVideos } from '../lib/recommendation';

type SourceFilter = 'all' | 'hackernews' | 'karpathy';

export function HomePage() {
  const catalog = useCatalog();
  const { state } = useLibrary();
  const [showFilters, setShowFilters] = useState(false);
  const [source, setSource] = useState<SourceFilter>('all');
  const day = new Date().toISOString().slice(0, 10);
  const ranked = rankVideos(catalog.videos, state, day);
  const videos = ranked.filter((video) => source === 'all' || (source === 'karpathy' ? video.source === 'karpathy' : video.source !== 'karpathy')).slice(0, 60);
  return (
    <>
      <h1 className="sr-only">Home</h1>
      <div className="feed-toolbar">
        <button className={showFilters ? 'is-active' : ''} type="button" aria-expanded={showFilters} onClick={() => setShowFilters((value) => !value)}><Icon name="filter" size={18} />Filters</button>
        {showFilters && <div className="filter-pills" aria-label="数据源筛选">
          {([['all', 'All'], ['hackernews', 'Hacker News'], ['karpathy', 'Karpathy']] as const).map(([value, label]) => <button type="button" key={value} className={source === value ? 'is-selected' : ''} onClick={() => setSource(value)}>{label}</button>)}
        </div>}
      </div>
      <VideoGrid videos={videos} />
    </>
  );
}
