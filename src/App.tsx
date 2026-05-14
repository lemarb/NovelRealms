import { AuthProvider } from './contexts/AuthContext';
import { RouterProvider, useRouterContext } from './contexts/RouterContext';
import { Header } from './components/Layout/Header';
import { Footer } from './components/Layout/Footer';
import { HomePage } from './pages/HomePage';
import { BrowsePage } from './pages/BrowsePage';
import { NovelDetailPage } from './pages/NovelDetailPage';
import { ChapterReaderPage } from './pages/ChapterReaderPage';
import { ProfilePage } from './pages/ProfilePage';
import { AdminPage } from './pages/AdminPage';
import { AuthPage } from './pages/AuthPage';

function AppContent() {
  const { route } = useRouterContext();

  if (route.name === 'auth') {
    return <AuthPage mode={route.mode} />;
  }

  if (route.name === 'chapter') {
    return (
      <div className="flex flex-col min-h-screen">
        <Header />
        <main className="flex-1">
          <ChapterReaderPage novelId={route.novelId} chapterId={route.chapterId} />
        </main>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1">
        {route.name === 'home' && <HomePage />}
        {route.name === 'browse' && (
          <BrowsePage initialGenre={route.genre} initialSearch={route.search} />
        )}
        {route.name === 'novel' && <NovelDetailPage novelId={route.novelId} />}
        {route.name === 'profile' && <ProfilePage />}
        {route.name === 'admin' && <AdminPage />}
      </main>
      <Footer />
    </div>
  );
}

function App() {
  return (
    <AuthProvider>
      <RouterProvider>
        <AppContent />
      </RouterProvider>
    </AuthProvider>
  );
}

export default App;
