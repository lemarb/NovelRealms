import { useState, useEffect, useCallback } from 'react';
import { Route } from '../types';

function parsePath(path: string): Route {
  const [pathname, queryStr] = path.split('?');
  const params = new URLSearchParams(queryStr || '');
  const segments = pathname.split('/').filter(Boolean);

  if (segments.length === 0) return { name: 'home' };

  switch (segments[0]) {
    case 'browse':
      return {
        name: 'browse',
        genre: params.get('genre') || undefined,
        search: params.get('search') || undefined,
      };
    case 'novel':
      if (segments[1] && segments[2] === 'chapter' && segments[3]) {
        return { name: 'chapter', novelId: segments[1], chapterId: segments[3] };
      }
      if (segments[1]) {
        return { name: 'novel', novelId: segments[1] };
      }
      return { name: 'home' };
    case 'profile':
      return { name: 'profile' };
    case 'admin':
      return { name: 'admin' };
    case 'auth':
      return {
        name: 'auth',
        mode: (params.get('mode') as 'login' | 'signup') || 'login',
      };
    default:
      return { name: 'home' };
  }
}

function routeToPath(route: Route): string {
  switch (route.name) {
    case 'home':
      return '/';
    case 'browse': {
      const p = new URLSearchParams();
      if (route.genre) p.set('genre', route.genre);
      if (route.search) p.set('search', route.search);
      const qs = p.toString();
      return qs ? `/browse?${qs}` : '/browse';
    }
    case 'novel':
      return `/novel/${route.novelId}`;
    case 'chapter':
      return `/novel/${route.novelId}/chapter/${route.chapterId}`;
    case 'profile':
      return '/profile';
    case 'admin':
      return '/admin';
    case 'auth': {
      const p = new URLSearchParams();
      if (route.mode) p.set('mode', route.mode);
      return `/auth?${p.toString()}`;
    }
  }
}

export function useRouter() {
  const [route, setRoute] = useState<Route>(() =>
    parsePath(window.location.pathname + window.location.search)
  );

  useEffect(() => {
    const handlePop = () => {
      setRoute(parsePath(window.location.pathname + window.location.search));
    };
    window.addEventListener('popstate', handlePop);
    return () => window.removeEventListener('popstate', handlePop);
  }, []);

  const navigate = useCallback((next: Route) => {
    const path = routeToPath(next);
    window.history.pushState(null, '', path);
    setRoute(next);
    window.scrollTo(0, 0);
  }, []);

  return { route, navigate };
}
