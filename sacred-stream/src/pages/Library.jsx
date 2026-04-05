import React, { useState } from 'react';
import { usePlayerStore } from '../store/playerStore';
import { surahs } from '../data/surahs';

export default function Library() {
  const { play, currentTrack, isPlaying, pause } = usePlayerStore();
  const [search, setSearch] = useState('');

  const handlePlay = (track) => {
    if (currentTrack?.id === track.id && isPlaying) {
      pause();
    } else {
      play(track);
    }
  };

  const filteredSurahs = surahs.filter(surah => 
    surah.name.toLowerCase().includes(search.toLowerCase()) || 
    surah.surahNumber.toString().includes(search)
  );

  return (
    <div className="px-6 lg:px-8 pt-6 pb-20">
      <div className="flex flex-col md:flex-row md:items-end justify-between mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-extrabold tracking-tight font-headline text-on-surface">Your Library</h2>
          <p className="text-sm text-on-surface-variant mt-1">All 114 Surahs • English TTS Audio</p>
        </div>
        <div className="relative w-full md:w-64">
           <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">search</span>
           <input 
             type="text" 
             placeholder="Find a Surah..." 
             className="w-full bg-surface-container py-2 pl-9 pr-4 rounded-full text-sm text-on-surface placeholder:text-on-surface-variant/50 focus:outline-none focus:ring-1 focus:ring-primary/50"
             value={search}
             onChange={(e) => setSearch(e.target.value)}
           />
        </div>
      </div>

      <div className="space-y-1">
        {filteredSurahs.map((surah) => {
          const isActive = currentTrack?.id === surah.id;
          return (
            <div 
              key={surah.id} 
              onClick={() => handlePlay(surah)}
              className={`flex items-center justify-between p-3 lg:p-4 rounded-lg cursor-pointer transition-colors group ${isActive ? 'bg-surface-container-high' : 'hover:bg-surface-container'}`}
            >
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 flex items-center justify-center text-on-surface-variant font-bold text-sm opacity-50 w-8">
                   {isActive && isPlaying ? (
                       <span className="material-symbols-outlined text-primary" style={{ fontVariationSettings: "'FILL' 1" }}>equalizer</span>
                   ) : (
                       surah.id
                   )}
                </div>
                <div>
                  <h4 className={`font-bold transition-colors ${isActive ? 'text-primary' : 'text-on-surface group-hover:text-white'}`}>
                    Surah {surah.name}
                  </h4>
                  <p className="text-xs text-on-surface-variant">{surah.reciter}</p>
                </div>
              </div>
              <div className="flex items-center gap-6">
                 {/* Only visible on hover or active */}
                 <button className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${isActive && isPlaying ? 'bg-primary text-on-primary opacity-100' : 'bg-surface text-on-surface opacity-0 group-hover:opacity-100'}`}>
                    <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                        {isActive && isPlaying ? 'pause' : 'play_arrow'}
                    </span>
                 </button>
              </div>
            </div>
          );
        })}
        {filteredSurahs.length === 0 && (
          <div className="text-center py-12 text-on-surface-variant">
             <span className="material-symbols-outlined text-4xl mb-2 opacity-50">search_off</span>
             <p>No surahs found matching "{search}"</p>
          </div>
        )}
      </div>
    </div>
  );
}
