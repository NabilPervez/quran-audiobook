import { useEffect } from 'react';
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom';
import AppShell from './layouts/AppShell';
import Home from './pages/Home';
import Contents from './pages/Contents';
import Player from './pages/Player';
import { engine } from './audio/engine';
import { useHotkeys } from './hooks/useHotkeys';

export default function App() {
  useHotkeys();
  // Load the last-played surah (paused) so "Resume" is one tap away.
  useEffect(() => engine.restore(), []);

  return (
    <BrowserRouter>
      <Routes>
        <Route element={<AppShell />}>
          <Route index element={<Home />} />
          <Route path="contents" element={<Contents />} />
          {/* Old routes from the Spotify-style layout */}
          <Route path="browse" element={<Navigate to="/contents" replace />} />
          <Route path="library" element={<Navigate to="/contents" replace />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
        <Route path="/player/:surahId" element={<Player />} />
      </Routes>
    </BrowserRouter>
  );
}
