import { Link } from 'react-router-dom';

export function PlaylistsPage() {
  return (
    <><header className="page-heading"><h1>Playlists</h1><p>Your personal collections, stored only in this browser.</p></header>
      <div className="playlist-grid"><Link to="/liked"><strong>Liked</strong><span>Your liked videos</span></Link><Link to="/later"><strong>Watch later</strong><span>Saved for another time</span></Link><Link to="/history"><strong>History</strong><span>Recently watched</span></Link></div>
    </>
  );
}
