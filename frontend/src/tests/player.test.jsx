import { render, screen, fireEvent, act } from '@testing-library/react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { usePlayerStore } from '../stores/playerStore';

// ─── Mock Howler ─────────────────────────────────────────────────────────────

const mockHowl = {
  play: vi.fn(),
  pause: vi.fn(),
  stop: vi.fn(),
  unload: vi.fn(),
  volume: vi.fn(),
  seek: vi.fn().mockReturnValue(0),
  duration: vi.fn().mockReturnValue(180),
  playing: vi.fn().mockReturnValue(false),
  on: vi.fn(),
};

vi.mock('howler', () => ({
  Howl: vi.fn().mockImplementation(() => mockHowl),
}));

// ─── Mock playerApi ──────────────────────────────────────────────────────────

vi.mock('../lib/playerApi', () => ({
  getStreamUrl: vi.fn().mockResolvedValue({ songId: 'song-1', title: 'Test Song', url: 'https://s3.example.com/audio/test.mp3' }),
  logPlay: vi.fn().mockResolvedValue(undefined),
  logBehavior: vi.fn().mockResolvedValue(undefined),
}));

import { getStreamUrl, logPlay } from '../lib/playerApi';
import PlayerBar from '../components/player/PlayerBar';
import PlayerControls from '../components/player/PlayerControls';
import ProgressBar from '../components/player/ProgressBar';
import VolumeControl from '../components/player/VolumeControl';
import SongCard from '../components/SongCard';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const SONG = { id: 'song-1', title: 'Test Song', duration: 180, coverUrl: null, artist: { id: 'a-1', displayName: 'Artist' } };

beforeEach(() => {
  vi.clearAllMocks();
  usePlayerStore.setState({ currentSong: null, queue: [], queueIndex: 0, isPlaying: false, volume: 0.8 });
});

// ─── playerStore ─────────────────────────────────────────────────────────────

describe('playerStore', () => {
  test('playSong sets currentSong and isPlaying', () => {
    usePlayerStore.getState().playSong(SONG);
    const s = usePlayerStore.getState();
    expect(s.currentSong).toEqual(SONG);
    expect(s.isPlaying).toBe(true);
    expect(s.queue).toEqual([SONG]);
  });

  test('togglePlay flips isPlaying', () => {
    usePlayerStore.setState({ isPlaying: false });
    usePlayerStore.getState().togglePlay();
    expect(usePlayerStore.getState().isPlaying).toBe(true);
    usePlayerStore.getState().togglePlay();
    expect(usePlayerStore.getState().isPlaying).toBe(false);
  });

  test('nextSong advances queue', () => {
    const songs = [SONG, { ...SONG, id: 'song-2', title: 'Song 2' }];
    usePlayerStore.setState({ queue: songs, queueIndex: 0, currentSong: songs[0] });
    usePlayerStore.getState().nextSong();
    const s = usePlayerStore.getState();
    expect(s.queueIndex).toBe(1);
    expect(s.currentSong.id).toBe('song-2');
  });

  test('nextSong stops at end of queue', () => {
    usePlayerStore.setState({ queue: [SONG], queueIndex: 0, currentSong: SONG, isPlaying: true });
    usePlayerStore.getState().nextSong();
    expect(usePlayerStore.getState().isPlaying).toBe(false);
  });

  test('prevSong goes back in queue', () => {
    const songs = [SONG, { ...SONG, id: 'song-2' }];
    usePlayerStore.setState({ queue: songs, queueIndex: 1, currentSong: songs[1] });
    usePlayerStore.getState().prevSong();
    expect(usePlayerStore.getState().queueIndex).toBe(0);
    expect(usePlayerStore.getState().currentSong.id).toBe('song-1');
  });

  test('setVolume updates volume', () => {
    usePlayerStore.getState().setVolume(0.5);
    expect(usePlayerStore.getState().volume).toBe(0.5);
  });

  test('playQueue sets queue and plays from given index', () => {
    const songs = [SONG, { ...SONG, id: 'song-2' }];
    usePlayerStore.getState().playQueue(songs, 1);
    const s = usePlayerStore.getState();
    expect(s.currentSong.id).toBe('song-2');
    expect(s.queueIndex).toBe(1);
    expect(s.isPlaying).toBe(true);
  });
});

// ─── PlayerControls ───────────────────────────────────────────────────────────

