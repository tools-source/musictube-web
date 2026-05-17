import { useEffect, useMemo } from 'react'
import { useStore } from '../store'
import { greeting, initials, isArabic, isWorship } from '../utils'
import FilterChip from '../components/FilterChip'
import TrackRow from '../components/TrackRow'
import ArtworkImage from '../components/ArtworkImage'
import { SkeletonTrackRow, SkeletonContinueCard } from '../components/Skeleton'
import type { HomeFilter, Track } from '../types'

const FILTERS: HomeFilter[] = ['All', 'Arabic', 'Worship', 'Playlists', 'Recent']

export default function HomeView() {
  const user = useStore(s => s.user)
  const accessToken = useStore(s => s.accessToken)
  const homeFilter = useStore(s => s.homeFilter)
  const setHomeFilter = useStore(s => s.setHomeFilter)
  const featuredTracks = useStore(s => s.featuredTracks)
  const isLoadingHome = useStore(s => s.isLoadingHome)
  const hasLoadedHome = useStore(s => s.hasLoadedHome)
  const historyTracks = useStore(s => s.historyTracks)
  const loadHome = useStore(s => s.loadHome)
  const signIn = useStore(s => s.signIn)
  const isSigningIn = useStore(s => s.isSigningIn)
  const play = useStore(s => s.play)
  const setActiveTab = useStore(s => s.setActiveTab)

  useEffect(() => {
    if (!hasLoadedHome) loadHome()
  }, [hasLoadedHome, loadHome])

  const continueTracks = useMemo<Track[]>(() => {
    const base = historyTracks.length > 0 ? historyTracks : featuredTracks
    switch (homeFilter) {
      case 'Arabic': return base.filter(t => isArabic(t.title, t.artist))
      case 'Worship': return base.filter(t => isWorship(t.title, t.artist))
      case 'Recent': return historyTracks.slice(0, 20)
      case 'Playlists': return []
      default: return base
    }
  }, [homeFilter, historyTracks, featuredTracks])

  const recommendedTracks = useMemo<Track[]>(() => {
    if (homeFilter === 'Playlists') return []

    // Build a personalized list: tracks from artists in history first, then remaining trending
    let base = featuredTracks
    if (homeFilter === 'Arabic') base = featuredTracks.filter(t => isArabic(t.title, t.artist))
    else if (homeFilter === 'Worship') base = featuredTracks.filter(t => isWorship(t.title, t.artist))
    else if (homeFilter === 'Recent') base = featuredTracks

    if (historyTracks.length === 0) return base

    const recentArtists = new Set(historyTracks.slice(0, 20).map(t => t.artist.toLowerCase()))
    const preferred = base.filter(t => recentArtists.has(t.artist.toLowerCase()))
    const rest = base.filter(t => !recentArtists.has(t.artist.toLowerCase()))
    return [...preferred, ...rest]
  }, [homeFilter, featuredTracks, historyTracks])

  const displayName = user?.name.split(' ')[0] ?? 'Guest'

  return (
    <div className="flex flex-col gap-6 px-5 pt-3 pb-4">
      {/* Greeting Header */}
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium text-text-secondary">{greeting()}</p>
          <h1 className="text-3xl font-bold text-text-primary leading-tight">{displayName}</h1>
          <p className="text-xs text-text-tertiary mt-0.5">
            {accessToken ? 'Connected to YouTube' : 'Guest mode · local recommendations'}
          </p>
        </div>

        {!accessToken ? (
          <button
            onClick={signIn}
            disabled={isSigningIn}
            className="px-4 py-2.5 rounded-full bg-control text-sm font-semibold text-text-primary hover:bg-control-strong transition-colors shrink-0"
          >
            {isSigningIn ? 'Connecting…' : 'Connect'}
          </button>
        ) : user ? (
          <div
            className="w-11 h-11 rounded-full flex items-center justify-center text-white font-bold text-base shrink-0 cursor-pointer"
            style={{ backgroundColor: '#DA3838' }}
          >
            {initials(user.name)}
          </div>
        ) : null}
      </div>

      {/* Filter Chips */}
      <div className="flex gap-2 overflow-x-auto scrollbar-hide -mx-5 px-5">
        {FILTERS.map(f => (
          <FilterChip key={f} label={f} selected={homeFilter === f} onClick={() => setHomeFilter(f)} />
        ))}
      </div>

      {/* Continue Listening */}
      {homeFilter !== 'Playlists' && (
        <section>
          <SectionHeader
            title="Continue Listening"
            onSeeAll={continueTracks.length > 0 ? () => setActiveTab('library') : undefined}
          />
          <div className="flex gap-3.5 overflow-x-auto scrollbar-hide -mx-5 px-5 mt-3">
            {!hasLoadedHome || isLoadingHome
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonContinueCard key={i} />)
              : continueTracks.length === 0
              ? (
                <div className="w-full py-4 px-4 rounded-2xl bg-card text-sm text-text-secondary">
                  {historyTracks.length === 0
                    ? 'No recent tracks yet. Search and play something!'
                    : 'No tracks match this filter.'}
                </div>
              )
              : continueTracks.slice(0, 8).map((track, i) => (
                  <ContinueListeningCard
                    key={track.youtubeVideoID}
                    track={track}
                    isNew={i === 0 && historyTracks.length === 0}
                    onPlay={() => play(track, continueTracks)}
                  />
                ))
            }
          </div>
        </section>
      )}

      {/* Recommended */}
      {homeFilter !== 'Playlists' && (
        <section>
          <SectionHeader title="Recommended for you" />
          <div className="mt-3 space-y-0">
            {!hasLoadedHome || isLoadingHome
              ? Array.from({ length: 4 }).map((_, i) => <SkeletonTrackRow key={i} />)
              : recommendedTracks.length === 0
              ? (
                <div className="py-4 px-4 rounded-2xl bg-card text-sm text-text-secondary">
                  Your recommendations will appear here.
                </div>
              )
              : recommendedTracks.map((track, i) => (
                  <div key={track.youtubeVideoID}>
                    <TrackRow
                      track={track}
                      onPlay={() => play(track, recommendedTracks)}
                    />
                    {i < recommendedTracks.length - 1 && (
                      <div className="h-px bg-divider ml-16" />
                    )}
                  </div>
                ))
            }
          </div>
        </section>
      )}

      {/* Playlists filter empty state */}
      {homeFilter === 'Playlists' && (
        <section className="py-8 flex flex-col items-center gap-3 text-center">
          <div className="w-16 h-16 rounded-2xl bg-card flex items-center justify-center">
            <svg className="w-8 h-8 text-text-tertiary" fill="currentColor" viewBox="0 0 24 24">
              <path d="M3 6h18v2H3V6zm0 4h18v2H3v-2zm0 4h12v2H3v-2z" />
            </svg>
          </div>
          <p className="text-text-secondary text-sm">
            {accessToken ? 'Your YouTube playlists will appear here.' : 'Connect YouTube to see your playlists.'}
          </p>
          {!accessToken && (
            <button onClick={signIn} className="px-5 py-2.5 rounded-full bg-accent text-white text-sm font-semibold">
              Connect YouTube
            </button>
          )}
        </section>
      )}
    </div>
  )
}

