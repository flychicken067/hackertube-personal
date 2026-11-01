import { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import { Icon } from './Icon';
import { SearchBar } from './SearchBar';

const nav = [
  ['/', 'Home', 'home'],
  ['/karpathy', 'Karpathy', 'play'],
  ['/longs', 'Longs', 'longs'],
  ['/liked', 'Liked', 'liked'],
  ['/history', 'History', 'history'],
  ['/later', 'Watch later', 'later'],
  ['/categories', 'Categories', 'categories'],
  ['/playlists', 'Playlists', 'playlists'],
  ['/settings', 'Settings', 'settings'],
] as const;

export function Layout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [dark, setDark] = useState(false);
  return (
    <div className="app-shell" data-theme={dark ? 'dark' : 'light'}>
      <header className="topbar">
        <button className="icon-button menu-button" type="button" aria-label="打开菜单" aria-expanded={menuOpen} onClick={() => setMenuOpen((value) => !value)}><Icon name="menu" /></button>
        <NavLink className="wordmark" to="/" aria-label="HackerTube 首页"><span>Hacker</span><strong>Tube</strong></NavLink>
        <SearchBar />
        <div className="topbar-actions">
          <button className="icon-button" type="button" aria-label="键盘快捷键" title="Keyboard shortcuts" onClick={() => window.dispatchEvent(new Event('open-shortcuts'))}><Icon name="help" /></button>
          <button className="icon-button" type="button" aria-label={dark ? '切换浅色模式' : '切换深色模式'} title="Toggle theme" onClick={() => setDark((value) => !value)}><Icon name={dark ? 'sun' : 'moon'} /></button>
        </div>
      </header>
      <aside className={`sidebar${menuOpen ? ' is-open' : ''}`}>
        <nav aria-label="主导航">
          {nav.map(([to, label, icon], index) => (
            <div key={to} className={index === 3 || index === 6 || index === 8 ? 'nav-section' : undefined}>
              <NavLink to={to} end={to === '/'} onClick={() => setMenuOpen(false)}><Icon name={icon} /><span>{label}</span></NavLink>
            </div>
          ))}
        </nav>
      </aside>
      {menuOpen && <button className="menu-backdrop" type="button" aria-label="关闭菜单" onClick={() => setMenuOpen(false)} />}
      <div className="content-column">
        <main id="main-content"><Outlet /></main>
        <footer className="site-footer">
          <p>Data from Hacker News comments · Inspired by <a href="https://hackertube.org/" target="_blank" rel="noreferrer">HackerTube</a> · Karpathy videos from his <a href="https://www.youtube.com/@AndrejKarpathy/videos" target="_blank" rel="noreferrer">official channel</a>.</p>
          <p>Videos play with YouTube privacy-enhanced embeds. No video files are hosted here.</p>
        </footer>
      </div>
    </div>
  );
}
