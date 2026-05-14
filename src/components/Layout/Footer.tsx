import { BookOpen } from 'lucide-react';
import { useRouterContext } from '../../contexts/RouterContext';

export function Footer() {
  const { navigate } = useRouterContext();
  return (
    <footer className="bg-slate-900 border-t border-slate-800 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <button
            onClick={() => navigate({ name: 'home' })}
            className="flex items-center gap-2 text-slate-50"
          >
            <BookOpen size={20} className="text-amber-400" strokeWidth={1.5} />
            <span className="text-lg font-bold">Novel<span className="text-amber-400">Realm</span></span>
          </button>
          <nav className="flex items-center gap-6">
            <button onClick={() => navigate({ name: 'home' })} className="text-slate-400 hover:text-slate-200 text-sm transition-colors">Home</button>
            <button onClick={() => navigate({ name: 'browse' })} className="text-slate-400 hover:text-slate-200 text-sm transition-colors">Browse</button>
            <button onClick={() => navigate({ name: 'browse', genre: 'fantasy' })} className="text-slate-400 hover:text-slate-200 text-sm transition-colors">Fantasy</button>
            <button onClick={() => navigate({ name: 'browse', genre: 'romance' })} className="text-slate-400 hover:text-slate-200 text-sm transition-colors">Romance</button>
          </nav>
          <p className="text-slate-500 text-sm">
            &copy; {new Date().getFullYear()} NovelRealm. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}
