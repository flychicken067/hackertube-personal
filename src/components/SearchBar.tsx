import { useEffect, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';

export function SearchBar() {
  const navigate = useNavigate();
  const location = useLocation();
  const current = new URLSearchParams(location.search).get('q') ?? '';
  const [query, setQuery] = useState(current);

  useEffect(() => setQuery(current), [current]);

  return (
    <form
      className="search-form"
      role="search"
      onSubmit={(event) => {
        event.preventDefault();
        const next = query.trim();
        if (next) navigate(`/search?q=${encodeURIComponent(next)}`);
      }}
    >
      <label className="sr-only" htmlFor="global-search">
        搜索视频和话题
      </label>
      <input
        id="global-search"
        type="search"
        value={query}
        placeholder="搜索标题或话题…"
        onChange={(event) => setQuery(event.target.value)}
      />
      <kbd>/</kbd>
    </form>
  );
}
