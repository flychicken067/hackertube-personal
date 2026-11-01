import { useCatalog } from '../lib/CatalogContext';
import { useLibrary } from '../lib/LibraryContext';
import { rankVideos } from '../lib/recommendation';
import { VideoGrid } from '../components/VideoGrid';

export function HomePage() {
  const catalog = useCatalog();
  const { state } = useLibrary();
  const day = new Date().toISOString().slice(0, 10);
  const videos = rankVideos(catalog.videos, state, day).slice(0, 60);
  return (
    <>
      <section className="page-intro home-intro">
        <div>
          <p className="eyebrow">FOR YOU / {day}</p>
          <h1>为你放映</h1>
        </div>
        <p>从 Hacker News 多年反复推荐的视频中，按你的点赞、观看和话题偏好重新排列。没有账号，记录只留在这台设备。</p>
      </section>
      <VideoGrid videos={videos} />
    </>
  );
}
