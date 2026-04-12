import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { describe, test, expect, vi, beforeEach } from 'vitest';

import SongCard from '../components/SongCard';
import ArtistCard from '../components/ArtistCard';
import ArtistPage from '../pages/ArtistPage';
import AlbumPage from '../pages/AlbumPage';

// ─── Mock musicApi ────────────────────────────────────────────────────────────

vi.mock('../lib/musicApi', () => ({
  fetchArtist: vi.fn(),
  fetchAlbum: vi.fn(),
  fetchSongs: vi.fn(),
  fetchSong: vi.fn(),
}));

import { fetchArtist, fetchAlbum } from '../lib/musicApi';

// ─── Fixtures ─────────────────────────────────────────────────────────────────

const mockSong = {
  id: 'song-1',
  title: 'Test Song',
  duration: 213,
  coverUrl: null,
  playCount: 500,
  artist: { id: 'artist-1', displayName: 'Artist One', avatarUrl: null },
  album: null,
  genre: { id: 'genre-1', name: 'V-Pop', slug: 'v-pop' },
};

const mockArtist = {
  id: 'artist-1',
  displayName: 'Artist One',
  avatarUrl: null,
  bio: 'A talented artist',
  totalPlayCount: 1000,
  followerCount: 42,
  songs: [mockSong, { ...mockSong, id: 'song-2', title: 'Second Song' }],
  albums: [
    { id: 'album-1', title: 'Great Album', coverUrl: null, year: 2024 },
  ],
};

const mockAlbum = {
  id: 'album-1',
  title: 'Great Album',
  coverUrl: null,
  year: 2024,
  artist: { id: 'artist-1', displayName: 'Artist One', avatarUrl: null },
  songs: [mockSong, { ...mockSong, id: 'song-2', title: 'Second Song' }],
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeQueryClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function renderWithProviders(ui, { initialEntries = ['/'] } = {}) {
  return render(
    <QueryClientProvider client={makeQueryClient()}>
      <MemoryRouter initialEntries={initialEntries}>{ui}</MemoryRouter>
    </QueryClientProvider>
  );
}

beforeEach(() => vi.clearAllMocks());

// ─── SongCard ────────────────────────────────────────────────────────────────

describe('SongCard', () => {
  test('renders song title and artist name', () => {
    renderWithProviders(<SongCard song={mockSong} />);
    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('Artist One')).toBeInTheDocument();
  });

  test('renders formatted duration', () => {
    renderWithProviders(<SongCard song={mockSong} />);
    expect(screen.getByText('3:33')).toBeInTheDocument();
  });

  test('renders rank when provided', () => {
    renderWithProviders(<SongCard song={mockSong} rank={1} />);
    expect(screen.getByText('1')).toBeInTheDocument();
  });

  test('does not render rank column when rank is omitted', () => {
    renderWithProviders(<SongCard song={mockSong} />);
    expect(screen.queryByText('1')).not.toBeInTheDocument();
  });

  test('renders fallback icon when coverUrl is null', () => {
    renderWithProviders(<SongCard song={mockSong} />);
    expect(screen.getByText('♪')).toBeInTheDocument();
  });

  test('renders cover image when coverUrl is provided', () => {
    const song = { ...mockSong, coverUrl: 'https://example.com/cover.jpg' };
    renderWithProviders(<SongCard song={song} />);
    expect(screen.getByRole('img', { name: 'Test Song' })).toHaveAttribute('src', 'https://example.com/cover.jpg');
  });
});

// ─── ArtistCard ──────────────────────────────────────────────────────────────

describe('ArtistCard', () => {
  const artist = { id: 'artist-1', displayName: 'Artist One', avatarUrl: null, followerCount: 42 };

  test('renders artist name', () => {
    renderWithProviders(<ArtistCard artist={artist} />);
    expect(screen.getByText('Artist One')).toBeInTheDocument();
  });

  test('renders follower count', () => {
    renderWithProviders(<ArtistCard artist={artist} />);
    expect(screen.getByText('42 followers')).toBeInTheDocument();
  });

  test('links to /artists/:id', () => {
    renderWithProviders(<ArtistCard artist={artist} />);
    expect(screen.getByRole('link')).toHaveAttribute('href', '/artists/artist-1');
  });
});

// ─── ArtistPage ──────────────────────────────────────────────────────────────

describe('ArtistPage', () => {
  test('renders artist info, songs, and albums after loading', async () => {
    fetchArtist.mockResolvedValue(mockArtist);

    renderWithProviders(
      <Routes>
        <Route path="/artists/:id" element={<ArtistPage />} />
      </Routes>,
      { initialEntries: ['/artists/artist-1'] }
    );

    expect(screen.getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Artist One' })).toBeInTheDocument());

    expect(screen.getByText('A talented artist')).toBeInTheDocument();
    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('Second Song')).toBeInTheDocument();
    expect(screen.getByText('Great Album')).toBeInTheDocument();
  });

  test('shows error state when fetch fails', async () => {
    fetchArtist.mockRejectedValue(new Error('Not found'));

    renderWithProviders(
      <Routes>
        <Route path="/artists/:id" element={<ArtistPage />} />
      </Routes>,
      { initialEntries: ['/artists/bad-id'] }
    );

    await waitFor(() => expect(screen.getByText('Artist not found.')).toBeInTheDocument());
  });

  test('clicking album navigates to /albums/:id', async () => {
    fetchArtist.mockResolvedValue(mockArtist);

    renderWithProviders(
      <Routes>
        <Route path="/artists/:id" element={<ArtistPage />} />
        <Route path="/albums/:id" element={<div>Album Page</div>} />
      </Routes>,
      { initialEntries: ['/artists/artist-1'] }
    );

    await waitFor(() => expect(screen.getByText('Great Album')).toBeInTheDocument());

    const albumLink = screen.getByRole('link', { name: /Great Album/i });
    expect(albumLink).toHaveAttribute('href', '/albums/album-1');
  });
});

// ─── AlbumPage ───────────────────────────────────────────────────────────────

describe('AlbumPage', () => {
  test('renders album title, artist link, and songs', async () => {
    fetchAlbum.mockResolvedValue(mockAlbum);

    renderWithProviders(
      <Routes>
        <Route path="/albums/:id" element={<AlbumPage />} />
      </Routes>,
      { initialEntries: ['/albums/album-1'] }
    );

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Great Album' })).toBeInTheDocument());

    expect(screen.getAllByText('Artist One').length).toBeGreaterThan(0);
    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('Second Song')).toBeInTheDocument();
  });

  test('artist name links to /artists/:id', async () => {
    fetchAlbum.mockResolvedValue(mockAlbum);

    renderWithProviders(
      <Routes>
        <Route path="/albums/:id" element={<AlbumPage />} />
      </Routes>,
      { initialEntries: ['/albums/album-1'] }
    );

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Great Album' })).toBeInTheDocument());

    expect(screen.getByRole('link', { name: 'Artist One' })).toHaveAttribute(
      'href',
      '/artists/artist-1'
    );
  });

  test('shows error state when fetch fails', async () => {
    fetchAlbum.mockRejectedValue(new Error('Not found'));

    renderWithProviders(
      <Routes>
        <Route path="/albums/:id" element={<AlbumPage />} />
      </Routes>,
      { initialEntries: ['/albums/bad-id'] }
    );

    await waitFor(() => expect(screen.getByText('Album not found.')).toBeInTheDocument());
  });
});
