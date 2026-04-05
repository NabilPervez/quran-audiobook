import { Outlet, Link, useLocation } from 'react-router-dom';

export default function MainLayout() {
  const location = useLocation();
  const path = location.pathname;

  return (
    <div className="flex min-h-screen bg-surface">
      {/* Side Navigation (Desktop) */}
      <aside className="h-screen w-64 hidden lg:flex flex-col sticky top-0 left-0 bg-[#131313] p-6 gap-y-4 text-sm tracking-tight border-r border-white/5">
        <div className="mb-8">
          <h1 className="text-xl font-bold tracking-tighter text-primary">The Sacred Stream</h1>
          <p className="text-[10px] text-on-surface-variant tracking-widest uppercase mt-1">Premium Quran Audio</p>
        </div>
        <nav className="flex flex-col gap-y-2">
          <Link to="/" className={`flex items-center gap-4 px-2 py-2 transition-colors duration-200 ${path === '/' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: path === '/' ? "'FILL' 1" : "" }}>home</span>
            <span>Home</span>
          </Link>
          <Link to="/browse" className={`flex items-center gap-4 px-2 py-2 transition-colors duration-200 ${path === '/browse' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: path === '/browse' ? "'FILL' 1" : "" }}>explore</span>
            <span>Browse</span>
          </Link>
          <Link to="/library" className={`flex items-center gap-4 px-2 py-2 transition-colors duration-200 ${path === '/library' ? 'text-primary font-bold' : 'text-on-surface-variant hover:text-primary'}`}>
            <span className="material-symbols-outlined" style={{ fontVariationSettings: path === '/library' ? "'FILL' 1" : "" }}>library_music</span>
            <span>Your Library</span>
          </Link>
          <Link to="#" className="flex items-center gap-4 px-2 py-2 text-on-surface-variant hover:text-primary transition-colors duration-200">
            <span className="material-symbols-outlined">favorite</span>
            <span>Liked Surahs</span>
          </Link>
        </nav>
        <div className="mt-auto pt-6">
          <div className="bg-surface-container-high p-4 rounded-xl flex items-center gap-3 cursor-pointer hover:bg-surface-bright transition-colors">
            <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center overflow-hidden flex-shrink-0">
               <span className="material-symbols-outlined text-primary">person</span>
            </div>
            <div>
              <p className="text-xs font-bold text-on-surface truncate">Abdullah</p>
              <p className="text-[10px] text-on-surface-variant truncate">Premium Member</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col relative min-w-0 pb-[88px] lg:pb-32">
        {/* TopAppBar */}
        <header className="flex justify-between items-center w-full px-6 lg:px-8 h-20 sticky top-0 z-40 bg-[#131313]/70 backdrop-blur-3xl border-b border-white/5">
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
                <input className="w-full bg-surface-container-high border-none rounded-full py-3 pl-12 pr-4 text-sm font-medium focus:ring-1 focus:ring-primary/30 placeholder:text-on-surface-variant transition-all outline-none text-on-surface" placeholder="What do you want to listen to?" type="text"/>
              </div>
            )}
          </div>
          <div className="flex items-center gap-4">
             <button className="hidden md:flex bg-gradient-to-r from-primary to-primary-container text-on-primary px-6 py-2 rounded-full text-sm font-extrabold hover:scale-105 transition-transform shadow-[0_0_15px_rgba(83,224,118,0.2)]">
                  Explore Premium
             </button>
             <button className="lg:hidden text-on-surface">
                <span className="material-symbols-outlined text-3xl">account_circle</span>
             </button>
          </div>
        </header>

        {/* Dynamic Route Content */}
        <Outlet />
        
        {/* Ambient Blur effect to give spatial feeling */}
        <div className="fixed top-1/2 right-0 -translate-y-1/2 w-96 h-96 bg-primary/5 blur-[120px] pointer-events-none -z-10"></div>
      </main>

      {/* Bottom Mobile Nav */}
      <nav className="fixed bottom-0 left-0 w-full z-50 flex justify-around items-center h-16 pb-safe bg-[#131313]/90 backdrop-blur-2xl lg:hidden text-[10px] font-medium border-t border-white/5">
        <Link to="/" className={`flex flex-col items-center justify-center transition-all duration-300 ${path === '/' ? 'text-primary' : 'text-on-surface-variant active:text-on-surface'}`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: path === '/' ? "'FILL' 1" : "" }}>home</span>
          <span>Home</span>
        </Link>
        <Link to="/browse" className={`flex flex-col items-center justify-center transition-all duration-300 ${path === '/browse' ? 'text-primary' : 'text-on-surface-variant active:text-on-surface'}`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: path === '/browse' ? "'FILL' 1" : "" }}>search</span>
          <span>Browse</span>
        </Link>
        <Link to="/library" className={`flex flex-col items-center justify-center transition-all duration-300 ${path === '/library' ? 'text-primary' : 'text-on-surface-variant active:text-on-surface'}`}>
          <span className="material-symbols-outlined" style={{ fontVariationSettings: path === '/library' ? "'FILL' 1" : "" }}>subscriptions</span>
          <span>Library</span>
        </Link>
        <Link to="#" className="flex flex-col items-center justify-center text-on-surface-variant active:text-on-surface transition-all duration-300">
          <span className="material-symbols-outlined">favorite</span>
          <span>Liked</span>
        </Link>
      </nav>
    </div>
  );
}
