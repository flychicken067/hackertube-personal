import type { Catalog, ChannelSource, Video, VideoCategory } from './types';

const fallbackCategory: VideoCategory = {
  id: 'machine-learning',
  name: 'Machine learning & deep learning',
  area: 'ai-data',
  areaName: 'AI, Machine Learning & Data',
};

export function mergeKarpathySource(catalog: Catalog, channel: ChannelSource): Catalog {
  const existing = new Map(catalog.videos.map((video) => [video.vid, video]));
  const machineLearning = findCategory(catalog, 'machine-learning') ?? fallbackCategory;
  const generativeAI = findCategory(catalog, 'llms-generative-ai');

  for (const item of channel.videos) {
    const current = existing.get(item.vid);
    if (current) {
      existing.set(item.vid, {
        ...current,
        source: 'karpathy',
        duration: item.duration || current.duration,
        viewsLabel: item.viewsLabel,
        publishedLabel: item.publishedLabel,
      });
      continue;
    }

    const diffusion = item.title.toLocaleLowerCase().includes('stable diffusion');
    const categories = diffusion && generativeAI
      ? [generativeAI, machineLearning]
      : [machineLearning, ...(generativeAI ? [generativeAI] : [])];
    const video: Video = {
      vid: item.vid,
      url: `https://www.youtube.com/watch?v=${item.vid}`,
      title: item.title,
      channel: channel.source.name,
      summary: diffusion
        ? 'Andrej Karpathy 使用 Stable Diffusion 生成的一段视觉实验。'
        : 'Andrej Karpathy 官方频道发布的人工智能与神经网络课程。',
      whyHn: '来自 Andrej Karpathy 官方 YouTube 频道。',
      contentType: diffusion ? 'demo' : 'course',
      level: 'technical',
      shelfLife: 'evergreen',
      primaryTopic: diffusion ? 'generative AI' : 'machine learning',
      tags: diffusion ? ['stable diffusion', 'generative AI', 'Karpathy'] : ['machine learning', 'neural networks', 'Karpathy'],
      categories,
      quote: null,
      hn: {
        mentions: 0,
        recommenders: 0,
        recMonths: 0,
        strongRecs: 0,
        stances: {},
        firstYear: 0,
        lastYear: 0,
      },
      score: 12,
      duration: item.duration,
      available: true,
      embeddable: true,
      source: 'karpathy',
      viewsLabel: item.viewsLabel,
      publishedLabel: item.publishedLabel,
    };
    existing.set(item.vid, video);
  }

  return { ...catalog, videos: [...existing.values()] };
}

function findCategory(catalog: Catalog, id: string): VideoCategory | undefined {
  for (const area of catalog.areas) {
    const category = area.categories.find((item) => item.id === id);
    if (category) return { id: category.id, name: category.name, area: area.id, areaName: area.name };
  }
}
