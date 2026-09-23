import { Home, Library, ListOrdered, Search } from 'lucide-react';

export const NAV_ITEMS = [
  { to: '/', label: 'Home', icon: Home, end: true },
  { to: '/contents', label: 'Contents', icon: ListOrdered },
  { to: '/library', label: 'Library', icon: Library },
  { to: '/search', label: 'Search', icon: Search },
];
