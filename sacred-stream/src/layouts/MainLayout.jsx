import { Outlet, Link, useLocation } from 'react-router-dom';

export default function MainLayout() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Side Navigation (Responsive) */}
      <aside className="h-screen w-20 md:w-64 flex flex-col sticky top-0 left-0 bg-[#131313] p-4 md:p-6 gap-y-4 text-sm tracking-tight border-r border-white/5 transition-all z-50">
        <div className="mb-8 hidden md:block">
          <h1 className="text-xl font-bold tracking-tighter text-primary">The Sacred Stream</h1>
          <p className="text-[10px] text-on-surface-variant tracking-widest uppercase mt-1">English Quran Audiobook</p>
        </div>
        <div className="mb-8 mt-2 flex justify-center md:hidden">
          <span className="material-symbols-outlined text-primary text-3xl">water_drop</span>
        </div>
        <nav className="flex flex-col gap-y-2">
          <Link to="/" className={`flex flex-col md:flex-row items-center gap-1 md:gap-4 px-2 py-3 transition-colors duration-200 rounded-lg ${path === '/' ? 'text-primary font-bold bg-surface-container/50' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container/30'}`}>
            <span className="material-symbols-outlined text-2xl md:text-xl" style={{ fontVariationSettings: path === '/' ? "'FILL' 1" : "" }}>home</span>
            <span className="text-[10px] md:text-sm font-medium">Home</span>
          </Link>
          <Link to="/browse" className={`flex flex-col md:flex-row items-center gap-1 md:gap-4 px-2 py-3 transition-colors duration-200 rounded-lg ${path === '/browse' ? 'text-primary font-bold bg-surface-container/50' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container/30'}`}>
            <span className="material-symbols-outlined text-2xl md:text-xl" style={{ fontVariationSettings: path === '/browse' ? "'FILL' 1" : "" }}>explore</span>
            <span className="text-[10px] md:text-sm font-medium">Browse</span>
          </Link>
          <Link to="/library" className={`flex flex-col md:flex-row items-center gap-1 md:gap-4 px-2 py-3 transition-colors duration-200 rounded-lg ${path === '/library' ? 'text-primary font-bold bg-surface-container/50' : 'text-on-surface-variant hover:text-primary hover:bg-surface-container/30'}`}>
            <span className="material-symbols-outlined text-2xl md:text-xl" style={{ fontVariationSettings: path === '/library' ? "'FILL' 1" : "" }}>library_music</span>
            <span className="text-[10px] md:text-sm font-medium">Library</span>
          </Link>
        </nav>
        <div className="mt-auto pt-6">
          <div className="bg-surface-container-high p-2 md:p-4 rounded-xl flex items-center justify-center md:justify-start gap-3 cursor-pointer hover:bg-surface-bright transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
               <span className="material-symbols-outlined text-primary">person</span>
            </div>
            <div className="hidden md:block min-w-0 flex-1">
              <p className="text-xs font-bold text-on-surface truncate">Abdullah</p>
              <p className="text-[10px] text-on-surface-variant truncate">Standard Member</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative min-w-0 pb-[88px] md:pb-32">
        {/* TopAppBar */}
        <header className="flex justify-between items-center w-full px-4 md:px-8 h-16 md:h-20 sticky top-0 z-40 bg-[#131313]/70 backdrop-blur-3xl border-b border-white/5">
          <div className="flex items-center gap-4 flex-1 max-w-2xl">
            <div className="gap-2 mr-4 hidden md:flex">
               <button className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined text-sm">arrow_back_ios</span>
               </button>
               <button className="w-8 h-8 rounded-full bg-surface-container-lowest flex items-center justify-center text-on-surface hover:bg-surface-container-high transition-colors">
                  <span className="material-symbols-outlined text-sm">arrow_forward_ios</span>
               </button>
            </div>
            {path === '/browse' && (
              <div className="relative w-full group">
                <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant group-focus-within:text-primary transition-colors">search</span>
                <input className="w-full bg-surface-container-high border-none rounded-full py-2.5 md:py-3 pl-12 pr-4 text-sm font-medium focus:ring-1 focus:ring-primary/30 placeholder:text-on-surface-variant transition-all outline-none text-on-surface" placeholder="Search surahs..." type="text"/>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
             {/* No Extra Buttons to conflict here */}
          </div>
        </header>

        {/* Dynamic Route Content */}
        <Outlet />
        
        {/* Ambient Blur effect to give spatial feeling */}
        <div className="fixed top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-primary/5 blur-[120px] pointer-events-none -z-10"></div>
      </main>
    </div>
  );
}
