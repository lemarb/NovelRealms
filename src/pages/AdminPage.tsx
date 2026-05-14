import { useEffect, useState } from 'react';
import { Plus, CreditCard as Edit2, Trash2, BookOpen, ChevronDown, ChevronUp, Upload, X, Shield } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useRouterContext } from '../contexts/RouterContext';
import { Novel, Genre, Chapter } from '../types';

interface NovelForm {
  title: string;
  original_title: string;
  author: string;
  translator: string;
  cover_url: string;
  description: string;
  status: 'ongoing' | 'completed' | 'hiatus';
  genreIds: string[];
}

interface ChapterForm {
  chapter_number: string;
  title: string;
  content: string;
}

const EMPTY_NOVEL: NovelForm = {
  title: '', original_title: '', author: '', translator: '', cover_url: '', description: '', status: 'ongoing', genreIds: [],
};
const EMPTY_CHAPTER: ChapterForm = { chapter_number: '', title: '', content: '' };

export function AdminPage() {
  const { user, profile } = useAuth();
  const { navigate } = useRouterContext();
  const [novels, setNovels] = useState<Novel[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);

  const [novelForm, setNovelForm] = useState<NovelForm>(EMPTY_NOVEL);
  const [editingNovelId, setEditingNovelId] = useState<string | null>(null);
  const [showNovelForm, setShowNovelForm] = useState(false);
  const [novelSaving, setNovelSaving] = useState(false);

  const [expandedNovel, setExpandedNovel] = useState<string | null>(null);
  const [novelChapters, setNovelChapters] = useState<Record<string, Chapter[]>>({});
  const [chapterForm, setChapterForm] = useState<ChapterForm>(EMPTY_CHAPTER);
  const [editingChapterId, setEditingChapterId] = useState<string | null>(null);
  const [chapterNovelId, setChapterNovelId] = useState<string | null>(null);
  const [chapterSaving, setChapterSaving] = useState(false);

  useEffect(() => {
    if (!user || !profile?.is_admin) return;
    loadData();
  }, [user, profile]);

  async function loadData() {
    setLoading(true);
    const [novelsRes, genresRes] = await Promise.all([
      supabase.from('novels').select('*, novel_genres(genre:genres(id,name,slug))').order('updated_at', { ascending: false }),
      supabase.from('genres').select('*').order('name'),
    ]);
    const normalized = (novelsRes.data || []).map((n) => {
      const raw = n as Record<string, unknown>;
      return {
        ...raw,
        genres: ((raw.novel_genres as { genre: Genre }[]) || []).map((ng) => ng.genre).filter(Boolean),
      } as Novel;
    });
    setNovels(normalized);
    setGenres(genresRes.data || []);
    setLoading(false);
  }

  async function loadChapters(novelId: string) {
    const { data } = await supabase
      .from('chapters')
      .select('id,novel_id,chapter_number,title,views,created_at,updated_at,created_by,content')
      .eq('novel_id', novelId)
      .order('chapter_number');
    setNovelChapters((prev) => ({ ...prev, [novelId]: data || [] }));
  }

  async function saveNovel() {
    if (!novelForm.title.trim() || !novelForm.author.trim()) return;
    setNovelSaving(true);

    const payload = {
      title: novelForm.title.trim(),
      original_title: novelForm.original_title.trim() || null,
      author: novelForm.author.trim(),
      translator: novelForm.translator.trim() || null,
      cover_url: novelForm.cover_url.trim() || null,
      description: novelForm.description.trim() || null,
      status: novelForm.status,
      created_by: user!.id,
      updated_at: new Date().toISOString(),
    };

    let novelId = editingNovelId;
    if (editingNovelId) {
      await supabase.from('novels').update(payload).eq('id', editingNovelId);
    } else {
      const { data } = await supabase.from('novels').insert(payload).select().maybeSingle();
      novelId = data?.id || null;
    }

    if (novelId) {
      await supabase.from('novel_genres').delete().eq('novel_id', novelId);
      if (novelForm.genreIds.length > 0) {
        await supabase.from('novel_genres').insert(
          novelForm.genreIds.map((gid) => ({ novel_id: novelId, genre_id: gid }))
        );
      }
    }

    setNovelForm(EMPTY_NOVEL);
    setEditingNovelId(null);
    setShowNovelForm(false);
    setNovelSaving(false);
    loadData();
  }

  async function deleteNovel(id: string) {
    if (!confirm('Delete this novel and all its chapters? This cannot be undone.')) return;
    await supabase.from('novels').delete().eq('id', id);
    setNovels((prev) => prev.filter((n) => n.id !== id));
  }

  function startEditNovel(novel: Novel) {
    setNovelForm({
      title: novel.title,
      original_title: novel.original_title || '',
      author: novel.author,
      translator: novel.translator || '',
      cover_url: novel.cover_url || '',
      description: novel.description || '',
      status: novel.status,
      genreIds: (novel.genres || []).map((g) => g.id),
    });
    setEditingNovelId(novel.id);
    setShowNovelForm(true);
  }

  async function saveChapter() {
    if (!chapterNovelId || !chapterForm.title.trim() || !chapterForm.content.trim() || !chapterForm.chapter_number) return;
    setChapterSaving(true);

    const payload = {
      novel_id: chapterNovelId,
      chapter_number: parseInt(chapterForm.chapter_number),
      title: chapterForm.title.trim(),
      content: chapterForm.content.trim(),
      created_by: user!.id,
      updated_at: new Date().toISOString(),
    };

    if (editingChapterId) {
      await supabase.from('chapters').update(payload).eq('id', editingChapterId);
    } else {
      await supabase.from('chapters').insert(payload);
    }

    setChapterForm(EMPTY_CHAPTER);
    setEditingChapterId(null);
    setChapterNovelId(null);
    setChapterSaving(false);
    loadChapters(chapterNovelId);
  }

  async function deleteChapter(chapterId: string, novelId: string) {
    if (!confirm('Delete this chapter?')) return;
    await supabase.from('chapters').delete().eq('id', chapterId);
    loadChapters(novelId);
  }

  function startAddChapter(novelId: string) {
    setChapterNovelId(novelId);
    setEditingChapterId(null);
    setChapterForm(EMPTY_CHAPTER);
  }

  function startEditChapter(ch: Chapter) {
    setChapterNovelId(ch.novel_id);
    setEditingChapterId(ch.id);
    setChapterForm({
      chapter_number: String(ch.chapter_number),
      title: ch.title,
      content: ch.content,
    });
  }

  if (!user || !profile?.is_admin) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <Shield size={40} className="text-slate-700 mx-auto mb-3" />
          <p className="text-slate-400 mb-2">Admin access required</p>
          <button onClick={() => navigate({ name: 'home' })} className="text-amber-400 text-sm hover:underline">
            Go home
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <div className="bg-slate-900 border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-slate-50">Admin Panel</h1>
              <p className="text-slate-400 text-sm mt-1">Manage novels and chapters</p>
            </div>
            <button
              onClick={() => { setShowNovelForm(!showNovelForm); setNovelForm(EMPTY_NOVEL); setEditingNovelId(null); }}
              className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-semibold px-4 py-2.5 rounded-xl text-sm transition-colors"
            >
              <Plus size={16} /> Add Novel
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8 space-y-6">
        {showNovelForm && (
          <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-slate-200 font-semibold text-lg">
                {editingNovelId ? 'Edit Novel' : 'New Novel'}
              </h2>
              <button onClick={() => { setShowNovelForm(false); setEditingNovelId(null); setNovelForm(EMPTY_NOVEL); }} className="text-slate-500 hover:text-slate-300">
                <X size={18} />
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Title *</label>
                <input value={novelForm.title} onChange={(e) => setNovelForm({ ...novelForm, title: e.target.value })}
                  placeholder="Novel title" className="input-field" />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Original Title</label>
                <input value={novelForm.original_title} onChange={(e) => setNovelForm({ ...novelForm, original_title: e.target.value })}
                  placeholder="Original language title" className="input-field" />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Author *</label>
                <input value={novelForm.author} onChange={(e) => setNovelForm({ ...novelForm, author: e.target.value })}
                  placeholder="Author name" className="input-field" />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Translator</label>
                <input value={novelForm.translator} onChange={(e) => setNovelForm({ ...novelForm, translator: e.target.value })}
                  placeholder="Translator name" className="input-field" />
              </div>
              <div className="md:col-span-2">
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Cover Image URL</label>
                <input value={novelForm.cover_url} onChange={(e) => setNovelForm({ ...novelForm, cover_url: e.target.value })}
                  placeholder="https://..." className="input-field" />
              </div>
              <div className="md:col-span-2">
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Description / Synopsis</label>
                <textarea value={novelForm.description} onChange={(e) => setNovelForm({ ...novelForm, description: e.target.value })}
                  rows={4} placeholder="Novel synopsis..." className="input-field resize-none" />
              </div>
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Status</label>
                <select value={novelForm.status} onChange={(e) => setNovelForm({ ...novelForm, status: e.target.value as NovelForm['status'] })}
                  className="input-field">
                  <option value="ongoing">Ongoing</option>
                  <option value="completed">Completed</option>
                  <option value="hiatus">Hiatus</option>
                </select>
              </div>
              <div>
                <label className="text-slate-400 text-xs font-medium mb-1.5 block">Genres</label>
                <div className="flex flex-wrap gap-2 max-h-28 overflow-y-auto p-3 bg-slate-800 border border-slate-700 rounded-xl">
                  {genres.map((g) => (
                    <button
                      key={g.id}
                      type="button"
                      onClick={() => {
                        const ids = novelForm.genreIds.includes(g.id)
                          ? novelForm.genreIds.filter((id) => id !== g.id)
                          : [...novelForm.genreIds, g.id];
                        setNovelForm({ ...novelForm, genreIds: ids });
                      }}
                      className={`px-2.5 py-1 rounded-full text-xs font-medium border transition-all ${
                        novelForm.genreIds.includes(g.id)
                          ? 'bg-amber-500 text-slate-950 border-amber-500'
                          : 'bg-slate-700 text-slate-400 border-slate-600 hover:border-slate-500'
                      }`}
                    >
                      {g.name}
                    </button>
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={saveNovel}
                disabled={novelSaving || !novelForm.title.trim() || !novelForm.author.trim()}
                className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
              >
                <Upload size={14} />
                {novelSaving ? 'Saving...' : editingNovelId ? 'Update Novel' : 'Publish Novel'}
              </button>
              <button onClick={() => { setShowNovelForm(false); setNovelForm(EMPTY_NOVEL); setEditingNovelId(null); }}
                className="px-5 py-2.5 rounded-xl text-sm text-slate-400 hover:text-slate-200 border border-slate-700 hover:border-slate-500 transition-colors">
                Cancel
              </button>
            </div>
          </div>
        )}

        {chapterNovelId && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70">
            <div className="bg-slate-900 border border-slate-700 rounded-2xl p-6 w-full max-w-3xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-5">
                <h2 className="text-slate-200 font-semibold text-lg">
                  {editingChapterId ? 'Edit Chapter' : 'New Chapter'}
                </h2>
                <button onClick={() => { setChapterNovelId(null); setEditingChapterId(null); setChapterForm(EMPTY_CHAPTER); }}
                  className="text-slate-500 hover:text-slate-300">
                  <X size={18} />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-slate-400 text-xs font-medium mb-1.5 block">Chapter Number *</label>
                    <input type="number" value={chapterForm.chapter_number}
                      onChange={(e) => setChapterForm({ ...chapterForm, chapter_number: e.target.value })}
                      placeholder="1" className="input-field" />
                  </div>
                  <div>
                    <label className="text-slate-400 text-xs font-medium mb-1.5 block">Chapter Title *</label>
                    <input value={chapterForm.title}
                      onChange={(e) => setChapterForm({ ...chapterForm, title: e.target.value })}
                      placeholder="The Beginning" className="input-field" />
                  </div>
                </div>
                <div>
                  <label className="text-slate-400 text-xs font-medium mb-1.5 block">
                    Content * <span className="text-slate-600">({chapterForm.content.length} chars)</span>
                  </label>
                  <textarea
                    value={chapterForm.content}
                    onChange={(e) => setChapterForm({ ...chapterForm, content: e.target.value })}
                    rows={16}
                    placeholder="Paste the chapter content here..."
                    className="input-field resize-none font-mono text-sm"
                  />
                </div>
              </div>
              <div className="flex gap-3 mt-5">
                <button
                  onClick={saveChapter}
                  disabled={chapterSaving || !chapterForm.title.trim() || !chapterForm.content.trim() || !chapterForm.chapter_number}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 font-semibold px-5 py-2.5 rounded-xl text-sm transition-colors"
                >
                  <Upload size={14} />
                  {chapterSaving ? 'Saving...' : editingChapterId ? 'Update Chapter' : 'Publish Chapter'}
                </button>
                <button onClick={() => { setChapterNovelId(null); setEditingChapterId(null); setChapterForm(EMPTY_CHAPTER); }}
                  className="px-5 py-2.5 rounded-xl text-sm text-slate-400 border border-slate-700 hover:border-slate-500 transition-colors">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="animate-pulse bg-slate-800 rounded-xl h-20" />
            ))}
          </div>
        ) : novels.length === 0 ? (
          <div className="text-center py-16 border border-dashed border-slate-800 rounded-2xl">
            <BookOpen size={40} className="text-slate-700 mx-auto mb-3" />
            <p className="text-slate-400 mb-4">No novels yet. Add your first novel!</p>
            <button onClick={() => setShowNovelForm(true)} className="text-amber-400 hover:underline text-sm">
              Add Novel
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {novels.map((novel) => {
              const isExpanded = expandedNovel === novel.id;
              const chapters = novelChapters[novel.id] || [];
              return (
                <div key={novel.id} className="bg-slate-900 border border-slate-800 rounded-xl overflow-hidden">
                  <div className="flex items-center gap-4 p-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-slate-200 font-medium text-sm">{novel.title}</p>
                        <span className={`text-[10px] border px-2 py-0.5 rounded-full ${
                          novel.status === 'ongoing' ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' :
                          novel.status === 'completed' ? 'text-sky-400 border-sky-500/30 bg-sky-500/10' :
                          'text-orange-400 border-orange-500/30 bg-orange-500/10'
                        }`}>{novel.status}</span>
                      </div>
                      <p className="text-slate-500 text-xs mt-0.5">{novel.author} &middot; {novel.total_chapters} chapters &middot; {novel.views} views</p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                      <button onClick={() => startEditNovel(novel)} className="p-1.5 text-slate-500 hover:text-amber-400 hover:bg-slate-800 rounded-lg transition-colors"><Edit2 size={14} /></button>
                      <button onClick={() => deleteNovel(novel.id)} className="p-1.5 text-slate-500 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors"><Trash2 size={14} /></button>
                      <button
                        onClick={() => {
                          if (isExpanded) {
                            setExpandedNovel(null);
                          } else {
                            setExpandedNovel(novel.id);
                            loadChapters(novel.id);
                          }
                        }}
                        className="p-1.5 text-slate-500 hover:text-slate-300 hover:bg-slate-800 rounded-lg transition-colors"
                      >
                        {isExpanded ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
                      </button>
                    </div>
                  </div>

                  {isExpanded && (
                    <div className="border-t border-slate-800 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-slate-400 text-xs font-medium uppercase tracking-wider">Chapters</p>
                        <button
                          onClick={() => startAddChapter(novel.id)}
                          className="flex items-center gap-1.5 text-xs text-amber-400 hover:text-amber-300 transition-colors"
                        >
                          <Plus size={13} /> Add Chapter
                        </button>
                      </div>
                      {chapters.length === 0 ? (
                        <p className="text-slate-600 text-xs text-center py-4">No chapters yet.</p>
                      ) : (
                        <div className="space-y-1.5">
                          {chapters.map((ch) => (
                            <div key={ch.id} className="flex items-center justify-between py-2 px-3 rounded-lg hover:bg-slate-800 group transition-colors">
                              <span className="text-slate-300 text-xs">Ch. {ch.chapter_number}: {ch.title}</span>
                              <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={() => startEditChapter(ch)} className="text-slate-500 hover:text-amber-400 transition-colors"><Edit2 size={12} /></button>
                                <button onClick={() => deleteChapter(ch.id, novel.id)} className="text-slate-500 hover:text-red-400 transition-colors"><Trash2 size={12} /></button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
