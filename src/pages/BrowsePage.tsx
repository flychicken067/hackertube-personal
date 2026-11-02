import { useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { VideoGrid } from '../components/VideoGrid';
import {
  filterAndSortVideos,
  type BrowseFilters,
  type BrowseSort,
  type ContentTypeFilter,
  type DurationFilter,
  type UploadDateFilter,
} from '../lib/browse';
import { useCatalog } from '../lib/CatalogContext';

const uploadDates: Array<[UploadDateFilter, string]> = [
  ['all', '全部时间'], ['past-year', '过去一年'], ['2020s', '2020 年代'], ['2010s', '2010 年代'], ['2000s', '2000 年代'],
];
const contentTypes: Array<[ContentTypeFilter, string]> = [
  ['all', '全部类型'], ['talk', 'Talk'], ['lecture', 'Lecture'], ['explainer', 'Explainer'], ['tutorial', 'Tutorial'], ['documentary', 'Documentary'], ['interview', 'Interview'], ['demo', 'Demo'], ['commentary', 'Commentary'], ['comedy', 'Comedy'], ['music', 'Music'],
];
const durations: Array<[DurationFilter, string]> = [
  ['all', '全部时长'], ['under-4', '4 分钟以内'], ['4-20', '4–20 分钟'], ['20-60', '20–60 分钟'], ['over-60', '1 小时以上'],
];
const sorts: Array<[BrowseSort, string]> = [
  ['best', '最佳'], ['recently-recommended', '最近被推荐'], ['upload-date', '上传日期'], ['oldest', '最早上传'], ['view-count', '播放量'], ['like-ratio', '点赞率'],
];

function allowed<T extends string>(value: string | null, options: Array<[T, string]>, fallback: T): T {
  return options.some(([candidate]) => candidate === value) ? value as T : fallback;
}

export function BrowsePage() {
  const catalog = useCatalog();
  const [params, setParams] = useSearchParams();
  const filters: BrowseFilters = {
    uploadDate: allowed(params.get('date'), uploadDates, 'all'),
    type: allowed(params.get('type'), contentTypes, 'all'),
    duration: allowed(params.get('duration'), durations, 'all'),
    hiddenGems: params.get('hidden') === '1',
    evergreenOnly: params.get('evergreen') === '1',
    sort: allowed(params.get('sort'), sorts, 'best'),
  };
  const videos = useMemo(() => filterAndSortVideos(catalog.videos, filters), [catalog.videos, params.toString()]);
  const visible = videos.slice(0, 120);
  const update = (key: string, value: string, defaultValue = 'all') => {
    const next = new URLSearchParams(params);
    if (value === defaultValue) next.delete(key);
    else next.set(key, value);
    setParams(next);
  };

  return (
    <section className="browse-page">
      <header className="page-heading">
        <h1>Browse</h1>
        <p>按上传时间、类型、时长和质量信号浏览全部视频。</p>
      </header>
      <div className="browse-controls" aria-label="视频筛选器">
        <label>上传日期<select value={filters.uploadDate} onChange={(event) => update('date', event.target.value)}>{uploadDates.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>类型<select value={filters.type} onChange={(event) => update('type', event.target.value)}>{contentTypes.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>时长<select value={filters.duration} onChange={(event) => update('duration', event.target.value)}>{durations.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label>排序<select value={filters.sort} onChange={(event) => update('sort', event.target.value, 'best')}>{sorts.map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <label className="browse-check"><input type="checkbox" checked={filters.hiddenGems} onChange={(event) => update('hidden', event.target.checked ? '1' : '0', '0')} />冷门佳作</label>
        <label className="browse-check"><input type="checkbox" checked={filters.evergreenOnly} onChange={(event) => update('evergreen', event.target.checked ? '1' : '0', '0')} />只看常青内容</label>
        <button type="button" onClick={() => setParams({})}>清除筛选</button>
      </div>
      <p className="browse-count">找到 {videos.length} 个视频{videos.length > visible.length ? `，先显示前 ${visible.length} 个` : ''}</p>
      <VideoGrid videos={visible} empty="没有符合这些条件的视频。" />
    </section>
  );
}
