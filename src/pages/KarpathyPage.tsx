import { VideoGrid } from '../components/VideoGrid';
import { useCatalog } from '../lib/CatalogContext';

export function KarpathyPage() {
  const videos = useCatalog().videos.filter((video) => video.source === 'karpathy');
  return (
    <>
      <header className="channel-heading">
        <div className="channel-avatar">AK</div>
        <div><h1>Andrej Karpathy</h1><p>{videos.length} videos · Official YouTube channel</p></div>
        <a href="https://www.youtube.com/@AndrejKarpathy/videos" target="_blank" rel="noreferrer">View channel</a>
      </header>
      <VideoGrid videos={videos} />
    </>
  );
}
