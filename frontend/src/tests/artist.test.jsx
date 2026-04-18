import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../lib/artistApi', () => ({
  getDashboard: vi.fn(),
  getMySongs: vi.fn(),
  uploadSong: vi.fn(),
  deleteSong: vi.fn(),
  getMyAlbums: vi.fn(),
  createAlbum: vi.fn(),
}));

import { getDashboard, getMySongs, deleteSong } from '../lib/artistApi';
import ArtistDashboardPage from '../pages/ArtistDashboardPage';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderPage() {
  return render(
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter>
        <ArtistDashboardPage />
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const mockDashboard = {
  id: 'a1',
  displayName: 'Test Artist',
  email: 'artist@test.com',
  avatarUrl: null,
  bio: 'Bio here',
  totalEarnings: 500,
  followerCount: 10,
  totalSongs: 2,
  totalPlayCount: 1000,
  songsByStatus: { pending: 1, published: 1, rejected: 0 },
};

const mockSong = {
  id: 's1',
  title: 'My Pending Song',
  status: 'pending',
  rejectionReason: null,
  uploadedAt: new Date().toISOString(),
};

beforeEach(() => vi.clearAllMocks());

// ─── Tests ────────────────────────────────────────────────────────────────────

describe('ArtistDashboardPage', () => {
  test('renders dashboard stats', async () => {
    getDashboard.mockResolvedValue(mockDashboard);
    getMySongs.mockResolvedValue({ songs: [], pagination: { total: 0 } });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('dashboard-stats')).toBeInTheDocument());
    expect(screen.getByText('Test Artist')).toBeInTheDocument();
    expect(screen.getByText('1,000')).toBeInTheDocument(); // totalPlayCount
  });

  test('shows empty state when no songs', async () => {
    getDashboard.mockResolvedValue(mockDashboard);
    getMySongs.mockResolvedValue({ songs: [], pagination: { total: 0 } });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('empty-songs')).toBeInTheDocument());
    expect(screen.getByText(/No songs uploaded yet/)).toBeInTheDocument();
  });

  test('renders songs list', async () => {
    getDashboard.mockResolvedValue(mockDashboard);
    getMySongs.mockResolvedValue({ songs: [mockSong], pagination: { total: 1 } });

    renderPage();

    await waitFor(() => expect(screen.getByTestId('songs-list')).toBeInTheDocument());
    expect(screen.getByText('My Pending Song')).toBeInTheDocument();
    expect(screen.getByText('pending')).toBeInTheDocument();
  });

  test('shows upload form when toggle clicked', async () => {
    getDashboard.mockResolvedValue(mockDashboard);
    getMySongs.mockResolvedValue({ songs: [], pagination: { total: 0 } });

    renderPage();

    await waitFor(() => screen.getByTestId('upload-toggle'));
    fireEvent.click(screen.getByTestId('upload-toggle'));

    expect(screen.getByTestId('upload-form')).toBeInTheDocument();
    expect(screen.getByTestId('audio-input')).toBeInTheDocument();
  });

  test('shows status counts in dashboard', async () => {
    getDashboard.mockResolvedValue(mockDashboard);
    getMySongs.mockResolvedValue({ songs: [], pagination: { total: 0 } });

    renderPage();

    await waitFor(() => screen.getByTestId('dashboard-stats'));
    expect(screen.getByText(/Published: 1/)).toBeInTheDocument();
    expect(screen.getByText(/Pending: 1/)).toBeInTheDocument();
  });
});
