import { useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useCatalog } from '../lib/CatalogContext';
import { useLibrary } from '../lib/LibraryContext';

export function VideoPage() {
  const { vid = '' } = useParams();
  const video = useCatalog().videos.find((item) => item.vid === vid);
  const { state, markWatched, setSelectedId, toggleLike, toggleLater } = useLibrary();

  useEffect(() => {
    if (!video) return;
    setSelectedId(video.vid);
    markWatched(video.vid);
  }, [video?.vid]);

  if (!video) return <p className="empty-state">没找到这个视频。</p>;
  const unavailable = video.available === false || video.embeddable === false;
  return (
    <article className="watch-page">
      <div className="player-frame">
        {unavailable ? (
          <div className="player-unavailable"><strong>这个视频暂时无法在站内播放</strong><p>它可能已被删除、设为私密，或禁止嵌入。</p></div>
        ) : (
          <iframe
            title={video.title}
            src={`https://www.youtube-nocookie.com/embed/${video.vid}?rel=0${video.startSeconds ? `&start=${video.startSeconds}` : ''}`}
            allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        )}
      </div>
      <p className="embed-note">如果播放器没有响应，<a href={video.url} target="_blank" rel="noreferrer">去 YouTube 打开</a>。</p>
      <div className="watch-layout">
        <section>
          <p className="eyebrow">{video.contentType.toUpperCase()} / {video.level.toUpperCase()}</p>
          <h1>{video.title}</h1>
          <p className="watch-channel">{video.channel}</p>
          <div className="watch-actions">
            <button type="button" aria-pressed={state.likes.includes(video.vid)} onClick={() => toggleLike(video.vid)}>{state.likes.includes(video.vid) ? '已点赞' : '点赞'}</button>
            <button type="button" aria-pressed={state.watchLater.includes(video.vid)} onClick={() => toggleLater(video.vid)}>{state.watchLater.includes(video.vid) ? '已收藏' : '稍后看'}</button>
          </div>
          <h2>这段视频讲什么</h2>
          <p>{video.summary}</p>
          <h2>{video.source === 'karpathy' ? 'About this source' : 'HN 为什么推荐'}</h2>
          <p>{video.whyHn}</p>
          {video.quote && <blockquote>“{video.quote.text}”</blockquote>}
        </section>
        <aside className="video-facts">
          <dl>
            <div><dt>时长</dt><dd>{video.duration ?? '时长未知'}</dd></div>
            {video.source === 'karpathy' ? <>
              <div><dt>Views</dt><dd>{video.viewsLabel ?? '—'}</dd></div>
              <div><dt>Published</dt><dd>{video.publishedLabel ?? '—'}</dd></div>
              <div><dt>Source</dt><dd>{video.sourceLabel ?? 'Official YouTube channel'}</dd></div>
            </> : <>
              <div><dt>HN 推荐</dt><dd>{video.hn.recommenders} 人推荐</dd></div>
              <div><dt>被提及</dt><dd>{video.hn.mentions} 次</dd></div>
              <div><dt>时间跨度</dt><dd>{video.hn.firstYear}–{video.hn.lastYear}</dd></div>
            </>}
          </dl>
          <div className="topic-list">{video.categories.map((category) => <Link key={category.id} to={`/topic/${category.id}`}>{category.name}</Link>)}</div>
          {video.quote && <a className="hn-link" href={`https://news.ycombinator.com/item?id=${video.quote.hnCommentId}`} target="_blank" rel="noreferrer">查看原 HN 评论</a>}
        </aside>
      </div>
    </article>
  );
}
