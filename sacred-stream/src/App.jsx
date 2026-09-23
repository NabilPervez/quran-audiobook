import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import AppShell from './layouts/AppShell';
import Home from './pages/Home';
import Contents from './pages/Contents';
import SurahDetail from './pages/SurahDetail';
import Search from './pages/Search';
import Library from './pages/library/Library';
import Bookmarks from './pages/library/Bookmarks';
import History from './pages/library/History';
import { engine } from './audio/engine';
import { useHotkeys } from './hooks/useHotkeys';

// Old full-page player URLs now open the surah page with the player sheet on top.
function LegacyPlayerRedirect() {
  const { surahId } = useParams();
  return <Navigate to={`/surah/${surahId}?player=${surahId}`} replace />;
}

export default function App() {
  useHotkeys();
  // Load the last-played surah (paused) so "Resume" is one tap away.
  useEffect(() => {
    engine.restore();
  }, []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="contents" element={<Contents />} />
          <Route path="surah/:id" element={<SurahDetail />} />
          <Route path="search" element={<Search />} />
          <Route path="library" element={<Library />}>
            <Route index element={<Bookmarks />} />
            <Route path="history" element={<History />} />
          </Route>
          <Route path="player/:surahId" element={<LegacyPlayerRedirect />} />
          {/* Routes from the old Spotify-style layout */}
          <Route path="browse" element={<Navigate to="/contents" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
