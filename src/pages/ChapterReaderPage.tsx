import { useEffect, useState } from 'react';
import { ChevronLeft, ChevronRight, ArrowLeft, List, Settings2, Sun, Moon, Type } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { Chapter, Novel } from '../types';
import { CommentSection } from '../components/Comments/CommentSection';
import { useAuth } from '../contexts/AuthContext';
import { useRouterContext } from '../contexts/RouterContext';

type FontSize = 'sm' | 'base' | 'lg' | 'xl';
type Theme = 'dark' | 'sepia' | 'light';

const FONT_CLASS: Record<FontSize, string> = {
  sm: 'text-sm',
  base: 'text-base',
  lg: 'text-lg',
  xl: 'text-xl',
};

const THEME_CLASS: Record<Theme, { bg: string; text: string; surface: string; border: string; muted: string }> = {
  dark: { bg: 'bg-slate-950', text: 'text-slate-200', surface: 'bg-slate-900', border: 'border-slate-800', muted: 'text-slate-500' },
  sepia: { bg: 'bg-amber-50', text: 'text-amber-950', surface: 'bg-amber-100', border: 'border-amber-200', muted: 'text-amber-700' },
  light: { bg: 'bg-white', text: 'text-slate-800', surface: 'bg-slate-50', border: 'border-slate-200', muted: 'text-slate-500' },
};

