import { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import SideRail from '../components/nav/SideRail';
import TabBar from '../components/nav/TabBar';
import MiniPlayer from '../components/MiniPlayer';
import PlayerSheet from '../components/player/PlayerSheet';
import Toaster from '../components/Toaster';
import NoteEditor from '../components/NoteEditor';
import { getSurah } from '../data/catalog';
import { usePlayerStore } from '../stores/playerStore';
import { usePlayerSheet } from '../hooks/usePlayerSheet';

export default function AppShell() {
  const hasPlayer = usePlayerStore((s) => s.surahId != null);
  const { openId } = usePlayerSheet();
  const sheetOpen = Boolean(openId && getSurah(openId));
  const { pathname } = useLocation();

  // New page, start at the top (opening/closing the sheet only changes the query string).
  // (Braces matter: scrollTo returns a Promise in recent Chrome, which an effect must not return.)
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  // Reserve space so the last row of content is never hidden behind the bars.
  const bottomPad = hasPlayer
    ? 'pb-[calc(var(--tabbar-h)+var(--miniplayer-h)+var(--safe-bottom)+16px)] lg:pb-32'
    : 'pb-[calc(var(--tabbar-h)+var(--safe-bottom)+16px)] lg:pb-8';

  return (
    <>
      {/* Everything behind the player sheet is inert while it is open. */}
      <div className="flex min-h-screen bg-surface" inert={sheetOpen}>
        <a
          href="#main"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:bg-surface-container-highest focus:px-4 focus:py-2 focus:rounded-lg"
        >
          Skip to content
        </a>
        <SideRail />
        <main id="main" className={`flex-1 min-w-0 ${bottomPad}`}>
          <Outlet />
        </main>
        <MiniPlayer />
        <TabBar />
      </div>
      {sheetOpen && <PlayerSheet key={openId} surahId={openId} />}
      <NoteEditor />
      <Toaster />
    </>
  );
}
