import { Link } from 'react-router-dom';
import { useLibrary } from '../lib/LibraryContext';
import type { Video } from '../lib/types';
import { Icon } from './Icon';
import { Thumbnail } from './Thumbnail';

export function VideoCard({ video }: { video: Video }) {
  const { state, selectedId, setSelectedId, toggleLike, toggleLater } = useLibrary();
  const liked = state.likes.includes(video.vid);
  const later = state.watchLater.includes(video.vid);
  const metadata = video.source === 'karpathy'
    ? [video.viewsLabel ? `${video.viewsLabel} views` : video.sourceLabel, video.publishedLabel].filter(Boolean).join(' · ')
    : `${video.hn.recommenders} HN recommendations${video.hn.lastYear ? ` · ${video.hn.lastYear}` : ''}`;

  return (
    <article className={`video-card${selectedId === video.vid ? ' is-selected' : ''}`} data-video-card data-video-id={video.vid} tabIndex={0} onFocus={() => setSelectedId(video.vid)} onMouseEnter={() => setSelectedId(video.vid)}>
      <div className="thumbnail-wrap">
        <Link className="thumb-link" to={`/watch/${video.vid}`} aria-label={`播放 ${video.title}`}><Thumbnail className="thumbnail" vid={video.vid} title="" />{video.duration && <span className="duration">{video.duration}</span>}</Link>
        <div className="quick-actions">
          <button type="button" className={liked ? 'is-active' : ''} aria-pressed={liked} aria-label={`${liked ? '取消点赞' : '点赞'} ${video.title}`} title="Like (L)" onClick={() => toggleLike(video.vid)}><Icon name="liked" size={18} /></button>
          <button type="button" className={later ? 'is-active' : ''} aria-pressed={later} aria-label={`${later ? '移出稍后看' : '稍后看'} ${video.title}`} title="Watch later (W)" onClick={() => toggleLater(video.vid)}><Icon name="later" size={18} /></button>
        </div>
      </div>
      <div className="card-body">
        <h2><Link data-open-video to={`/watch/${video.vid}`}>{video.title}</Link></h2>
        <p className="channel">{video.channel}</p>
        <p className="video-meta">{metadata}</p>
      </div>
    </article>
  );
}
