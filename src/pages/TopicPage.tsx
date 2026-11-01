import { useParams } from 'react-router-dom';
import { VideoGrid } from '../components/VideoGrid';
import { useCatalog } from '../lib/CatalogContext';

export function TopicPage() {
  const { id = '' } = useParams();
  const catalog = useCatalog();
  const topic = catalog.areas.flatMap((area) => area.categories).find((category) => category.id === id);
  const videos = catalog.videos
    .filter((video) => video.categories.some((category) => category.id === id))
    .sort((a, b) => b.score - a.score);
  return <><section className="page-intro compact"><div><p className="eyebrow">TOPIC</p><h1>{topic?.name ?? '话题'}</h1></div><p>{topic?.description ?? `${videos.length} 个相关视频。`}</p></section><VideoGrid videos={videos} /></>;
}
