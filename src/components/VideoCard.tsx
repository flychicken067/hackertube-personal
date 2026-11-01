import { Link } from 'react-router-dom';
import { useLibrary } from '../lib/LibraryContext';
import type { Video } from '../lib/types';
import { Thumbnail } from './Thumbnail';

export function VideoCard({ video }: { video: Video }) {
  const { state, selectedId, setSelectedId, toggleLike, toggleLater } = useLibrary();
  const liked = state.likes.includes(video.vid);
  const later = state.watchLater.includes(video.vid);

  return (
    <article
      className={`video-card${selectedId === video.vid ? ' is-selected' : ''}`}
      data-video-card
      data-video-id={video.vid}
      tabIndex={0}
      onFocus={() => setSelectedId(video.vid)}
      onMouseEnter={() => setSelectedId(video.vid)}
    >
      <Link className="thumb-link" to={`/watch/${video.vid}`} aria-label={`播放 ${video.title}`}>
        <Thumbnail className="thumbnail" vid={video.vid} title="" />
        <span className="duration">{video.duration ?? '时长未知'}</span>
      </Link>
      <div className="card-body">
        <div className="card-kicker">
          <span>{video.primaryTopic}</span>
          <span>{video.hn.recommenders} 人推荐</span>
        </div>
        <h2>
          <Link data-open-video to={`/watch/${video.vid}`}>
            {video.title}
          </Link>
        </h2>
        <p className="channel">{video.channel}</p>
        <p className="why">{video.whyHn}</p>
        <div className="card-footer">
          <Link className="topic-link" to={`/topic/${video.categories[0]?.id ?? ''}`}>
            {video.categories[0]?.name ?? video.primaryTopic}
          </Link>
          <div className="card-actions">
            <button
              type="button"
              className={liked ? 'is-active' : ''}
              aria-pressed={liked}
              aria-label={`${liked ? '取消点赞' : '点赞'} ${video.title}`}
              onClick={() => toggleLike(video.vid)}
            >
              {liked ? '已赞' : '点赞'}
            </button>
            <button
              type="button"
              className={later ? 'is-active' : ''}
              aria-pressed={later}
              aria-label={`${later ? '移出稍后看' : '稍后看'} ${video.title}`}
              onClick={() => toggleLater(video.vid)}
            >
              {later ? '已收藏' : '稍后看'}
            </button>
          </div>
        </div>
      </div>
    </article>
  );
}