describe('PlayerControls', () => {
  test('renders play button when paused', () => {
    render(<PlayerControls isPlaying={false} hasPrev={false} hasNext={false} onToggle={vi.fn()} onPrev={vi.fn()} onNext={vi.fn()} />);
    expect(screen.getByLabelText('Play')).toBeInTheDocument();
  });

  test('renders pause button when playing', () => {
    render(<PlayerControls isPlaying={true} hasPrev={false} hasNext={false} onToggle={vi.fn()} onPrev={vi.fn()} onNext={vi.fn()} />);
    expect(screen.getByLabelText('Pause')).toBeInTheDocument();
  });

  test('calls onToggle when play/pause clicked', () => {
    const onToggle = vi.fn();
    render(<PlayerControls isPlaying={false} hasPrev={false} hasNext={false} onToggle={onToggle} onPrev={vi.fn()} onNext={vi.fn()} />);
    fireEvent.click(screen.getByLabelText('Play'));
    expect(onToggle).toHaveBeenCalledOnce();
  });

  test('prev button disabled when hasPrev=false', () => {
    render(<PlayerControls isPlaying={false} hasPrev={false} hasNext={true} onToggle={vi.fn()} onPrev={vi.fn()} onNext={vi.fn()} />);
    expect(screen.getByLabelText('Previous')).toBeDisabled();
  });

  test('next button disabled when hasNext=false', () => {
    render(<PlayerControls isPlaying={false} hasPrev={true} hasNext={false} onToggle={vi.fn()} onPrev={vi.fn()} onNext={vi.fn()} />);
    expect(screen.getByLabelText('Next')).toBeDisabled();
  });
});

// ─── ProgressBar ──────────────────────────────────────────────────────────────

describe('ProgressBar', () => {
  test('renders current and total time', () => {
    render(<ProgressBar current={65} duration={180} onSeek={vi.fn()} />);
    expect(screen.getByText('1:05')).toBeInTheDocument();
    expect(screen.getByText('3:00')).toBeInTheDocument();
  });

  test('shows 0:00 when no time given', () => {
    render(<ProgressBar />);
    expect(screen.getAllByText('0:00').length).toBeGreaterThan(0);
  });
});

// ─── VolumeControl ────────────────────────────────────────────────────────────

describe('VolumeControl', () => {
  test('renders volume slider', () => {
    render(<VolumeControl volume={0.8} onChange={vi.fn()} />);
    expect(screen.getByLabelText('Volume')).toBeInTheDocument();
  });

  test('calls onChange when slider moves', () => {
    const onChange = vi.fn();
    render(<VolumeControl volume={0.8} onChange={onChange} />);
    fireEvent.change(screen.getByLabelText('Volume'), { target: { value: '0.5' } });
    expect(onChange).toHaveBeenCalledWith(0.5);
  });

  test('mute button toggles to 0', () => {
    const onChange = vi.fn();
    render(<VolumeControl volume={0.8} onChange={onChange} />);
    fireEvent.click(screen.getByLabelText('Mute'));
    expect(onChange).toHaveBeenCalledWith(0);
  });
});

// ─── PlayerBar ────────────────────────────────────────────────────────────────

describe('PlayerBar', () => {
  test('renders nothing when no currentSong', () => {
    const { container } = render(<PlayerBar />);
    expect(container.firstChild).toBeNull();
  });

  test('renders song info when currentSong is set', async () => {
    await act(async () => {
      usePlayerStore.setState({ currentSong: SONG, isPlaying: true, queue: [SONG], queueIndex: 0, volume: 0.8 });
      render(<PlayerBar />);
    });
    expect(screen.getByText('Test Song')).toBeInTheDocument();
    expect(screen.getByText('Artist')).toBeInTheDocument();
  });

  test('calls getStreamUrl when song loads', async () => {
    await act(async () => {
      usePlayerStore.setState({ currentSong: SONG, isPlaying: true, queue: [SONG], queueIndex: 0, volume: 0.8 });
      render(<PlayerBar />);
    });
    expect(getStreamUrl).toHaveBeenCalledWith(SONG.id);
  });
});

// ─── SongCard ─────────────────────────────────────────────────────────────────

describe('SongCard', () => {
  test('calls playSong on click', () => {
    render(<SongCard song={SONG} />);
    fireEvent.click(screen.getByText('Test Song'));
    expect(usePlayerStore.getState().currentSong).toEqual(SONG);
    expect(usePlayerStore.getState().isPlaying).toBe(true);
  });

  test('calls togglePlay when clicking currently playing song', () => {
    usePlayerStore.setState({ currentSong: SONG, isPlaying: true });
    render(<SongCard song={SONG} />);
    fireEvent.click(screen.getByText('Test Song'));
    expect(usePlayerStore.getState().isPlaying).toBe(false);
  });
});
