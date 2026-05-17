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
  const repeatMode = useStore(s => s.repeatMode)

  const autoQueueRelated = useStore(s => s.autoQueueRelated)

  const containerRef = useRef<HTMLDivElement>(null)
  const playerRef = useRef<YTPlayer | null>(null)
  const tickRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const isExternalPause = useRef(false)

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

      if (playerRef.current) {
        playerRef.current.loadVideoById(nowPlaying.youtubeVideoID)
        return
      }

      playerRef.current = new window.YT.Player(containerRef.current, {
        videoId: nowPlaying.youtubeVideoID,
        playerVars: {
          autoplay: 1,
          playsinline: 1,
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
