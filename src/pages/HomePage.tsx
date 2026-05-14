import { useEffect, useState } from 'react';
import { TrendingUp, Clock, ChevronRight, Flame } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Novel, Genre } from '../types';
import { NovelCard } from '../components/Novels/NovelCard';
import { useRouterContext } from '../contexts/RouterContext';

export function HomePage() {
  const { navigate } = useRouterContext();
  const [trending, setTrending] = useState<Novel[]>([]);
  const [recent, setRecent] = useState<Novel[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const [trendRes, recentRes, genreRes] = await Promise.all([
        supabase
          .from('novels')
          .select('*, novel_genres(genre:genres(id,name,slug))')
          .order('views', { ascending: false })
          .limit(8),
        supabase
          .from('novels')
          .select('*, novel_genres(genre:genres(id,name,slug))')
          .order('updated_at', { ascending: false })
          .limit(8),
        supabase.from('genres').select('*').order('name'),
      ]);

      function normalizeNovels(data: Record<string, unknown>[] | null): Novel[] {
        return (data || []).map((n) => ({
          ...n,
          genres: ((n.novel_genres as { genre: Genre }[]) || [])
            .map((ng) => ng.genre)
            .filter(Boolean),
        })) as Novel[];
      }

      setTrending(normalizeNovels(trendRes.data as Record<string, unknown>[] | null));
      setRecent(normalizeNovels(recentRes.data as Record<string, unknown>[] | null));
      setGenres(genreRes.data || []);
      setLoading(false);
    }
    load();
  }, []);

  const popularGenres = genres.slice(0, 12);

  return (
    <div className="min-h-screen bg-slate-950">
      <section className="relative bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 py-20 px-4 text-center overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_var(--tw-gradient-stops))] from-amber-900/20 via-transparent to-transparent" />
        <div className="relative max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-medium px-4 py-1.5 rounded-full mb-6">
            <Flame size={12} />
            Your Gateway to Translated Novels
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-slate-50 leading-tight mb-4">
            Discover Amazing<br />
            <span className="text-amber-400">Translated Stories</span>
          </h1>
          <p className="text-slate-400 text-lg mb-8 max-w-xl mx-auto">
            Explore thousands of translated novels from Asia and beyond — free, fast, and always updated.
          </p>
          <div className="flex items-center justify-center gap-4 flex-wrap">
            <button
              onClick={() => navigate({ name: 'browse' })}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Browse Library
            </button>
            <button
              onClick={() => navigate({ name: 'browse', genre: 'fantasy' })}
              className="bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium px-6 py-3 rounded-xl transition-colors text-sm"
            >
              Explore Fantasy
            </button>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-14">
        {genres.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-slate-100">Browse by Genre</h2>
              <button onClick={() => navigate({ name: 'browse' })} className="text-amber-400 text-sm hover:text-amber-300 flex items-center gap-1 transition-colors">
                View all <ChevronRight size={14} />
              </button>
            </div>
            <div className="flex flex-wrap gap-2">
              {popularGenres.map((g) => (
                <button
                  key={g.id}
                  onClick={() => navigate({ name: 'browse', genre: g.slug })}
                  className="bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-amber-400 border border-slate-700 hover:border-amber-500/40 text-xs font-medium px-4 py-2 rounded-full transition-all"
                >
                  {g.name}
                </button>
              ))}
            </div>
          </section>
        )}

        <section>
          <div className="flex items-center justify-between mb-5">
            <h2 className="flex items-center gap-2 text-lg font-bold text-slate-100">
              <TrendingUp size={18} className="text-amber-400" />
              Trending Now
            </h2>
            <button onClick={() => navigate({ name: 'browse' })} className="text-amber-400 text-sm hover:text-amber-300 flex items-center gap-1 transition-colors">
              See more <ChevronRight size={14} />
            </button>
          </div>
          {loading ? (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="animate-pulse">
                  <div className="bg-slate-800 rounded-xl aspect-[3/4]" />
                  <div className="mt-2 space-y-1.5 p-2">
                    <div className="h-3 bg-slate-800 rounded w-full" />
                    <div className="h-3 bg-slate-800 rounded w-2/3" />
                  </div>
                </div>
              ))}
            </div>
          ) : trending.length === 0 ? (
            <div className="text-center py-16 text-slate-500">
              <p>No novels yet. Check back soon!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {trending.slice(0, 6).map((novel) => (
                <NovelCard key={novel.id} novel={novel} />
              ))}
            </div>
          )}
        </section>

        {recent.length > 0 && (
          <section>
            <div className="flex items-center justify-between mb-5">
              <h2 className="flex items-center gap-2 text-lg font-bold text-slate-100">
                <Clock size={18} className="text-sky-400" />
                Recently Updated
              </h2>
              <button onClick={() => navigate({ name: 'browse' })} className="text-amber-400 text-sm hover:text-amber-300 flex items-center gap-1 transition-colors">
                See more <ChevronRight size={14} />
              </button>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
              {recent.slice(0, 8).map((novel) => (
                <NovelCard key={novel.id} novel={novel} compact />
              ))}
            </div>
          </section>
        )}

        {trending.length === 0 && !loading && (
          <section className="border border-dashed border-slate-700 rounded-2xl p-10 text-center">
            <p className="text-slate-400 text-sm mb-3">The library is empty. Admins can add novels via the Admin Panel.</p>
            <button
              onClick={() => navigate({ name: 'admin' })}
              className="text-amber-400 text-sm hover:underline"
            >
              Go to Admin Panel
            </button>
          </section>
        )}
      </div>
    </div>
  );
}
