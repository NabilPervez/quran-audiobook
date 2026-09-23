import { Home, ListOrdered, Search } from 'lucide-react';

// Library (bookmarks) joins this list when that feature ships.
export const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/contents', label: 'Contents', icon: ListOrdered },
  { to: '/search', label: 'Search', icon: Search },
];
