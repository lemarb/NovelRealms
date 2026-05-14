import { Star } from 'lucide-react';

interface StarRatingProps {
  value: number;
  max?: number;
  interactive?: boolean;
  onChange?: (val: number) => void;
  size?: number;
}

export function StarRating({ value, max = 5, interactive = false, onChange, size = 16 }: StarRatingProps) {
  return (
    <div className="flex items-center gap-0.5">
      {Array.from({ length: max }).map((_, i) => {
        const filled = i < Math.round(value);
        return (
          <button
            key={i}
            type="button"
            disabled={!interactive}
            onClick={() => onChange?.(i + 1)}
            className={interactive ? 'cursor-pointer hover:scale-110 transition-transform' : 'cursor-default'}
          >
            <Star
              size={size}
              className={filled ? 'text-amber-400 fill-amber-400' : 'text-slate-600'}
              strokeWidth={1.5}
            />
          </button>
        );
      })}
    </div>
  );
}
