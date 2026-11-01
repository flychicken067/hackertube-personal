import { NavLink, Outlet } from 'react-router-dom';
import { SearchBar } from './SearchBar';

const nav = [
  ['/', '为你放映'],
  ['/liked', '已点赞'],
  ['/history', '历史'],
  ['/later', '稍后看'],
  ['/settings', '设置'],
] as const;

export function Layout() {
  return (
    <div className="app-shell">
      <header className="site-header">
        <NavLink className="brand" to="/" aria-label="HackerTube 个人版首页">
          <span className="brand-mark">H</span>
          <span>HackerTube</span>
          <small>个人放映室</small>
        </NavLink>
        <SearchBar />
        <button className="help-button" type="button" onClick={() => window.dispatchEvent(new Event('open-shortcuts'))}>
          快捷键 <kbd>?</kbd>
        </button>
      </header>
      <nav className="site-nav" aria-label="主导航">
        {nav.map(([to, label]) => <NavLink key={to} to={to} end={to === '/'}>{label}</NavLink>)}
      </nav>
      <main id="main-content"><Outlet /></main>
      <footer className="site-footer">
        <p>数据来自 Hacker News 评论，参考了 <a href="https://hackertube.org/" target="_blank" rel="noreferrer">HackerTube</a>。</p>
        <p>视频由 YouTube 隐私增强模式播放，本站不托管视频文件。</p>
      </footer>
    </div>
  );
}
