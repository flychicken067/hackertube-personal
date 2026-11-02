import { useRef, useState } from 'react';
import { useCatalog } from '../lib/CatalogContext';
import { useLibrary } from '../lib/LibraryContext';
import { exportLibraryState } from '../lib/storage';

export function SettingsPage() {
  const catalog = useCatalog();
  const { state, setTopicPreference, setUseVideoFrames, clear, importState } = useLibrary();
  const fileRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState('');

  const exportState = () => {
    const blob = new Blob([exportLibraryState(state)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = 'hackertube-personal-data.json';
    anchor.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="settings-page">
      <section className="page-intro compact"><div><p className="eyebrow">LOCAL ONLY</p><h1>设置</h1></div><p>这里没有账号。你可以随时导出或清除所有本地记录。</p></section>
      <section className="settings-section">
        <div><p className="eyebrow">THUMBNAILS</p><h2>缩略图</h2><p>自动帧更接近视频实际内容；关闭后显示上传者选择的封面。图片失效时会自动回退。</p></div>
        <label className="setting-toggle">
          <input type="checkbox" aria-label="使用视频中段自动帧" checked={state.useVideoFrames} onChange={(event) => setUseVideoFrames(event.target.checked)} />
          <span><strong>使用视频中段自动帧</strong><small>{state.useVideoFrames ? '当前：代表性视频画面' : '当前：上传者封面'}</small></span>
        </label>
      </section>
      <section className="settings-section">
        <div><p className="eyebrow">DATA</p><h2>你的数据</h2><p>{state.likes.length} 个点赞，{state.dislikes.length} 个不喜欢，{state.history.length} 条历史，{state.watchLater.length} 个稍后看。</p></div>
        <div className="settings-actions">
          <button type="button" onClick={exportState}>导出我的数据</button>
          <button type="button" onClick={() => fileRef.current?.click()}>导入数据</button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json"
            hidden
            onChange={async (event) => {
              const file = event.target.files?.[0];
              if (!file) return;
              try { importState(await file.text()); setMessage('导入完成。'); }
              catch (error) { setMessage(error instanceof Error ? error.message : '导入失败。'); }
            }}
          />
          <button className="danger" type="button" onClick={() => { if (window.confirm('确定清除所有点赞、不喜欢、历史和偏好吗？')) { clear(); setMessage('本地数据已清除。'); } }}>清除本地数据</button>
          {message && <p role="status">{message}</p>}
        </div>
      </section>
      <section className="settings-section topic-preferences">
        <div><p className="eyebrow">TASTE</p><h2>话题偏好</h2><p>调整后，For You 会立即重新排序。</p></div>
        <div className="preference-list">
          {catalog.areas.flatMap((area) => area.categories).map((topic) => (
            <label key={topic.id}>
              <span>{topic.name}</span>
              <select aria-label={`${topic.name} 偏好`} value={state.topicPreferences[topic.id] ?? 0} onChange={(event) => setTopicPreference(topic.id, Number(event.target.value))}>
                <option value="-2">少看</option><option value="0">默认</option><option value="1">喜欢</option><option value="2">非常喜欢</option>
              </select>
            </label>
          ))}
        </div>
      </section>
    </div>
  );
}
