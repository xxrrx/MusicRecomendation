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

/* ── SVG icons ───────────────────────────────────────────────────────────── */
const RepeatIcon = ({ mode }) =>
  mode === 'one' ? (
    /* Repeat-one */
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M12 5.25a.75.75 0 0 1 .75.75v.756a49.106 49.106 0 0 1 9.152 1 .75.75 0 0 1-.152 1.485h-1.918l1.95 8.425a.75.75 0 0 1-.617.91 48.97 48.97 0 0 1-8.43 0 .75.75 0 0 1-.617-.91l1.95-8.425H12.75V6a.75.75 0 0 1 .75-.75zm-4.813.212a.75.75 0 0 1 1.06.013l2.5 2.5a.75.75 0 0 1-1.06 1.06L8.59 7.818 7.38 9.03a.75.75 0 0 1-1.06-1.06l1.5-1.5a.75.75 0 0 1 .367-.008zM12 12.75a.75.75 0 1 0 0 1.5.75.75 0 0 0 0-1.5z" clipRule="evenodd" />
    </svg>
  ) : (
    /* Repeat-all / off */
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
      <path fillRule="evenodd" d="M4.755 10.059a7.5 7.5 0 0 1 12.548-3.364l1.903 1.903h-3.183a.75.75 0 1 0 0 1.5h4.992a.75.75 0 0 0 .75-.75V4.356a.75.75 0 0 0-1.5 0v3.18l-1.9-1.9A9 9 0 0 0 3.306 9.67a.75.75 0 1 0 1.45.388zm15.408 3.352a.75.75 0 0 0-.919.53 7.5 7.5 0 0 1-12.548 3.364l-1.902-1.903h3.183a.75.75 0 0 0 0-1.5H2.984a.75.75 0 0 0-.75.75v4.992a.75.75 0 0 0 1.5 0v-3.18l1.9 1.9a9 9 0 0 0 15.059-4.035.75.75 0 0 0-.53-.918z" clipRule="evenodd" />
    </svg>
  );

const QueueIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M2.625 6.75a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0zm4.875 0A.75.75 0 0 1 8.25 6h12a.75.75 0 0 1 0 1.5h-12a.75.75 0 0 1-.75-.75zM2.625 12a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0zM7.5 12a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5h-12A.75.75 0 0 1 7.5 12zm-4.875 5.25a1.125 1.125 0 1 1 2.25 0 1.125 1.125 0 0 1-2.25 0zm4.875 0a.75.75 0 0 1 .75-.75h12a.75.75 0 0 1 0 1.5h-12a.75.75 0 0 1-.75-.75z" clipRule="evenodd" />
  </svg>
);

const ExpandIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-4 h-4">
    <path fillRule="evenodd" d="M15 3.75a.75.75 0 0 1 .75-.75h4.5a.75.75 0 0 1 .75.75v4.5a.75.75 0 0 1-1.5 0V5.56l-3.97 3.97a.75.75 0 1 1-1.06-1.06l3.97-3.97h-2.69a.75.75 0 0 1-.75-.75zm-12 0A.75.75 0 0 1 3.75 3h4.5a.75.75 0 0 1 0 1.5H5.56l3.97 3.97a.75.75 0 0 1-1.06 1.06L4.5 5.56v2.69a.75.75 0 0 1-1.5 0v-4.5zm11.47 11.78a.75.75 0 1 1 1.06-1.06l3.97 3.97v-2.69a.75.75 0 0 1 1.5 0v4.5a.75.75 0 0 1-.75.75h-4.5a.75.75 0 0 1 0-1.5h2.69l-3.97-3.97zm-4.94-1.06a.75.75 0 0 1 0 1.06L5.56 19.5h2.69a.75.75 0 0 1 0 1.5h-4.5a.75.75 0 0 1-.75-.75v-4.5a.75.75 0 0 1 1.5 0v2.69l3.97-3.97a.75.75 0 0 1 1.06 0z" clipRule="evenodd" />
  </svg>
);

/* ─────────────────────────────────────────────────────────────────────────── */