export function ChapterReaderPage({ novelId, chapterId }: { novelId: string; chapterId: string }) {
  const { user } = useAuth();
  const { navigate } = useRouterContext();
  const [chapter, setChapter] = useState<Chapter | null>(null);
  const [novel, setNovel] = useState<Novel | null>(null);
  const [allChapters, setAllChapters] = useState<Pick<Chapter, 'id' | 'chapter_number' | 'title'>[]>([]);
  const [loading, setLoading] = useState(true);
  const [showSettings, setShowSettings] = useState(false);
  const [showChapterList, setShowChapterList] = useState(false);
  const [fontSize, setFontSize] = useState<FontSize>('base');
  const [theme, setTheme] = useState<Theme>('dark');

  useEffect(() => {
    load();
  }, [chapterId, novelId]);

  async function load() {
    setLoading(true);
    const [chapterRes, novelRes, allRes] = await Promise.all([
      supabase.from('chapters').select('*').eq('id', chapterId).maybeSingle(),
      supabase.from('novels').select('id,title,author').eq('id', novelId).maybeSingle(),
      supabase
        .from('chapters')
        .select('id,chapter_number,title')
        .eq('novel_id', novelId)
        .order('chapter_number'),
    ]);

    setChapter(chapterRes.data);
    setNovel(novelRes.data as Novel | null);
    setAllChapters(allRes.data || []);

    if (chapterRes.data) {
      supabase
        .from('chapters')
        .update({ views: (chapterRes.data.views || 0) + 1 })
        .eq('id', chapterId);
    }

    if (user && chapterRes.data) {
      supabase
        .from('bookmarks')
        .upsert(
          { novel_id: novelId, user_id: user.id, last_chapter_id: chapterId, updated_at: new Date().toISOString() },
          { onConflict: 'user_id,novel_id' }
        );
    }

    setLoading(false);
  }

  const currentIndex = allChapters.findIndex((c) => c.id === chapterId);
  const prevChapter = currentIndex > 0 ? allChapters[currentIndex - 1] : null;
  const nextChapter = currentIndex < allChapters.length - 1 ? allChapters[currentIndex + 1] : null;

  const t = THEME_CLASS[theme];

  function NavButtons({ className = '' }: { className?: string }) {
    return (
      <div className={`flex items-center gap-3 ${className}`}>
        <button
          disabled={!prevChapter}
          onClick={() => prevChapter && navigate({ name: 'chapter', novelId, chapterId: prevChapter.id })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 disabled:opacity-30 disabled:cursor-not-allowed text-slate-300 text-sm font-medium transition-colors border border-slate-700"
        >
          <ChevronLeft size={15} /> Previous
        </button>
        <button
          disabled={!nextChapter}
          onClick={() => nextChapter && navigate({ name: 'chapter', novelId, chapterId: nextChapter.id })}
          className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 disabled:opacity-30 disabled:cursor-not-allowed text-slate-950 text-sm font-semibold transition-colors"
        >
          Next <ChevronRight size={15} />
        </button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (!chapter) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center text-slate-400">
        Chapter not found.
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${t.bg} transition-colors`}>
      <div className={`sticky top-0 z-40 ${t.surface} border-b ${t.border} px-4 py-3`}>
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => navigate({ name: 'novel', novelId })}
              className={`${t.muted} hover:opacity-80 flex-shrink-0 transition-opacity`}
            >
              <ArrowLeft size={18} />
            </button>
            <div className="min-w-0">
              <p className={`text-xs ${t.muted} truncate`}>{novel?.title}</p>
              <p className={`text-sm font-medium truncate ${t.text}`}>
                Ch. {chapter.chapter_number}: {chapter.title}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => { setShowChapterList(!showChapterList); setShowSettings(false); }}
              className={`p-2 rounded-lg ${t.muted} hover:opacity-80 transition-opacity`}
            >
              <List size={17} />
            </button>
            <button
              onClick={() => { setShowSettings(!showSettings); setShowChapterList(false); }}
              className={`p-2 rounded-lg ${t.muted} hover:opacity-80 transition-opacity`}
            >
              <Settings2 size={17} />
            </button>
          </div>
        </div>

        {showSettings && (
          <div className="max-w-3xl mx-auto mt-3 p-4 bg-slate-800 rounded-xl border border-slate-700 space-y-4">
            <div>
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Theme</p>
              <div className="flex gap-2">
                {(['dark', 'sepia', 'light'] as Theme[]).map((th) => (
                  <button
                    key={th}
                    onClick={() => setTheme(th)}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      theme === th ? 'border-amber-500 text-amber-400 bg-amber-500/10' : 'border-slate-600 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {th === 'dark' ? <Moon size={12} /> : th === 'light' ? <Sun size={12} /> : <Type size={12} />}
                    {th.charAt(0).toUpperCase() + th.slice(1)}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Font Size</p>
              <div className="flex gap-2">
                {(['sm', 'base', 'lg', 'xl'] as FontSize[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setFontSize(s)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${
                      fontSize === s ? 'border-amber-500 text-amber-400 bg-amber-500/10' : 'border-slate-600 text-slate-400 hover:border-slate-500'
                    }`}
                  >
                    {s === 'sm' ? 'S' : s === 'base' ? 'M' : s === 'lg' ? 'L' : 'XL'}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {showChapterList && (
          <div className="max-w-3xl mx-auto mt-3 bg-slate-800 rounded-xl border border-slate-700 max-h-64 overflow-y-auto">
            {allChapters.map((ch) => (
              <button
                key={ch.id}
                onClick={() => { navigate({ name: 'chapter', novelId, chapterId: ch.id }); setShowChapterList(false); }}
                className={`flex items-center gap-2 w-full px-4 py-2.5 text-left text-sm hover:bg-slate-700 transition-colors border-b border-slate-700/50 last:border-0 ${
                  ch.id === chapterId ? 'text-amber-400' : 'text-slate-300'
                }`}
              >
                {ch.id === chapterId && <div className="w-1 h-1 rounded-full bg-amber-400 flex-shrink-0" />}
                Ch. {ch.chapter_number}: {ch.title}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
        <h1 className={`text-2xl font-bold mb-1 ${t.text}`}>
          Chapter {chapter.chapter_number}
        </h1>
        <h2 className={`text-lg mb-8 ${t.muted}`}>
          {chapter.title}
        </h2>

        <NavButtons className="mb-8" />

        <article
          className={`leading-[1.9] ${FONT_CLASS[fontSize]} ${t.text} space-y-4`}
          style={{ fontFamily: "'Georgia', 'Cambria', serif" }}
        >
          {chapter.content.split('\n').map((para, i) =>
            para.trim() ? (
              <p key={i}>{para}</p>
            ) : (
              <div key={i} className="h-3" />
            )
          )}
        </article>

        <NavButtons className="mt-10" />

        <div className={`mt-4 flex justify-between text-xs ${t.muted}`}>
          <span>{prevChapter ? `Previous: Ch.${prevChapter.chapter_number}` : ''}</span>
          <span>{currentIndex + 1} / {allChapters.length}</span>
          <span>{nextChapter ? `Next: Ch.${nextChapter.chapter_number}` : ''}</span>
        </div>

        <div className={`mt-12 pt-8 border-t ${t.border}`}>
          <CommentSection novelId={novelId} chapterId={chapterId} />
        </div>
      </div>
    </div>
  );
}
