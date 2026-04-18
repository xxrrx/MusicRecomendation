import { create } from 'zustand';

// repeat: 'off' | 'one' | 'all'

export const usePlayerStore = create((set, get) => ({
  currentSong: null,
  queue: [],
  queueIndex: 0,
  isPlaying: false,
  volume: 0.8,
  repeat: 'off', // 'off' | 'one' | 'all'

  // Play a single song (replaces queue)
  playSong: (song) =>
    set({ currentSong: song, queue: [song], queueIndex: 0, isPlaying: true }),

  // Play from a list at a given index
  playQueue: (songs, index = 0) =>
    set({ currentSong: songs[index], queue: songs, queueIndex: index, isPlaying: true }),

  // Add a song to end of queue
  addToQueue: (song) =>
    set((s) => ({ queue: [...s.queue, song] })),

  // Remove song from queue by index (cannot remove currently playing)
  removeFromQueue: (index) =>
    set((s) => {
      if (index === s.queueIndex) return {};
      const queue = s.queue.filter((_, i) => i !== index);
      const queueIndex = index < s.queueIndex ? s.queueIndex - 1 : s.queueIndex;
      return { queue, queueIndex };
    }),

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

  // Called by PlayerBar onend — respects repeat mode
  handleSongEnd: () => {
    const { queue, queueIndex, repeat } = get();
    if (repeat === 'one') {
      // Signal PlayerBar to restart current song
      set({ isPlaying: true });
      return 'restart';
    }
    const next = queueIndex + 1;
    if (next < queue.length) {
      set({ currentSong: queue[next], queueIndex: next, isPlaying: true });
    } else if (repeat === 'all' && queue.length > 0) {
      set({ currentSong: queue[0], queueIndex: 0, isPlaying: true });
    } else {
      set({ isPlaying: false });
    }
    return 'next';
  },

  nextSong: () => {
    const { queue, queueIndex, repeat } = get();
    const next = queueIndex + 1;
    if (next < queue.length) {
      set({ currentSong: queue[next], queueIndex: next, isPlaying: true });
    } else if (repeat === 'all' && queue.length > 0) {
      set({ currentSong: queue[0], queueIndex: 0, isPlaying: true });
    } else {
      set({ isPlaying: false });
    }
  },

  prevSong: () => {
    const { queue, queueIndex } = get();
    const prev = queueIndex - 1;
    if (prev >= 0) {
      set({ currentSong: queue[prev], queueIndex: prev, isPlaying: true });
    }
  },

  setVolume: (volume) => set({ volume }),

  cycleRepeat: () =>
    set((s) => {
      const next = s.repeat === 'off' ? 'one' : s.repeat === 'one' ? 'all' : 'off';
      return { repeat: next };
    }),
}));
