import { NavLink, Outlet } from 'react-router-dom';

const TABS = [
  { to: '/library', label: 'Bookmarks', end: true },
  { to: '/library/notes', label: 'Notes' },
  { to: '/library/history', label: 'History' },
];

/** Library shell: tabs are routes, so each one is linkable and back-button friendly. */
export default function Library() {
  return (
    <div className="max-w-3xl mx-auto px-4 lg:px-8 pt-6">
      <h1 className="text-3xl font-extrabold tracking-tight">Library</h1>
      <nav aria-label="Library sections" className="flex gap-2 mt-4 mb-4">
        {TABS.map((t) => (
          <NavLink
            key={t.to}
            to={t.to}
            end={t.end}
            className={({ isActive }) =>
              `px-4 h-9 flex items-center rounded-full text-sm font-semibold transition-colors ${
                isActive ? 'bg-on-surface text-surface' : 'bg-surface-container text-on-surface-variant hover:text-on-surface'
              }`
            }
          >
            {t.label}
          </NavLink>
        ))}
      </nav>
      <Outlet />
    </div>
  );
}
