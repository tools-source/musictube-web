import { useState, useEffect } from 'react'
import { useStore } from '../store'
import ArtworkImage from './ArtworkImage'
import TrackRow from './TrackRow'
import { formatDuration } from '../utils'

export default function FullPlayer() {
  const isOpen = useStore(s => s.isPlayerOpen)
  const closePlayer = useStore(s => s.closePlayer)
  const nowPlaying = useStore(s => s.nowPlaying)
  const playbackState = useStore(s => s.playbackState)
  const setPlaybackState = useStore(s => s.setPlaybackState)
  const playNext = useStore(s => s.playNext)
  const playPrev = useStore(s => s.playPrev)
  const toggleShuffle = useStore(s => s.toggleShuffle)
  const cycleRepeat = useStore(s => s.cycleRepeat)
  const shuffleMode = useStore(s => s.shuffleMode)
  const repeatMode = useStore(s => s.repeatMode)
  const toggleLike = useStore(s => s.toggleLike)
  const likedTrackIDs = useStore(s => s.likedTrackIDs)
  const queue = useStore(s => s.queue)
  const queueIndex = useStore(s => s.queueIndex)

  const [scrubValue, setScrubValue] = useState(0)
  const [isScrubbing, setIsScrubbing] = useState(false)
  const [showQueue, setShowQueue] = useState(true)

  const isLiked = nowPlaying ? likedTrackIDs.has(nowPlaying.youtubeVideoID) : false

  // Sync scrubber with playback time
  useEffect(() => {
    if (!isScrubbing) setScrubValue(playbackState.currentTime)
  }, [playbackState.currentTime, isScrubbing])

  const progress = playbackState.duration > 0 ? scrubValue / playbackState.duration : 0
  const buffered = playbackState.bufferedFraction

  const handleScrubChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setScrubValue(parseFloat(e.target.value))
  }

  const handleScrubStart = () => setIsScrubbing(true)
  const handleScrubEnd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const t = parseFloat(e.target.value)
    setIsScrubbing(false)
    ;(window as Window & { __mtSeek?: (t: number) => void }).__mtSeek?.(t)
    setPlaybackState({ currentTime: t })
  }

  if (!nowPlaying) return null

  return (
    <div
      className={`fixed inset-0 z-[70] flex flex-col transition-transform duration-300 ease-out ${
        isOpen ? 'translate-y-0' : 'translate-y-full'
      }`}
      style={{
        background: 'linear-gradient(160deg, #07070E 0%, #140210 50%, #0A080F 100%)',
        paddingTop: 'var(--safe-top)',
      }}
    >
      {/* Background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-[-120px] right-[-80px] w-80 h-80 rounded-full bg-pink-500/[0.12] blur-[100px]" />
        <div className="absolute bottom-[120px] left-[-100px] w-72 h-72 rounded-full bg-blue-500/[0.10] blur-[100px]" />
      </div>

      {/* Drag handle */}
      <button onClick={closePlayer} className="pt-3 pb-1 flex flex-col items-center gap-1 shrink-0">
        <div className="w-10 h-1.5 rounded-full bg-white/20" />
      </button>

      {/* Header */}
      <div className="flex items-center justify-between px-6 py-2 shrink-0">
        <button onClick={closePlayer} className="w-10 h-10 flex items-center justify-center rounded-full bg-white/10">
          <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
        <div className="text-center">
          <p className="text-[10px] font-semibold text-text-secondary uppercase tracking-wider">Now Playing</p>
          <p className="text-sm font-semibold text-text-primary">MusicTube</p>
        </div>
        <button
          onClick={() => nowPlaying && toggleLike(nowPlaying)}
          className="w-10 h-10 flex items-center justify-center"
        >
          <svg
            className={`w-6 h-6 ${isLiked ? 'text-accent' : 'text-text-secondary'}`}
            fill={isLiked ? 'currentColor' : 'none'}
            stroke="currentColor"
            strokeWidth={2}
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 0 1 6.364 0L12 7.636l1.318-1.318a4.5 4.5 0 1 1 6.364 6.364L12 20.364l-7.682-7.682a4.5 4.5 0 0 1 0-6.364z" />
          </svg>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto px-6 pb-safe">
        {/* Artwork */}
        <div className="flex justify-center py-6">
          <div
            className={`relative rounded-[28px] overflow-hidden shadow-2xl transition-transform duration-300 ${
              playbackState.isPlaying ? 'scale-100' : 'scale-95'
            }`}
            style={{ width: 'min(320px, calc(100vw - 80px))', aspectRatio: '1' }}
          >
            <ArtworkImage
              url={nowPlaying.artworkURL}
              alt={nowPlaying.title}
              className="w-full h-full"
            />
            {playbackState.isLoading && (
              <div className="absolute inset-0 flex items-center justify-center bg-black/40">
                <div className="w-10 h-10 border-3 border-white/30 border-t-white rounded-full animate-spin" />
              </div>
            )}
          </div>
        </div>

        {/* Title + YouTube link */}
        <div className="mb-6">
          <h2 className="text-2xl font-bold text-text-primary leading-tight">{nowPlaying.title}</h2>
          <p className="text-base text-text-secondary mt-1">{nowPlaying.artist}</p>
          <a
            href={`https://www.youtube.com/watch?v=${nowPlaying.youtubeVideoID}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 mt-2 text-xs text-text-tertiary hover:text-text-secondary transition-colors"
          >
            <svg className="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10 6v2H5v11h11v-5h2v7H3V6h7zm11-3h-6l2.29-2.29-8.49 8.49 1.41 1.41 8.49-8.49L21 6V3z" />
            </svg>
            Open in YouTube
          </a>
        </div>

        {/* Progress */}
        <div className="mb-6 p-4 rounded-3xl bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm">
          <div className="relative mx-1 mb-4 h-8 flex items-center">
            {/* Buffered bar */}
            <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1.5 rounded-full bg-white/10 overflow-hidden">
              <div className="h-full bg-white/25 rounded-full transition-all duration-200" style={{ width: `${buffered * 100}%` }} />
            </div>
            {/* Input range */}
            <input
              type="range"
              min={0}
              max={Math.max(playbackState.duration, 1)}
              step={0.5}
              value={scrubValue}
              onChange={handleScrubChange}
              onMouseDown={handleScrubStart}
              onTouchStart={handleScrubStart}
              onMouseUp={e => handleScrubEnd(e as unknown as React.ChangeEvent<HTMLInputElement>)}
              onTouchEnd={e => handleScrubEnd(e as unknown as React.ChangeEvent<HTMLInputElement>)}
              className="relative z-10 w-full h-8 cursor-pointer bg-transparent scrubber"
              style={{ '--progress': `${progress * 100}%` } as React.CSSProperties}
            />
          </div>
          <div className="flex justify-between text-xs tabular-nums text-text-secondary">
            <span>{formatDuration(scrubValue) ?? '0:00'}</span>
            <span>{formatDuration(playbackState.duration) ?? '0:00'}</span>
          </div>
        </div>

        {/* Transport */}
        <div className="flex items-center justify-center gap-6 mb-6 p-5 rounded-3xl bg-white/[0.06] border border-white/[0.08] backdrop-blur-sm">
          <button onClick={playPrev} className="w-13 h-13 rounded-full bg-white/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
            </svg>
          </button>
          <button
            onClick={() => setPlaybackState({ isPlaying: !playbackState.isPlaying })}
            className="w-20 h-20 rounded-full bg-white flex items-center justify-center shadow-lg"
          >
            {playbackState.isLoading ? (
              <div className="w-7 h-7 border-3 border-black/20 border-t-black rounded-full animate-spin" />
            ) : playbackState.isPlaying ? (
              <svg className="w-8 h-8 text-black" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-8 h-8 text-black translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button onClick={playNext} className="w-13 h-13 rounded-full bg-white/10 flex items-center justify-center">
            <svg className="w-6 h-6 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z" />
            </svg>
          </button>
        </div>

        {/* Secondary controls */}
        <div className="flex items-center justify-around mb-6 py-4 px-3 rounded-2xl bg-white/[0.06] border border-white/[0.08]">
          <SecondaryBtn
            active={shuffleMode}
            onClick={toggleShuffle}
            title="Shuffle"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M10.59 9.17L5.41 4 4 5.41l5.17 5.17 1.42-1.41zM14.5 4l2.04 2.04L4 18.59 5.41 20 17.96 7.46 20 9.5V4h-5.5zm.33 9.41l-1.41 1.41 3.13 3.13L14.5 20H20v-5.5l-2.04 2.04-3.13-3.13z" />
            </svg>
          </SecondaryBtn>

          <SecondaryBtn active={repeatMode !== 'off'} onClick={cycleRepeat} title="Repeat">
            {repeatMode === 'one' ? (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4zm-4-2V9h-1l-2 1v1h1.5v4H13z" />
              </svg>
            ) : (
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M7 7h10v3l4-4-4-4v3H5v6h2V7zm10 10H7v-3l-4 4 4 4v-3h12v-6h-2v4z" />
              </svg>
            )}
          </SecondaryBtn>

          <SecondaryBtn active={showQueue} onClick={() => setShowQueue(v => !v)} title="Queue">
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 13h2v-2H3v2zm0 4h2v-2H3v2zm0-8h2V7H3v2zm4 4h14v-2H7v2zm0 4h14v-2H7v2zM7 7v2h14V7H7z" />
            </svg>
          </SecondaryBtn>
        </div>

        {/* Queue / Up Next */}
        {showQueue && queue.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-text-primary mb-3">Up Next</h3>
            <div className="rounded-2xl overflow-hidden bg-white/[0.04] border border-white/[0.08]">
              {queue.slice(queueIndex + 1, queueIndex + 6).map((track, i) => (
                <div key={track.youtubeVideoID}>
                  <div className="px-4">
                    <TrackRow
                      track={track}
                      showIndex={queueIndex + 1 + i}
                      onPlay={() => useStore.getState().play(track, queue)}
                    />
                  </div>
                  {i < Math.min(5, queue.length - queueIndex - 2) && <div className="h-px bg-divider mx-4" />}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Bottom padding */}
        <div className="h-8" />
      </div>
    </div>
  )
}

function SecondaryBtn({
  active,
  onClick,
  title,
  children,
}: {
  active: boolean
  onClick: () => void
  title: string
  children: React.ReactNode
}) {
  return (
    <button onClick={onClick} title={title} className="flex flex-col items-center gap-1">
      <span className={active ? 'text-accent' : 'text-text-secondary'}>{children}</span>
      {active && <span className="w-1 h-1 rounded-full bg-accent" />}
      {!active && <span className="w-1 h-1" />}
    </button>
  )
}
