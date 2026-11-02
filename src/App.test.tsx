import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, test, vi } from 'vitest';
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

  afterEach(() => {
    vi.restoreAllMocks();
  });

  test('revalidates public data files so a new deployment is visible immediately', async () => {
    const channel = {
      source: { id: 'karpathy', name: 'Andrej Karpathy', url: 'https://www.youtube.com/@AndrejKarpathy' },
      videos: [],
    };
    const fetchMock = vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce({ ok: true, json: async () => catalog } as Response)
      .mockResolvedValueOnce({ ok: true, json: async () => channel } as Response);

    render(<App />);

    await screen.findByRole('heading', { name: 'Home' });
    expect(fetchMock).toHaveBeenNthCalledWith(1, expect.any(URL), { cache: 'no-cache' });
    expect(fetchMock).toHaveBeenNthCalledWith(2, expect.any(URL), { cache: 'no-cache' });
  });

  test('opens the For You page with ranked videos from the catalog', () => {
    render(<App initialCatalog={catalog} />);

    expect(screen.getByRole('heading', { name: 'Home' })).toBeInTheDocument();
    expect(screen.getByRole('heading', { name: 'A thoughtful systems talk' })).toBeInTheDocument();
  });

  test('searches titles and topics from the global search box', async () => {
    render(<App initialCatalog={catalog} />);

    const search = screen.getByRole('searchbox', { name: '搜索视频和话题' });
    fireEvent.change(search, { target: { value: 'geometry' } });
    fireEvent.submit(search.closest('form')!);

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Search results' })).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'Geometry for Artists' })).toBeInTheDocument();
    expect(screen.queryByRole('heading', { name: 'A thoughtful systems talk' })).not.toBeInTheDocument();
  });

  test('likes the selected video with the l keyboard shortcut and saves it locally', async () => {
    render(<App initialCatalog={catalog} />);
    const firstVideoId = document.querySelector<HTMLElement>('[data-video-card]')?.dataset.videoId;
    expect(firstVideoId).toBeTruthy();

    fireEvent.keyDown(window, { key: 'j' });
    fireEvent.keyDown(window, { key: 'l' });

    await waitFor(() => {
      const saved = JSON.parse(window.localStorage.getItem('hackertube-personal:v1') ?? '{}');
      expect(saved.likes).toContain(firstVideoId);
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

  test('opens a featured Karpathy talk at the timestamp selected on his personal website', async () => {
    const featured = makeCatalog([
      makeVideo({
        vid: 'featured001',
        title: 'Featured Karpathy talk',
        channel: 'Conference Channel',
        source: 'karpathy',
        sourceLabel: 'Featured on karpathy.ai',
        startSeconds: 245,
      } as Partial<ReturnType<typeof makeVideo>>),
    ]);
    render(<App initialCatalog={featured} />);

    fireEvent.click(screen.getByRole('link', { name: 'Featured Karpathy talk' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Featured Karpathy talk' })).toBeInTheDocument());
    expect(screen.getByTitle('Featured Karpathy talk')).toHaveAttribute(
      'src',
      'https://www.youtube-nocookie.com/embed/featured001?rel=0&start=245',
    );
    expect(screen.getByText('Featured on karpathy.ai')).toBeInTheDocument();
  });

  test('offers the exact YouTube video when embedded login cannot complete', async () => {
    const loginFallback = makeCatalog([
      makeVideo({
        vid: 'featured001',
        url: 'https://www.youtube.com/watch?v=featured001',
        title: 'Featured Karpathy talk',
        source: 'karpathy',
        startSeconds: 245,
      } as Partial<ReturnType<typeof makeVideo>>),
    ]);
    render(<App initialCatalog={loginFallback} />);

    fireEvent.click(screen.getByRole('link', { name: 'Featured Karpathy talk' }));

    expect(await screen.findByText('嵌入播放器无法完成 YouTube 登录或人机验证。')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: '在 YouTube 登录并观看' })).toHaveAttribute(
      'href',
      'https://www.youtube.com/watch?v=featured001&t=245s',
    );
  });

  test('shows Karpathy videos in the curated source order', async () => {
    const unordered = makeCatalog([
      makeVideo({ vid: 'second00001', title: 'Second source item', source: 'karpathy', sourceOrder: 1 } as Partial<ReturnType<typeof makeVideo>>),
      makeVideo({ vid: 'first000001', title: 'First source item', source: 'karpathy', sourceOrder: 0 } as Partial<ReturnType<typeof makeVideo>>),
    ]);
    render(<App initialCatalog={unordered} />);

    fireEvent.click(screen.getByRole('link', { name: 'Karpathy' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Andrej Karpathy' })).toBeInTheDocument());
    expect(screen.getAllByRole('heading', { level: 2 }).map((heading) => heading.textContent)).toEqual([
      'First source item',
      'Second source item',
    ]);
  });

  test('shows liked videos on the Liked page', async () => {
    render(<App initialCatalog={catalog} />);
    fireEvent.click(screen.getByRole('button', { name: '点赞 A thoughtful systems talk' }));
    fireEvent.click(screen.getByRole('link', { name: 'Liked' }));

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Liked' })).toBeInTheDocument());
    expect(screen.getByRole('heading', { name: 'A thoughtful systems talk' })).toBeInTheDocument();
  });

  test('changes a topic preference on Settings and stores it locally', async () => {
    render(<App initialCatalog={catalog} />);
    fireEvent.click(screen.getByRole('link', { name: 'Settings' }));

    const preference = await screen.findByRole('combobox', { name: 'Distributed systems 偏好' });
    fireEvent.change(preference, { target: { value: '2' } });

    const saved = JSON.parse(window.localStorage.getItem('hackertube-personal:v1') ?? '{}');
    expect(saved.topicPreferences).toEqual({ 'distributed-systems': 2 });
  });
});