export default function PlayerBar() {
  const {
    currentSong, queue, queueIndex, isPlaying, volume, repeat,
    setIsPlaying, togglePlay, nextSong, prevSong, handleSongEnd, setVolume, cycleRepeat,
  } = usePlayerStore();

  const howlRef = useRef(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const progressRafRef = useRef(null);
  const [showQueue, setShowQueue] = useState(false);
  const [showFullscreen, setShowFullscreen] = useState(false);

  /* ── Load new song ──────────────────────────────────────────────────────── */
  useEffect(() => {
    if (!currentSong) return;
    if (howlRef.current) howlRef.current.unload();
    setProgress(0);
    setDuration(0);

    let cancelled = false;
    getStreamUrl(currentSong.id)
      .then(({ url }) => {
        if (cancelled) return;
        const howl = new Howl({
          src: [url], html5: true, volume,
          onload()  { setDuration(howl.duration()); },
          onplay()  { startProgress(); },
          onpause() { stopProgress(); sendLogPlay(howl); },
          onend()   {
            stopProgress(); sendLogPlay(howl);
            const result = handleSongEnd();
            if (result === 'restart') { howl.seek(0); howl.play(); }
          },
          onstop()  { stopProgress(); },
        });
        howlRef.current = howl;
        if (isPlaying) howl.play();
      })
      .catch((err) => console.error('[PlayerBar] stream load error:', err));

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSong?.id]);

  /* ── Sync play/pause ────────────────────────────────────────────────────── */
  useEffect(() => {
    const h = howlRef.current;
    if (!h) return;
    if (isPlaying && !h.playing()) h.play();
    else if (!isPlaying && h.playing()) h.pause();
  }, [isPlaying]);

  /* ── Sync volume ────────────────────────────────────────────────────────── */
  useEffect(() => { howlRef.current?.volume(volume); }, [volume]);

  /* ── Cleanup ────────────────────────────────────────────────────────────── */
  useEffect(() => () => { stopProgress(); howlRef.current?.unload(); }, []); // eslint-disable-line

  function startProgress() {
    function tick() {
      const h = howlRef.current;
      if (h?.playing()) setProgress(h.seek() || 0);
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

  function handleSeek(sec) {
    const h = howlRef.current;
    if (!h) return;
    h.seek(sec);
    setProgress(sec);
  }

  function sendLogPlay(h) {
    if (!currentSong) return;
    const dur = h.duration() || 0;
    const played = dur > 0 ? Math.min(h.seek() || 0, dur) : 0;
    logPlay(currentSong.id, Math.round(played), dur > 0 ? played / dur : 0).catch(() => {});
  }

  if (!currentSong) return null;

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

      {/* ── Player bar ──────────────────────────────────────────────────────── */}
      <div
        className="fixed bottom-0 left-0 right-0 z-50"
        style={{
          background: 'rgba(7,7,15,0.92)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          borderTop: '1px solid rgba(255,255,255,0.07)',
          boxShadow: '0 -8px 32px rgba(0,0,0,0.5)',
        }}
      >
        <div className="max-w-screen-xl mx-auto px-4 py-3 flex items-center gap-4">

          {/* ── Left: cover + info + actions ────────────────────────────── */}
          <div className="flex items-center gap-3 w-64 shrink-0">
            {/* Cover — click opens fullscreen */}
            <button
              onClick={() => setShowFullscreen(true)}
              aria-label="Open fullscreen player"
              className="shrink-0 group focus:outline-none"
            >
              {currentSong.coverUrl ? (
                <img
                  src={currentSong.coverUrl}
                  alt={currentSong.title}
                  className="w-14 h-14 rounded-card object-cover
                             group-hover:brightness-75 transition-all duration-150"
                />
              ) : (
                <div className="w-14 h-14 rounded-card bg-sp-hover flex items-center justify-center
                                group-hover:bg-sp-border transition-colors duration-150">
                  <span className="text-sp-gray text-xl">♪</span>
                </div>
              )}
            </button>

            <div className="min-w-0 flex-1">
              <p className="text-white text-sm font-semibold truncate leading-snug">
                {currentSong.title}
              </p>
              {currentSong.artist && (
                <Link
                  to={`/artists/${currentSong.artist.id}`}
                  className="text-sp-gray text-xs truncate hover:text-white hover:underline
                             transition-colors duration-150 block"
                >
                  {currentSong.artist.displayName}
                </Link>
              )}
            </div>

            <div className="flex items-center gap-1.5 shrink-0">
              <LikeButton songId={currentSong.id} size="sm" />
              <AddToPlaylistMenu songId={currentSong.id} song={currentSong} />
            </div>
          </div>

          {/* ── Center: controls + progress ─────────────────────────────── */}
          <div className="flex-1 flex flex-col items-center gap-2 min-w-0">
            {/* Control row */}
            <div className="flex items-center gap-4">
              {/* Repeat toggle */}
              <button
                onClick={cycleRepeat}
                title={`Repeat: ${repeat}`}
                aria-label="Cycle repeat mode"
                className={`btn-icon relative ${repeatActive ? 'text-sp-green' : ''}`}
              >
                <RepeatIcon mode={repeat} />
                {/* Active dot indicator */}
                {repeatActive && (
                  <span className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full bg-sp-green" />
                )}
              </button>

              <PlayerControls
                isPlaying={isPlaying}
                hasPrev={queueIndex > 0}
                hasNext={queueIndex < queue.length - 1}
                onToggle={togglePlay}
                onPrev={prevSong}
                onNext={nextSong}
              />

              {/* Queue toggle */}
              <button
                onClick={() => setShowQueue((v) => !v)}
                title="Queue"
                aria-label="Toggle queue"
                className={`btn-icon ${showQueue ? 'text-sp-green' : ''}`}
              >
                <QueueIcon />
              </button>
            </div>

            {/* Progress bar */}
            <ProgressBar current={progress} duration={duration} onSeek={handleSeek} />
          </div>

          {/* ── Right: volume + fullscreen ───────────────────────────────── */}
          <div className="w-48 flex items-center justify-end gap-3 shrink-0">
            <VolumeControl volume={volume} onChange={setVolume} />
            <button
              onClick={() => setShowFullscreen(true)}
              title="Fullscreen"
              aria-label="Open fullscreen player"
              className="btn-icon"
            >
              <ExpandIcon />
            </button>
          </div>

        </div>
      </div>
    </>
  );
}
