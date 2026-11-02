import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { VideoGrid } from '../components/VideoGrid';
import { useCatalog } from '../lib/CatalogContext';
import { useLibrary } from '../lib/LibraryContext';
import { HnComments } from '../components/HnComments';
import { getRelatedVideos, loadRelatedIndex } from '../lib/related';
import type { Video } from '../lib/types';

export function VideoPage() {
  const { vid = '' } = useParams();
  const catalog = useCatalog();
  const video = catalog.videos.find((item) => item.vid === vid);
  const { state, markWatched, setSelectedId, toggleDislike, toggleLike, toggleLater } = useLibrary();
  const [relatedVideos, setRelatedVideos] = useState<Video[]>([]);

  useEffect(() => {
    if (!video) return;
    setSelectedId(video.vid);
    markWatched(video.vid);
  }, [video?.vid]);

  useEffect(() => {
    let active = true;
    if (!video || video.source === 'karpathy') {
      setRelatedVideos([]);
      return () => { active = false; };
    }
    loadRelatedIndex().then((index) => {
      if (active) setRelatedVideos(getRelatedVideos(video.vid, index, catalog.videos, 6).map((item) => item.video));
    }).catch(() => {
      if (active) setRelatedVideos([]);
    });
    return () => { active = false; };
  }, [catalog.videos, video?.vid]);

  if (!video) return <p className="empty-state">没找到这个视频。</p>;
  const unavailable = video.available === false || video.embeddable === false;
  const youtubeWatchUrl = video.startSeconds
    ? `${video.url}${video.url.includes('?') ? '&' : '?'}t=${video.startSeconds}s`
    : video.url;
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
      <div className="youtube-login-help">
        <p><strong>播放器要求登录？</strong><span>嵌入播放器无法完成 YouTube 登录或人机验证。</span></p>
        <a href={youtubeWatchUrl} target="_blank" rel="noopener">在 YouTube 登录并观看 <span aria-hidden="true">↗</span></a>
      </div>
      <div className="watch-layout">
        <section>
          <p className="eyebrow">{video.contentType.toUpperCase()} / {video.level.toUpperCase()}</p>
          <h1>{video.title}</h1>
          <p className="watch-channel">{video.channel}</p>
          <div className="watch-actions">
            <button type="button" aria-pressed={state.likes.includes(video.vid)} onClick={() => toggleLike(video.vid)}>{state.likes.includes(video.vid) ? '已点赞' : '点赞'}</button>
            <button type="button" aria-pressed={state.dislikes.includes(video.vid)} onClick={() => toggleDislike(video.vid)}>{state.dislikes.includes(video.vid) ? '已不喜欢' : '不喜欢'}</button>
            <button type="button" aria-pressed={state.watchLater.includes(video.vid)} onClick={() => toggleLater(video.vid)}>{state.watchLater.includes(video.vid) ? '已收藏' : '稍后看'}</button>
          </div>
          <h2>这段视频讲什么</h2>
          <p>{video.summary}</p>
          <h2>{video.source === 'karpathy' ? 'About this source' : 'HN 为什么推荐'}</h2>
          <p>{video.whyHn}</p>
          {video.quote && <blockquote>“{video.quote.text}”</blockquote>}
          {video.source !== 'karpathy' && <HnComments vid={video.vid} />}
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
      {relatedVideos.length > 0 && <section className="watch-related"><h2>HN 用户也推荐</h2><VideoGrid videos={relatedVideos} /></section>}
    </article>
  );
}
