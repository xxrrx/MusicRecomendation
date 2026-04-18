import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/Layout/AppLayout';
import PlayerBar from './components/player/PlayerBar';

import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import OnboardingPage from './pages/OnboardingPage';
import HomePage from './pages/HomePage';
import ArtistPage from './pages/ArtistPage';
import AlbumPage from './pages/AlbumPage';
import PlaylistsPage from './pages/PlaylistsPage';
import PlaylistPage from './pages/PlaylistPage';
import LikedSongsPage from './pages/LikedSongsPage';
import FollowingPage from './pages/FollowingPage';
import SearchPage from './pages/SearchPage';
import ChartsPage from './pages/ChartsPage';
import ArtistDashboardPage from './pages/ArtistDashboardPage';
import AdminPanelPage from './pages/AdminPanelPage';

const queryClient = new QueryClient();

/**
 * Wrap a page element with AppLayout (sidebar + main area).
 * Only used for authenticated app pages — not for auth flows.
 */
function WithLayout({ children }) {
  return <AppLayout>{children}</AppLayout>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Auth flows — no sidebar */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* App pages — with sidebar layout */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <WithLayout>
                  <HomePage />
                </WithLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/artists/:id"
            element={
              <WithLayout>
                <ArtistPage />
              </WithLayout>
            }
          />

          <Route
            path="/albums/:id"
            element={
              <WithLayout>
                <AlbumPage />
              </WithLayout>
            }
          />

          <Route
            path="/playlists"
            element={
              <ProtectedRoute>
                <WithLayout>
                  <PlaylistsPage />
                </WithLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/playlists/:id"
            element={
              <ProtectedRoute>
                <WithLayout>
                  <PlaylistPage />
                </WithLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/liked"
            element={
              <ProtectedRoute>
                <WithLayout>
                  <LikedSongsPage />
                </WithLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/following"
            element={
              <ProtectedRoute>
                <WithLayout>
                  <FollowingPage />
                </WithLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/search"
            element={
              <WithLayout>
                <SearchPage />
              </WithLayout>
            }
          />

          <Route
            path="/charts"
            element={
              <WithLayout>
                <ChartsPage />
              </WithLayout>
            }
          />

          <Route
            path="/artist/dashboard"
            element={
              <ProtectedRoute>
                <WithLayout>
                  <ArtistDashboardPage />
                </WithLayout>
              </ProtectedRoute>
            }
          />

          <Route
            path="/admin"
            element={
              <ProtectedRoute>
                <WithLayout>
                  <AdminPanelPage />
                </WithLayout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* PlayerBar floats above all pages when a song is loaded */}
        <PlayerBar />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
