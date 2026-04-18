import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter } from 'react-router-dom';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../lib/searchApi', () => ({
  searchAll: vi.fn(),
}));

vi.mock('../lib/chartsApi', () => ({
  fetchChart: vi.fn(),
}));

vi.mock('../stores/playerStore', () => ({
  usePlayerStore: vi.fn(() => ({
    playSong: vi.fn(),
    playQueue: vi.fn(),
    currentSong: null,
    isPlaying: false,
    togglePlay: vi.fn(),
  })),
}));

vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({ isAuthenticated: true, user: { id: 'u1' } })),
}));

vi.mock('../lib/playlistApi', () => ({
  checkLiked: vi.fn().mockResolvedValue(false),
  getPlaylists: vi.fn().mockResolvedValue([]),
}));

import { searchAll } from '../lib/searchApi';
import { fetchChart } from '../lib/chartsApi';
import SearchPage from '../pages/SearchPage';
import ChartsPage from '../pages/ChartsPage';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderWithProviders(ui) {
  return render(
    <QueryClientProvider client={makeClient()}>
      <MemoryRouter>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

const mockSong = {
  id: 's1',
  title: 'Top Song',
  duration: 200,
  coverUrl: null,
  playCount: 100,
  artist: { id: 'a1', displayName: 'Artist One', avatarUrl: null },
  album: null,
  genre: null,
};

// ─── SearchPage ───────────────────────────────────────────────────────────────

describe('SearchPage', () => {
  beforeEach(() => vi.clearAllMocks());

  test('renders search input', () => {
    renderWithProviders(<SearchPage />);
    expect(screen.getByTestId('search-input')).toBeInTheDocument();
  });

  test('shows type filter buttons', () => {
    renderWithProviders(<SearchPage />);
    expect(screen.getByText('All')).toBeInTheDocument();
    expect(screen.getByText('Songs')).toBeInTheDocument();
    expect(screen.getByText('Artists')).toBeInTheDocument();
    expect(screen.getByText('Albums')).toBeInTheDocument();
  });

  test('shows song results when query returns songs', async () => {
    searchAll.mockResolvedValue({
      songs: [mockSong],
      artists: [],
      albums: [],
    });

    renderWithProviders(<SearchPage />);
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'top' } });

    await waitFor(() => expect(screen.getByTestId('songs-section')).toBeInTheDocument());
    expect(screen.getByText('Top Song')).toBeInTheDocument();
  });

  test('shows no results message when search returns empty', async () => {
    searchAll.mockResolvedValue({ songs: [], artists: [], albums: [] });

    renderWithProviders(<SearchPage />);
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'xyz' } });

    await waitFor(() => expect(screen.getByText(/No results for/)).toBeInTheDocument());
  });

  test('shows artists section when results include artists', async () => {
    searchAll.mockResolvedValue({
      songs: [],
      artists: [{ id: 'a1', displayName: 'Artist One', avatarUrl: null, followerCount: 500, bio: '' }],
      albums: [],
    });

    renderWithProviders(<SearchPage />);
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'artist' } });

    await waitFor(() => expect(screen.getByTestId('artists-section')).toBeInTheDocument());
    expect(screen.getByText('Artist One')).toBeInTheDocument();
    expect(screen.getByText('500 followers')).toBeInTheDocument();
  });

  test('shows albums section when results include albums', async () => {
    searchAll.mockResolvedValue({
      songs: [],
      artists: [],
      albums: [{ id: 'al1', title: 'Great Album', coverUrl: null, year: 2024, artist: { id: 'a1', displayName: 'Artist One' } }],
    });

    renderWithProviders(<SearchPage />);
    fireEvent.change(screen.getByTestId('search-input'), { target: { value: 'album' } });

    await waitFor(() => expect(screen.getByTestId('albums-section')).toBeInTheDocument());
    expect(screen.getByText('Great Album')).toBeInTheDocument();
  });

  test('does not call searchAll when query is empty', () => {
    renderWithProviders(<SearchPage />);
    expect(searchAll).not.toHaveBeenCalled();
  });
});

// ─── ChartsPage ───────────────────────────────────────────────────────────────

describe('ChartsPage', () => {
  beforeEach(() => vi.clearAllMocks());

  test('renders chart type tabs', () => {
    fetchChart.mockResolvedValue({ type: 'daily', title: 'Daily Top 50', songs: [], computedAt: '' });
    renderWithProviders(<ChartsPage />);
    expect(screen.getByTestId('tab-daily')).toBeInTheDocument();
    expect(screen.getByTestId('tab-weekly')).toBeInTheDocument();
    expect(screen.getByTestId('tab-monthly')).toBeInTheDocument();
  });

  test('displays chart songs', async () => {
    fetchChart.mockResolvedValue({
      type: 'daily',
      title: 'Daily Top 50',
      songs: [mockSong],
      computedAt: new Date().toISOString(),
    });

    renderWithProviders(<ChartsPage />);

    await waitFor(() => expect(screen.getByTestId('chart-songs')).toBeInTheDocument());
    expect(screen.getByText('Top Song')).toBeInTheDocument();
  });

  test('switching tab calls fetchChart with new type', async () => {
    fetchChart.mockResolvedValue({ type: 'daily', title: 'Daily Top 50', songs: [], computedAt: '' });

    renderWithProviders(<ChartsPage />);
    fireEvent.click(screen.getByTestId('tab-weekly'));

    await waitFor(() =>
      expect(fetchChart).toHaveBeenCalledWith('weekly')
    );
  });

  test('shows empty message when chart has no songs', async () => {
    fetchChart.mockResolvedValue({ type: 'daily', title: 'Daily Top 50', songs: [], computedAt: '' });
    renderWithProviders(<ChartsPage />);
    await waitFor(() => expect(screen.getByText('Daily Top 50')).toBeInTheDocument());
    expect(screen.getByText(/No data yet/)).toBeInTheDocument();
  });

  test('shows rank numbers on songs', async () => {
    fetchChart.mockResolvedValue({
      type: 'weekly',
      title: 'Weekly Top 50',
      songs: [mockSong],
      computedAt: '',
    });

    renderWithProviders(<ChartsPage />);
    await waitFor(() => expect(screen.getByText('1')).toBeInTheDocument());
  });
});
