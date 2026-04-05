import { useRef, useEffect, useState } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { useNavigate } from 'react-router-dom';

export default function PersistentPlayerBar() {
  const audioRef = useRef(null);
  const navigate = useNavigate();
  const { currentTrack, isPlaying, play, pause, resume, progress, duration, currentTime, setProgress, setDuration } = usePlayerStore();
  
  // Local state for UI updates
  const [localProgress, setLocalProgress] = useState(0);

  useEffect(() => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.play().catch(e => console.error("Playback error", e));
      } else {
        audioRef.current.pause();
      }
    }
  }, [isPlaying, currentTrack]);

  const handleTimeUpdate = () => {
    if (audioRef.current && audioRef.current.duration) {
      const p = audioRef.current.currentTime / audioRef.current.duration;
      setLocalProgress(p);
      setProgress(p, audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current) {
      setDuration(audioRef.current.duration);
    }
  };

  const togglePlay = (e) => {
    e.stopPropagation();
    if (!currentTrack) return;
    if (isPlaying) pause();
    else resume();
  };

  const formatTime = (timeInSecs) => {
    if (!timeInSecs || isNaN(timeInSecs)) return "0:00";
    const minutes = Math.floor(timeInSecs / 60);
    const seconds = Math.floor(timeInSecs % 60);
    return `${minutes}:${seconds < 10 ? '0' : ''}${seconds}`;
  };

  const openFullScreen = () => {
    if (currentTrack) {
        navigate(`/player/${currentTrack.id}`);
    }
  };

  if (!currentTrack) {
     return null; // Don't show if nothing has ever played
  }

  return (
    <>
      <audio 
        ref={audioRef} 
        src={currentTrack.audioUrl} 
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={() => pause()}
      />
      
      <div 
        className="fixed bottom-[64px] lg:bottom-0 left-0 w-full h-[72px] lg:h-24 glass-player z-[60] flex items-center justify-between px-4 lg:px-6 border-t border-white/5 cursor-pointer hover:bg-[#1C1B1B]/80 transition-colors shadow-[0_-20px_40px_rgba(0,0,0,0.4)]"
        onClick={openFullScreen}
      >
        {/* Track Info */}
        <div className="flex items-center gap-3 lg:gap-4 w-1/2 lg:w-1/3 min-w-0">
          <div className="w-10 h-10 lg:w-14 lg:h-14 bg-surface-container-high rounded-md overflow-hidden flex-shrink-0 relative group">
             {/* Just a generic abstract pattern for artwork for now */}
             <div className="w-full h-full bg-gradient-to-br from-primary-container to-surface-bright flex items-center justify-center">
                 <span className="material-symbols-outlined text-surface-lowest/50 text-3xl">auto_stories</span>
             </div>
             <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity lg:hidden">
                 <span className="material-symbols-outlined text-white">open_in_full</span>
             </div>
          </div>
          <div className="truncate flex-1">
            <h4 className="text-sm font-bold truncate text-on-surface">Surah {currentTrack.name}</h4>
            <p className="text-xs text-on-surface-variant truncate">{currentTrack.reciter}</p>
          </div>
          <button className="text-on-surface-variant hover:text-primary transition-colors hidden sm:block" onClick={(e) => e.stopPropagation()}>
            <span className="material-symbols-outlined text-lg">favorite_border</span>
          </button>
        </div>

        {/* Player Controls (Desktop Center, Mobile Right) */}
        <div className="flex flex-col items-center gap-1 lg:gap-2 flex-1 lg:w-1/3 max-w-xl justify-end lg:justify-center">
          <div className="flex items-center gap-4 lg:gap-6">
            <button className="text-on-surface-variant hover:text-on-surface hidden lg:block" onClick={(e) => e.stopPropagation()}>
                <span className="material-symbols-outlined text-xl">shuffle</span>
            </button>
            <button className="text-on-surface hover:text-primary transition-colors hidden lg:block" onClick={(e) => e.stopPropagation()}>
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>skip_previous</span>
            </button>
            <button 
                onClick={togglePlay} 
                className="w-10 h-10 rounded-full bg-on-surface text-surface flex items-center justify-center hover:scale-105 transition-transform active:scale-95 shadow-lg"
            >
              <span className="material-symbols-outlined text-3xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                  {isPlaying ? 'pause' : 'play_arrow'}
              </span>
            </button>
            <button className="text-on-surface hover:text-primary transition-colors hidden lg:block" onClick={(e) => e.stopPropagation()}>
                <span className="material-symbols-outlined text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>skip_next</span>
            </button>
            <button className="text-on-surface-variant hover:text-on-surface hidden lg:block" onClick={(e) => e.stopPropagation()}>
                <span className="material-symbols-outlined text-xl">repeat</span>
            </button>
          </div>
          
          {/* Progress Bar (Desktop only) */}
          <div className="hidden lg:flex items-center gap-3 w-full" onClick={(e) => e.stopPropagation()}>
            <span className="text-[10px] text-on-surface-variant w-8 text-right font-medium">{formatTime(currentTime)}</span>
            <div className="flex-1 h-1 bg-surface-container-high rounded-full relative group cursor-pointer" onClick={(e) => {
                const rect = e.currentTarget.getBoundingClientRect();
                const p = (e.clientX - rect.left) / rect.width;
                if(audioRef.current) audioRef.current.currentTime = p * audioRef.current.duration;
            }}>
              <div className="absolute top-0 left-0 h-full bg-primary rounded-full shadow-[0_0_8px_rgba(83,224,118,0.5)]" style={{ width: `${localProgress * 100}%` }}></div>
              <div 
                  className="absolute top-1/2 -translate-y-1/2 w-3 h-3 bg-on-surface rounded-full opacity-0 group-hover:opacity-100 transition-opacity -ml-1.5 shadow-sm hover:scale-110" 
                  style={{ left: `${localProgress * 100}%` }}
              ></div>
            </div>
            <span className="text-[10px] text-on-surface-variant w-8 font-medium">{formatTime(duration)}</span>
          </div>
        </div>

        {/* Volume/Action Controls (Desktop only) */}
        <div className="hidden lg:flex items-center justify-end gap-4 w-1/3" onClick={(e) => e.stopPropagation()}>
          <button className="text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined text-lg">lyrics</span>
          </button>
          <button className="text-on-surface-variant hover:text-on-surface">
              <span className="material-symbols-outlined text-lg">queue_music</span>
          </button>
          <div className="flex items-center gap-2 w-24 group cursor-pointer">
            <span className="material-symbols-outlined text-on-surface-variant text-lg group-hover:text-on-surface transition-colors">volume_up</span>
            <div className="flex-1 h-1 bg-surface-container-high rounded-full relative">
              <div className="absolute top-0 left-0 h-full w-[80%] bg-on-surface-variant group-hover:bg-primary transition-colors rounded-full"></div>
            </div>
          </div>
          <button className="text-on-surface-variant hover:text-on-surface ml-2" onClick={openFullScreen}>
             <span className="material-symbols-outlined text-xl">open_in_full</span>
          </button>
        </div>
        
        {/* Mobile thin progress bar along the top edge of player bar */}
        <div className="absolute top-0 left-0 w-full h-[2px] bg-surface-container-lowest lg:hidden">
            <div className="h-full bg-primary shadow-[0_0_8px_rgba(83,224,118,0.5)]" style={{ width: `${localProgress * 100}%` }}></div>
        </div>
      </div>
    </>
  );
}
