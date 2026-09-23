# Sacred Stream: UX/UI Overhaul Plan

**Goal:** Change the app from a Spotify clone into an **audiobook-first Quran companion**. It should play like Audible (resume anywhere, bookmarks, speed, sleep timer, chapter navigation) and read like a good Quran reader (verse-synced text, Arabic alongside English, tap-to-seek).

**Codebase analysed:** `main` @ `c793f11` (React 19 + Vite 8 + Tailwind 3 + Zustand 5 + vite-plugin-pwa, with a Python Piper-TTS pipeline).

---

## Progress

| Task | Status |
|---|---|
| Sprint 0 (S0-1 to S0-6) | ✅ Done. Lint is clean, CI workflow added, fake UI removed, `scripts/build_metadata.py` generates `src/data/catalog.json`, lucide icons, self-hosted fonts, PWA icons. |
| Sprint 1 (S1-1 to S1-7) | ✅ Done. `src/audio/engine.js` + `timeBus.js`, persisted resume, skip/speed/chapter controls, auto-advance, Media Session, sleep timer with fade, new mini-player. Real-device lock-screen check is still pending. |
| S2-1 App shell | ✅ Tab bar (phones) / side rail (desktop). Tabs are Home and Contents; Library and Search get added when they exist. |
| S2-2 Home, S2-3 Contents | ✅ First version: Continue card, Up next, Journey, short surahs; TOC with Surah/Juz views, filters, search, progress rings. |
| S2-5 Covers | ✅ `Cover.jsx` (SVG). PNG export for Media Session artwork is still to do. |
| S3-1 interim timings | ✅ Length-weighted estimate (`lib/verseTiming.js`), labelled as approximate in the UI. The per-verse pipeline is still to do. |
| S3-3 Read view | ✅ First version inside `/player/:id`: auto-follow, back-to-current pill, tap-to-play, Arabic toggle. Still missing: text size, action sheet, `?v=` deep link. |
| Deviations | Stayed on JavaScript (no TS migration). The player is still a route (`/player/:id`), not a `?player=` sheet. Verse text still comes from api.quran.com at runtime until the S3-1 pipeline produces static JSON. |

---

## Table of contents