function SectionHeader({ title, onSeeAll }: { title: string; onSeeAll?: () => void }) {
  return (
    <div className="flex items-center justify-between">
      <h2 className="text-lg font-bold text-text-primary">{title}</h2>
      {onSeeAll && (
        <button onClick={onSeeAll} className="text-sm font-medium text-accent">
          See all
        </button>
      )}
    </div>
  )
}

function ContinueListeningCard({
  track,
  isNew,
  onPlay,
}: {
  track: Track
  isNew: boolean
  onPlay: () => void
}) {
  const nowPlaying = useStore(s => s.nowPlaying)
  const playbackState = useStore(s => s.playbackState)
  const isCurrentTrack = nowPlaying?.youtubeVideoID === track.youtubeVideoID
  const isPlaying = isCurrentTrack && playbackState.isPlaying

  return (
    <button onClick={onPlay} className="flex flex-col gap-2 w-40 shrink-0 text-left group">
      <div className="relative">
        <ArtworkImage
          url={track.artworkURL}
          alt={track.title}
          className={`w-40 h-40 rounded-2xl ${isCurrentTrack ? 'ring-2 ring-accent/60' : ''}`}
        />
        {isNew && !isCurrentTrack && (
          <span className="absolute top-2 left-2 bg-accent text-white text-[10px] font-black px-2 py-0.5 rounded-full">
            NEW
          </span>
        )}
        {isCurrentTrack && (
          <div className="absolute top-2 left-2 w-6 h-6 rounded-full bg-accent flex items-center justify-center">
            <svg className="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 24 24">
              {isPlaying ? <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z" /> : <path d="M8 5v14l11-7z" />}
            </svg>
          </div>
        )}
        <div className="absolute inset-0 rounded-2xl bg-black/0 group-hover:bg-black/20 transition-colors flex items-center justify-center">
          <div className="w-10 h-10 rounded-full bg-accent flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
            <svg className="w-5 h-5 text-white translate-x-0.5" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z" />
            </svg>
          </div>
        </div>
      </div>

      <p className={`text-sm font-semibold line-clamp-2 leading-snug ${isCurrentTrack ? 'text-accent' : 'text-text-primary'}`}>
        {track.title}
      </p>
      <p className="text-xs text-text-tertiary truncate">{track.artist}</p>
    </button>
  )
}
