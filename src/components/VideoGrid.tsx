import type { Video } from '../lib/types';
import { VideoCard } from './VideoCard';

export function VideoGrid({ videos, empty = '这里还没有视频。', reasons = {} }: { videos: Video[]; empty?: string; reasons?: Record<string, string> }) {
  if (!videos.length) return <p className="empty-state">{empty}</p>;
  return <div className="video-grid">{videos.map((video) => <VideoCard key={video.vid} video={video} reason={reasons[video.vid]} />)}</div>;
}
