import { BrowserRouter, Routes, Route, useLocation } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import Home from './pages/Home';
import Browse from './pages/Browse';
import Player from './pages/Player';
import Library from './pages/Library';
import PersistentPlayerBar from './components/PersistentPlayerBar';

function App() {
  return (
    <BrowserRouter>
      {/* Persistent Audio Bar at root level to prevent unmounting and audio stuttering */}
      <PersistentPlayerBar />
      <Routes>
        <Route element={<MainLayout />}>
          <Route path="/" element={<Home />} />
          <Route path="/browse" element={<Browse />} />
          <Route path="/library" element={<Library />} />
        </Route>
        <Route path="/player/:surahId" element={<Player />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
