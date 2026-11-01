import { VideoGrid } from '../components/VideoGrid';
import { useCatalog } from '../lib/CatalogContext';

export function KarpathyPage() {
  const videos = useCatalog().videos
    .filter((video) => video.source === 'karpathy')
    .sort((left, right) => (left.sourceOrder ?? Number.MAX_SAFE_INTEGER) - (right.sourceOrder ?? Number.MAX_SAFE_INTEGER));
  return (
    <>
      <header className="channel-heading">
        <div className="channel-avatar">AK</div>
        <div><h1>Andrej Karpathy</h1><p>{videos.length} videos · Official uploads + featured talks & podcasts</p></div>
        <a href="https://karpathy.ai/" target="_blank" rel="noreferrer">View sources</a>
      </header>
      <VideoGrid videos={videos} />
    </>
  );
}
