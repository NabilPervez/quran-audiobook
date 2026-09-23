import { useCallback } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';

/**
 * The player is a sheet over the current page, addressed by search params:
 *   ?player=18            Listen view for surah 18
 *   ?player=18&view=read  Read view
 *   &v=23                 scroll to / start from verse 23
 * Opening pushes a history entry, so the browser/Android back button closes it.
 */
export function usePlayerSheet() {
  const [params] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  const openId = Number(params.get('player')) || null;
  const view = params.get('view') === 'read' ? 'read' : 'listen';
  const verse = Number(params.get('v')) || null;

  const withParams = useCallback(
    (mutate) => {
      const next = new URLSearchParams(location.search);
      mutate(next);
      const search = next.toString();
      return { pathname: location.pathname, search: search ? `?${search}` : '' };
    },
    [location.pathname, location.search]
  );

  const open = useCallback(
    (id, { view: v = 'listen', verse: n } = {}) => {
      const to = withParams((p) => {
        p.set('player', String(id));
        if (v === 'read') p.set('view', 'read');
        else p.delete('view');
        if (n) p.set('v', String(n));
        else p.delete('v');
      });
      navigate(to, { state: { sheet: true } });
    },
    [navigate, withParams]
  );

  const close = useCallback(() => {
    // If we opened the sheet ourselves, going back restores the page exactly.
    if (location.state?.sheet) navigate(-1);
    else
      navigate(
        withParams((p) => ['player', 'view', 'v'].forEach((k) => p.delete(k))),
        { replace: true }
      );
  }, [location.state, navigate, withParams]);

  const setView = useCallback(
    (v) =>
      navigate(
        withParams((p) => (v === 'read' ? p.set('view', 'read') : p.delete('view'))),
        { replace: true, state: location.state }
      ),
    [navigate, withParams, location.state]
  );

  return { openId, view, verse, open, close, setView };
}
