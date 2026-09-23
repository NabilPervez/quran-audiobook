import { Outlet } from 'react-router-dom';
import SideRail from '../components/nav/SideRail';
import TabBar from '../components/nav/TabBar';
import MiniPlayer from '../components/MiniPlayer';
import { usePlayerStore } from '../stores/playerStore';

export default function AppShell() {
  const hasPlayer = usePlayerStore((s) => s.surahId != null);
  // Reserve space so the last row of content is never hidden behind the bars.
  const bottomPad = hasPlayer
    ? 'pb-[calc(var(--tabbar-h)+var(--miniplayer-h)+var(--safe-bottom)+16px)] lg:pb-32'
    : 'pb-[calc(var(--tabbar-h)+var(--safe-bottom)+16px)] lg:pb-8';

  return (
    <div className="flex min-h-screen bg-surface">
      <a href="#main" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-surface-container-highest focus:px-4 focus:py-2 focus:rounded-lg">
        Skip to content
      </a>
      <SideRail />
      <main id="main" className={`flex-1 min-w-0 ${bottomPad}`}>
        <Outlet />
      </main>
      <MiniPlayer />
      <TabBar />
    </div>
  );
}
