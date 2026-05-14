import { useEffect, useState } from 'react';
import { BookMarked, Trash2, Clock, BookOpen } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useRouterContext } from '../contexts/RouterContext';
import { Novel, Chapter, Genre } from '../types';

const DEFAULT_COVERS = [
  'https://images.pexels.com/photos/1130980/pexels-photo-1130980.jpeg?auto=compress&cs=tinysrgb&w=300',
  'https://images.pexels.com/photos/2099737/pexels-photo-2099737.jpeg?auto=compress&cs=tinysrgb&w=300',
  'https://images.pexels.com/photos/3889863/pexels-photo-3889863.jpeg?auto=compress&cs=tinysrgb&w=300',
  'https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=300',
];

interface BookmarkWithRelations {
  id: string;
  user_id: string;
  novel_id: string;
  last_chapter_id: string | null;
  created_at: string;
  updated_at: string;
  novel: Novel;
  last_chapter?: Chapter;
}

export function ProfilePage() {
  const { user, profile } = useAuth();
  const { navigate } = useRouterContext();
  const [bookmarks, setBookmarks] = useState<BookmarkWithRelations[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate({ name: 'auth', mode: 'login' });
      return;
    }
    loadBookmarks();
  }, [user]);

  async function loadBookmarks() {
    setLoading(true);
    const { data } = await supabase
      .from('bookmarks')
      .select('*, novel:novels(*, novel_genres(genre:genres(id,name,slug))), last_chapter:chapters(id,chapter_number,title)')
      .eq('user_id', user!.id)
      .order('updated_at', { ascending: false });

    const normalized = (data || []).map((b) => {
      const raw = b as Record<string, unknown>;
      const novel = raw.novel as Record<string, unknown>;
      return {
        ...raw,
        novel: {
          ...novel,
          genres: ((novel?.novel_genres as { genre: Genre }[]) || [])
            .map((ng) => ng.genre)
            .filter(Boolean),
        },
      } as BookmarkWithRelations;
    });

    setBookmarks(normalized);
    setLoading(false);
  }

  async function removeBookmark(bookmarkId: string) {
    await supabase.from('bookmarks').delete().eq('id', bookmarkId);
    setBookmarks((prev) => prev.filter((b) => b.id !== bookmarkId));
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <span className="text-amber-400 text-xl font-bold">
                {profile?.username?.[0]?.toUpperCase() || 'U'}
              </span>
            </div>
            <div>
              <h1 className="text-xl font-bold text-slate-50">{profile?.username || 'User'}</h1>
              <p className="text-slate-400 text-sm">{user.email}</p>
              {profile?.is_admin && (
                <span className="text-xs bg-amber-500/10 border border-amber-500/30 text-amber-400 px-2 py-0.5 rounded-full mt-1 inline-block">
                  Administrator
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <h2 className="flex items-center gap-2 text-slate-200 font-bold text-xl mb-6">
          <BookMarked size={18} className="text-amber-400" />
          My Library
          {bookmarks.length > 0 && (
            <span className="text-slate-500 font-normal text-base">({bookmarks.length})</span>
          )}
        </h2>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-slate-800 rounded-xl h-36" />
            ))}
          </div>
        ) : bookmarks.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-slate-800 rounded-2xl">
            <BookMarked size={40} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 mb-2">Your library is empty</p>
            <p className="text-slate-600 text-sm mb-5">Browse novels and bookmark your favorites</p>
            <button
              onClick={() => navigate({ name: 'browse' })}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
            >
              Browse Library
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {bookmarks.map((bm) => {
              const novel = bm.novel;
              const lastChapter = bm.last_chapter;
              const cover = novel?.cover_url || DEFAULT_COVERS[novel?.id?.charCodeAt(0) % DEFAULT_COVERS.length || 0];
              return (
                <div
                  key={bm.id}
                  className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex gap-4 hover:border-slate-700 transition-colors group"
                >
                  <button
                    onClick={() => novel && navigate({ name: 'novel', novelId: novel.id })}
                    className="flex-shrink-0"
                  >
                    <img
                      src={cover}
                      alt={novel?.title}
                      className="w-16 h-20 object-cover rounded-lg"
                      onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_COVERS[0]; }}
                    />
                  </button>
                  <div className="flex-1 min-w-0">
                    <button
                      onClick={() => novel && navigate({ name: 'novel', novelId: novel.id })}
                      className="text-slate-200 font-semibold text-sm leading-snug line-clamp-2 group-hover:text-amber-400 transition-colors text-left"
                    >
                      {novel?.title}
                    </button>
                    <p className="text-slate-500 text-xs mt-1">{novel?.author}</p>
                    <div className="flex items-center gap-2 text-slate-500 text-xs mt-2">
                      <BookOpen size={11} />
                      <span>{novel?.total_chapters} ch.</span>
                    </div>
                    {lastChapter && (
                      <button
                        onClick={() => navigate({ name: 'chapter', novelId: novel.id, chapterId: lastChapter.id })}
                        className="flex items-center gap-1.5 mt-2 text-sky-400 hover:text-sky-300 text-xs transition-colors"
                      >
                        <Clock size={11} />
                        Continue Ch.{lastChapter.chapter_number}
                      </button>
                    )}
                    {!lastChapter && novel && (
                      <button
                        onClick={() => navigate({ name: 'novel', novelId: novel.id })}
                        className="flex items-center gap-1.5 mt-2 text-amber-400 hover:text-amber-300 text-xs transition-colors"
                      >
                        <BookOpen size={11} />
                        Start Reading
                      </button>
                    )}
                  </div>
                  <button
                    onClick={() => removeBookmark(bm.id)}
                    className="text-slate-700 hover:text-red-400 transition-colors flex-shrink-0 opacity-0 group-hover:opacity-100 self-start"
                  >
                    <Trash2 size={14} />
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
