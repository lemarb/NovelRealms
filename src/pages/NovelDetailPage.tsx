import { useEffect, useState } from 'react';
import { BookOpen, Eye, Clock, User as User2, Languages, BookMarked, CheckCircle, ChevronRight, List } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Novel, Chapter, Rating, Bookmark, Genre } from '../types';
import { StarRating } from '../components/UI/StarRating';
import { CommentSection } from '../components/Comments/CommentSection';
import { useAuth } from '../contexts/AuthContext';
import { useRouterContext } from '../contexts/RouterContext';

const STATUS_LABEL: Record<string, string> = {
  ongoing: 'Ongoing',
  completed: 'Completed',
  hiatus: 'On Hiatus',
};
const STATUS_COLOR: Record<string, string> = {
  ongoing: 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30',
  completed: 'text-sky-400 bg-sky-500/10 border-sky-500/30',
  hiatus: 'text-orange-400 bg-orange-500/10 border-orange-500/30',
};

const DEFAULT_COVERS = [
  'https://images.pexels.com/photos/1130980/pexels-photo-1130980.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/2099737/pexels-photo-2099737.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/3889863/pexels-photo-3889863.jpeg?auto=compress&cs=tinysrgb&w=600',
  'https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=600',
];

export function NovelDetailPage({ novelId }: { novelId: string }) {
  const { user } = useAuth();
  const { navigate } = useRouterContext();
  const [novel, setNovel] = useState<Novel | null>(null);
  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [rating, setRating] = useState<Rating | null>(null);
  const [avgRating, setAvgRating] = useState(0);
  const [ratingCount, setRatingCount] = useState(0);
  const [bookmark, setBookmark] = useState<Bookmark | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAllChapters, setShowAllChapters] = useState(false);

  useEffect(() => {
    load();
  }, [novelId, user]);

  async function load() {
    setLoading(true);
    const [novelRes, chapterRes, ratingRes] = await Promise.all([
      supabase
        .from('novels')
        .select('*, novel_genres(genre:genres(id,name,slug))')
        .eq('id', novelId)
        .maybeSingle(),
      supabase
        .from('chapters')
        .select('id,novel_id,chapter_number,title,views,created_at,updated_at,created_by,content')
        .eq('novel_id', novelId)
        .order('chapter_number'),
      supabase
        .from('ratings')
        .select('score')
        .eq('novel_id', novelId),
    ]);

    if (novelRes.data) {
      const raw = novelRes.data as Record<string, unknown>;
      setNovel({
        ...raw,
        genres: ((raw.novel_genres as { genre: Genre }[]) || [])
          .map((ng) => ng.genre)
          .filter(Boolean),
      } as Novel);

      supabase.from('novels').update({ views: ((novelRes.data as Record<string, unknown>).views as number || 0) + 1 }).eq('id', novelId);
    }

    setChapters(chapterRes.data || []);

    const scores = (ratingRes.data || []).map((r) => r.score);
    setRatingCount(scores.length);
    setAvgRating(scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0);

    if (user) {
      const [userRatingRes, bookmarkRes] = await Promise.all([
        supabase
          .from('ratings')
          .select('*')
          .eq('novel_id', novelId)
          .eq('user_id', user.id)
          .maybeSingle(),
        supabase
          .from('bookmarks')
          .select('*, last_chapter:chapters(id,chapter_number,title)')
          .eq('novel_id', novelId)
          .eq('user_id', user.id)
          .maybeSingle(),
      ]);
      setRating(userRatingRes.data);
      setBookmark(bookmarkRes.data);
    }

    setLoading(false);
  }

  async function handleRate(score: number) {
    if (!user) {
      navigate({ name: 'auth', mode: 'login' });
      return;
    }
    if (rating) {
      await supabase.from('ratings').update({ score }).eq('id', rating.id);
      setRating({ ...rating, score });
    } else {
      const { data } = await supabase.from('ratings').insert({ novel_id: novelId, user_id: user.id, score }).select().maybeSingle();
      setRating(data);
    }
    const { data: allRatings } = await supabase.from('ratings').select('score').eq('novel_id', novelId);
    const scores = (allRatings || []).map((r) => r.score);
    setRatingCount(scores.length);
    setAvgRating(scores.length > 0 ? scores.reduce((a, b) => a + b, 0) / scores.length : 0);
  }

  async function handleBookmark() {
    if (!user) {
      navigate({ name: 'auth', mode: 'login' });
      return;
    }
    if (bookmark) {
      await supabase.from('bookmarks').delete().eq('id', bookmark.id);
      setBookmark(null);
    } else {
      const { data } = await supabase
        .from('bookmarks')
        .insert({ novel_id: novelId, user_id: user.id })
        .select('*, last_chapter:chapters(id,chapter_number,title)')
        .maybeSingle();
      setBookmark(data);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!novel) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Novel not found.
      </div>
    );
  }

  const cover = novel.cover_url || DEFAULT_COVERS[novel.id.charCodeAt(0) % DEFAULT_COVERS.length];
  const displayChapters = showAllChapters ? chapters : chapters.slice(0, 20);
  const lastChapter = bookmark?.last_chapter as unknown as Chapter | undefined;

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="relative h-48 md:h-64 overflow-hidden">
        <img src={cover} alt="" className="w-full h-full object-cover opacity-20 blur-sm scale-110" />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent to-slate-950" />
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 -mt-24 relative">
        <div className="flex flex-col md:flex-row gap-8">
          <div className="flex-shrink-0">
            <img
              src={cover}
              alt={novel.title}
              className="w-36 md:w-48 rounded-xl border-2 border-slate-700 shadow-2xl mx-auto md:mx-0"
              onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_COVERS[0]; }}
            />
          </div>

          <div className="flex-1 pt-2 text-center md:text-left">
            <div className="flex flex-wrap items-center justify-center md:justify-start gap-2 mb-3">
              <span className={`text-xs font-semibold border px-2.5 py-0.5 rounded-full ${STATUS_COLOR[novel.status] || ''}`}>
                {STATUS_LABEL[novel.status]}
              </span>
              {novel.genres?.slice(0, 3).map((g) => (
                <button
                  key={g.id}
                  onClick={() => navigate({ name: 'browse', genre: g.slug })}
                  className="text-xs bg-slate-800 hover:bg-slate-700 text-slate-400 border border-slate-700 px-2.5 py-0.5 rounded-full transition-colors"
                >
                  {g.name}
                </button>
              ))}
            </div>
            <h1 className="text-2xl md:text-3xl font-bold text-slate-50 leading-tight mb-1">{novel.title}</h1>
            {novel.original_title && (
              <p className="text-slate-500 text-sm mb-2">{novel.original_title}</p>
            )}

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 text-sm text-slate-400 mb-4">
              <span className="flex items-center gap-1.5"><User2 size={13} className="text-slate-500" />{novel.author}</span>
              {novel.translator && <span className="flex items-center gap-1.5"><Languages size={13} className="text-slate-500" />{novel.translator}</span>}
              <span className="flex items-center gap-1.5"><BookOpen size={13} className="text-slate-500" />{novel.total_chapters} chapters</span>
              <span className="flex items-center gap-1.5"><Eye size={13} className="text-slate-500" />{novel.views.toLocaleString()} views</span>
            </div>

            <div className="flex items-center justify-center md:justify-start gap-3 mb-4">
              <StarRating value={avgRating} interactive onChange={handleRate} size={20} />
              <span className="text-slate-400 text-sm">
                {avgRating > 0 ? avgRating.toFixed(1) : '—'}
                {ratingCount > 0 && <span className="text-slate-600"> ({ratingCount})</span>}
              </span>
              {rating && <span className="text-xs text-amber-400">Your rating: {rating.score}</span>}
            </div>

            <div className="flex flex-wrap items-center justify-center md:justify-start gap-3">
              {chapters.length > 0 && (
                <button
                  onClick={() => navigate({ name: 'chapter', novelId: novel.id, chapterId: chapters[0].id })}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
                >
                  <BookOpen size={15} /> Start Reading
                </button>
              )}
              {bookmark && lastChapter && (
                <button
                  onClick={() => navigate({ name: 'chapter', novelId: novel.id, chapterId: lastChapter.id })}
                  className="flex items-center gap-2 bg-sky-500/20 hover:bg-sky-500/30 text-sky-400 border border-sky-500/30 font-medium px-5 py-2.5 rounded-xl text-sm transition-colors"
                >
                  <Clock size={15} /> Continue Ch.{lastChapter.chapter_number}
                </button>
              )}
              <button
                onClick={handleBookmark}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium border transition-all ${
                  bookmark
                    ? 'bg-amber-500/20 text-amber-400 border-amber-500/30 hover:bg-amber-500/10'
                    : 'bg-slate-800 text-slate-300 border-slate-700 hover:border-amber-500/40 hover:text-amber-400'
                }`}
              >
                {bookmark ? <CheckCircle size={15} /> : <BookMarked size={15} />}
                {bookmark ? 'Bookmarked' : 'Bookmark'}
              </button>
            </div>
          </div>
        </div>

        {novel.description && (
          <div className="mt-8 bg-slate-900 border border-slate-800 rounded-xl p-5">
            <h2 className="text-slate-300 font-semibold mb-3">Synopsis</h2>
            <p className="text-slate-400 text-sm leading-relaxed whitespace-pre-wrap">{novel.description}</p>
          </div>
        )}

        <div className="mt-8">
          <h2 className="flex items-center gap-2 text-slate-200 font-bold text-xl mb-4">
            <List size={18} className="text-amber-400" />
            Chapters <span className="text-slate-500 font-normal text-base">({chapters.length})</span>
          </h2>
          {chapters.length === 0 ? (
            <div className="bg-slate-900 border border-slate-800 rounded-xl p-8 text-center text-slate-500 text-sm">
              No chapters uploaded yet.
            </div>
          ) : (
            <div className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
              {displayChapters.map((ch, idx) => (
                <button
                  key={ch.id}
                  onClick={() => navigate({ name: 'chapter', novelId: novel.id, chapterId: ch.id })}
                  className={`flex items-center justify-between w-full px-5 py-3.5 text-left hover:bg-slate-800 transition-colors group ${
                    idx !== 0 ? 'border-t border-slate-800' : ''
                  }`}
                >
                  <div>
                    <span className="text-slate-200 text-sm group-hover:text-amber-400 transition-colors">
                      Ch. {ch.chapter_number}: {ch.title}
                    </span>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-slate-600 text-xs">
                        {new Date(ch.created_at).toLocaleDateString()}
                      </span>
                      <span className="text-slate-600 text-xs flex items-center gap-1">
                        <Eye size={11} />{ch.views}
                      </span>
                    </div>
                  </div>
                  <ChevronRight size={16} className="text-slate-600 group-hover:text-amber-400 transition-colors flex-shrink-0" />
                </button>
              ))}
              {chapters.length > 20 && (
                <button
                  onClick={() => setShowAllChapters(!showAllChapters)}
                  className="w-full py-3 text-sm text-amber-400 hover:text-amber-300 border-t border-slate-800 transition-colors"
                >
                  {showAllChapters ? 'Show less' : `Show all ${chapters.length} chapters`}
                </button>
              )}
            </div>
          )}
        </div>

        <div className="mt-8 mb-12">
          <CommentSection novelId={novel.id} />
        </div>
      </div>
    </div>
  );
}
