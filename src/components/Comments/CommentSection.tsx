import { useState, useEffect } from 'react';
import { MessageCircle, Send, Trash2 } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import { Comment } from '../../types';
import { useRouterContext } from '../../contexts/RouterContext';

interface CommentSectionProps {
  novelId: string;
  chapterId?: string;
}

function timeAgo(dateStr: string) {
  const seconds = Math.floor((Date.now() - new Date(dateStr).getTime()) / 1000);
  if (seconds < 60) return 'just now';
  const m = Math.floor(seconds / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function CommentSection({ novelId, chapterId }: CommentSectionProps) {
  const { user, profile } = useAuth();
  const { navigate } = useRouterContext();
  const [comments, setComments] = useState<Comment[]>([]);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchComments();
  }, [novelId, chapterId]);

  async function fetchComments() {
    setLoading(true);
    let query = supabase
      .from('comments')
      .select('*, profile:profiles(id, username, avatar_url, is_admin)')
      .eq('novel_id', novelId)
      .order('created_at', { ascending: false })
      .limit(50);

    if (chapterId) {
      query = query.eq('chapter_id', chapterId);
    } else {
      query = query.is('chapter_id', null);
    }

    const { data } = await query;
    setComments(data || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!content.trim() || submitting) return;
    setSubmitting(true);
    const { error } = await supabase.from('comments').insert({
      novel_id: novelId,
      chapter_id: chapterId || null,
      user_id: user!.id,
      content: content.trim(),
    });
    if (!error) {
      setContent('');
      fetchComments();
    }
    setSubmitting(false);
  }

  async function handleDelete(commentId: string) {
    await supabase.from('comments').delete().eq('id', commentId);
    setComments((prev) => prev.filter((c) => c.id !== commentId));
  }

  return (
    <section className="mt-8">
      <h3 className="flex items-center gap-2 text-slate-200 font-semibold text-lg mb-5">
        <MessageCircle size={18} className="text-amber-400" />
        Comments {comments.length > 0 && <span className="text-slate-500 text-base font-normal">({comments.length})</span>}
      </h3>

      {user ? (
        <form onSubmit={handleSubmit} className="mb-6">
          <div className="flex gap-3">
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center flex-shrink-0 mt-1">
              <span className="text-amber-400 text-xs font-bold">{profile?.username?.[0]?.toUpperCase() || 'U'}</span>
            </div>
            <div className="flex-1">
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder="Share your thoughts..."
                rows={3}
                className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 resize-none transition-all"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="submit"
                  disabled={!content.trim() || submitting}
                  className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 disabled:cursor-not-allowed text-slate-950 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  <Send size={13} />
                  {submitting ? 'Posting...' : 'Post'}
                </button>
              </div>
            </div>
          </div>
        </form>
      ) : (
        <div className="bg-slate-800/50 border border-slate-700 rounded-xl p-4 mb-6 text-center">
          <p className="text-slate-400 text-sm">
            <button onClick={() => navigate({ name: 'auth', mode: 'login' })} className="text-amber-400 hover:underline font-medium">Sign in</button>
            {' '}to join the discussion.
          </p>
        </div>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2, 3].map((i) => (
            <div key={i} className="animate-pulse flex gap-3">
              <div className="w-8 h-8 rounded-full bg-slate-700 flex-shrink-0" />
              <div className="flex-1 space-y-2">
                <div className="h-3 bg-slate-700 rounded w-24" />
                <div className="h-12 bg-slate-700 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : comments.length === 0 ? (
        <p className="text-slate-500 text-sm text-center py-8">No comments yet. Be the first to comment!</p>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="flex gap-3 group">
              <div className="w-8 h-8 rounded-full bg-slate-700 border border-slate-600 flex items-center justify-center flex-shrink-0">
                <span className="text-slate-300 text-xs font-bold">
                  {comment.profile?.username?.[0]?.toUpperCase() || 'U'}
                </span>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-slate-200 text-sm font-medium">{comment.profile?.username || 'Unknown'}</span>
                    {comment.profile?.is_admin && (
                      <span className="text-[10px] bg-amber-500/20 text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded-full font-medium">Admin</span>
                    )}
                    <span className="text-slate-600 text-xs">{timeAgo(comment.created_at)}</span>
                  </div>
                  {(user?.id === comment.user_id || profile?.is_admin) && (
                    <button
                      onClick={() => handleDelete(comment.id)}
                      className="opacity-0 group-hover:opacity-100 text-slate-600 hover:text-red-400 transition-all"
                    >
                      <Trash2 size={13} />
                    </button>
                  )}
                </div>
                <p className="text-slate-300 text-sm mt-1 leading-relaxed whitespace-pre-wrap break-words">{comment.content}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
}
