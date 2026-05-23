import { useEffect, useRef } from 'react'
import { useStore } from '../store'

declare global {
  interface Window {
    YT: {
      Player: new (
        el: HTMLElement,
        opts: {
          videoId: string
          playerVars?: Record<string, number | string>
          events?: {
            onReady?: (e: { target: YTPlayer }) => void
            onStateChange?: (e: { data: number }) => void
            onError?: (e: { data: number }) => void
          }
        }
      ) => YTPlayer
    }
    onYouTubeIframeAPIReady: () => void
  }
}

interface YTPlayer {
  playVideo(): void
  pauseVideo(): void
  stopVideo(): void
  seekTo(seconds: number, allowSeek: boolean): void
  setVolume(volume: number): void
  mute(): void
  unMute(): void
  getVolume(): number
  getCurrentTime(): number
  getDuration(): number
  getVideoLoadedFraction(): number
  loadVideoById(id: string): void
  getPlayerState(): number
  destroy(): void
}

type MediaSessionAction =
  | 'play'
  | 'pause'
  | 'previoustrack'
  | 'nexttrack'
  | 'seekbackward'
  | 'seekforward'
  | 'seekto'

type MediaSessionWithPosition = MediaSession & {
  setPositionState?: (state?: { duration?: number; playbackRate?: number; position?: number }) => void
  setActionHandler: (
    action: MediaSessionAction,
    handler: ((details?: { seekTime?: number; seekOffset?: number; fastSeek?: boolean }) => void) | null,
  ) => void
}

let ytReady = false
let ytCallbacks: (() => void)[] = []

function loadYTScript() {
  if (document.getElementById('yt-iframe-script')) return
  const script = document.createElement('script')
  script.id = 'yt-iframe-script'
  script.src = 'https://www.youtube.com/iframe_api'
  document.head.appendChild(script)
}

function onYTReady(cb: () => void) {
  if (ytReady) { cb(); return }
  ytCallbacks.push(cb)
}

function hasPlayerAPI(player: YTPlayer | null): player is YTPlayer {
  return typeof player?.loadVideoById === 'function' && typeof player.playVideo === 'function'
}

window.onYouTubeIframeAPIReady = () => {
  ytReady = true
  ytCallbacks.forEach(cb => cb())
  ytCallbacks = []
}

