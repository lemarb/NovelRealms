import { createContext, useContext, ReactNode } from 'react';
import { Route } from '../types';
import { useRouter } from '../hooks/useRouter';

interface RouterContextValue {
  route: Route;
  navigate: (route: Route) => void;
}

const RouterContext = createContext<RouterContextValue | null>(null);

export function RouterProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  return (
    <RouterContext.Provider value={router}>
      {children}
    </RouterContext.Provider>
  );
}

export function useRouterContext() {
  const ctx = useContext(RouterContext);
  if (!ctx) throw new Error('useRouterContext must be used within RouterProvider');
  return ctx;
}
