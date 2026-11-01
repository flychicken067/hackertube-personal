import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, test } from 'vitest';
import { App } from './App';
import { makeCatalog, makeVideo } from './test/fixtures';

const catalog = makeCatalog([
  makeVideo({ vid: 'systems0001', title: 'A thoughtful systems talk' }),
  makeVideo({
    vid: 'geometry001',
    title: 'Geometry for Artists',
    primaryTopic: 'geometry',
    tags: ['drawing'],
    categories: [{ id: 'visual-art', name: 'Visual arts', area: 'culture', areaName: 'Culture' }],
  }),
]);

describe('App', () => {
  beforeEach(() => {
    window.localStorage.clear();
    window.location.hash = '#/';
  });

  test('opens the For You page with ranked videos from the catalog', () => {
    render(<App initialCatalog={catalog} />);

    expect(screen.getByRole('heading', { name: '为你放映' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'A thoughtful systems talk' })).toBeInTheDocument();
  });

  test('searches titles and topics from the global search box', async () => {
    render(<App initialCatalog={catalog} />);

    const search = screen.getByRole('searchbox', { name: '搜索视频和话题' });
    fireEvent.change(search, { target: { value: 'geometry' } });
    fireEvent.submit(search.closest('form')!);

    await waitFor(() => expect(screen.getByRole('heading', { name: '搜索结果' })).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Geometry for Artists' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'A thoughtful systems talk' })).not.toBeInTheDocument();
  });

  test('likes the selected video with the l keyboard shortcut and saves it locally', async () => {
    render(<App initialCatalog={catalog} />);

    fireEvent.keyDown(window, { key: 'j' });
    fireEvent.keyDown(window, { key: 'l' });

    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem('hackertube-personal:v1') ?? '{}');
      expect(saved.likes).toContain('systems0001');
    });
  });

  test('shows shortcut help when question mark is pressed', () => {
    render(<App initialCatalog={catalog} />);

    fireEvent.keyDown(window, { key: '?' });

    expect(screen.getByRole('dialog', { name: '键盘快捷键' })).toBeInTheDocument();
  });

  test('opens a video page with channel, duration fallback, topics, recommendation count and HN link', async () => {
    render(<App initialCatalog={catalog} />);

    fireEvent.click(screen.getByRole('link', { name: 'A thoughtful systems talk' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'A thoughtful systems talk' })).toBeInTheDocument());
    expect(screen.getByText('Example Channel')).toBeInTheDocument();
    expect(screen.getByText('时长未知')).toBeInTheDocument();
    expect(screen.getByText('5 人推荐')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '查看原 HN 评论' })).toHaveAttribute(
      'href',
      'https://news.ycombinator.com/item?id=123',
    );
    expect(screen.getByTitle('A thoughtful systems talk')).toHaveAttribute(
      'src',
      'https://www.youtube-nocookie.com/embed/systems0001?rel=0',
    );
  });

  test('shows liked videos on the Liked page', async () => {
    render(<App initialCatalog={catalog} />);
    fireEvent.click(screen.getByRole('button', { name: '点赞 A thoughtful systems talk' }));
    fireEvent.click(screen.getByRole('link', { name: '已点赞' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: '已点赞' })).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'A thoughtful systems talk' })).toBeInTheDocument();
  });

  test('changes a topic preference on Settings and stores it locally', async () => {
    render(<App initialCatalog={catalog} />);
    fireEvent.click(screen.getByRole('link', { name: '设置' }));

    const preference = await screen.findByRole('combobox', { name: 'Distributed systems 偏好' });
    fireEvent.change(preference, { target: { value: '2' } });

    const saved = JSON.parse(window.localStorage.getItem('hackertube-personal:v1') ?? '{}');
    expect(saved.topicPreferences).toEqual({ 'distributed-systems': 2 });
  });
});