export default function YouTubePlayer() {
  const nowPlaying = useStore(s => s.nowPlaying)
  const playbackState = useStore(s => s.playbackState)
  const setPlaybackState = useStore(s => s.setPlaybackState)
  const playNext = useStore(s => s.playNext)
  const playPrev = useStore(s => s.playPrev)
  const repeatMode = useStore(s => s.repeatMode)

  const autoQueueRelated = useStore(s => s.autoQueueRelated)

  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isExternalPause = useRef(false)
  const shouldResumeOnReturn = useRef(false)

  // Load YT script once
  useEffect(() => { loadYTScript() }, [])

  // Auto-queue related tracks when song changes
  useEffect(() => {
    if (nowPlaying) autoQueueRelated()
  }, [nowPlaying?.youtubeVideoID])

  // Create / reload player when track changes
  useEffect(() => {
    if (!nowPlaying) return

    const init = () => {
      if (!containerRef.current) return

      if (hasPlayerAPI(playerRef.current)) {
        playerRef.current.loadVideoById(nowPlaying.youtubeVideoID)
        return
      }
      ;(playerRef.current as Partial<YTPlayer> | null)?.destroy?.()
      playerRef.current = null

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: nowPlaying.youtubeVideoID,
        playerVars: {
          autoplay: 1,
          playsinline: 1,
          enablejsapi: 1,
          origin: window.location.origin,
          controls: 0,
          disablekb: 1,
          modestbranding: 1,
          rel: 0,
          iv_load_policy: 3,
        },
        events: {
          onReady: e => e.target.playVideo(),
          onStateChange: handleStateChange,
          onError: () => setPlaybackState({ isLoading: false }),
        },
      })
    }

    onYTReady(init)
  }, [nowPlaying?.youtubeVideoID])

  // Sync isPlaying → player (skip pause while loading a new track)
  useEffect(() => {
    const p = playerRef.current
    if (!p) return
    if (playbackState.isPlaying && !isExternalPause.current) {
      p.playVideo()
    } else if (!playbackState.isPlaying && !playbackState.isLoading) {
      isExternalPause.current = false
      p.pauseVideo()
    }
  }, [playbackState.isPlaying, playbackState.isLoading])

  useEffect(() => {
    const mediaSession = 'mediaSession' in navigator ? navigator.mediaSession as MediaSessionWithPosition : null
    if (!mediaSession || !nowPlaying) return
    const setHandler = (
      action: MediaSessionAction,
      handler: ((details?: { seekTime?: number; seekOffset?: number; fastSeek?: boolean }) => void) | null,
    ) => {
      try {
        mediaSession.setActionHandler(action, handler)
      } catch {
        // Older mobile browsers may expose Media Session but not every action.
      }
    }

    if (typeof MediaMetadata !== 'undefined') {
      mediaSession.metadata = new MediaMetadata({
        title: nowPlaying.title,
        artist: nowPlaying.artist,
        album: 'MusicTube',
        artwork: nowPlaying.artworkURL
          ? [
              { src: nowPlaying.artworkURL, sizes: '96x96', type: 'image/jpeg' },
              { src: nowPlaying.artworkURL, sizes: '512x512', type: 'image/jpeg' },
            ]
          : [],
      })
    }

    setHandler('play', () => {
      playerRef.current?.playVideo()
      setPlaybackState({ isPlaying: true })
    })
    setHandler('pause', () => {
      playerRef.current?.pauseVideo()
      setPlaybackState({ isPlaying: false })
    })
    setHandler('previoustrack', () => playPrev())
    setHandler('nexttrack', () => playNext())
    setHandler('seekbackward', details => {
      const current = playerRef.current?.getCurrentTime() ?? playbackState.currentTime
      const next = Math.max(0, current - (details?.seekOffset ?? 10))
      playerRef.current?.seekTo(next, true)
      setPlaybackState({ currentTime: next })
    })
    setHandler('seekforward', details => {
      const current = playerRef.current?.getCurrentTime() ?? playbackState.currentTime
      const duration = playerRef.current?.getDuration() ?? playbackState.duration
      const next = Math.min(duration || current + 10, current + (details?.seekOffset ?? 10))
      playerRef.current?.seekTo(next, true)
      setPlaybackState({ currentTime: next })
    })
    setHandler('seekto', details => {
      if (typeof details?.seekTime !== 'number') return
      playerRef.current?.seekTo(details.seekTime, true)
      setPlaybackState({ currentTime: details.seekTime })
    })

    return () => {
      ;(['play', 'pause', 'previoustrack', 'nexttrack', 'seekbackward', 'seekforward', 'seekto'] as MediaSessionAction[])
        .forEach(action => setHandler(action, null))
    }
  }, [nowPlaying?.youtubeVideoID, playNext, playPrev, setPlaybackState])

  useEffect(() => {
    const mediaSession = 'mediaSession' in navigator ? navigator.mediaSession as MediaSessionWithPosition : null
    if (!mediaSession) return
    mediaSession.playbackState = playbackState.isPlaying ? 'playing' : 'paused'
    if (playbackState.duration > 0 && mediaSession.setPositionState) {
      try {
        mediaSession.setPositionState({
          duration: playbackState.duration,
          playbackRate: 1,
          position: Math.min(playbackState.currentTime, playbackState.duration),
        })
      } catch {
        // Some browsers throw while metadata is settling; playback still works.
      }
    }
  }, [playbackState.currentTime, playbackState.duration, playbackState.isPlaying])

  useEffect(() => {
    const rememberPlaybackIntent = () => {
      shouldResumeOnReturn.current = playbackState.isPlaying
    }
    const resumeIfNeeded = () => {
      if (!shouldResumeOnReturn.current) return
      playerRef.current?.playVideo()
      setPlaybackState({ isPlaying: true })
    }
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') rememberPlaybackIntent()
      if (document.visibilityState === 'visible') resumeIfNeeded()
    }

    window.addEventListener('pagehide', rememberPlaybackIntent)
    window.addEventListener('pageshow', resumeIfNeeded)
    document.addEventListener('visibilitychange', handleVisibilityChange)

    return () => {
      window.removeEventListener('pagehide', rememberPlaybackIntent)
      window.removeEventListener('pageshow', resumeIfNeeded)
      document.removeEventListener('visibilitychange', handleVisibilityChange)
    }
  }, [playbackState.isPlaying, setPlaybackState])

  // Tick to update currentTime/duration/buffer
  function startTick() {
    if (tickRef.current) return
    tickRef.current = setInterval(() => {
      const p = playerRef.current
      if (!p) return
      const duration = p.getDuration()
      const currentTime = p.getCurrentTime()
      const bufferedFraction = p.getVideoLoadedFraction()
      setPlaybackState({ currentTime, duration, bufferedFraction })
    }, 500)
  }

  function stopTick() {
    if (tickRef.current) { clearInterval(tickRef.current); tickRef.current = null }
  }

  function handleStateChange(e: { data: number }) {
    // YT.PlayerState: ENDED=0, PLAYING=1, PAUSED=2, BUFFERING=3
    switch (e.data) {
      case 1: // PLAYING
        isExternalPause.current = false
        setPlaybackState({ isPlaying: true, isLoading: false })
        startTick()
        break
      case 2: // PAUSED
        isExternalPause.current = true
        setPlaybackState({ isPlaying: false })
        stopTick()
        break
      case 0: // ENDED
        stopTick()
        if (repeatMode === 'one') playerRef.current?.seekTo(0, true)
        else playNext()
        break
      case 3: // BUFFERING
        setPlaybackState({ isLoading: true })
        break
    }
  }

  // Expose seekTo globally so FullPlayer can call it
  useEffect(() => {
    (window as Window & { __mtSeek?: (t: number) => void }).__mtSeek = (t: number) => {
      playerRef.current?.seekTo(t, true)
    }
  }, [])

  useEffect(() => () => { stopTick(); playerRef.current?.destroy() }, [])

  return (
    <div
      style={{ position: 'fixed', bottom: -9999, left: -9999, width: 1, height: 1, opacity: 0, pointerEvents: 'none' }}
      aria-hidden
    >
      <div ref={containerRef} />
    </div>
  )
}