1. [Product direction: why Spotify was the wrong model](#1-product-direction)
2. [Code review: the good](#2-the-good)
3. [Code review: the bad](#3-the-bad)
4. [Target architecture](#4-target-architecture)
5. [Target information architecture and screens](#5-target-ia--screens)
6. [Sprint plan](#6-sprint-plan)
   - [Sprint 0: Foundation and cleanup](#sprint-0--foundation--cleanup)
   - [Sprint 1: Audio engine and audiobook playback](#sprint-1--audio-engine--audiobook-playback)
   - [Sprint 2: New navigation and screens](#sprint-2--new-navigation--screens)
   - [Sprint 3: Read-along (verse-synced text)](#sprint-3--read-along-verse-synced-text)
   - [Sprint 4: Bookmarks, notes and library](#sprint-4--bookmarks-notes--library)
   - [Sprint 5: Offline and PWA](#sprint-5--offline--pwa)
   - [Sprint 6: Accessibility, performance and QA](#sprint-6--accessibility-performance--qa)
7. [Definition of done (every task)](#7-definition-of-done)
8. [Risks and open questions](#8-risks--open-questions)

---

## 1. Product direction

Spotify is built for **many short, interchangeable tracks** that people discover, shuffle and add to playlists. This content is a **single long-form book** (about 12.5 hours of English narration in 114 chapters of very different lengths). People listen to it **in order, over many sessions**. They also want to **read along** and **come back to specific passages**.

| Spotify pattern (current) | Why it fails here | Audiobook pattern (target) |
|---|---|---|
| Grid of album-art cards with the same stock photo | 114 identical tiles give no information scent. Users can't tell Al-Baqarah (61 min) from Al-Ikhlas (15 s) | **Table of contents** list: number, name, meaning, duration, per-chapter progress ring |
| "Recently Recited", "Recommended for You" (hardcoded) | Fake personalisation erodes trust | **Continue listening** hero with the exact resume point ("Al-Kahf · 12 min left") |
| Prev/next **track** as the main secondary controls | In a 60-minute chapter the user wants "what did he just say?", not the next chapter | **Skip back 15 s / forward 30 s** as secondary controls; chapter skip moved to a smaller position |
| Playback stops when a track ends, and the position is forgotten | Every session starts from 0:00 | Position is **auto-saved** per surah, the next chapter plays automatically, and finished chapters are marked done |
| "Lyrics" toggle | Wrong mental model; also the sync is a guess | **Listen / Read** tabs inside the player, with real verse timings |
| Heart/save playlist | Doesn't fit | **Bookmarks** (verse + timestamp + optional note) |

**Design principles for the rework**

1. **One tap to resume.** Launching the app always shows where the user left off.
2. **The text is a first-class part of the product.** Reading, listening, or both at once should all work equally well.
3. **Calm, reverent, legible.** Keep the dark "Emerald Night" palette, but drop the Spotify green glow effects and marketing-style hero sections. Use generous line-height and a proper Arabic typeface.
4. **No fake UI.** Every button on screen works. If a feature doesn't exist yet, its button doesn't ship.
5. **Mobile first.** Commuters are the core audience, so the app gets lock-screen controls, one-thumb reach and offline downloads.

---

## 2. The good

These parts are sound and should be kept or built on:

| # | What | Where | Why it's good |
|---|---|---|---|
| G1 | The `<audio>` element sits at the app root, outside `<Routes>` | `src/App.jsx:13`, `PersistentPlayerBar.jsx:61` | Playback survives route changes. This is the right instinct; Sprint 1 formalises it into an engine module. |
| G2 | Zustand for player state | `src/store/playerStore.js` | Small, easy to reach from any component, and its `persist` middleware gives free resume/bookmark storage. |
| G3 | Design tokens in Tailwind following a written design system | `tailwind.config.js`, `direction/emerald_night/DESIGN.md` | Colours are already semantic (`surface-container-high`, `on-surface-variant`), so the restyle becomes a token change instead of a rewrite. |
| G4 | One MP3 per surah, CBR 24 kbps mono | `public/audio/*.mp3`, `compress.py` | Chapters map naturally onto files. CBR keeps browser seeking sample-accurate, which read-along sync needs. About 135 MB for the whole Quran is very small. |
| G5 | Same translation (Abdel Haleem, id 85) for TTS and display | `extract_text.py:36`, `Player.jsx:29` | The narration and the text on screen match word for word. That is the precondition for read-along. |
| G6 | The TTS pipeline is resumable and decoupled | `main.py` skips existing files | Easy to rerun and extend to emit verse timings (Sprint 3). |
| G7 | PWA and SPA hosting are already wired up | `vite.config.js`, `netlify.toml` | Offline is an incremental improvement, not a from-scratch build. |
| G8 | Small JS bundle | `npm run build` → 274 kB / 83 kB gzip | There is headroom for new features. |
| G9 | Mobile mini-player has a thin progress line | `PersistentPlayerBar.jsx:144` | A good pattern to keep. |

---

## 3. The bad

Checked on this clone. `npm run lint` fails with **6 problems (5 errors, 1 warning)**; `npm run build` succeeds.

### 3.1 Functional bugs (users hit these)

| # | Issue | Location | Impact |
|---|---|---|---|
| B1 | **The full-screen seek bar is not interactive** (`pointer-events-none`) | `Player.jsx:117` | **Mobile users can't seek at all.** The mini-bar scrubber is `hidden lg:flex`. |
| B2 | **The position is never saved** | the store has no persistence | Closing the tab loses the place in a 60-minute surah. This is the #1 audiobook requirement. |
| B3 | `onEnded={() => pause()}` | `PersistentPlayerBar.jsx:66` | The book stops at the end of every chapter. |
| B4 | Skip prev/next buttons do nothing | `PersistentPlayerBar.jsx:93,108`, `Player.jsx:133,145` | Dead controls. |
| B5 | `/player/:surahId` ignores the URL while something else is playing: `track = currentTrack \|\| find(...)` | `Player.jsx:15` | Opening `/player/18` while surah 2 plays shows surah 2. Deep links are broken. |
| B6 | `isPlaying` is set optimistically and never reconciled with the element | `PersistentPlayerBar.jsx:13-21` | If autoplay is blocked (deep link, iOS) or the network stalls, the UI shows "pause" while nothing plays. |
| B7 | The active verse is guessed as `floor(progress × verseCount)` | `Player.jsx:69` | Verses range from 3 to 150+ words, so the highlight drifts by minutes in long surahs. Read-along is effectively broken. |
| B8 | The header search box on `/browse` isn't wired to anything | `MainLayout.jsx:55-60` | Dead input. |
| B9 | The volume bar is a static 80% div; back/forward "history" buttons do nothing; "Learn More" and "Show all" do nothing | `PersistentPlayerBar.jsx:131-136`, `MainLayout.jsx:45-51`, `Home.jsx:42,85` | Fake UI. |
| B10 | Mobile layout: the mini-player sits at `bottom-[64px]` to clear a bottom nav **that doesn't exist**, while an 80 px sidebar takes up the phone's width | `PersistentPlayerBar.jsx:71`, `MainLayout.jsx:9` | Wasted space, a floating gap, and a cramped 295 px content column on a 375 px phone. |
| B11 | Fake user "Abdullah · Standard Member" | `MainLayout.jsx:33-40` | Implies accounts that don't exist. |

### 3.2 UX and IA problems

- **U1 Card grid for 114 chapters.** Every card uses the *same* Unsplash photo (the `sig` param doesn't change the image). The grid can't be scanned, and it depends on a third-party CDN.
- **U2 Home duplicates Browse, and Browse duplicates Library.** There are three screens with no clear purpose. Library ("Your Library") is really the full surah list, not the user's library.
- **U3 No metadata.** There are no durations (`"duration": "0:00"` for every surah), no meanings ("The Cave"), no Arabic names, no verse counts and no Meccan/Medinan labels. Names like "Al Maidah" lack proper transliteration.
- **U4 No "time left in chapter"**, no speed control, no sleep timer and no skip ±N seconds.
- **U5 No lock-screen or headphone controls** (Media Session API). This is critical for commuting.
- **U6 `select-none` on `<body>`** (`index.css:8`). Users **can't select or copy verses** in a reading app.
- **U7 Arabic is rendered in `font-serif`** with no Arabic webfont, `dir` or `lang`. Glyph shaping falls back to the system font; on Windows that's often Times/Arial, which looks poor for Uthmani script.
- **U8 Material Symbols is loaded as a full variable font from Google Fonts.** It is large, and icon ligature names ("play_arrow") flash as text before it loads.
- **U9 Tapping a card in Home/Browse/Library starts playback but doesn't open anything.** There's no way to see a chapter's details or text without playing it.
- **U10 Branding copy** ("Spotify-inspired", "Reciter: Alan (Piper TTS)") reads as a tech demo. Audiobook convention is "Narrated by …", with the translation credited ("Translation: M.A.S. Abdel Haleem").

### 3.3 Code quality and architecture

- **C1 Every page subscribes to the whole store** (`const {…} = usePlayerStore()`). `timeupdate` writes `progress` roughly 4× per second, so **Home, Browse, Library and Player all re-render about 4× per second**, including the full verse list (up to 286 verses) in Player.
- **C2 Audio logic lives inside a presentational component** (`PersistentPlayerBar`). The seek code reaches into `audioRef` from JSX, so the full-screen player *cannot* seek because it has no ref. That's the root cause of B1.
- **C3 Verse text comes from api.quran.com at runtime** through two requests per open, with `setState` inside an effect (lint error) and no abort on unmount (race condition when switching surahs fast). Offline reading depends on a NetworkFirst cache that only fills after the user has opened each surah online once.
- **C4 `dangerouslySetInnerHTML` on third-party API text** (`Player.jsx:172`). This is an XSS surface. Plain text is all that's needed.
- **C5 Duplicated code:** `handlePlay` is copy-pasted four times, `formatTime` twice, and the card markup three times.
- **C6 Dead files and dependencies:** `App.css` (Vite template), `assets/react.svg`, `assets/vite.svg`, `assets/hero.png`, and `framer-motion` (installed, never imported).
- **C7 PWA manifest references missing files:** `pwa-192.png`, `pwa-512.png`, `favicon.ico` and `apple-touch-icon.png` are not in `public/`, so install fails or shows a blank icon.
- **C8 Audio caching:** `CacheFirst` on `.mp3` without `RangeRequestsPlugin` or `cacheableResponse`. Browsers request audio with `Range:` headers, so cached playback and seeking break on Safari and are flaky elsewhere. Caching is also implicit, with no "Downloaded" state for users to see.
- **C9 Pipeline bug:** `--sentence-silence` is parsed and passed to `synthesise_surah` but **never used** (`main.py:95`). Verses are joined with `"  "`, so there's no deliberate pause between ayat.
- **C10 No tests, no TypeScript, no CI lint gate.** The lint errors above reached `main`.

---

## 4. Target architecture

```
                         ┌───────────────────────────────────────────┐
  Build time (Python)    │ scripts/                                   │
                         │  main.py  ── per-verse synth ─► WAV + timings.json
                         │  compress.py ─► MP3 (CBR)                  │
                         │  build_content.py ─► public/data/          │
                         │     surahs.json      (metadata + durations)│
                         │     text/001.json …  (verses + start/end)  │
                         └───────────────────────────────────────────┘
                                             │ static files (Netlify CDN, SW-cached)
  Runtime (React)                            ▼
  ┌──────────────────────────────────────────────────────────────────────┐
  │ audio/engine.js  (singleton HTMLAudioElement, not in React tree)     │
  │   load(surahId, startAt) · play · pause · seek · skip(±s) · rate     │
  │   emits → playerStore (coarse)   timeBus (fine-grained, rAF)         │
  │   Media Session handlers · autosave position every 5 s + on pause    │
  └──────────────┬───────────────────────────────────────────────────────┘
                 │
  ┌──────────────▼──────────────┐   ┌──────────────────────────────────┐
  │ stores/ (zustand)           │   │ hooks/                           │
  │  playerStore   (session)    │   │  useCurrentTime()  – timeBus sub │
  │  progressStore (persisted)  │   │  useSurahText(id) – fetch+cache  │
  │  bookmarkStore (persisted)  │   │  useActiveVerse(verses, t)       │
  │  settingsStore (persisted)  │   │  useSleepTimer()                 │
  └──────────────┬──────────────┘   └──────────────────────────────────┘
                 ▼
  routes/ Home · Contents · SurahDetail · Library · Search · Settings
  components/ AppShell(TabBar/SideRail) · MiniPlayer · PlayerSheet(Listen|Read)
```

**Key decisions**

| Decision | Choice | Rationale |
|---|---|---|
| Audio ownership | Module singleton `engine.js`, not a React component | Any screen can control audio without refs. React StrictMode double-mounting can't create two elements. The engine can be unit-tested without the DOM tree. |
| Time updates | Separate tiny pub/sub (`timeBus`) read through `useSyncExternalStore`, *not* the zustand store | Only components that show time re-render (scrubber, active verse). This fixes C1. |
| Persistence | `zustand/middleware` `persist` → `localStorage`, versioned with `migrate` | Resume points, bookmarks and settings are a few KB. IndexedDB isn't needed until notes grow large. |
| Content | Static JSON produced by the pipeline and served from `/data/` | Works offline, keeps text and timings in exact agreement with the audio, and removes the runtime API dependency and XSS surface. |
| Player | A full-screen **sheet** over the current route, opened via `?player=listen\|read` search param | The Android/browser back button closes it, the page behind keeps its scroll position, and deep links work (`/surah/18?player=read&t=754`). |
| Styling | Keep Tailwind and the tokens; swap Material Symbols for `lucide-react` (tree-shaken SVG) | Fixes U8 and ships only the roughly 30 icons used. |
| Language | Migrate to TypeScript incrementally (new files `.ts/.tsx`, `allowJs`) | Typed `Verse`, `Bookmark` and `Progress` shapes prevent a whole class of persistence bugs. Optional, but recommended in Sprint 0. |

**Core data shapes**

```ts
// public/data/surahs.json
type SurahMeta = {
  id: number;               // 1..114
  slug: string;             // "al-kahf"
  nameTranslit: string;     // "Al-Kahf"
  nameArabic: string;       // "الكهف"
  meaning: string;          // "The Cave"
  revelation: "meccan" | "medinan";
  verseCount: number;
  durationSec: number;      // from ffprobe
  audioUrl: string;         // "/audio/018_Al_Kahf.mp3"
  juzStart: number;         // for Juz view
};

// public/data/text/018.json
type SurahText = {
  id: number;
  bismillah: boolean;
  verses: { n: number; en: string; ar: string; start: number; end: number }[];
};

// persisted
type ProgressEntry = { position: number; duration: number; finished: boolean; updatedAt: number };
type Bookmark = { id: string; surahId: number; verse: number; time: number; note?: string; createdAt: number };
type Settings = {
  rate: number; skipBack: 10|15|30; skipFwd: 15|30|45; autoAdvance: boolean;
  showArabic: boolean; showEnglish: boolean; textScale: 0.9|1|1.15|1.3; autoScroll: boolean;
};
```

---

## 5. Target IA and screens

### Navigation

- **Mobile (< 768 px):** a **bottom tab bar** with 4 tabs (**Home · Contents · Library · Search**). The mini-player sits directly above it. The left sidebar is removed. Settings lives behind a gear icon on Home.
- **Desktop (≥ 1024 px):** the same 4 destinations in a left rail. The mini-player is a full-width bottom bar. The player sheet opens as a right-side panel (Listen and Read side by side) instead of covering the whole screen.

### Screens

```
HOME (mobile)                          CONTENTS
┌───────────────────────────────┐      ┌───────────────────────────────┐
│ Assalamu alaikum          ⚙   │      │ Contents        [Surah|Juz]   │
│ ┌───────────────────────────┐ │      │ ┌───┬─────────────────────┬─┐ │
│ │ CONTINUE LISTENING        │ │      │ │ 1 │ Al-Fatihah  الفاتحة  │◔│ │
│ │ 18 · Al-Kahf  The Cave    │ │      │ │   │ The Opening · 1m     │ │ │
│ │ v.23 · 12 min left        │ │      │ ├───┼─────────────────────┼─┤ │
│ │ ▓▓▓▓▓▓▓░░░░░   [▶ Resume] │ │      │ │ 2 │ Al-Baqarah  البقرة   │✓│ │
│ └───────────────────────────┘ │      │ │   │ The Cow · 61m        │ │ │
│ Your journey  34 / 114 · 41%  │      │ ├───┼─────────────────────┼─┤ │
│ ▓▓▓▓▓▓▓░░░░░░░░░░░░           │      │ │ 3 │ Al-Imran   آل عمران  │ │ │
│ Up next                       │      │ │   │ Family of Imran · 34m│ │ │
│  19 Maryam · Mary · 14m    ▶  │      │ └───┴─────────────────────┴─┘ │
│ Recent bookmarks              │      │   ◔ in progress ✓ finished    │
│  🔖 2:255 Ayat al-Kursi  ▶    │      │                               │
├───────────────────────────────┤      ├───────────────────────────────┤
│▁▁▁▁▁▁▁▁▁▁▁ mini-player ▁▁▁▁▁▁▁│      │ mini-player                   │
│ Home  Contents  Library Search│      │ tab bar                       │
└───────────────────────────────┘      └───────────────────────────────┘

PLAYER SHEET — LISTEN                  PLAYER SHEET — READ
┌───────────────────────────────┐      ┌───────────────────────────────┐
│ ⌄        [Listen | Read]    ⋯ │      │ ⌄        [Listen | Read]  Aa  │
│                               │      │ 18:22  لَّا تَقُولَنَّ …      │
│      ┌─────────────────┐      │      │ "Do not say of anything,…"    │
│      │   ١٨  الكهف      │      │      │ ┃18:23 إِلَّا أَن يَشَاءَ …  │
│      │   Al-Kahf       │      │      │ ┃"…without adding 'God       │
│      └─────────────────┘      │      │ ┃ willing'…"   ◀ highlighted │
│ Al-Kahf · The Cave            │      │ 18:24 …                       │
│ Verse 23 of 110               │      │        [↓ Back to current]    │
│ ●━━━━━━━━━━━━○─────────────   │      │ ●━━━━━━━━━━━━○─────────────   │
│ 14:02            -12:10 left  │      │ ⟲15   ⏮   ▶   ⏭   30⟳        │
│  ⟲15    ⏮    ( ▶ )   ⏭   30⟳  │      └───────────────────────────────┘
│ 1.0×   ☾ Sleep   🔖   ☰ Ch.   │       tap verse = seek · long-press =
└───────────────────────────────┘       bookmark / copy / share
```

- **SurahDetail** (`/surah/:id`): a header with the Arabic name, meaning, revelation and duration, a **Play/Resume** button, "Read" and "Download" actions, a list of this surah's bookmarks, then the **full verse list** (readable without playing; tap a verse to play from there).
- **Library** (`/library`): tabs for **Bookmarks · Notes · History · Downloads**.
- **Search** (`/search`): surah name, number or meaning, plus full-text search across the English verses (index built lazily from `/data/text/*.json`).

### Visual direction (updated "Emerald Night")

- Keep `surface` (#131313) and the container scale. **Reduce the green:** use `primary` only for the play button, progress and the active verse; drop glow shadows and blurred emerald blobs.
- **Cover art:** a generated typographic cover (an SVG component, no images). It shows the surah number in Arabic-Indic digits and the Arabic name on a subtle geometric pattern. The tint comes from revelation type (Meccan = deep emerald, Medinan = deep teal/gold). This makes all 114 covers distinct at zero bytes.
- **Type:** Plus Jakarta Sans for the UI; **Literata** or **Source Serif 4** for English verse reading (serif body at 1.7 line-height suits long reading); **Amiri Quran** or **Scheherazade New** for Arabic, all self-hosted with `font-display: swap`.
- **Motion:** 200 ms ease-out for sheets; a highlight fade for the active verse; everything disabled under `prefers-reduced-motion`.

---

## 6. Sprint plan

Sprints are about 1 week each for one developer. Each task lists **files**, **implementation** and **acceptance criteria (AC)**. The order matters: S0 and S1 unblock everything else.

---

### Sprint 0: Foundation and cleanup

> Outcome: lint-clean, honest UI (no dead controls), real metadata, icons and fonts fixed. No visual redesign yet.

#### S0-1 Fix lint errors and add a CI gate
- **Files:** `App.jsx`, `PersistentPlayerBar.jsx`, `Player.jsx`, new `.github/workflows/ci.yml`
- **How:**
  - Remove the unused `useLocation`, `play`, `progress` and `setProgress`.
  - Move `setLoading(true)` out of the effect by deriving loading state: `const loading = text?.id !== surahId`. This goes away completely in S3 when `useSurahText` replaces the fetch.
  - CI: `actions/setup-node@v4` → `npm ci` → `npm run lint` → `npm run build` (and later `npm test`), with `working-directory: sacred-stream`.
- **AC:** `npm run lint` exits 0; a PR fails when lint fails.

#### S0-2 Remove fake and dead UI
- **Files:** `MainLayout.jsx`, `Home.jsx`, `PersistentPlayerBar.jsx`, `Player.jsx`
- **How:** Delete the fake profile card (B11), the history arrows, "Learn More", "Show all", the static volume bar, the unwired header search, and the no-op skip buttons (they come back wired up in S1). Delete `App.css`, `assets/react.svg`, `assets/vite.svg` and `assets/hero.png`, and `npm uninstall framer-motion`.
- **AC:** Every visible control does something; `grep -r "framer-motion\|App.css" src` is empty.

#### S0-3 Generate real surah metadata
- **Files:** new `scripts/build_metadata.py`, output `sacred-stream/public/data/surahs.json`; delete `src/data/surahs.js`
- **How:**
  ```python
  # scripts/build_metadata.py
  chapters = requests.get(f"{API}/chapters?language=en").json()["chapters"]
  juzs = requests.get(f"{API}/juzs").json()["juzs"]  # verse_mapping → juzStart per surah
  for c in chapters:
      mp3 = AUDIO_DIR / f"{c['id']:03d}_{SURAH_NAMES[c['id']]}.mp3"
      dur = float(subprocess.check_output(
          ["ffprobe","-v","error","-show_entries","format=duration","-of","csv=p=0", mp3]))
      out.append(dict(id=c["id"], slug=slugify(c["name_simple"]),
          nameTranslit=c["name_simple"], nameArabic=c["name_arabic"],
          meaning=c["translated_name"]["name"], revelation=c["revelation_place"],
          verseCount=c["verses_count"], durationSec=round(dur, 2),
          audioUrl=f"/audio/{mp3.name}", juzStart=juz_for(c["id"])))
  json.dump(out, open(OUT, "w", encoding="utf-8"), ensure_ascii=False, indent=0)
  ```
  - Runtime: `src/data/catalog.ts` exports `useCatalog()`, which does `fetch('/data/surahs.json')` once and caches it in module scope. At about 20 KB it could also simply be `import`ed as JSON so it's bundled and available synchronously (**recommended**: `import surahs from '../../public/data/surahs.json'`, or move it to `src/data/surahs.json`).
- **AC:** Every surah has a non-zero `durationSec`, an Arabic name and a meaning. The UI shows "The Cave · 1h 2m"-style metadata.

#### S0-4 Replace Material Symbols with `lucide-react`
- **Files:** `index.html` (remove the font link), all components, new `src/components/Icon.tsx` (optional wrapper)
- **How:** `npm i lucide-react`. Mapping: `play_arrow→Play`, `pause→Pause`, `skip_previous→SkipBack`, `skip_next→SkipForward`, `replay_15→RotateCcw` (plus a label "15"), `forward_30→RotateCw`, `bookmark→Bookmark`, `menu_book→BookOpen`, `home→Home`, `search→Search`, `library→Library`, `expand_more→ChevronDown`, `timer→Moon`, `settings→Settings`, `download→Download`. Always pass `aria-hidden` on the icon and put an `aria-label` on the button.
- **AC:** No network request to `fonts.googleapis.com/css2?family=Material+Symbols`; no icon-name text flashes on a slow 3G throttle.

#### S0-5 Fonts, `select-none` and base typography
- **Files:** `index.html`, `index.css`, `tailwind.config.js`
- **How:**
  - Self-host with `@fontsource-variable/plus-jakarta-sans`, `@fontsource-variable/literata` and `@fontsource/amiri-quran` (or `scheherazade-new`). Import them in `main.jsx`.
  - Tailwind: `fontFamily: { ui: [...], read: ['Literata Variable','Georgia','serif'], arabic: ['Amiri Quran','Scheherazade New','serif'] }`.
  - Remove `select-none` from `body` and apply it only to controls (`button, [role=slider] { user-select:none }`).
  - Add a utility: `.arabic { font-family: theme(fontFamily.arabic); direction: rtl; line-height: 2.2; font-feature-settings: "calt","liga"; }`. Always render Arabic with `lang="ar" dir="rtl"`.
- **AC:** Verses can be selected and copied; Arabic renders in the Quranic font on Windows, macOS, iOS and Android.

#### S0-6 PWA icons and manifest
- **Files:** `public/pwa-192.png`, `public/pwa-512.png`, `public/pwa-maskable-512.png`, `public/apple-touch-icon.png`, `vite.config.js`
- **How:** Design one SVG mark and generate the PNGs with `npx @vite-pwa/assets-generator --preset minimal-2023 public/logo.svg`. Update `includeAssets` and add `{ purpose: 'maskable' }`. Rename the manifest description from "Spotify-inspired" to "The Quran in English, narrated — listen, read along, and bookmark."
- **AC:** Chrome DevTools → Application → Manifest shows no errors; "Install app" shows the icon.

---

### Sprint 1: Audio engine and audiobook playback

> Outcome: playback behaves like Audible: resume anywhere, skip ±, speed, auto-advance, lock-screen controls, sleep timer, and seeking works everywhere.

#### S1-1 Audio engine singleton
- **Files:** new `src/audio/engine.ts`, `src/audio/timeBus.ts`, `src/stores/playerStore.ts`; delete the `<audio>` from `PersistentPlayerBar`
- **How:**
  ```ts
  // src/audio/timeBus.ts — fine-grained time without re-rendering the world
  type Snap = { t: number; d: number; buffered: number };
  let snap: Snap = { t: 0, d: 0, buffered: 0 };
  const subs = new Set<() => void>();
  export const timeBus = {
    get: () => snap,
    set: (s: Snap) => { snap = s; subs.forEach(f => f()); },
    subscribe: (f: () => void) => (subs.add(f), () => subs.delete(f)),
  };
  export const useCurrentTime = () => useSyncExternalStore(timeBus.subscribe, timeBus.get);
  ```
  ```ts
  // src/audio/engine.ts
  const el = new Audio(); el.preload = 'metadata';
  let raf = 0;
  const tick = () => { timeBus.set({ t: el.currentTime, d: el.duration || 0, buffered: bufEnd() }); raf = requestAnimationFrame(tick); };
  // rAF while playing (smooth scrubber + verse sync), a single push when paused/seeked
  el.addEventListener('play',    () => { usePlayer.setState({ status: 'playing' }); raf = requestAnimationFrame(tick); });
  el.addEventListener('pause',   () => { usePlayer.setState({ status: 'paused' }); cancelAnimationFrame(raf); saveProgress(); });
  el.addEventListener('waiting', () => usePlayer.setState({ status: 'buffering' }));
  el.addEventListener('playing', () => usePlayer.setState({ status: 'playing' }));
  el.addEventListener('ended',   onEnded);          // S1-4
  el.addEventListener('error',   () => usePlayer.setState({ status: 'error', error: mediaErr(el.error) }));
  el.addEventListener('seeked',  () => timeBus.set({ ...timeBus.get(), t: el.currentTime }));

  export const engine = {
    async load(surahId: number, opts: { at?: number; autoplay?: boolean } = {}) {
      const s = catalog.byId(surahId);
      if (usePlayer.getState().surahId !== surahId) { el.src = s.audioUrl; usePlayer.setState({ surahId }); }
      const at = opts.at ?? resumePointFor(surahId);     // S1-2
      await once(el, 'loadedmetadata'); el.currentTime = at;
      el.playbackRate = useSettings.getState().rate;
      if (opts.autoplay !== false) await this.play();
      updateMediaSession(s);                              // S1-5
    },
    play:  () => el.play().catch(e => usePlayer.setState({ status: 'paused', error: e.name === 'NotAllowedError' ? 'tap-to-play' : e.message })),
    pause: () => el.pause(),
    toggle() { el.paused ? this.play() : this.pause(); },
    seek:  (t: number) => { el.currentTime = clamp(t, 0, el.duration || t); },
    skip:  (d: number) => engine.seek(el.currentTime + d),
    setRate: (r: number) => { el.playbackRate = r; useSettings.setState({ rate: r }); },
    nextSurah: () => { const id = usePlayer.getState().surahId; if (id && id < 114) engine.load(id + 1, { at: 0 }); },
    prevSurah: () => { /* if t > 3s → seek(0), else load(id-1, {at:0}) — standard audiobook behaviour */ },
  };
  ```
  - `playerStore` holds only coarse state: `{ surahId, status: 'idle'|'loading'|'playing'|'paused'|'buffering'|'error', error?, sheet: null|'listen'|'read' }`. `status` is **driven by element events**, which fixes B6.
  - Components use selectors: `const status = usePlayer(s => s.status)`. That fixes C1.
- **AC:** React DevTools "Highlight updates" shows only the scrubber and active verse re-rendering during playback. Blocking autoplay (Chrome `--autoplay-policy=document-user-activation-required`) shows a "Tap to play" state instead of a fake pause icon.

#### S1-2 Persisted progress and resume
- **Files:** new `src/stores/progressStore.ts`; `engine.ts`
- **How:**
  ```ts
  export const useProgress = create(persist<{
    bySurah: Record<number, ProgressEntry>; last: { surahId: number } | null;
    save: (id: number, position: number, duration: number) => void;
    markFinished: (id: number) => void; reset: (id: number) => void;
  }>((set) => ({
    bySurah: {}, last: null,
    save: (id, position, duration) => set(s => ({
      last: { surahId: id },
      bySurah: { ...s.bySurah, [id]: { position, duration, updatedAt: Date.now(),
        finished: s.bySurah[id]?.finished || position / duration > 0.98 } } })),
    markFinished: (id) => set(s => ({ bySurah: { ...s.bySurah, [id]: { ...s.bySurah[id], finished: true, position: 0 } } })),
    reset: (id) => set(s => { const { [id]: _, ...rest } = s.bySurah; return { bySurah: rest }; }),
  }), { name: 'ss.progress.v1', version: 1 }));
  ```
  - Save when: `pause`, `ended`, `visibilitychange → hidden`, `pagehide`, and a 5 s interval while playing (throttled; `localStorage` writes are cheap at this size).
  - `resumePointFor(id)`: if finished, return 0; otherwise `max(0, position - 3)`. Rewinding 3 s on resume is an Audible convention that helps users regain context.
  - On app boot: if `last` exists, call `engine.load(last.surahId, { autoplay: false })` so the mini-player shows "Resume Al-Kahf · 14:02" immediately.
- **AC:** Play surah 18 to 14:00, hard-refresh, and the mini-player shows Al-Kahf at 13:57; tapping play continues from there. The per-surah ring shows progress in Contents (S2).

#### S1-3 Transport controls: skip ±, speed, chapter prev/next
- **Files:** new `src/components/player/Transport.tsx`, `Scrubber.tsx`, `SpeedButton.tsx`
- **How:**
  - `Transport`: `[⟲ skipBack] [⏮ prevSurah] [▶/⏸ toggle] [⏭ nextSurah] [skipFwd ⟳]`. The big button is 72 px and the others 48 px (touch targets ≥ 44 px). The skip values come from `useSettings` (defaults 15/30).
  - `Scrubber`: native `<input type="range">` for free keyboard and screen-reader support, styled with CSS (`appearance:none`, `::-webkit-slider-thumb`, `::-moz-range-thumb`). While dragging, hold a local `dragValue` and show a floating time/verse bubble ("14:02 · v.23"); call `engine.seek` on `pointerup`/`change` only, so there's no audio stutter while dragging. It shows a buffered range as a second track layer.
    - Labels: left `elapsed`, right **`-remaining`** (tap to toggle to total). Remaining is divided by playback rate, since Audible shows real-time remaining at the current speed.
    - `aria-valuetext={`${fmt(t)} of ${fmt(d)}, verse ${v}`}`.
  - `SpeedButton`: cycles or opens a sheet with `0.75 · 0.9 · 1.0 · 1.1 · 1.25 · 1.5 · 1.75 · 2.0`, persisted, with `el.preservesPitch = true`.
  - Keyboard shortcuts (desktop, in `useHotkeys`): `Space` toggle, `←/→` skip, `Shift+←/→` prev/next verse (after S3), `[`/`]` speed, `B` bookmark (S4).
- **AC:** Seeking works on the mobile full player (fixes B1). Speed persists across reloads. Remaining time shrinks correctly at 1.5×.

#### S1-4 Auto-advance and chapter completion
- **Files:** `engine.ts`
- **How:** `onEnded`: `markFinished(id)`; if `settings.autoAdvance && id < 114`, then `engine.load(id + 1, { at: 0 })`; else set `status = 'ended'`. Show a toast: "Finished Al-Kahf · Next: Maryam". If a sleep timer is set to "end of chapter", stop instead (S1-6).
- **AC:** Surah 113 flows into 114 without interaction. 114 ends with a "You've completed the Quran" state and the option to start again.

#### S1-5 Media Session (lock screen, headphones, car)
- **Files:** `src/audio/mediaSession.ts`
- **How:**
  ```ts
  export function updateMediaSession(s: SurahMeta) {
    if (!('mediaSession' in navigator)) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: `${s.id}. ${s.nameTranslit} — ${s.meaning}`,
      artist: 'The Quran (English) · Narrated',
      album: 'Translation: M.A.S. Abdel Haleem',
      artwork: [{ src: `/covers/${s.id}.png`, sizes: '512x512', type: 'image/png' }], // S2-5 exports PNGs
    });
    const ms = navigator.mediaSession;
    ms.setActionHandler('play', () => engine.play());
    ms.setActionHandler('pause', () => engine.pause());
    ms.setActionHandler('seekbackward', d => engine.skip(-(d.seekOffset ?? settings.skipBack)));
    ms.setActionHandler('seekforward',  d => engine.skip(d.seekOffset ?? settings.skipFwd));
    ms.setActionHandler('seekto', d => engine.seek(d.seekTime!));
    ms.setActionHandler('previoustrack', () => engine.prevSurah());
    ms.setActionHandler('nexttrack', () => engine.nextSurah());
  }
  // in tick(), at most once per second:
  navigator.mediaSession.setPositionState?.({ duration: el.duration, position: el.currentTime, playbackRate: el.playbackRate });
  ```
- **AC:** On Android Chrome and iOS Safari (installed PWA), the lock screen shows the surah title, and the scrubber, play/pause and ±skip all work; Bluetooth headphone play/pause works.

#### S1-6 Sleep timer
- **Files:** `src/hooks/useSleepTimer.ts`, `src/components/player/SleepSheet.tsx`
- **How:** Options: 5, 10, 15, 30, 45, 60 min, and "End of chapter". Store `{ mode: 'minutes'|'eoc', endsAt }` in `playerStore` (not persisted). A 1 s interval checks `Date.now() >= endsAt`, then **fades out** over 10 s by ramping `el.volume` 1→0, pauses, and restores the volume. The "End of chapter" mode is handled in `onEnded`. The moon icon shows the remaining minutes as a badge.
- **AC:** The 5-minute timer stops playback with an audible fade and the position is saved.

#### S1-7 Mini-player rebuild
- **Files:** `src/components/MiniPlayer.tsx` (replaces `PersistentPlayerBar.jsx`)
- **How:** 64 px high on mobile and anchored directly above the tab bar (`bottom: calc(var(--tabbar-h) + env(safe-area-inset-bottom))`). Layout: cover (40 px), title and "v.23 · 12m left", then `⟲15` and `▶`. The thin progress line on top reads from `useCurrentTime`. Tapping the body opens the sheet (`setSearchParams({ player: 'listen' })`); swiping up also opens it (pointer events, threshold 40 px). Desktop: a full bar with Transport, Scrubber, speed, sleep and bookmark.
- **AC:** No gap under the mini-player on mobile (fixes B10); the play button doesn't open the sheet.

---

### Sprint 2: New navigation and screens

> Outcome: the Spotify shell is replaced by an audiobook shell: tab bar, Home with continue-listening, Contents TOC, surah detail page and a player sheet.

#### S2-1 App shell and routing
- **Files:** `App.tsx`, new `src/layouts/AppShell.tsx`, `src/components/nav/TabBar.tsx`, `SideRail.tsx`; delete `MainLayout.jsx`
- **How:**
  ```tsx
  <Routes>
    <Route element={<AppShell />}>
      <Route index element={<Home />} />
      <Route path="contents" element={<Contents />} />
      <Route path="surah/:id" element={<SurahDetail />} />
      <Route path="library/*" element={<Library />} />
      <Route path="search" element={<Search />} />
      <Route path="settings" element={<Settings />} />
      <Route path="player/:id" element={<LegacyPlayerRedirect />} /> {/* → /surah/:id?player=listen */}
    </Route>
  </Routes>
  ```
  - `AppShell` renders `<SideRail/>` (lg+), `<main><Outlet/></main>`, `<MiniPlayer/>`, `<TabBar/>` (< lg) and `<PlayerSheet/>`. The sheet is visible when `searchParams.get('player')` is set. Opening it uses `navigate({ search: '?player=listen' })` so **back closes it**.
  - `TabBar`: `<nav aria-label="Primary">` with 4 `NavLink`s, `aria-current="page"`, 56 px plus the safe-area inset, labels always visible.
  - Use `ScrollRestoration` (data router) or a per-route scroll memory so returning to Contents lands at the same row.
- **AC:** Phone layout has no side rail; the back button closes the player sheet; `/player/18` redirects correctly (fixes B5).

#### S2-2 Home: "Continue listening"
- **Files:** `src/routes/Home.tsx`, `src/components/ContinueCard.tsx`, `JourneyProgress.tsx`
- **How:**
  - **ContinueCard** (the hero): `progress.last` → cover, title, meaning, "Verse 23 · 12 min left", a progress bar and a big **Resume** button (`engine.load(id)` + `engine.play()`). For first-time users it shows "Begin with Al-Fatihah".
  - **JourneyProgress:** `finishedCount / 114` plus the percentage of total listening time (`Σ finished durations + partial positions / Σ durations`), shown as one quiet bar with no gamification noise.
  - **Up next:** the next unfinished surah after `last`.
  - **Recent bookmarks:** the latest 3 (after S4).
  - **Short surahs for a quick listen:** a static list (Juz 'Amma, 78–114) with durations. This gives real, useful discovery in place of fake "recommended".
- **AC:** A fresh profile sees the Begin state; a returning profile's first screen shows the resume point one tap away.

#### S2-3 Contents (table of contents)
- **Files:** `src/routes/Contents.tsx`, `src/components/SurahRow.tsx`, `ProgressRing.tsx`
- **How:**
  - A segmented control for **Surah | Juz**. The Surah view is a flat list of 114 `SurahRow`s. The Juz view is 30 collapsible groups built from `juzStart`.
  - `SurahRow`: number (tabular-nums), `nameTranslit` + `nameArabic` (right-aligned, `lang="ar"`), second line `meaning · 1h 2m · 286 verses · Medinan`, and a trailing `ProgressRing` (0–100%, ✓ when finished, pulsing bars when it's the current one).
  - **Row tap → SurahDetail. Trailing play button → play/resume directly.** This separates "look" from "play" (fixes U9).
  - Performance: 114 rows is fine without virtualisation; use `content-visibility: auto` on rows.
  - A sticky filter chip row: *All · In progress · Not started · Finished*.
- **AC:** The current surah is scrolled into view on open; everything works with the keyboard (rows are `<a>` links and the play button is a separate `<button>`).

#### S2-4 SurahDetail page
- **Files:** `src/routes/SurahDetail.tsx`
- **How:** A header (cover, names, meaning, revelation, verses, duration, progress), primary **Resume/Play** (label depends on progress), secondary **Read** (opens the sheet in Read mode *without* autoplay), **Download** (S5) and **Mark as finished/unfinished**. Then "Bookmarks in this surah" and the full **verse list**, which reuses `<VerseList>` from S3 in non-synced mode; tapping a verse plays from its `start`.
- **AC:** A user can read a whole surah without playing audio.

#### S2-5 Generated covers
- **Files:** `src/components/Cover.tsx`, `scripts/export_covers.mjs`
- **How:** An SVG component taking `{ id, nameArabic, revelation, size }`. It draws a gradient background from the revelation palette, an 8-point star pattern (`<pattern>`) at 6% opacity, the Arabic name in Amiri Quran and the number in Arabic-Indic digits (`id.toLocaleString('ar-EG')`). For Media Session artwork, a Node script uses `@resvg/resvg-js` to render the same SVG to `public/covers/{id}.png` (512×512) at build time.
- **AC:** No Unsplash requests remain; every surah cover is distinct and readable at 40 px.

#### S2-6 Player sheet: Listen tab
- **Files:** `src/components/player/PlayerSheet.tsx`, `ListenView.tsx`
- **How:** On mobile it's a full-screen sheet that slides up (CSS `transform: translateY` + `transition`, with drag-down to dismiss via pointer events; no animation library needed). On desktop (lg+) it's a right panel at 480 px width, or split 50/50 when Read is active. The header has `⌄ close`, the `Listen | Read` segmented control and an `⋯` menu (Go to surah page, Mark finished, Share). The body has the cover, title, "Verse 23 of 110" (from S3), `Scrubber`, `Transport`, and a bottom row of `SpeedButton`, `SleepButton`, `BookmarkButton` and `ChaptersButton` (opens Contents as a sheet list inside the player).
  - Focus management: on open, focus the close button and trap focus (`inert` on the background `<main>`); on close, return focus to the opener.
- **AC:** Opening, closing, swiping and back all work; screen reader announces "Now playing, Al-Kahf, dialog".

#### S2-7 Search
- **Files:** `src/routes/Search.tsx`, `src/search/index.ts`
- **How:** Two tiers. (1) An instant match on surah metadata: number, transliteration (normalised by stripping `-'` and diacritics, lowercased), meaning, and Arabic name. (2) "Search in verses": a lazy-loaded web worker that fetches all `text/*.json` (about 1 MB gz total, which the SW caches) and builds a `MiniSearch` index on `en`. Results show `18:23` plus a snippet with `<mark>`, and a tap opens `/surah/18?player=read&v=23`.
- **AC:** "cave", "kahf", "18" and "الكهف" all find Al-Kahf; "patience" returns verse hits within 300 ms after the index is warm.

---

### Sprint 3: Read-along (verse-synced text)

> Outcome: exact verse-level synchronisation. The highlight tracks the voice, tapping a verse seeks to it, and the view auto-scrolls without fighting the user.

#### S3-1 Pipeline: synthesise per verse and emit timings (the key task)
- **Files:** `extract_text.py`, `main.py`, new `scripts/build_content.py`
- **Why:** Piper narrates the whole surah as one string, so no verse boundaries exist. Guessing is inaccurate (B7). Forced alignment (aeneas/WhisperX) works but is heavy. **Synthesising verse by verse and recording sample offsets gives exact timings for free.**
- **How:**
  1. `extract_text.py`: make `get_quran_data` yield `(num, slug, verses: list[VerseText])`, where `VerseText = {n, display_en, tts_en}`. Keep **two** strings per verse: `display_en` (HTML/footnotes stripped, **no** phonetic respelling; that's what the user reads) and `tts_en` (phonetic map applied; that's what Piper speaks). Also fetch `text_uthmani` for `ar`.
  2. `main.py`, replacing `synthesise_surah`:
     ```python
     def synthesise_surah(voice, verses, out_wav, cfg, verse_gap=0.6, intro_gap=1.0):
         sr = voice.config.sample_rate
         silence = lambda s: b"\x00\x00" * int(sr * s)
         frames, timings = 0, []
         with wave.open(str(out_wav), "wb") as w:
             w.setnchannels(1); w.setsampwidth(2); w.setframerate(sr)
             # optional spoken title: "Surah Al-Kahf. The Cave."
             for pcm in _synth(voice, f"Surah {title}. {meaning}.", cfg): w.writeframes(pcm); frames += len(pcm)//2
             w.writeframes(silence(intro_gap)); frames += int(sr*intro_gap)
             for v in verses:
                 start = frames / sr
                 for pcm in _synth(voice, v["tts_en"], cfg):
                     w.writeframes(pcm); frames += len(pcm) // 2
                 end = frames / sr
                 timings.append({"n": v["n"], "start": round(start, 3), "end": round(end, 3)})
                 w.writeframes(silence(verse_gap)); frames += int(sr * verse_gap)
         return timings
     ```
     This also fixes **C9**: the gap between verses becomes an explicit, configurable pause, and `--sentence-silence` is wired into `SynthesisConfig`, or removed.
  3. Write `piper_audiobook_output/{num:03d}.timings.json` next to each WAV.
  4. `compress.py`: keep CBR (`-b:a 32k` recommended over 24k for more natural sibilants, at about +45 MB total). Add `-write_xing 0` to avoid the Xing header offsetting timings in some decoders. Remove the misleading `-q:a 4`.
  5. `scripts/build_content.py` merges text and timings into `sacred-stream/public/data/text/{NNN}.json` (`{id, bismillah, verses:[{n,en,ar,start,end}]}`) and refreshes `durationSec` in `surahs.json`.
  6. **Verification script** `scripts/check_timings.py`: for 5 random verses per surah, assert `0 ≤ start < end ≤ duration`, that timings increase monotonically, and that `verses.length === verseCount`.
- **Cost:** a full re-synthesis (the pipeline is resumable; roughly the same wall time as the original run). The audio changes slightly because Piper's noise differs per run; that's acceptable.
- **Interim fallback (ship before regeneration if needed):** estimate timings by weighting on character length. TTS duration is roughly linear in characters, so it's far better than equal slices:
  ```ts
  const lens = verses.map(v => v.en.length + 12);   // +12 ≈ inter-verse pause
  const total = lens.reduce((a,b)=>a+b); let acc = 0;
  verses.forEach((v,i) => { v.start = acc/total*dur; acc += lens[i]; v.end = acc/total*dur; });
  ```
  Mark these as `approx: true` and show a small "sync approximate" note.
- **AC:** In 10 spot checks across short and long surahs, the highlight changes within ±250 ms of the narrator starting the verse, including at 2× speed.

#### S3-2 `useSurahText` and `useActiveVerse`
- **Files:** `src/hooks/useSurahText.ts`, `src/hooks/useActiveVerse.ts`
- **How:**
  ```ts
  const cache = new Map<number, Promise<SurahText>>();
  export function loadSurahText(id: number) {
    if (!cache.has(id)) cache.set(id, fetch(`/data/text/${pad3(id)}.json`).then(r => { if (!r.ok) throw r; return r.json(); }));
    return cache.get(id)!;
  }
  export const useSurahText = (id: number) => use(loadSurahText(id));  // React 19 `use` + <Suspense>
  ```
  ```ts
  // binary search: O(log n) per frame
  export function useActiveVerse(verses: Verse[]) {
    const { t } = useCurrentTime();
    return useMemo(() => {
      let lo = 0, hi = verses.length - 1, ans = 0;
      while (lo <= hi) { const m = (lo + hi) >> 1; if (verses[m].start <= t + 0.05) { ans = m; lo = m + 1; } else hi = m - 1; }
      return ans;
    }, [verses, Math.floor(t * 10)]);   // 100 ms resolution: stable, cheap
  }
  ```
  - Wrap in `<Suspense fallback={<VerseSkeleton/>}>` and an `<ErrorBoundary>` that shows "Couldn't load text · Retry". This removes the effect and setState lint error, the race, and `dangerouslySetInnerHTML` (fixes C3 and C4).
- **AC:** Switching surahs rapidly never shows the wrong text; offline works once the file is cached (S5).

#### S3-3 Read view
- **Files:** `src/components/reader/ReadView.tsx`, `VerseList.tsx`, `VerseItem.tsx`, `ReaderToolbar.tsx`
- **How:**
  - `VerseItem` is `memo`'d with props `{ verse, state: 'past'|'active'|'future', showArabic, showEnglish }`. Only two items re-render when the active verse changes.
    ```tsx
    <article id={`v${verse.n}`} aria-current={state==='active' ? 'true' : undefined}
             className={cx('verse', state)} onClick={() => engine.seek(verse.start)}>
      <header className="verse-num">{surahId}:{verse.n}</header>
      {showArabic && <p lang="ar" dir="rtl" className="arabic text-[1.75em]">{verse.ar}</p>}
      {showEnglish && <p className="font-read text-[1.125em] leading-[1.75]">{verse.en}</p>}
    </article>
    ```
  - Styles: the active verse has full opacity, a left border in `primary` (a 3 px inset box-shadow, to respect the "no-line" rule) and a slight background `surface-container-high`. Past verses are at 70% opacity and future at 85%. **Don't** go down to 30%: users need to read ahead (fixes a contrast problem in the current design). No scale transforms, since they cause text reflow and jitter.
  - **Auto-scroll that respects the user:**
    ```ts
    const userScrolledAt = useRef(0);
    onWheel/onTouchMove/onKeyDown(scroll keys) → userScrolledAt.current = Date.now();
    useEffect(() => {
      if (!settings.autoScroll) return;
      if (Date.now() - userScrolledAt.current < 4000) { setShowReturnPill(true); return; }
      el(`#v${active}`)?.scrollIntoView({ block: 'center', behavior: reduceMotion ? 'auto' : 'smooth' });
    }, [active]);
    ```
    A floating **"↓ Back to current verse"** pill appears when the active verse is off-screen (`IntersectionObserver` on the active item) and re-centres on tap.
  - **ReaderToolbar** (`Aa` button): text size (4 steps via the `--text-scale` CSS var), Arabic on/off, English on/off, auto-scroll on/off. All stored in `settingsStore`.
  - **Long-press / right-click on a verse** opens an action sheet: *Bookmark · Add note · Copy · Share · Play from here*. Copy gives `"<en>" — Quran 18:23 (tr. Abdel Haleem)`. Share uses `navigator.share` with fallback to clipboard, and includes `https://…/surah/18?player=read&v=23`.
  - The "Verse 23 of 110" label in ListenView and the scrubber bubble uses the same `useActiveVerse`.
  - Deep link `?v=23`: on load, `engine.load(id, { at: verses[22].start, autoplay: false })` and scroll to it.
- **Desktop layout:** Listen (left, 40%) and Read (right, 60%) side by side in the sheet.
- **AC:** Tap verse 50 of Al-Baqarah and audio jumps there within 100 ms. Scroll away manually and auto-scroll pauses and the pill appears; tap the pill to resume following. VoiceOver reads the verse number and text.

#### S3-4 Verse-level navigation
- **Files:** `engine.ts`, `Transport.tsx`
- **How:** `engine.prevVerse()` / `nextVerse()` use the current surah's timings. They're exposed as keyboard `Shift+←/→`, as a long-press on the skip buttons, and optionally mapped to Media Session `previoustrack`/`nexttrack` through a settings toggle ("Headphone skip = verse | chapter").
- **AC:** In Al-Baqarah, Shift+→ moves exactly one ayah.

---

### Sprint 4: Bookmarks, notes and library

> Outcome: users can save places inside a chapter, annotate them, and find them again.

#### S4-1 Bookmark store
- **Files:** `src/stores/bookmarkStore.ts`
- **How:**
  ```ts
  export const useBookmarks = create(persist<{
    items: Bookmark[];
    add: (b: Omit<Bookmark,'id'|'createdAt'>) => string;
    update: (id: string, patch: Partial<Pick<Bookmark,'note'>>) => void;
    remove: (id: string) => void;
  }>((set) => ({
    items: [],
    add: (b) => { const id = crypto.randomUUID(); set(s => ({ items: [{ ...b, id, createdAt: Date.now() }, ...s.items] })); return id; },
    update: (id, patch) => set(s => ({ items: s.items.map(i => i.id === id ? { ...i, ...patch } : i) })),
    remove: (id) => set(s => ({ items: s.items.filter(i => i.id !== id) })),
  }), { name: 'ss.bookmarks.v1', version: 1 }));
  // derived selectors
  export const bookmarksFor = (surahId: number) => (s) => s.items.filter(b => b.surahId === surahId);
  ```
- **AC:** Bookmarks survive reload; a unit test covers add, update and remove plus the persist round-trip.

#### S4-2 Bookmark UX (the Audible pattern)
- **Files:** `BookmarkButton.tsx`, `BookmarkToast.tsx`, `NoteEditor.tsx`
- **How:**
  - One tap on 🔖 (in the player, mini-player on desktop, or `B` key) **instantly** creates a bookmark at `{surahId, verse: active, time: t}` with no dialog, so the flow isn't interrupted. A toast appears: "Bookmarked 18:23 · **Add note** · Undo" (5 s).
  - "Add note" opens a bottom sheet with a textarea (autosave on blur, 2,000 char limit, plain text).
  - The Read view's verse action sheet → Bookmark creates one at `verse.start`.
  - Visual marker: verses with bookmarks show a small 🔖 glyph in the verse header, and the scrubber shows tick marks at bookmark times.
  - If the same surah and verse is already bookmarked, the button shows a filled state; tapping it opens the existing bookmark instead of creating a duplicate.
- **AC:** Bookmarking while driving takes 1 tap; Undo removes it; notes persist.

#### S4-3 Library screen
- **Files:** `src/routes/library/*`
- **How:** Tabs are nested routes (`/library/bookmarks|notes|history|downloads`), which makes them deep-linkable.
  - **Bookmarks:** grouped by surah in canonical order (or "Recent" sort). Each item shows `18:23`, a 2-line verse snippet, the note preview and the relative date. Tap → `engine.load(surahId, { at: time })` and open the sheet. Swipe-left or ⋯ → edit note / delete.
  - **Notes:** bookmarks with a `note`, shown as a card list and searchable.
  - **History:** from `progressStore.bySurah` sorted by `updatedAt`: "Al-Kahf · stopped at v.23 · yesterday". Includes a "Clear history" option.
  - **Downloads:** S5.
  - Empty states explain the feature ("Tap 🔖 while listening to save your place").
- **AC:** Everything is reachable in 2 taps from the tab bar.

#### S4-4 Export and import (data ownership, no accounts)
- **Files:** `src/routes/Settings.tsx`, `src/lib/backup.ts`
- **How:** "Export my data" downloads `sacred-stream-backup-YYYY-MM-DD.json` containing `{ version, progress, bookmarks, settings }`. "Import" validates with `zod` and merges bookmarks by `id` and progress by `updatedAt` (newest wins). This covers moving to a new phone without building a backend.
- **Future (out of scope):** optional sync through Supabase or Firebase using the same shapes.
- **AC:** Export → clear site data → import restores everything.

---

### Sprint 5: Offline and PWA

> Outcome: download chapters (or the whole book) for commuting and flights, with visible status.

#### S5-1 Fix audio caching (range requests)
- **Files:** `vite.config.js` → switch to `strategies: 'injectManifest'` with `src/sw.ts`
- **How:**
  ```ts
  // src/sw.ts
  import { precacheAndRoute } from 'workbox-precaching';
  import { registerRoute } from 'workbox-routing';
  import { CacheFirst, StaleWhileRevalidate } from 'workbox-strategies';
  import { RangeRequestsPlugin } from 'workbox-range-requests';
  import { CacheableResponsePlugin } from 'workbox-cacheable-response';
  precacheAndRoute(self.__WB_MANIFEST);                 // app shell + surahs.json + fonts
  registerRoute(({ url }) => url.pathname.startsWith('/audio/'),
    new CacheFirst({ cacheName: 'audio-v1', plugins: [
      new CacheableResponsePlugin({ statuses: [200] }),
      new RangeRequestsPlugin() ] }));
  registerRoute(({ url }) => url.pathname.startsWith('/data/text/'),
    new StaleWhileRevalidate({ cacheName: 'text-v1' }));
  ```
  - Streaming playback (not downloaded) should **not** be written to cache implicitly. Only explicit downloads fill `audio-v1`, so storage stays predictable.
- **AC:** Download a surah, go offline, then play and **seek** on iOS Safari and Android Chrome.

#### S5-2 Download manager
- **Files:** `src/offline/downloads.ts`, `src/stores/downloadStore.ts`, `DownloadButton.tsx`, `routes/library/Downloads.tsx`
- **How:**
  ```ts
  export async function downloadSurah(s: SurahMeta, onProgress: (p: number) => void, signal: AbortSignal) {
    const res = await fetch(s.audioUrl, { signal });
    const total = +res.headers.get('content-length')!; let got = 0; const chunks: Uint8Array[] = [];
    const reader = res.body!.getReader();
    for (;;) { const { done, value } = await reader.read(); if (done) break; chunks.push(value); got += value.length; onProgress(got / total); }
    const cache = await caches.open('audio-v1');
    await cache.put(s.audioUrl, new Response(new Blob(chunks, { type: 'audio/mpeg' }), { headers: { 'Content-Length': String(got) } }));
    await caches.open('text-v1').then(c => c.add(`/data/text/${pad3(s.id)}.json`));
  }
  ```
  - `downloadStore` (persisted) tracks `{ [id]: 'none'|'queued'|'downloading'|'done'|'error' }` plus progress. On boot, reconcile it against `caches.match` so it's the source of truth.
  - A queue with 2 concurrent downloads. **"Download all"** is about 135 MB, so show the size first. Before starting, check `navigator.storage.estimate()` and call `navigator.storage.persist()` so the browser doesn't evict the cache.
  - UI: a download icon in SurahRow/SurahDetail cycles through ⬇ → a progress ring → ✓. The Library → Downloads tab lists items with sizes, a total and "Remove all".
  - A global offline banner (`navigator.onLine` + `online`/`offline` events). Undownloaded rows appear dimmed while offline.
- **AC:** "Download Juz 'Amma" (78–114) completes with progress shown; it plays in airplane mode; the storage total is correct.

#### S5-3 Update flow and install prompt
- **Files:** `src/pwa/useSWUpdate.ts`, `InstallPrompt.tsx`
- **How:** Switch `registerType` to `'prompt'` and use `virtual:pwa-register/react` `useRegisterSW` to show the toast "Update available · Reload". **Never** auto-reload while audio is playing. Capture `beforeinstallprompt` and show a subtle "Install for offline listening" card on Home after the second session. iOS gets an instruction sheet ("Share → Add to Home Screen").
- **AC:** Deploying a new build shows the update toast; playback isn't interrupted.

---

### Sprint 6: Accessibility, performance and QA

> Outcome: meets WCAG 2.2 AA, is fast on low-end phones, and is protected by tests.

#### S6-1 Accessibility pass
- All icon buttons have `aria-label`; toggle buttons use `aria-pressed` (e.g. Arabic on/off); the Listen/Read control is a `role="tablist"`.
- The player sheet is `role="dialog" aria-modal="true" aria-labelledby`, with focus trap and return.
- A live region (`aria-live="polite"`) announces "Playing Al-Kahf", "Bookmarked 18:23" and "Sleep timer set, 15 minutes". It does **not** announce every verse change.
- Contrast: verify all text pairs ≥ 4.5:1 (past verses at 70% opacity on #131313 → check `#e5e2e1` at 0.7 ≈ #a4a2a1 ≈ 7:1 ✓). Visible `:focus-visible` rings use `outline: 2px solid theme(colors.primary)`.
- Targets ≥ 44×44 px; honour `prefers-reduced-motion`; support zoom to 200% without horizontal scroll.
- Add a skip link ("Skip to content").
- **Tooling:** `eslint-plugin-jsx-a11y`, `@axe-core/playwright` in the E2E suite.

#### S6-2 Performance budget
- JS ≤ 120 kB gzip for the initial route; the search worker and MiniSearch load lazily. Route-level `lazy()` for Library, Search and Settings.
- Fonts: subset Amiri Quran to Arabic plus Quranic marks; `preload` only the UI font.
- The Read view with 286 verses should have 0 long tasks (> 50 ms) during playback. Verify in a Performance panel trace; add `content-visibility: auto; contain-intrinsic-size: 0 160px` to `VerseItem`.
- Lighthouse mobile targets: Performance ≥ 90, Accessibility 100, Best Practices ≥ 95, PWA installable.

#### S6-3 Tests
- **Unit (Vitest):** `progressStore` (save/finish thresholds, resume rewind), `bookmarkStore`, `useActiveVerse` binary search (edges: before the first verse, exactly on a boundary, after the last), `formatTime`, backup import validation and merge, and the timing-estimation fallback.
- **Component (React Testing Library):** Scrubber keyboard behaviour; the auto-scroll pause after user scroll (fake timers); the BookmarkButton → toast → undo flow.
- **E2E (Playwright, Chromium and WebKit):** (1) play → reload → resume point is restored; (2) open Read → tap verse → `audio.currentTime ≈ verse.start`; (3) bookmark → Library → tap → resumes at the bookmark; (4) download → `context.setOffline(true)` → play and seek; (5) back button closes the sheet.
  - For deterministic E2E, stub audio: serve a 30 s silent MP3 fixture and a matching `text/001.json` via `page.route`.
- **Pipeline:** `pytest` for `normalise()` (footnotes stripped; display text keeps the original spelling while TTS text gets respellings) and for `check_timings.py`.

#### S6-4 Copy and trust
- Settings → About: translation credit (M.A.S. Abdel Haleem, Oxford), a TTS disclosure ("English narration is computer-generated"), the Arabic text source (Quran.com, Uthmani), and a feedback link.
- Rename "Reciter" to "Narrated by", and use consistent transliteration from the metadata (`Al-Kahf`, not `Al Kahf`).

---

## 7. Definition of done

A task is done when all of these are true:

- `npm run lint`, `npm test` and `npm run build` pass in CI.
- It works at **375 px** (iPhone SE/mini), **768 px** and **1440 px**, and was checked in Chrome and Safari/WebKit.
- It's keyboard-operable, and there are no new axe violations.
- No new dead or fake controls.
- User-visible changes include a screenshot or short clip in the PR.
- Persisted-state shape changes bump `version` and include a `migrate` function.

---

## 8. Risks and open questions

| Risk / question | Mitigation / recommendation |
|---|---|
| Re-synthesising 12.5 h of audio for exact timings (S3-1) takes time and changes the audio slightly | The pipeline is resumable, so run it overnight. Ship the length-weighted estimate first as a stopgap. Timings can later be **verified** with WhisperX on a sample. |
| iOS PWA audio quirks (background playback, and Media Session only when installed) | Test on a real device every sprint from S1. Keep one `<audio>` element and never recreate it. |
| Storage eviction wipes downloads or bookmarks | `navigator.storage.persist()`; Export/Import (S4-4); show the "Downloaded" state from `caches.match`, not only from the store. |
| 135 MB of MP3 in git | Move audio to Netlify Large Media / Git LFS or an object store (Cloudflare R2) with `Accept-Ranges` and long `Cache-Control`. Not blocking. |
| Should the audio include the Arabic recitation too? | Out of scope for this plan. The data model (`ar` per verse plus per-verse timings) makes a later "Arabic then English" mode possible using everyayah.com per-ayah files. |
| Word-level highlighting (karaoke style) | Piper can emit phoneme alignments with `--output-raw`/alignment in newer versions. Worth revisiting after S3. Verse level is the 90% win. |
| TypeScript migration cost | Optional. If skipped, add JSDoc `@typedef`s for the data shapes in section 4 and keep `// @ts-check` in the store files. |

---

### Suggested order of first PRs

1. `chore: lint clean + remove fake UI + CI` (S0-1, S0-2)
2. `feat: surah metadata json + lucide icons + fonts` (S0-3 to S0-5)
3. `feat(audio): engine singleton + timeBus + selectors` (S1-1). **The riskiest refactor, so land it early.**
4. `feat(audio): persisted resume + skip/speed + auto-advance` (S1-2 to S1-4)
5. `feat(shell): tab bar, contents TOC, player sheet` (S2-1, S2-3, S2-6)
6. `feat(read): per-verse pipeline + read-along view` (S3)
7. `feat(bookmarks): store, 1-tap bookmark, library` (S4)
8. `feat(offline): range-request SW + download manager` (S5)
