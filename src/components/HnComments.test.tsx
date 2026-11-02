import { render, screen } from '@testing-library/react';
import { describe, expect, test, vi } from 'vitest';
import type { HnComment } from '../lib/types';
import { HnComments } from './HnComments';

const comments: HnComment[] = [
  {
    hnCommentId: 101,
    hnUrl: 'https://news.ycombinator.com/item?id=101',
    vid: 'abcdefghijk',
    author: 'alice',
    month: '2024-03',
    storyTitle: 'A story about learning',
    stance: 'strong_rec',
    why: 'Makes the hard part intuitive',
    quote: 'The clearest explanation I have seen',
    text: 'I recommend this walkthrough to everyone who asks.',
  },
  {
    hnCommentId: 102,
    hnUrl: 'https://news.ycombinator.com/item?id=102',
    vid: 'abcdefghijk',
    author: 'bob',
    month: '2025-07',
    storyTitle: 'A second HN story',
    stance: 'reference',
    why: '',
    quote: '',
    text: 'This comment cites the same video for background.',
  },
];

describe('HnComments', () => {
  test('shows a loading state before comments arrive', () => {
    const loader = vi.fn(() => new Promise<HnComment[]>(() => undefined));

    render(<HnComments vid="abcdefghijk" loader={loader} />);

    expect(screen.getByRole('status')).toHaveTextContent('正在加载 HN 评论');
  });

  test('shows every comment with stance, story context and original HN link', async () => {
    const loader = vi.fn().mockResolvedValue(comments);

    render(<HnComments vid="abcdefghijk" loader={loader} />);

    expect(await screen.findByText('I recommend this walkthrough to everyone who asks.')).toBeInTheDocument();
    expect(screen.getByText('This comment cites the same video for background.')).toBeInTheDocument();
    expect(screen.getByText('强烈推荐')).toBeInTheDocument();
    expect(screen.getByText('引用')).toBeInTheDocument();
    expect(screen.getByText('A story about learning')).toBeInTheDocument();
    expect(screen.getByText('Makes the hard part intuitive')).toBeInTheDocument();
    expect(screen.getAllByRole('link', { name: '查看原 HN 评论' })).toHaveLength(2);
    expect(screen.getAllByRole('link', { name: '查看原 HN 评论' })[0]).toHaveAttribute(
      'href',
      'https://news.ycombinator.com/item?id=101',
    );
  });

  test('shows a friendly empty state', async () => {
    render(<HnComments vid="abcdefghijk" loader={vi.fn().mockResolvedValue([])} />);

    expect(await screen.findByText('暂无可展示的 HN 评论。')).toBeInTheDocument();
  });

  test('keeps the page usable when comment loading fails', async () => {
    render(<HnComments vid="abcdefghijk" loader={vi.fn().mockRejectedValue(new Error('offline'))} />);

    expect(await screen.findByRole('alert')).toHaveTextContent('评论暂时加载失败');
    expect(screen.getByRole('alert')).toHaveTextContent('视频仍可正常播放');
  });
});
