import { useStore } from '../store'
import ArtworkImage from './ArtworkImage'

export default function MiniPlayer() {
  const nowPlaying = useStore(s => s.nowPlaying)
  const playbackState = useStore(s => s.playbackState)
  const setPlaybackState = useStore(s => s.setPlaybackState)
  const playNext = useStore(s => s.playNext)
  const playPrev = useStore(s => s.playPrev)
  const openPlayer = useStore(s => s.openPlayer)
  const stopPlayback = useStore(s => s.stopPlayback)

  if (!nowPlaying) return null

  const progress = playbackState.duration > 0 ? playbackState.currentTime / playbackState.duration : 0

  return (
    <div
      className="fixed left-0 right-0 z-40 px-3"
      style={{ bottom: 'var(--tabbar-total-height)' }}
    >
      <div
        role="button"
        tabIndex={0}
        aria-label="Open player"
        className="flex items-center gap-3 px-3 py-2 rounded-2xl bg-white/[0.12] backdrop-blur-xl border border-white/10 shadow-2xl cursor-pointer"
        onClick={openPlayer}
        onKeyDown={e => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault()
            openPlayer()
          }
        }}
      >
        <div className="relative shrink-0">
          <ArtworkImage url={nowPlaying.artworkURL} alt={nowPlaying.title} className="w-11 h-11 rounded-xl" />
          {playbackState.isLoading && (
            <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/40">
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-text-primary truncate">{nowPlaying.title}</p>
          <p className="text-xs text-text-secondary truncate">{nowPlaying.artist}</p>
          {/* progress bar */}
          <div className="mt-1.5 h-0.5 rounded-full bg-white/20 overflow-hidden">
            <div
              className="h-full bg-accent rounded-full transition-all duration-500"
              style={{ width: `${progress * 100}%` }}
            />
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={e => { e.stopPropagation(); playPrev() }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-secondary"
          >
            <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
            </svg>
          </button>
          <button
            onClick={e => { e.stopPropagation(); setPlaybackState({ isPlaying: !playbackState.isPlaying }) }}
            className="w-10 h-10 rounded-full bg-white/10 flex items-center justify-center"
          >
            {playbackState.isPlaying ? (
              <svg className="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 24 24">
                <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" />
              </svg>
            ) : (
              <svg className="w-5 h-5 text-white translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8 5v14l11-7z" />
              </svg>
            )}
          </button>
          <button
            onClick={e => { e.stopPropagation(); playNext() }}
            className="w-10 h-10 rounded-full flex items-center justify-center"
          >
            <svg className="w-5 h-5 text-text-secondary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M6 18l8.5-6L6 6v12zm2-8.14L11.03 12 8 14.14V9.86zM16 6h2v12h-2z" />
            </svg>
          </button>
          <button
            onClick={e => { e.stopPropagation(); stopPlayback() }}
            className="w-8 h-8 rounded-full flex items-center justify-center text-text-tertiary hover:text-text-secondary"
            aria-label="Close player"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
      </div>
    </div>
  )
}
