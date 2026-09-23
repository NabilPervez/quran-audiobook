import { Home, ListOrdered } from 'lucide-react';

// Library (bookmarks) and Search join this list when those features ship.
export const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/contents', label: 'Contents', icon: ListOrdered },
];
