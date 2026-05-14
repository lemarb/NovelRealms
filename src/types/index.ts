export interface Profile {
  id: string;
  username: string;
  avatar_url: string | null;
  is_admin: boolean;
  created_at: string;
}

export interface Genre {
  id: string;
  name: string;
  slug: string;
}

export interface Novel {
  id: string;
  title: string;
  original_title: string | null;
  author: string;
  translator: string | null;
  cover_url: string | null;
  description: string | null;
  status: 'ongoing' | 'completed' | 'hiatus';
  total_chapters: number;
  views: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
  genres?: Genre[];
  avg_rating?: number;
  rating_count?: number;
}

export interface Chapter {
  id: string;
  novel_id: string;
  chapter_number: number;
  title: string;
  content: string;
  views: number;
  created_at: string;
  updated_at: string;
  created_by: string | null;
}

export interface Bookmark {
  id: string;
  user_id: string;
  novel_id: string;
  last_chapter_id: string | null;
  created_at: string;
  updated_at: string;
  novel?: Novel;
  last_chapter?: Chapter;
}

export interface Rating {
  id: string;
  user_id: string;
  novel_id: string;
  score: number;
  created_at: string;
  updated_at: string;
}

export interface Comment {
  id: string;
  user_id: string;
  novel_id: string;
  chapter_id: string | null;
  content: string;
  created_at: string;
  updated_at: string;
  profile?: Profile;
}

export type Route =
  | { name: 'home' }
  | { name: 'browse'; genre?: string; search?: string }
  | { name: 'novel'; novelId: string }
  | { name: 'chapter'; novelId: string; chapterId: string }
  | { name: 'profile' }
  | { name: 'admin' }
  | { name: 'auth'; mode?: 'login' | 'signup' };
