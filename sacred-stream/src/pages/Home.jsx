import { usePlayerStore } from '../store/playerStore';
import { surahs } from '../data/surahs';

export default function Home() {
  const { play, currentTrack, isPlaying, pause } = usePlayerStore();
  
  // Handlers
  const handlePlay = (track) => {
    if (currentTrack?.id === track.id && isPlaying) {
      pause();
    } else {
      play(track);
    }
  };

  const featureSurah = surahs[17]; // Al-Kahf (18th surah)
  const recentSurahs = [surahs[54], surahs[18], surahs[35], surahs[55], surahs[66], surahs[85]];

  return (
    <div className="px-6 lg:px-8 pt-6 pb-20">
      {/* Featured Section: Asymmetric Hero */}
      <section className="mb-12">
        <div className="relative w-full h-[320px] rounded-xl overflow-hidden group">
          <img 
            alt="Featured Recitation" 
            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105" 
            src="https://images.unsplash.com/photo-1584551246679-0daf3d275d0f?ixlib=rb-4.0.3&auto=format&fit=crop&w=1600&q=80"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-surface via-surface/60 to-transparent"></div>
          <div className="absolute bottom-10 left-6 lg:left-10 max-w-xl z-10">
            <span className="bg-primary text-on-primary text-[10px] font-extrabold px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block shadow-lg">Surah of the Day</span>
            <h1 className="text-5xl lg:text-6xl font-extrabold tracking-tighter mb-4 text-on-surface">Surah {featureSurah?.name}</h1>
            <p className="text-on-surface-variant text-base lg:text-lg mb-8 leading-relaxed max-w-md">A profound meditation on faith, patience, and the passage of time. Recited by {featureSurah?.reciter}.</p>
            <div className="flex items-center gap-4">
              <button 
                onClick={() => handlePlay(featureSurah)}
                className="bg-primary hover:bg-primary-container text-on-primary font-bold px-8 py-3 rounded-full flex items-center gap-2 transition-colors shadow-[0_0_20px_rgba(83,224,118,0.3)] hover:scale-105 active:scale-95 duration-200"
              >
                <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                   {currentTrack?.id === featureSurah?.id && isPlaying ? 'pause' : 'play_arrow'}
                </span>
                {currentTrack?.id === featureSurah?.id && isPlaying ? 'Pause' : 'Play Now'}
              </button>
              <button className="hidden sm:block bg-surface/30 backdrop-blur-md border border-outline-variant/30 text-on-surface font-bold px-8 py-3 rounded-full hover:bg-surface/50 transition-colors">
                Learn More
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Recently Played Row */}
      <section className="mb-12">
        <h2 className="text-2xl font-bold tracking-tight mb-6">Recently Recited</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-4 lg:gap-6">
          {recentSurahs.map((surah, idx) => (
            <div key={surah.id} className="bg-surface-container-low p-4 rounded-xl hover:bg-surface-container-high transition-all duration-300 group cursor-pointer" onClick={() => handlePlay(surah)}>
              <div className="relative aspect-square rounded-lg overflow-hidden mb-4 bg-surface-container shadow-inner">
                <img 
                    alt={surah.name} 
                    className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity" 
                    src={`https://images.unsplash.com/photo-1542816417-0983c9c9ad53?ixlib=rb-4.0.3&auto=format&fit=crop&w=400&q=80&sig=${idx}`}
                />
                <button 
                    onClick={(e) => { e.stopPropagation(); handlePlay(surah); }}
                    className="absolute bottom-2 right-2 w-12 h-12 bg-primary rounded-full flex items-center justify-center shadow-lg opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0 transition-all hover:scale-105"
                >
                  <span className="material-symbols-outlined text-on-primary text-2xl" style={{ fontVariationSettings: "'FILL' 1" }}>
                     {currentTrack?.id === surah.id && isPlaying ? 'pause' : 'play_arrow'}
                  </span>
                </button>
              </div>
              <h3 className="font-bold truncate text-on-surface">Surah {surah.name}</h3>
              <p className="text-xs text-on-surface-variant mt-1 truncate">{surah.reciter}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Recommended Grid */}
      <section>
        <div className="flex justify-between items-end mb-6">
          <h2 className="text-2xl font-bold tracking-tight">Recommended for You</h2>
          <span className="text-primary text-sm font-bold hover:underline cursor-pointer">Show all</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[surahs[0], surahs[70], surahs[46], surahs[66]].map((surah) => (
                <div key={surah.id} className="flex items-center gap-4 bg-surface-container-low/50 hover:bg-surface-container-high p-3 rounded-xl transition-colors cursor-pointer group" onClick={() => handlePlay(surah)}>
                    <div className="w-16 h-16 rounded-md overflow-hidden flex-shrink-0 bg-surface">
                        <img 
                            className="w-full h-full object-cover"
                            src={`https://images.unsplash.com/photo-1608670185966-13cbdd79ea44?ixlib=rb-4.0.3&auto=format&fit=crop&w=200&q=80&sig=${surah.id}`} 
                            alt={surah.name} 
                        />
                    </div>
                    <div className="flex-1 min-w-0">
                        <h4 className="font-bold text-on-surface truncate">Surah {surah.name}</h4>
                        <p className="text-sm text-on-surface-variant truncate">English TTS • {surah.reciter}</p>
                    </div>
                    <button 
                        onClick={(e) => { e.stopPropagation(); handlePlay(surah); }}
                        className={`w-10 h-10 rounded-full flex items-center justify-center transition-all ${currentTrack?.id === surah.id && isPlaying ? 'bg-primary text-on-primary opacity-100' : 'bg-surface text-on-surface opacity-0 group-hover:opacity-100'}`}
                    >
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                            {currentTrack?.id === surah.id && isPlaying ? 'pause' : 'play_arrow'}
                        </span>
                    </button>
                </div>
            ))}
        </div>
      </section>
    </div>
  );
}
