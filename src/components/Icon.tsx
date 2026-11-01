import type { ReactNode } from 'react';

type IconName = 'menu' | 'home' | 'play' | 'longs' | 'liked' | 'history' | 'later' | 'categories' | 'playlists' | 'settings' | 'search' | 'help' | 'moon' | 'sun' | 'filter';

const paths: Record<IconName, ReactNode> = {
  menu: <path d="M4 7h16M4 12h16M4 17h16" />,
  home: <><path d="m3 11 9-7 9 7" /><path d="M5 10v10h14V10M9 20v-6h6v6" /></>,
  play: <><circle cx="12" cy="12" r="9" /><path d="m10 8 6 4-6 4Z" /></>,
  longs: <><rect x="5" y="3" width="14" height="18" rx="2" /><path d="m10 9 5 3-5 3Z" /></>,
  liked: <path d="M7 10v11H4V10h3ZM7 19h9.3a2 2 0 0 0 1.9-1.4l2.2-7A2 2 0 0 0 18.5 8H14l.7-3.2A2.3 2.3 0 0 0 12.5 2L7 10Z" />,
  history: <><path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 4v4h4M12 7v5l3 2" /></>,
  later: <><circle cx="12" cy="12" r="9" /><path d="M12 7v5l3 2" /></>,
  categories: <><rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" /><rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" /></>,
  playlists: <><path d="M4 6h11M4 11h11M4 16h7" /><path d="m16 14 5 3-5 3Z" /></>,
  settings: <><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.9l.1.1-2.8 2.8-.1-.1a1.7 1.7 0 0 0-1.9-.3 1.7 1.7 0 0 0-1 1.6v.2h-4V21a1.7 1.7 0 0 0-1-1.6 1.7 1.7 0 0 0-1.9.3l-.1.1L4.2 17l.1-.1a1.7 1.7 0 0 0 .3-1.9A1.7 1.7 0 0 0 3 14H2.8v-4H3a1.7 1.7 0 0 0 1.6-1 1.7 1.7 0 0 0-.3-1.9L4.2 7 7 4.2l.1.1a1.7 1.7 0 0 0 1.9.3A1.7 1.7 0 0 0 10 3V2.8h4V3a1.7 1.7 0 0 0 1 1.6 1.7 1.7 0 0 0 1.9-.3l.1-.1L19.8 7l-.1.1a1.7 1.7 0 0 0-.3 1.9 1.7 1.7 0 0 0 1.6 1h.2v4H21a1.7 1.7 0 0 0-1.6 1Z" /></>,
  search: <><circle cx="11" cy="11" r="7" /><path d="m16 16 5 5" /></>,
  help: <><circle cx="12" cy="12" r="9" /><path d="M9.7 9a2.4 2.4 0 1 1 3.8 2c-.9.6-1.5 1-1.5 2.2M12 17h.01" /></>,
  moon: <path d="M20 15.3A9 9 0 0 1 8.7 4a9 9 0 1 0 11.3 11.3Z" />,
  sun: <><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></>,
  filter: <><path d="M4 7h16M7 12h10M10 17h4" /></>,
};

export function Icon({ name, size = 22 }: { name: IconName; size?: number }) {
  return <svg className="icon" width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{paths[name]}</svg>;
}
