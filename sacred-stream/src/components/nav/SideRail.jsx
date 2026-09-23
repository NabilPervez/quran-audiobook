import { NavLink } from 'react-router-dom';
import { Settings } from 'lucide-react';
import { NAV_ITEMS } from './navItems';
import { NARRATION } from '../../data/catalog';

/** Left navigation for large screens. */
export default function SideRail() {
  return (
    <aside className="hidden lg:flex flex-col w-60 shrink-0 h-screen sticky top-0 bg-surface-container-lowest px-4 py-6 gap-6">
      <div className="px-3">
        <p className="text-lg font-extrabold tracking-tight text-on-surface">The Sacred Stream</p>
        <p className="text-xs text-on-surface-variant mt-0.5">The Quran in English, narrated</p>
      </div>
      <nav aria-label="Primary">
        <ul className="flex flex-col gap-1">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end }) => (
            <li key={to}>
              <NavLink
                to={to}
                end={end}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
                    isActive ? 'bg-surface-container-high text-on-surface' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
                  }`
                }
              >
                <Icon size={20} aria-hidden />
                {label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
      <NavLink
        to="/settings"
        className={({ isActive }) =>
          `mt-auto flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
            isActive ? 'bg-surface-container-high text-on-surface' : 'text-on-surface-variant hover:text-on-surface hover:bg-surface-container'
          }`
        }
      >
        <Settings size={20} aria-hidden />
        Settings
      </NavLink>
      <p className="px-3 pb-24 text-[11px] leading-relaxed text-on-surface-variant">
        Translation: {NARRATION.translation}
        <br />
        Narration: {NARRATION.narrator}
      </p>
    </aside>
  );
}
