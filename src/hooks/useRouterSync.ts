/**
 * useRouterSync — Bidirectional sync between URL and uiStore navigation.
 *
 * Reads the current URL on mount and updates uiStore.
 * Listens to uiStore changes and pushes to browser history.
 * Listens to popstate (back/forward) and updates uiStore.
 */

import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useUIStore, type NavTab } from '../store/uiStore';

const VALID_TABS = new Set(['home', 'team', 'frontoffice', 'league', 'history']);

/** Convert URL path to { tab, sub } */
function pathToNav(pathname: string): { tab: NavTab; sub: string } {
  // Strip leading slash and split
  const parts = pathname.replace(/^\/+/, '').split('/').filter(Boolean);
  const tab = parts[0] || 'home';
  const sub = parts[1] || '';

  if (!VALID_TABS.has(tab)) {
    return { tab: 'home', sub: '' };
  }
  return { tab: tab as NavTab, sub };
}

/** Convert uiStore { tab, sub } to URL path */
function navToPath(tab: NavTab, sub: string): string {
  if (tab === 'home' && !sub) return '/';
  if (!sub) return `/${tab}`;
  return `/${tab}/${sub}`;
}

export function useRouterSync() {
  const navigate = useNavigate();
  const location = useLocation();
  const { activeTab, subTab, navigate: storeNavigate } = useUIStore();
  const isPopstateRef = useRef(false);
  const lastPushedRef = useRef('');

  // On mount: read URL → update store (if URL has a path)
  useEffect(() => {
    const { tab, sub } = pathToNav(location.pathname);
    if (tab !== 'home' || sub) {
      storeNavigate(tab, sub);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only on mount

  // When store changes → push to URL (unless this was triggered by popstate)
  useEffect(() => {
    if (isPopstateRef.current) {
      isPopstateRef.current = false;
      return;
    }

    const newPath = navToPath(activeTab, subTab);
    if (newPath !== lastPushedRef.current && newPath !== location.pathname) {
      lastPushedRef.current = newPath;
      navigate(newPath, { replace: false });
    }
  }, [activeTab, subTab, navigate, location.pathname]);

  // When URL changes via back/forward → update store
  useEffect(() => {
    const { tab, sub } = pathToNav(location.pathname);
    const currentTab = useUIStore.getState().activeTab;
    const currentSub = useUIStore.getState().subTab;

    if (tab !== currentTab || sub !== currentSub) {
      isPopstateRef.current = true;
      storeNavigate(tab, sub);
    }
  }, [location.pathname, storeNavigate]);
}
