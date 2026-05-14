import { Genre } from '../../types';

interface GenreFilterProps {
  genres: Genre[];
  selected: string | undefined;
  onSelect: (slug: string | undefined) => void;
}

export function GenreFilter({ genres, selected, onSelect }: GenreFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      <button
        onClick={() => onSelect(undefined)}
        className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
          !selected
            ? 'bg-amber-500 text-slate-950 border-amber-500'
            : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200'
        }`}
      >
        All
      </button>
      {genres.map((g) => (
        <button
          key={g.id}
          onClick={() => onSelect(g.slug === selected ? undefined : g.slug)}
          className={`px-3 py-1.5 rounded-full text-xs font-medium border transition-all ${
            selected === g.slug
              ? 'bg-amber-500 text-slate-950 border-amber-500'
              : 'bg-slate-800 text-slate-400 border-slate-700 hover:border-slate-500 hover:text-slate-200'
          }`}
        >
          {g.name}
        </button>
      ))}
    </div>
  );
}
