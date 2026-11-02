import { useEffect, useState } from 'react';
import { loadVideoComments } from '../lib/comments';
import type { HnComment } from '../lib/types';

type CommentLoader = (vid: string) => Promise<HnComment[]>;

interface HnCommentsProps {
  vid: string;
  loader?: CommentLoader;
}

const stanceLabels: Record<string, string> = {
  strong_rec: '强烈推荐',
  rec: '推荐',
  reference: '引用',
  joke: '玩笑',
  critical: '批评',
};

type LoadState =
  | { status: 'loading' }
  | { status: 'loaded'; comments: HnComment[] }
  | { status: 'error' };

export function HnComments({ vid, loader = loadVideoComments }: HnCommentsProps) {
  const [state, setState] = useState<LoadState>({ status: 'loading' });

  useEffect(() => {
    let active = true;
    setState({ status: 'loading' });
    loader(vid).then(
      (comments) => {
        if (active) setState({ status: 'loaded', comments });
      },
      () => {
        if (active) setState({ status: 'error' });
      },
    );
    return () => {
      active = false;
    };
  }, [loader, vid]);

  return (
    <section className="hn-comments" aria-labelledby="hn-comments-title">
      <div className="hn-comments-heading">
        <h2 id="hn-comments-title">来自 Hacker News 的讨论</h2>
        {state.status === 'loaded' && state.comments.length > 0 && <span>{state.comments.length} 条</span>}
      </div>
      {state.status === 'loading' && <p className="hn-comments-message" role="status">正在加载 HN 评论…</p>}
      {state.status === 'error' && (
        <p className="hn-comments-message" role="alert">评论暂时加载失败，视频仍可正常播放。</p>
      )}
      {state.status === 'loaded' && state.comments.length === 0 && (
        <p className="hn-comments-message">暂无可展示的 HN 评论。</p>
      )}
      {state.status === 'loaded' && state.comments.length > 0 && (
        <div className="hn-comment-list">
          {state.comments.map((comment) => (
            <article className="hn-comment" key={`${comment.hnCommentId}-${comment.vid}`}>
              <div className="hn-comment-meta">
                <span className="hn-stance" data-stance={comment.stance}>
                  {stanceLabels[comment.stance] ?? comment.stance}
                </span>
                <span>{comment.author || 'HN 用户'}</span>
                <span>{comment.month}</span>
              </div>
              {comment.storyTitle && <h3>{comment.storyTitle}</h3>}
              {comment.why && <p className="hn-comment-why">{comment.why}</p>}
              <p className="hn-comment-text">{comment.text}</p>
              {comment.quote && <blockquote>“{comment.quote}”</blockquote>}
              <a href={comment.hnUrl} target="_blank" rel="noreferrer">查看原 HN 评论</a>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}
