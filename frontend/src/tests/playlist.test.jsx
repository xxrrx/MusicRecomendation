import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// ─── Mocks ────────────────────────────────────────────────────────────────────

vi.mock('../lib/playlistApi', () => ({
  getPlaylists: vi.fn(),
  getPlaylist: vi.fn(),
  createPlaylist: vi.fn(),
  deletePlaylist: vi.fn(),
  addSongToPlaylist: vi.fn(),
  removeSongFromPlaylist: vi.fn(),
  getLikedSongs: vi.fn(),
  checkLiked: vi.fn(),
  likeSong: vi.fn(),
  unlikeSong: vi.fn(),
}));

vi.mock('../lib/socialApi', () => ({
  getFollowing: vi.fn(),
  checkFollowing: vi.fn(),
  followArtist: vi.fn(),
  unfollowArtist: vi.fn(),
}));

vi.mock('../stores/authStore', () => ({
  useAuthStore: vi.fn(() => ({ isAuthenticated: true, user: { id: 'user-1' } })),
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

import {
  getPlaylists, getPlaylist, createPlaylist, getLikedSongs, checkLiked, likeSong, unlikeSong,
} from '../lib/playlistApi';
import { getFollowing, checkFollowing, followArtist, unfollowArtist } from '../lib/socialApi';
import PlaylistsPage from '../pages/PlaylistsPage';
import PlaylistPage from '../pages/PlaylistPage';
import LikedSongsPage from '../pages/LikedSongsPage';
import FollowingPage from '../pages/FollowingPage';
import LikeButton from '../components/LikeButton';
import FollowButton from '../components/FollowButton';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function makeClient() {
  return new QueryClient({ defaultOptions: { queries: { retry: false } } });
}

function wrap(ui, { path = '/', initialEntries = ['/'] } = {}) {
  const client = makeClient();
  return render(
    <QueryClientProvider client={client}>
      <MemoryRouter initialEntries={initialEntries}>
        {ui}
      </MemoryRouter>
    </QueryClientProvider>
  );
}

const MOCK_PLAYLISTS = [
  { id: 'pl-1', title: 'Chill Vibes', coverUrl: null, songCount: 3, createdAt: new Date(), updatedAt: new Date() },
];

const MOCK_SONG = {
  id: 'song-1', title: 'Night Drive', duration: 240, coverUrl: null, playCount: 100,
  artist: { id: 'a-1', displayName: 'SƠNTUNG', avatarUrl: null },
  album: null, genre: null,
};

const MOCK_PLAYLIST_DETAIL = {
  id: 'pl-1', title: 'Chill Vibes', coverUrl: null, songCount: 1,
  songs: [{ ...MOCK_SONG, position: 1, addedAt: new Date() }],
  createdAt: new Date(), updatedAt: new Date(),
};

beforeEach(() => vi.clearAllMocks());

// ─── PlaylistsPage ────────────────────────────────────────────────────────────

describe('PlaylistsPage', () => {
  test('renders playlist list', async () => {
    getPlaylists.mockResolvedValue(MOCK_PLAYLISTS);

    wrap(<PlaylistsPage />);

    expect(await screen.findByText('Chill Vibes')).toBeInTheDocument();
    expect(screen.getByText('3 songs')).toBeInTheDocument();
  });

  test('shows empty state when no playlists', async () => {
    getPlaylists.mockResolvedValue([]);

    wrap(<PlaylistsPage />);

    expect(await screen.findByText(/No playlists yet/)).toBeInTheDocument();
  });

  test('shows create form when button clicked', async () => {
    getPlaylists.mockResolvedValue([]);

    wrap(<PlaylistsPage />);

    await screen.findByText(/No playlists yet/);
    fireEvent.click(screen.getByText('+ New Playlist'));

    expect(screen.getByPlaceholderText('Playlist name...')).toBeInTheDocument();
  });

  test('calls createPlaylist on form submit', async () => {
    getPlaylists.mockResolvedValue([]);
    createPlaylist.mockResolvedValue({ id: 'pl-new', title: 'Road Trip', songCount: 0 });

    wrap(<PlaylistsPage />);

    await screen.findByText(/No playlists yet/);
    fireEvent.click(screen.getByText('+ New Playlist'));

    const input = screen.getByPlaceholderText('Playlist name...');
    fireEvent.change(input, { target: { value: 'Road Trip' } });
    fireEvent.submit(input.closest('form'));

    await waitFor(() => expect(createPlaylist).toHaveBeenCalledWith('Road Trip', null));
  });
});

// ─── PlaylistPage ─────────────────────────────────────────────────────────────

describe('PlaylistPage', () => {
  test('renders playlist detail with songs', async () => {
    getPlaylist.mockResolvedValue(MOCK_PLAYLIST_DETAIL);

    wrap(
      <Routes>
        <Route path="/playlists/:id" element={<PlaylistPage />} />
      </Routes>,
      { initialEntries: ['/playlists/pl-1'] }
    );

    expect(await screen.findByText('Chill Vibes')).toBeInTheDocument();
    expect(screen.getByText('Night Drive')).toBeInTheDocument();
  });

  test('shows empty state when no songs', async () => {
    getPlaylist.mockResolvedValue({ ...MOCK_PLAYLIST_DETAIL, songs: [], songCount: 0 });

    wrap(
      <Routes>
        <Route path="/playlists/:id" element={<PlaylistPage />} />
      </Routes>,
      { initialEntries: ['/playlists/pl-1'] }
    );

    expect(await screen.findByText('This playlist is empty.')).toBeInTheDocument();
  });
});

// ─── LikedSongsPage ───────────────────────────────────────────────────────────

describe('LikedSongsPage', () => {
  test('renders liked songs', async () => {
    getLikedSongs.mockResolvedValue({
      songs: [{ ...MOCK_SONG, likedAt: new Date() }],
      pagination: { page: 1, limit: 20, total: 1, totalPages: 1 },
    });

    wrap(<LikedSongsPage />);

    expect(await screen.findByText('Night Drive')).toBeInTheDocument();
    expect(screen.getByText('Liked Songs')).toBeInTheDocument();
  });

  test('shows empty state', async () => {
    getLikedSongs.mockResolvedValue({ songs: [], pagination: { total: 0 } });

    wrap(<LikedSongsPage />);

    expect(await screen.findByText('No liked songs yet.')).toBeInTheDocument();
  });
});

// ─── FollowingPage ────────────────────────────────────────────────────────────

describe('FollowingPage', () => {
  test('renders following list', async () => {
    checkFollowing.mockResolvedValue(true);
    getFollowing.mockResolvedValue({
      artists: [{ id: 'a-1', displayName: 'SƠNTUNG', avatarUrl: null, bio: null, followerCount: 500, followedAt: new Date() }],
      pagination: { total: 1 },
    });

    wrap(<FollowingPage />);

    expect(await screen.findByText('SƠNTUNG')).toBeInTheDocument();
    expect(screen.getByText('500 followers')).toBeInTheDocument();
  });

  test('shows empty state', async () => {
    getFollowing.mockResolvedValue({ artists: [], pagination: { total: 0 } });

    wrap(<FollowingPage />);

    expect(await screen.findByText(/not following any artists/)).toBeInTheDocument();
  });
});

// ─── LikeButton ───────────────────────────────────────────────────────────────

describe('LikeButton', () => {
  test('shows heart outline when not liked', async () => {
    checkLiked.mockResolvedValue(false);

    wrap(<LikeButton songId="song-1" />);

    expect(await screen.findByLabelText('Like song')).toBeInTheDocument();
  });

  test('shows filled heart when liked', async () => {
    checkLiked.mockResolvedValue(true);

    wrap(<LikeButton songId="song-1" />);

    expect(await screen.findByLabelText('Unlike song')).toBeInTheDocument();
  });

  test('calls unlikeSong when clicking liked button', async () => {
    checkLiked.mockResolvedValue(true);
    unlikeSong.mockResolvedValue(undefined);

    wrap(<LikeButton songId="song-1" />);

    const btn = await screen.findByLabelText('Unlike song');
    fireEvent.click(btn);

    await waitFor(() => expect(unlikeSong).toHaveBeenCalledWith('song-1'));
  });
});

// ─── FollowButton ─────────────────────────────────────────────────────────────

describe('FollowButton', () => {
  test('shows Follow when not following', async () => {
    checkFollowing.mockResolvedValue(false);

    wrap(<FollowButton artistId="a-1" />);

    expect(await screen.findByText('Follow')).toBeInTheDocument();
  });

  test('shows Following when already following', async () => {
    checkFollowing.mockResolvedValue(true);

    wrap(<FollowButton artistId="a-1" />);

    expect(await screen.findByText('Following')).toBeInTheDocument();
  });

  test('calls followArtist when clicking Follow', async () => {
    checkFollowing.mockResolvedValue(false);
    followArtist.mockResolvedValue(undefined);

    wrap(<FollowButton artistId="a-1" />);

    const btn = await screen.findByText('Follow');
    fireEvent.click(btn);

    await waitFor(() => expect(followArtist).toHaveBeenCalledWith('a-1'));
  });

  test('calls unfollowArtist when clicking Following', async () => {
    checkFollowing.mockResolvedValue(true);
    unfollowArtist.mockResolvedValue(undefined);

    wrap(<FollowButton artistId="a-1" />);

    const btn = await screen.findByText('Following');
    fireEvent.click(btn);

    await waitFor(() => expect(unfollowArtist).toHaveBeenCalledWith('a-1'));
  });
});
