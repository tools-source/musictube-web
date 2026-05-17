import ArtworkImage from './ArtworkImage'
import { formatDuration, formatViewCount } from '../utils'
import { useStore } from '../store'
import type { Track } from '../types'

interface Props {
  track: Track
  onPlay: () => void
  showIndex?: number
}

export default function TrackRow({ track, onPlay, showIndex }: Props) {
  const nowPlaying = useStore(s => s.nowPlaying)
  const playbackState = useStore(s => s.playbackState)
  const isCurrentTrack = nowPlaying?.youtubeVideoID === track.youtubeVideoID
  const isPlaying = isCurrentTrack && playbackState.isPlaying

  return (
    <div
      className={`flex items-center gap-3 py-2 px-2.5 rounded-2xl transition-colors cursor-pointer group ${
        isCurrentTrack ? 'bg-accent/[0.07] ring-1 ring-accent/40' : 'hover:bg-control'
      }`}
      onClick={onPlay}
    >
      {showIndex !== undefined && (
        <span className={`w-5 text-right text-xs tabular-nums shrink-0 ${isCurrentTrack ? 'text-accent' : 'text-text-tertiary'}`}>
          {showIndex + 1}
        </span>
      )}

      <div className="relative shrink-0">
        <ArtworkImage url={track.artworkURL} alt={track.title} className="w-13 h-13 rounded-xl" />
        {isCurrentTrack && (
          <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
            {isPlaying ? (
              <NowPlayingBars />
            ) : (
              <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 min-w-0">
        <p className={`text-sm font-semibold truncate ${isCurrentTrack ? 'text-accent' : 'text-text-primary'}`}>
          {track.title}
        </p>
        <div className="flex items-center gap-1 mt-0.5">
          {isPlaying && <span className="text-xs font-semibold text-accent">Playing ·</span>}
          {isCurrentTrack && !isPlaying && <span className="text-xs font-semibold text-accent/70">Paused ·</span>}
          {track.duration && (
            <span className="text-xs text-text-tertiary">{formatDuration(track.duration)}</span>
          )}
          {track.viewCount && (
            <span className="text-xs text-text-tertiary">· {formatViewCount(track.viewCount)}</span>
          )}
        </div>
      </div>

      <PlayButton track={track} onPlay={onPlay} />
    </div>
  )
}

function PlayButton({ track, onPlay }: { track: Track; onPlay: () => void }) {
  const nowPlaying = useStore(s => s.nowPlaying)
  const playbackState = useStore(s => s.playbackState)
  const setPlaybackState = useStore(s => s.setPlaybackState)
  const isCurrentTrack = nowPlaying?.youtubeVideoID === track.youtubeVideoID
  const isPlaying = isCurrentTrack && playbackState.isPlaying

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (isCurrentTrack) {
      setPlaybackState({ isPlaying: !isPlaying })
    } else {
      onPlay()
    }
  }

  return (
    <button
      onClick={handleClick}
      className="shrink-0 w-9 h-9 rounded-full bg-accent flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
    >
      {isPlaying ? (
        <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
          <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
        </svg>
      ) : (
        <svg className="w-4 h-4 text-white translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
    </button>
  )
}

function NowPlayingBars() {
  return (
    <div className="flex items-end gap-0.5 h-4">
      {[0, 0.3, 0.6].map(delay => (
        <div
          key={delay}
          className="w-1 bg-accent rounded-full animate-pulse"
          style={{ height: '100%', animationDelay: `${delay}s`, animationDuration: '0.8s' }}
        />
      ))}
    </div>
  )
}
