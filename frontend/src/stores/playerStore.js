import { create } from 'zustand';

export const usePlayerStore = create((set, get) => ({
  currentSong: null,
  queue: [],
  queueIndex: 0,
  isPlaying: false,
  volume: 0.8,

  // Play a single song (replaces queue)
  playSong: (song) =>
    set({ currentSong: song, queue: [song], queueIndex: 0, isPlaying: true }),

  // Play from a list at a given index
  playQueue: (songs, index = 0) =>
    set({ currentSong: songs[index], queue: songs, queueIndex: index, isPlaying: true }),

  setIsPlaying: (isPlaying) => set({ isPlaying }),

  togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),

  nextSong: () => {
    const { queue, queueIndex } = get();
    const next = queueIndex + 1;
    if (next < queue.length) {
      set({ currentSong: queue[next], queueIndex: next, isPlaying: true });
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
}));
