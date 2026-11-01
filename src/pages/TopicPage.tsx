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
  return <><header className="page-heading"><h1>{topic?.name ?? 'Topic'}</h1><p>{topic?.description ?? `${videos.length} related videos.`}</p></header><VideoGrid videos={videos} /></>;
}
