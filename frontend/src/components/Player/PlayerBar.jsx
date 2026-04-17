import { useEffect, useRef, useState } from 'react';
import { Howl } from 'howler';
import { usePlayerStore } from '../../stores/playerStore';
import { getStreamUrl, logPlay } from '../../lib/playerApi';
import PlayerControls from './PlayerControls';
import ProgressBar from './ProgressBar';
import VolumeControl from './VolumeControl';

export default function PlayerBar() {
  const { currentSong, queue, queueIndex, isPlaying, volume, setIsPlaying, togglePlay, nextSong, prevSong, setVolume } =
    usePlayerStore();

  const howlRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const progressRafRef = useRef(null);
  const playStartRef = useRef(null); // timestamp when playback started

  // ── Load new song when currentSong changes ────────────────────────────────
  useEffect(() => {
    if (!currentSong) return;

    // Unload previous
    if (howlRef.current) {
      howlRef.current.unload();
    }
    setProgress(0);
    setDuration(0);

    let cancelled = false;

    getStreamUrl(currentSong.id)
      .then(({ url }) => {
        if (cancelled) return;

        const howl = new Howl({
          src: [url],
          html5: true, // stream via HTML5 Audio
          volume,
          onload() {
            setDuration(howl.duration());
          },
          onplay() {
            playStartRef.current = Date.now();
            startProgress();
          },
          onpause() {
            stopProgress();
            sendLogPlay(howl);
          },
          onend() {
            stopProgress();
            sendLogPlay(howl);
            nextSong();
          },
          onstop() {
            stopProgress();
          },
        });

        howlRef.current = howl;
        if (isPlaying) howl.play();
      })
      .catch((err) => console.error('[PlayerBar] Failed to load stream URL:', err));

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSong?.id]);

  // ── Sync isPlaying with Howl ──────────────────────────────────────────────
  useEffect(() => {
    const howl = howlRef.current;
    if (!howl) return;

    if (isPlaying && !howl.playing()) {
      howl.play();
    } else if (!isPlaying && howl.playing()) {
      howl.pause();
    }
  }, [isPlaying]);

  // ── Sync volume ───────────────────────────────────────────────────────────
  useEffect(() => {
    howlRef.current?.volume(volume);
  }, [volume]);

  // ── Cleanup on unmount ────────────────────────────────────────────────────
  useEffect(() => {
    return () => {
      stopProgress();
      howlRef.current?.unload();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── Progress tracking via rAF ─────────────────────────────────────────────
  function startProgress() {
    function tick() {
      const howl = howlRef.current;
      if (howl && howl.playing()) {
        setProgress(howl.seek() || 0);
      }
      progressRafRef.current = requestAnimationFrame(tick);
    }
    progressRafRef.current = requestAnimationFrame(tick);
  }

  function stopProgress() {
    if (progressRafRef.current) {
      cancelAnimationFrame(progressRafRef.current);
      progressRafRef.current = null;
    }
  }

  // ── Seek ──────────────────────────────────────────────────────────────────
  function handleSeek(seconds) {
    const howl = howlRef.current;
    if (!howl) return;
    howl.seek(seconds);
    setProgress(seconds);
  }

  // ── Log play to backend ───────────────────────────────────────────────────
  function sendLogPlay(howl) {
    if (!currentSong) return;
    const dur = howl.duration() || 0;
    const played = dur > 0 ? Math.min(howl.seek() || 0, dur) : 0;
    const completionRate = dur > 0 ? played / dur : 0;
    logPlay(currentSong.id, Math.round(played), completionRate).catch(() => {});
  }

  if (!currentSong) return null;

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-4 py-3 z-50">
      <div className="max-w-screen-xl mx-auto flex items-center gap-4">

        {/* Song info */}
        <div className="flex items-center gap-3 w-56 shrink-0">
          {currentSong.coverUrl ? (
            <img src={currentSong.coverUrl} alt={currentSong.title} className="w-10 h-10 rounded object-cover" />
          ) : (
            <div className="w-10 h-10 rounded bg-gray-700 flex items-center justify-center text-gray-400">♪</div>
          )}
          <div className="min-w-0">
            <p className="text-white text-sm font-medium truncate">{currentSong.title}</p>
            <p className="text-gray-400 text-xs truncate">{currentSong.artist?.displayName}</p>
          </div>
        </div>

        {/* Center: controls + progress */}
        <div className="flex-1 flex flex-col items-center gap-1">
          <PlayerControls
            isPlaying={isPlaying}
            hasPrev={queueIndex > 0}
            hasNext={queueIndex < queue.length - 1}
            onToggle={togglePlay}
            onPrev={prevSong}
            onNext={nextSong}
          />
          <ProgressBar current={progress} duration={duration} onSeek={handleSeek} />
        </div>

        {/* Right: volume */}
        <div className="w-40 flex justify-end shrink-0">
          <VolumeControl volume={volume} onChange={setVolume} />
        </div>

      </div>
    </div>
  );
}
