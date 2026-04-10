import React from 'react';
import { usePlayerStore } from '../store/playerStore';
import { surahs } from '../data/surahs';

export default function Browse() {
  const { play, currentTrack, isPlaying, pause } = usePlayerStore();
  
  const handlePlay = (track) => {
    if (currentTrack?.id === track.id && isPlaying) {
      pause();
    } else {
      play(track);
    }
  };

  return (
    <section className="px-4 md:px-8 pt-6 pb-20">
      <h2 className="text-2xl font-extrabold tracking-tight mb-8 font-headline text-on-surface">Browse Surahs</h2>
      
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3 md:gap-6">
        {surahs.map((surah) => (
          <div 
             key={surah.id} 
             className="bg-surface-container-low p-3 md:p-4 rounded-xl hover:bg-surface-container-high transition-all duration-300 group cursor-pointer" 
             onClick={() => handlePlay(surah)}
          >
              <div className="relative aspect-square rounded-lg overflow-hidden mb-3 md:mb-4 bg-surface-container shadow-inner">
                  <img 
                      alt={surah.name} 
                      className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                      src={`https://images.unsplash.com/photo-1542816417-0983c9c9ad53?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80&sig=${surah.id}`}
                  />
                  <button 
                      onClick={(e) => { e.stopPropagation(); handlePlay(surah); }}
                      className="absolute bottom-2 right-2 w-10 h-10 md:w-12 md:h-12 bg-primary rounded-full flex items-center justify-center shadow-lg opacity-100 md:opacity-0 md:translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:scale-105"
                  >
                      <span className="material-symbols-outlined text-on-primary text-xl md:text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                         {currentTrack?.id === surah.id && isPlaying ? 'pause' : 'play_arrow'}
                      </span>
                  </button>
              </div>
              <h3 className="font-bold text-sm md:text-base truncate text-on-surface text-center md:text-left">{surah.id}. {surah.name}</h3>
              <p className="text-[10px] md:text-xs text-on-surface-variant mt-1 truncate text-center md:text-left">{surah.reciter}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
