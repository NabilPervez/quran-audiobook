import React from 'react';

export default function Browse() {
  const categories = [
    { title: 'Makkah Surahs', color: 'bg-[#8C33FF]', transform: 'rotate-12', icon: 'mosque' },
    { title: 'Madinah Surahs', color: 'bg-[#1DB954]', transform: '-rotate-6', icon: 'location_city' },
    { title: 'Patience', color: 'bg-[#E91E63]', transform: 'rotate-12', icon: 'hourglass_empty' },
    { title: 'Gratitude', color: 'bg-[#FF9800]', transform: '-rotate-12', icon: 'favorite' },
    { title: 'Stories of Prophets', color: 'bg-[#2196F3]', transform: 'rotate-45', icon: 'auto_stories' },
    { title: 'By Juz', color: 'bg-[#009688]', transform: 'rotate-0', icon: 'format_list_numbered' },
    { title: 'Inner Peace', color: 'bg-[#3F51B5]', transform: '-rotate-6', icon: 'spa' },
    { title: 'Global Reciters', color: 'bg-[#607D8B]', transform: 'rotate-12', icon: 'record_voice_over' },
  ];

  return (
    <section className="px-6 lg:px-8 pt-6 pb-20">
      <h2 className="text-2xl font-extrabold tracking-tight mb-8 font-headline text-on-surface">Browse All</h2>
      
      {/* Bento Grid Categories */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 lg:gap-6">
        {categories.map((cat, idx) => (
          <div 
            key={idx} 
            className={`relative overflow-hidden aspect-square rounded-xl p-4 lg:p-6 cursor-pointer ${cat.color} hover:scale-105 transition-transform duration-300 shadow-lg`}
          >
            <h3 className="text-lg lg:text-xl font-bold tracking-tight text-white drop-shadow-md z-10 relative leading-tight">{cat.title}</h3>
            
            <span 
                className={`material-symbols-outlined absolute -bottom-4 -right-2 text-[100px] opacity-20 text-white ${cat.transform}`} 
                style={{ fontVariationSettings: "'FILL' 1" }}
            >
                {cat.icon}
            </span>
            
            {/* Optional glow for specific cards */}
            <div className="absolute inset-0 bg-white opacity-0 hover:opacity-10 transition-opacity"></div>
          </div>
        ))}
      </div>
    </section>
  );
}
