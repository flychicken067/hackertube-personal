import { VideoGrid } from '../components/VideoGrid';
import { useCatalog } from '../lib/CatalogContext';

function durationSeconds(duration: string | null) {
  if (!duration) return 0;
  return duration.split(':').reduce((total, part) => total * 60 + Number(part), 0);
}

export function LongsPage() {
  const videos = useCatalog().videos.filter((video) => durationSeconds(video.duration) >= 20 * 60).sort((a, b) => b.score - a.score).slice(0, 120);
  return <><header className="page-heading"><h1>Longs</h1><p>Long-form videos and deep dives, 20 minutes or longer.</p></header><VideoGrid videos={videos} empty="No long videos found." /></>;
}
