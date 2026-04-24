import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

import ProtectedRoute from './components/ProtectedRoute';
import AppLayout from './components/Layout/AppLayout';
import AdminLayout from './components/Layout/AdminLayout';
import ArtistLayout from './components/Layout/ArtistLayout';
import PlayerBar from './components/player/PlayerBar';
import { useLocation } from 'react-router-dom';

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
import PendingSongsPage from './pages/Admin/PendingSongsPage';
import AdminUsersPage from './pages/Admin/AdminUsersPage';
import AdminStatsPage from './pages/Admin/AdminStatsPage';
import SongsManagePage from './pages/Admin/SongsManagePage';
import ArtistsManagePage from './pages/Admin/ArtistsManagePage';
import AlbumsManagePage from './pages/Admin/AlbumsManagePage';
import PlaylistsManagePage from './pages/Admin/PlaylistsManagePage';
import UserDetailPage from './pages/Admin/UserDetailPage';
import AnalyticsPage from './pages/Admin/AnalyticsPage';
import DonationsPage from './pages/Admin/DonationsPage';
import DonatePage from './pages/DonatePage';
import DonationResultPage from './pages/DonationResultPage';
import ProfilePage from './pages/ProfilePage';
import DonationHistoryPage from './pages/DonationHistoryPage';

const queryClient = new QueryClient();

// Role arrays — defined once for clarity
const ADMIN_ONLY = ['admin'];
const ARTIST_ONLY = ['artist'];
const USER_ONLY = ['user'];

function WithLayout({ children }) {
  return <AppLayout>{children}</AppLayout>;
}

function WithAdminLayout({ children }) {
  return <AdminLayout>{children}</AdminLayout>;
}

function WithArtistLayout({ children }) {
  return <ArtistLayout>{children}</ArtistLayout>;
}

// Hide PlayerBar on admin, artist, and donate pages
function PlayerBarWrapper() {
  const location = useLocation();
  if (location.pathname.startsWith('/admin')) return null;
  if (location.pathname.startsWith('/artist')) return null;
  if (location.pathname.startsWith('/donate')) return null;
  if (location.pathname.startsWith('/profile')) return null;
  return <PlayerBar />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Auth flows — no layout */}
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

          {/* ── USER routes (role: user) ───────────────────────────── */}
          <Route path="/" element={<ProtectedRoute allowedRoles={USER_ONLY}><WithLayout><HomePage /></WithLayout></ProtectedRoute>} />
          <Route path="/artists/:id" element={<ProtectedRoute allowedRoles={USER_ONLY}><WithLayout><ArtistPage /></WithLayout></ProtectedRoute>} />
          <Route path="/albums/:id" element={<ProtectedRoute allowedRoles={USER_ONLY}><WithLayout><AlbumPage /></WithLayout></ProtectedRoute>} />
          <Route path="/playlists" element={<ProtectedRoute allowedRoles={USER_ONLY}><WithLayout><PlaylistsPage /></WithLayout></ProtectedRoute>} />
          <Route path="/playlists/:id" element={<ProtectedRoute allowedRoles={USER_ONLY}><WithLayout><PlaylistPage /></WithLayout></ProtectedRoute>} />
          <Route path="/liked" element={<ProtectedRoute allowedRoles={USER_ONLY}><WithLayout><LikedSongsPage /></WithLayout></ProtectedRoute>} />
          <Route path="/following" element={<ProtectedRoute allowedRoles={USER_ONLY}><WithLayout><FollowingPage /></WithLayout></ProtectedRoute>} />
          <Route path="/search" element={<ProtectedRoute allowedRoles={USER_ONLY}><WithLayout><SearchPage /></WithLayout></ProtectedRoute>} />
          <Route path="/charts" element={<ProtectedRoute allowedRoles={USER_ONLY}><WithLayout><ChartsPage /></WithLayout></ProtectedRoute>} />
          <Route path="/donate/:id" element={<ProtectedRoute allowedRoles={USER_ONLY}><WithLayout><DonatePage /></WithLayout></ProtectedRoute>} />
          <Route path="/donation-result" element={<ProtectedRoute allowedRoles={USER_ONLY}><DonationResultPage /></ProtectedRoute>} />
          <Route path="/profile" element={<ProtectedRoute allowedRoles={USER_ONLY}><WithLayout><ProfilePage /></WithLayout></ProtectedRoute>} />
          <Route path="/donation-history" element={<ProtectedRoute allowedRoles={USER_ONLY}><WithLayout><DonationHistoryPage /></WithLayout></ProtectedRoute>} />

          {/* ── ARTIST routes (role: artist) ───────────────────────── */}
          <Route path="/artist/dashboard" element={<ProtectedRoute allowedRoles={ARTIST_ONLY}><WithArtistLayout><ArtistDashboardPage /></WithArtistLayout></ProtectedRoute>} />

          {/* ── ADMIN routes (role: admin) ─────────────────────────── */}
          <Route path="/admin" element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><WithAdminLayout><PendingSongsPage /></WithAdminLayout></ProtectedRoute>} />
          <Route path="/admin/users" element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><WithAdminLayout><AdminUsersPage /></WithAdminLayout></ProtectedRoute>} />
          <Route path="/admin/stats" element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><WithAdminLayout><AdminStatsPage /></WithAdminLayout></ProtectedRoute>} />
          <Route path="/admin/songs" element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><WithAdminLayout><SongsManagePage /></WithAdminLayout></ProtectedRoute>} />
          <Route path="/admin/artists" element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><WithAdminLayout><ArtistsManagePage /></WithAdminLayout></ProtectedRoute>} />
          <Route path="/admin/albums" element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><WithAdminLayout><AlbumsManagePage /></WithAdminLayout></ProtectedRoute>} />
          <Route path="/admin/playlists" element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><WithAdminLayout><PlaylistsManagePage /></WithAdminLayout></ProtectedRoute>} />
          <Route path="/admin/users/:id" element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><WithAdminLayout><UserDetailPage /></WithAdminLayout></ProtectedRoute>} />
          <Route path="/admin/analytics" element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><WithAdminLayout><AnalyticsPage /></WithAdminLayout></ProtectedRoute>} />
          <Route path="/admin/donations" element={<ProtectedRoute allowedRoles={ADMIN_ONLY}><WithAdminLayout><DonationsPage /></WithAdminLayout></ProtectedRoute>} />

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>

        <PlayerBarWrapper />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

export default App;
