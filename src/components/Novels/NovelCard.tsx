import { Eye, BookOpen } from 'lucide-react';
import { Novel } from '../../types';
import { StarRating } from '../UI/StarRating';
import { useRouterContext } from '../../contexts/RouterContext';

const STATUS_STYLES: Record<string, string> = {
  ongoing: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  completed: 'bg-sky-500/20 text-sky-400 border-sky-500/30',
  hiatus: 'bg-orange-500/20 text-orange-400 border-orange-500/30',
};

const DEFAULT_COVERS = [
  'https://images.pexels.com/photos/1130980/pexels-photo-1130980.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/2099737/pexels-photo-2099737.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/3889863/pexels-photo-3889863.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/1714208/pexels-photo-1714208.jpeg?auto=compress&cs=tinysrgb&w=400',
  'https://images.pexels.com/photos/4466054/pexels-photo-4466054.jpeg?auto=compress&cs=tinysrgb&w=400',
];

function getDefaultCover(id: string) {
  const idx = id.charCodeAt(0) % DEFAULT_COVERS.length;
  return DEFAULT_COVERS[idx];
}

interface NovelCardProps {
  novel: Novel;
  compact?: boolean;
}

export function NovelCard({ novel, compact = false }: NovelCardProps) {
  const { navigate } = useRouterContext();
  const cover = novel.cover_url || getDefaultCover(novel.id);

  if (compact) {
    return (
      <button
        onClick={() => navigate({ name: 'novel', novelId: novel.id })}
        className="flex gap-3 p-3 rounded-xl bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-slate-600 transition-all text-left group"
      >
        <img
          src={cover}
          alt={novel.title}
          className="w-12 h-16 object-cover rounded-lg flex-shrink-0"
          onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_COVERS[0]; }}
        />
        <div className="min-w-0">
          <p className="text-slate-200 font-medium text-sm leading-snug group-hover:text-amber-400 transition-colors line-clamp-2">{novel.title}</p>
          <p className="text-slate-500 text-xs mt-1">{novel.author}</p>
          <p className="text-slate-500 text-xs mt-1">{novel.total_chapters} ch.</p>
        </div>
      </button>
    );
  }

  return (
    <button
      onClick={() => navigate({ name: 'novel', novelId: novel.id })}
      className="group flex flex-col bg-slate-800/60 hover:bg-slate-800 border border-slate-700/50 hover:border-amber-500/40 rounded-xl overflow-hidden transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg hover:shadow-amber-900/10 text-left"
    >
      <div className="relative aspect-[3/4] overflow-hidden">
        <img
          src={cover}
          alt={novel.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          onError={(e) => { (e.target as HTMLImageElement).src = DEFAULT_COVERS[0]; }}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-transparent to-transparent" />
        <span className={`absolute top-2 right-2 text-[10px] font-semibold px-2 py-0.5 rounded-full border ${STATUS_STYLES[novel.status] || ''}`}>
          {novel.status.charAt(0).toUpperCase() + novel.status.slice(1)}
        </span>
        {novel.genres && novel.genres.length > 0 && (
          <div className="absolute bottom-2 left-2">
            <span className="bg-slate-900/80 text-amber-400 text-[10px] font-medium px-2 py-0.5 rounded-full">
              {novel.genres[0].name}
            </span>
          </div>
        )}
      </div>
      <div className="p-3 flex flex-col gap-1.5 flex-1">
        <h3 className="text-slate-100 font-semibold text-sm leading-snug line-clamp-2 group-hover:text-amber-400 transition-colors">
          {novel.title}
        </h3>
        <p className="text-slate-500 text-xs">{novel.author}</p>
        <div className="flex items-center justify-between mt-auto pt-1">
          <div className="flex items-center gap-1 text-slate-500 text-xs">
            <BookOpen size={12} />
            <span>{novel.total_chapters} ch.</span>
          </div>
          <div className="flex items-center gap-1 text-slate-500 text-xs">
            <Eye size={12} />
            <span>{novel.views >= 1000 ? `${(novel.views / 1000).toFixed(1)}k` : novel.views}</span>
          </div>
        </div>
        {novel.avg_rating !== undefined && novel.avg_rating > 0 && (
          <StarRating value={novel.avg_rating} size={12} />
        )}
      </div>
    </button>
  );
}
