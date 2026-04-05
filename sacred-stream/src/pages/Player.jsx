import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { usePlayerStore } from '../store/playerStore';
import { surahs } from '../data/surahs';

export default function Player() {
  const { surahId } = useParams();
  const navigate = useNavigate();
  const { currentTrack, isPlaying, play, pause, resume, progress, duration, currentTime, setProgress } = usePlayerStore();
  
  const [verses, setVerses] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fallback to URL param if nothing is playing
  const track = currentTrack || surahs.find(s => s.id === parseInt(surahId));

  useEffect(() => {
    // If we land here but this track isn't currently loaded, start it
    if (track && currentTrack?.id !== track.id) {
       play(track);
    }
  }, [track, currentTrack, play]);

  // Fetch Verses on mount
  useEffect(() => {
    if (!track) return;
    setLoading(true);
    // Fetch verses with translations=85 (Abdul Haleem - English) and fields=text_uthmani
    fetch(`https://api.quran.com/api/v4/verses/by_chapter/${track.id}?language=en&words=false&translations=85`)
      .then(res => res.json())
      .then(data => {
         // Also need arabic text. In v4 you often fetch text_uthmani separately, or include it
         // the quran.com api typically needs fields=text_uthmani to return the arabic string along with translations
         return fetch(`https://api.quran.com/api/v4/quran/verses/uthmani?chapter_number=${track.id}`)
            .then(arRes => arRes.json())
            .then(arData => {
               const combined = data.verses.map((v, i) => ({
                 id: v.id,
                 verse_key: v.verse_key,
                 english: v.translations[0]?.text?.replace(/<sup.*?<\/sup>/g, '') || '', // strip footnotes
                 arabic: arData.verses[i]?.text_uthmani || ''
               }));
               setVerses(combined);
               setLoading(false);
            });
      })
      .catch(err => {
         console.error(err);
         setLoading(false);
      });
  }, [track?.id]);

  const togglePlay = () => {
    if (isPlaying) pause();
    else resume();
  };

  const closePlayer = () => {
    navigate(-1); // go back
  };

  const formatTime = (timeInSecs) => {
    if (!timeInSecs || isNaN(timeInSecs)) return "0:00";
    const minutes = Math.floor(timeInSecs / 60);
    const seconds = Math.floor(timeInSecs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  if (!track) return <div className="p-8 text-on-surface">Track not found</div>;

  // We map the active verse purely by progress ratio over the track just as a mock,
  // exact sync requires timestamp data per verse which isn't available easily here.
  const activeVerseIndex = verses.length > 0 ? Math.floor(progress * verses.length) : 0;

  return (
    <div className="fixed inset-0 z-[100] bg-player-gradient overflow-hidden flex flex-col font-body">
      
      {/* Top Navigation Bar */}
      <header className="absolute top-0 left-0 w-full z-10 flex justify-between items-center px-6 lg:px-12 h-20 bg-transparent text-on-surface">
        <button onClick={closePlayer} className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-highest/30 backdrop-blur-md transition-colors">
          <span className="material-symbols-outlined">expand_more</span>
        </button>
        <div className="text-center group cursor-pointer">
          <p className="text-[10px] tracking-[0.2em] uppercase font-bold text-on-surface-variant group-hover:text-primary transition-colors">PLAYING FROM SURAH</p>
          <h1 className="font-headline text-sm font-extrabold tracking-tight">Surah {track.name}</h1>
        </div>
        <button className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-surface-container-highest/30 backdrop-blur-md transition-colors">
          <span className="material-symbols-outlined">more_vert</span>
        </button>
      </header>

      <main className="flex-1 flex flex-col lg:flex-row h-full">
        {/* Left Section: Visuals & Controls */}
        <section className="flex-1 flex flex-col items-center justify-center px-8 pt-24 pb-4 lg:py-0">
          
          {/* Artwork */}
          <div className="relative w-full max-w-[420px] aspect-square group shadow-2xl rounded-2xl">
            <div className={`absolute inset-0 bg-primary blur-[80px] rounded-full transition-all duration-700 ${isPlaying ? 'opacity-30 scale-105' : 'opacity-10 scale-95'}`}></div>
            <div className="relative w-full h-full object-cover rounded-2xl z-10 bg-gradient-to-br from-surface-container-high to-surface-lowest flex items-center justify-center overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1519681393784-d120267933ba?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80')] bg-cover bg-center opacity-40 mix-blend-overlay"></div>
               <span className="material-symbols-outlined text-9xl text-white/80 z-20">library_music</span>
            </div>
          </div>

          {/* Track Info */}
          <div className="mt-10 text-left w-full max-w-[420px] z-10">
            <div className="flex justify-between items-end">
              <div>
                <h2 className="text-3xl lg:text-4xl font-headline font-bold tracking-tighter text-on-surface leading-tight">Surah {track.name}</h2>
                <p className="text-lg text-primary font-medium mt-1">{track.reciter}</p>
              </div>
              <button className="text-on-surface-variant hover:text-primary hover:scale-110 transition-all mb-1">
                <span className="material-symbols-outlined text-3xl">favorite_border</span>
              </button>
            </div>
          </div>

          {/* Seek Bar */}
          <div className="mt-8 w-full max-w-[420px] space-y-2 z-10 cursor-pointer pointer-events-none">
             {/* Read only from this view to keep it clean, though it could be interactive */}
            <div className="relative h-1.5 w-full bg-surface-container-highest rounded-full overflow-hidden">
              <div className="absolute top-0 left-0 h-full bg-primary shadow-[0_0_8px_rgba(83,224,118,0.6)]" style={{ width: `${progress * 100}%` }}></div>
            </div>
            <div className="flex justify-between text-[10px] font-bold text-on-surface-variant tracking-wider">
              <span>{formatTime(currentTime)}</span>
              <span>{formatTime(duration)}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="mt-8 flex items-center justify-between w-full max-w-[420px] z-10">
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-2xl">shuffle</span>
            </button>
            <div className="flex items-center gap-6 lg:gap-8">
              <button className="text-on-surface hover:text-primary transition-colors active:scale-90">
                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>skip_previous</span>
              </button>
              <button 
                  onClick={togglePlay}
                  className="w-20 h-20 flex items-center justify-center rounded-full bg-gradient-to-br from-primary to-primary-container text-on-primary shadow-[0_0_20px_rgba(83,224,118,0.2)] hover:scale-105 hover:shadow-[0_0_30px_rgba(83,224,118,0.4)] transition-all active:scale-95"
              >
                <span className="material-symbols-outlined text-5xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                   {isPlaying ? 'pause' : 'play_arrow'}
                </span>
              </button>
              <button className="text-on-surface hover:text-primary transition-colors active:scale-90">
                <span className="material-symbols-outlined text-4xl" style={{ fontVariationSettings: "'FILL' 1" }}>skip_next</span>
              </button>
            </div>
            <button className="text-on-surface-variant hover:text-primary transition-colors">
              <span className="material-symbols-outlined text-2xl">repeat</span>
            </button>
          </div>
        </section>

        {/* Right Section: Synchronized Text */}
        <section className="flex-1 lg:h-full bg-surface-container-low/20 lg:bg-surface-container-low/40 lg:backdrop-blur-xl lg:rounded-l-[40px] px-8 lg:px-16 py-12 lg:py-24 overflow-y-auto custom-scrollbar border-l border-white/5 pb-32 lg:pb-24">
          <div className="max-w-2xl mx-auto space-y-12 lg:space-y-16">
            {loading ? (
                <div className="flex items-center justify-center text-primary animate-pulse py-20">
                    <span className="material-symbols-outlined animate-spin text-4xl mr-3">progress_activity</span>
                    <span className="font-bold tracking-widest text-sm uppercase">Loading Sacred Text...</span>
                </div>
            ) : verses.map((verse, index) => {
                const isActive = index === activeVerseIndex;
                return (
                  <div 
                      key={verse.id} 
                      className={`transition-all duration-700 ${isActive ? 'active-verse text-on-surface scale-[1.02] opacity-100' : 'text-on-surface-variant opacity-30 hover:opacity-70 scale-100'}`}
                  >
                    {isActive && (
                      <div className="flex items-center gap-4 mb-4">
                        <span className="w-8 h-px bg-primary"></span>
                        <span className="text-[10px] font-bold tracking-widest text-primary uppercase">Current Verse</span>
                      </div>
                    )}
                    <h3 className={`text-right font-serif text-3xl lg:text-4xl mb-4 lg:mb-6 leading-loose tracking-wide ${isActive ? 'text-primary' : ''}`}>
                        {verse.arabic} <span className="text-sm opacity-50 ml-2">({verse.verse_key.split(':')[1]})</span>
                    </h3>
                    <div dangerouslySetInnerHTML={{ __html: `<p class="text-xl lg:text-2xl ${isActive ? 'font-bold leading-snug drop-shadow-sm' : 'font-medium leading-relaxed'}">${verse.english}</p>` }}></div>
                  </div>
                );
            })}
          </div>
        </section>
      </main>

      {/* Glass Overlay for Tablet/Desktop Floating Feel */}
      <div className="hidden lg:block fixed top-1/2 -translate-y-1/2 right-4 w-1.5 h-32 bg-on-surface/10 rounded-full overflow-hidden">
        <div className="w-full bg-primary shadow-[0_0_10px_rgba(83,224,118,0.4)] absolute bottom-0 transition-all duration-300" style={{ height: `${progress * 100}%` }}></div>
      </div>
    </div>
  );
}
