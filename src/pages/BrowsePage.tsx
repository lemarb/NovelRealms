import { useEffect, useState, useRef } from 'react';
import { Search, SlidersHorizontal, X } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Novel, Genre } from '../types';
import { NovelCard } from '../components/Novels/NovelCard';
import { GenreFilter } from '../components/Novels/GenreFilter';
import { useRouterContext } from '../contexts/RouterContext';

type SortOption = 'updated_at' | 'views' | 'title' | 'total_chapters';

interface BrowsePageProps {
  initialGenre?: string;
  initialSearch?: string;
}

export function BrowsePage({ initialGenre, initialSearch }: BrowsePageProps) {
  const { navigate } = useRouterContext();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [selectedGenre, setSelectedGenre] = useState<string | undefined>(initialGenre);
  const [search, setSearch] = useState(initialSearch || '');
  const [sort, setSort] = useState<SortOption>('updated_at');
  const [status, setStatus] = useState<string>('all');
  const [loading, setLoading] = useState(true);
  const [showFilters, setShowFilters] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout>>();

  useEffect(() => {
    supabase.from('genres').select('*').order('name').then(({ data }) => {
      setGenres(data || []);
    });
  }, []);

  useEffect(() => {
    clearTimeout(searchTimeout.current);
    searchTimeout.current = setTimeout(() => fetchNovels(), 300);
    return () => clearTimeout(searchTimeout.current);
  }, [selectedGenre, search, sort, status]);

  async function fetchNovels() {
    setLoading(true);
    let query = supabase
      .from('novels')
      .select('*, novel_genres(genre:genres(id,name,slug))')
      .order(sort, { ascending: sort === 'title' });

    if (search.trim()) {
      query = supabase
        .from('novels')
        .select('*, novel_genres(genre:genres(id,name,slug))')
        .or(`title.ilike.%${search}%,author.ilike.%${search}%,translator.ilike.%${search}%`)
        .order(sort, { ascending: sort === 'title' });
    }

    if (status !== 'all') {
      query = query.eq('status', status);
    }

    const { data, error } = await query.limit(60);

    if (error) {
      setNovels([]);
      setLoading(false);
      return;
    }

    let normalized: Novel[] = (data || []).map((n) => {
      const raw = n as Record<string, unknown>;
      return {
        ...raw,
        genres: ((raw.novel_genres as { genre: Genre }[]) || [])
          .map((ng) => ng.genre)
          .filter(Boolean),
      } as Novel;
    });

    if (selectedGenre) {
      normalized = normalized.filter((n) =>
        n.genres?.some((g) => g.slug === selectedGenre)
      );
    }

    setNovels(normalized);
    setLoading(false);
  }

  function handleGenreSelect(slug: string | undefined) {
    setSelectedGenre(slug);
    navigate({ name: 'browse', genre: slug, search: search || undefined });
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
          <h1 className="text-3xl font-bold text-slate-50 mb-5">Browse Library</h1>
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by title, author, or translator..."
                className="w-full bg-slate-800 border border-slate-700 rounded-xl pl-10 pr-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-all"
              />
              {search && (
                <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300">
                  <X size={15} />
                </button>
              )}
            </div>
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 bg-slate-800 border border-slate-700 hover:border-slate-500 text-slate-300 px-4 py-3 rounded-xl text-sm transition-colors sm:w-auto"
            >
              <SlidersHorizontal size={15} /> Filters
            </button>
            <select
              value={sort}
              onChange={(e) => setSort(e.target.value as SortOption)}
              className="bg-slate-800 border border-slate-700 text-slate-300 rounded-xl px-4 py-3 text-sm focus:outline-none focus:border-amber-500"
            >
              <option value="updated_at">Latest Update</option>
              <option value="views">Most Views</option>
              <option value="total_chapters">Most Chapters</option>
              <option value="title">A-Z</option>
            </select>
          </div>

          {showFilters && (
            <div className="mt-4 p-4 bg-slate-800/60 rounded-xl border border-slate-700 space-y-4">
              <div>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Status</p>
                <div className="flex gap-2 flex-wrap">
                  {['all', 'ongoing', 'completed', 'hiatus'].map((s) => (
                    <button
                      key={s}
                      onClick={() => setStatus(s)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
                        status === s
                          ? 'bg-amber-500 text-slate-950 border-amber-500'
                          : 'bg-slate-700 text-slate-400 border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      {s === 'all' ? 'All' : s.charAt(0).toUpperCase() + s.slice(1)}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-slate-400 text-xs font-medium uppercase tracking-wider mb-3">Genre</p>
                <GenreFilter genres={genres} selected={selectedGenre} onSelect={handleGenreSelect} />
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-8">
        {(selectedGenre || search) && (
          <div className="flex items-center gap-2 mb-5 flex-wrap">
            <span className="text-slate-500 text-sm">Filtering by:</span>
            {selectedGenre && (
              <span className="flex items-center gap-1 bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs px-3 py-1 rounded-full">
                {genres.find((g) => g.slug === selectedGenre)?.name || selectedGenre}
                <button onClick={() => handleGenreSelect(undefined)}><X size={11} /></button>
              </span>
            )}
            {search && (
              <span className="flex items-center gap-1 bg-sky-500/10 border border-sky-500/30 text-sky-400 text-xs px-3 py-1 rounded-full">
                &quot;{search}&quot;
                <button onClick={() => setSearch('')}><X size={11} /></button>
              </span>
            )}
          </div>
        )}

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="animate-pulse">
                <div className="bg-slate-800 rounded-xl aspect-[3/4]" />
                <div className="mt-2 space-y-1.5 p-2">
                  <div className="h-3 bg-slate-800 rounded" />
                  <div className="h-3 bg-slate-800 rounded w-2/3" />
                </div>
              </div>
            ))}
          </div>
        ) : novels.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-slate-400 text-lg mb-2">No novels found</p>
            <p className="text-slate-600 text-sm">Try adjusting your search or filters</p>
          </div>
        ) : (
          <>
            <p className="text-slate-500 text-sm mb-5">{novels.length} novel{novels.length !== 1 ? 's' : ''} found</p>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
              {novels.map((novel) => (
                <NovelCard key={novel.id} novel={novel} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
