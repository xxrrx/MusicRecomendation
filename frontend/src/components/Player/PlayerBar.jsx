import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { Howl } from 'howler';
import { usePlayerStore } from '../../stores/playerStore';
import { getStreamUrl, logPlay } from '../../lib/playerApi';
import PlayerControls from './PlayerControls';
import ProgressBar from './ProgressBar';
import VolumeControl from './VolumeControl';
import LikeButton from '../LikeButton';
import AddToPlaylistMenu from '../AddToPlaylistMenu';
import QueuePanel from './QueuePanel';
import FullscreenPlayer from './FullscreenPlayer';

export default function PlayerBar() {
  const {
    currentSong,
    queue,
    queueIndex,
    isPlaying,
    volume,
    repeat,
    setIsPlaying,
    togglePlay,
    nextSong,
    prevSong,
    handleSongEnd,
    setVolume,
    cycleRepeat,
  } = usePlayerStore();

  const howlRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const progressRafRef = useRef(null);
  const [showQueue, setShowQueue] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);

  // ── Load new song when currentSong changes ────────────────────────────────
  useEffect(() => {
    if (!currentSong) return;

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
          html5: true,
          volume,
          onload() {
            setDuration(howl.duration());
          },
          onplay() {
            startProgress();
          },
          onpause() {
            stopProgress();
            sendLogPlay(howl);
          },
          onend() {
            stopProgress();
            sendLogPlay(howl);
            const result = handleSongEnd();
            // repeat 'one' — restart same Howl
            if (result === 'restart') {
              howl.seek(0);
              howl.play();
            }
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

  function handleSeek(seconds) {
    const howl = howlRef.current;
    if (!howl) return;
    howl.seek(seconds);
    setProgress(seconds);
  }

  function sendLogPlay(howl) {
    if (!currentSong) return;
    const dur = howl.duration() || 0;
    const played = dur > 0 ? Math.min(howl.seek() || 0, dur) : 0;
    const completionRate = dur > 0 ? played / dur : 0;
    logPlay(currentSong.id, Math.round(played), completionRate).catch(() => {});
  }

  if (!currentSong) return null;

  const repeatIcon = repeat === 'off' ? '🔁' : repeat === 'one' ? '🔂' : '🔁';
  const repeatActive = repeat !== 'off';

  return (
    <>
      {/* Queue panel */}
      {showQueue && <QueuePanel onClose={() => setShowQueue(false)} />}

      {/* Fullscreen overlay */}
      {showFullscreen && (
        <FullscreenPlayer
          progress={progress}
          duration={duration}
          onSeek={handleSeek}
          onClose={() => setShowFullscreen(false)}
        />
      )}

      {/* Player bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 px-4 py-3 z-50">
        <div className="max-w-screen-xl mx-auto flex items-center gap-4">

          {/* Left: song info + like + playlist */}
          <div className="flex items-center gap-3 w-72 shrink-0">
            {/* Cover — click to open fullscreen */}
            <button
              onClick={() => setShowFullscreen(true)}
              className="shrink-0 focus:outline-none group"
              aria-label="Open fullscreen player"
            >
              {currentSong.coverUrl ? (
                <img
                  src={currentSong.coverUrl}
                  alt={currentSong.title}
                  className="w-10 h-10 rounded object-cover group-hover:opacity-80 transition"
                />
              ) : (
                <div className="w-10 h-10 rounded bg-gray-700 flex items-center justify-center text-gray-400 group-hover:opacity-80 transition">
                  ♪
                </div>
              )}
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-medium truncate">{currentSong.title}</p>
              {currentSong.artist ? (
                <Link
                  to={`/artists/${currentSong.artist.id}`}
                  className="text-gray-400 text-xs truncate hover:text-white hover:underline transition block"
                >
                  {currentSong.artist.displayName}
                </Link>
              ) : null}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <LikeButton songId={currentSong.id} size="sm" />
              <AddToPlaylistMenu songId={currentSong.id} song={currentSong} />
            </div>
          </div>

          {/* Center: controls + progress */}
          <div className="flex-1 flex flex-col items-center gap-1">
            <div className="flex items-center gap-5">
              {/* Repeat button */}
              <button
                onClick={cycleRepeat}
                className={`text-base transition ${repeatActive ? 'text-green-400' : 'text-gray-500 hover:text-white'}`}
                title={`Repeat: ${repeat}`}
                aria-label="Cycle repeat mode"
              >
                {repeatIcon}
              </button>

              <PlayerControls
                isPlaying={isPlaying}
                hasPrev={queueIndex > 0}
                hasNext={queueIndex < queue.length - 1}
                onToggle={togglePlay}
                onPrev={prevSong}
                onNext={nextSong}
              />

              {/* Queue button */}
              <button
                onClick={() => setShowQueue((v) => !v)}
                className={`text-base transition ${showQueue ? 'text-green-400' : 'text-gray-500 hover:text-white'}`}
                title="Queue"
                aria-label="Toggle queue"
              >
                ☰
              </button>
            </div>

            <ProgressBar current={progress} duration={duration} onSeek={handleSeek} />
          </div>

          {/* Right: volume + fullscreen */}
          <div className="w-48 flex items-center justify-end gap-3 shrink-0">
            <VolumeControl volume={volume} onChange={setVolume} />
            <button
              onClick={() => setShowFullscreen(true)}
              className="text-gray-500 hover:text-white transition text-sm"
              title="Fullscreen"
              aria-label="Open fullscreen player"
            >
              ⛶
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
