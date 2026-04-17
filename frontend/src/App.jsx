import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ProtectedRoute from './components/ProtectedRoute';
import PlayerBar from './components/player/PlayerBar';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import VerifyEmailPage from './pages/VerifyEmailPage';
import OnboardingPage from './pages/OnboardingPage';
import ArtistPage from './pages/ArtistPage';
import AlbumPage from './pages/AlbumPage';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          <Route path="/verify-email" element={<VerifyEmailPage />} />

          {/* Protected routes */}
          <Route
            path="/onboarding"
            element={
              <ProtectedRoute>
                <OnboardingPage />
              </ProtectedRoute>
            }
          />

          {/* Public music pages */}
          <Route path="/artists/:id" element={<ArtistPage />} />
          <Route path="/albums/:id" element={<AlbumPage />} />

          {/* Placeholder home — replaced by later modules */}
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <div className="min-h-screen bg-gray-950 text-white flex items-center justify-center text-2xl font-bold">
                  🎵 Home — coming soon
                </div>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>

        {/* PlayerBar renders above all pages when a song is loaded */}
        <PlayerBar />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
