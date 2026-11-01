import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Icon } from './Icon';

export function SearchBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const current = new URLSearchParams(location.search).get('q') ?? '';
  const [query, setQuery] = useState(current);
  useEffect(() => setQuery(current), [current]);
  return (
    <form className="search-form" role="search" onSubmit={(event) => { event.preventDefault(); const next = query.trim(); if (next) navigate(`/search?q=${encodeURIComponent(next)}`); }}>
      <label className="sr-only" htmlFor="global-search">搜索视频和话题</label>
      <input id="global-search" type="search" value={query} placeholder="Search" onChange={(event) => setQuery(event.target.value)} />
      <button type="submit" aria-label="搜索" onClick={() => { if (!query.trim()) document.querySelector<HTMLInputElement>('#global-search')?.focus(); }}><Icon name="search" size={20} /></button>
    </form>
  );
}
