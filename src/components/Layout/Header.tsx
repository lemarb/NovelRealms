import { useState } from 'react';
import { BookOpen, Search, User, LogOut, Shield, Bookmark, Menu, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { useRouterContext } from '../../contexts/RouterContext';

export function Header() {
  const { user, profile, signOut } = useAuth();
  const { navigate } = useRouterContext();
  const [search, setSearch] = useState('');
  const [menuOpen, setMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);

  function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    if (search.trim()) {
      navigate({ name: 'browse', search: search.trim() });
      setSearch('');
      setMenuOpen(false);
    }
  }

  function handleSignOut() {
    signOut();
    setUserMenuOpen(false);
    navigate({ name: 'home' });
  }

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => navigate({ name: 'home' })}
            className="flex items-center gap-2.5 text-amber-400 hover:text-amber-300 transition-colors"
          >
            <BookOpen size={24} strokeWidth={1.5} />
            <span className="text-xl font-bold tracking-tight text-slate-50">
              Novel<span className="text-amber-400">Realm</span>
            </span>
          </button>

          <nav className="hidden md:flex items-center gap-6">
            <button
              onClick={() => navigate({ name: 'home' })}
              className="text-slate-300 hover:text-amber-400 transition-colors text-sm font-medium"
            >
              Home
            </button>
            <button
              onClick={() => navigate({ name: 'browse' })}
              className="text-slate-300 hover:text-amber-400 transition-colors text-sm font-medium"
            >
              Browse
            </button>
          </nav>

          <div className="hidden md:flex items-center gap-3">
            <form onSubmit={handleSearch} className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search novels..."
                className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500 w-52 transition-all"
              />
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            </form>

            {user ? (
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg px-3 py-2 text-sm text-slate-200 transition-colors"
                >
                  <User size={15} />
                  <span className="max-w-24 truncate">{profile?.username || 'Account'}</span>
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-slate-800 border border-slate-700 rounded-xl shadow-xl overflow-hidden z-50">
                    {profile?.is_admin && (
                      <button
                        onClick={() => { navigate({ name: 'admin' }); setUserMenuOpen(false); }}
                        className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-amber-400 hover:bg-slate-700 transition-colors"
                      >
                        <Shield size={14} /> Admin Panel
                      </button>
                    )}
                    <button
                      onClick={() => { navigate({ name: 'profile' }); setUserMenuOpen(false); }}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-slate-200 hover:bg-slate-700 transition-colors"
                    >
                      <Bookmark size={14} /> My Library
                    </button>
                    <div className="border-t border-slate-700" />
                    <button
                      onClick={handleSignOut}
                      className="flex items-center gap-2 w-full px-4 py-2.5 text-sm text-red-400 hover:bg-slate-700 transition-colors"
                    >
                      <LogOut size={14} /> Sign Out
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <button
                onClick={() => navigate({ name: 'auth', mode: 'login' })}
                className="bg-amber-500 hover:bg-amber-400 text-slate-950 text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                Sign In
              </button>
            )}
          </div>

          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden text-slate-400 hover:text-slate-200 transition-colors"
          >
            {menuOpen ? <X size={22} /> : <Menu size={22} />}
          </button>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-slate-800 py-4 space-y-3">
            <form onSubmit={handleSearch} className="relative">
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search novels..."
                className="bg-slate-800 border border-slate-700 rounded-lg pl-9 pr-4 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-amber-500 w-full"
              />
              <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" />
            </form>
            <div className="flex flex-col gap-1">
              <button onClick={() => { navigate({ name: 'home' }); setMenuOpen(false); }} className="text-left px-2 py-2 text-slate-300 hover:text-amber-400 text-sm">Home</button>
              <button onClick={() => { navigate({ name: 'browse' }); setMenuOpen(false); }} className="text-left px-2 py-2 text-slate-300 hover:text-amber-400 text-sm">Browse</button>
              {user ? (
                <>
                  <button onClick={() => { navigate({ name: 'profile' }); setMenuOpen(false); }} className="text-left px-2 py-2 text-slate-300 hover:text-amber-400 text-sm">My Library</button>
                  {profile?.is_admin && <button onClick={() => { navigate({ name: 'admin' }); setMenuOpen(false); }} className="text-left px-2 py-2 text-amber-400 text-sm">Admin Panel</button>}
                  <button onClick={handleSignOut} className="text-left px-2 py-2 text-red-400 text-sm">Sign Out</button>
                </>
              ) : (
                <button onClick={() => { navigate({ name: 'auth', mode: 'login' }); setMenuOpen(false); }} className="text-left px-2 py-2 text-amber-400 text-sm font-semibold">Sign In</button>
              )}
            </div>
          </div>
        )}
      </div>

      {userMenuOpen && (
        <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
      )}
    </header>
  );
}
