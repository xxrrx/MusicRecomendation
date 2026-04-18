import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../lib/adminApi', () => ({
  getPendingSongs: vi.fn(),
  reviewSong: vi.fn(),
  getUsers: vi.fn(),
  updateUserStatus: vi.fn(),
  getStats: vi.fn(),
  adminDeleteSong: vi.fn(),
}));

import { getPendingSongs, reviewSong, getUsers, getStats } from '../lib/adminApi';
import AdminPanelPage from '../pages/AdminPanelPage';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderPage() {
  return render(
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter>
        <AdminPanelPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const mockPendingSong = {
  id: 's1',
  title: 'Pending Song',
  status: 'pending',
  uploadedAt: new Date().toISOString(),
  artist: { id: 'a1', user: { displayName: 'Artist One', email: 'artist@test.com' } },
  genre: null,
  album: null,
};

const mockUser = {
  id: 'u1',
  email: 'user@test.com',
  displayName: 'Regular User',
  role: 'user',
  isActive: true,
  isVerified: true,
  createdAt: new Date().toISOString(),
};

beforeEach(() => {
  vi.clearAllMocks();
  getPendingSongs.mockResolvedValue({ songs: [], pagination: { total: 0 } });
  getUsers.mockResolvedValue({ users: [], pagination: { total: 0 } });
  getStats.mockResolvedValue({ userCount: 0, songCount: 0, pendingCount: 0, artistCount: 0 });
});

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('AdminPanelPage', () => {
  test('renders admin panel with tabs', () => {
    renderPage();
    expect(screen.getByTestId('admin-panel')).toBeInTheDocument();
    expect(screen.getByTestId('tab-pending-songs')).toBeInTheDocument();
    expect(screen.getByTestId('tab-users')).toBeInTheDocument();
    expect(screen.getByTestId('tab-stats')).toBeInTheDocument();
  });

  test('shows no pending message when queue is empty', async () => {
    renderPage();
    await waitFor(() => expect(screen.getByTestId('no-pending')).toBeInTheDocument());
    expect(screen.getByText(/No songs pending review/)).toBeInTheDocument();
  });

  test('renders pending songs list', async () => {
    getPendingSongs.mockResolvedValue({ songs: [mockPendingSong], pagination: { total: 1 } });
    renderPage();

    await waitFor(() => expect(screen.getByTestId('pending-songs-list')).toBeInTheDocument());
    expect(screen.getByText('Pending Song')).toBeInTheDocument();
    expect(screen.getByText('by Artist One')).toBeInTheDocument();
  });

  test('approve button triggers reviewSong', async () => {
    getPendingSongs.mockResolvedValue({ songs: [mockPendingSong], pagination: { total: 1 } });
    reviewSong.mockResolvedValue({ id: 's1', status: 'published' });
    getPendingSongs.mockResolvedValueOnce({ songs: [mockPendingSong], pagination: { total: 1 } });

    renderPage();

    await waitFor(() => screen.getByTestId(`approve-${mockPendingSong.id}`));
    fireEvent.click(screen.getByTestId(`approve-${mockPendingSong.id}`));

    await waitFor(() => expect(reviewSong).toHaveBeenCalledWith('s1', { action: 'approved' }));
  });

  test('reject button shows reason input', async () => {
    getPendingSongs.mockResolvedValue({ songs: [mockPendingSong], pagination: { total: 1 } });
    renderPage();

    await waitFor(() => screen.getByTestId(`reject-btn-${mockPendingSong.id}`));
    fireEvent.click(screen.getByTestId(`reject-btn-${mockPendingSong.id}`));

    expect(screen.getByTestId(`reject-form-${mockPendingSong.id}`)).toBeInTheDocument();
    expect(screen.getByTestId(`reject-reason-${mockPendingSong.id}`)).toBeInTheDocument();
  });

  test('renders users table on users tab', async () => {
    getUsers.mockResolvedValue({ users: [mockUser], pagination: { total: 1 } });
    renderPage();

    fireEvent.click(screen.getByTestId('tab-users'));

    await waitFor(() => expect(screen.getByTestId('users-table')).toBeInTheDocument());
    expect(screen.getByText('Regular User')).toBeInTheDocument();
    expect(screen.getByText('Active')).toBeInTheDocument();
  });

  test('renders stats on stats tab', async () => {
    getStats.mockResolvedValue({ userCount: 100, songCount: 50, pendingCount: 5, artistCount: 20 });
    renderPage();

    fireEvent.click(screen.getByTestId('tab-stats'));

    await waitFor(() => expect(screen.getByTestId('stats-tab')).toBeInTheDocument());
    expect(screen.getByText('100')).toBeInTheDocument();
  });
});
