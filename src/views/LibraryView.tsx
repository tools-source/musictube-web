import { useState, useEffect } from 'react'
import { useStore } from '../store'
import TrackRow from '../components/TrackRow'
import ArtworkImage from '../components/ArtworkImage'
import { fetchPlaylistTracks } from '../api/youtube'
import type { Playlist, Track } from '../types'

export default function LibraryView() {
  const user = useStore(s => s.user)
  const accessToken = useStore(s => s.accessToken)
  const signIn = useStore(s => s.signIn)
  const signOut = useStore(s => s.signOut)
  const isSigningIn = useStore(s => s.isSigningIn)

  return (
    <div className="flex flex-col gap-6 px-5 pt-3 pb-4">
      <h1 className="text-3xl font-bold text-text-primary">Library</h1>

      {/* Account card */}
      <SectionCard title={accessToken ? 'Account' : 'Guest Mode'}>
        {user ? (
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-text-primary">{user.name}</p>
              <p className="text-sm text-text-secondary">{user.email}</p>
            </div>
            <div className="h-px bg-divider" />
            <div className="flex gap-3">
              <button
                onClick={signOut}
                className="flex-1 py-3 rounded-2xl bg-control text-sm font-semibold text-text-primary"
              >
                Disconnect YouTube
              </button>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            <div>
              <p className="font-semibold text-text-primary">Your library is local and ready to use.</p>
              <p className="text-sm text-text-secondary mt-1.5">
                Connect YouTube anytime to import your account library.
              </p>
            </div>
            <button
              onClick={signIn}
              disabled={isSigningIn}
              className="w-full py-3.5 rounded-2xl bg-accent text-white font-semibold text-sm disabled:opacity-60"
            >
              {isSigningIn ? 'Connecting…' : 'Connect YouTube'}
            </button>
          </div>
        )}
      </SectionCard>

      {/* History */}
      <HistorySection />

      {/* Liked Songs */}
      <LikedSongsSection />

      {/* Saved Songs */}
      <SavedSongsSection />

      {/* Your Playlists */}
      <PlaylistsSection />

      {/* Saved Collections */}
      <SavedCollectionsSection />
    </div>
  )
}

// ── History ──────────────────────────────────────────────────────────────────

function HistorySection() {
  const historyTracks = useStore(s => s.historyTracks)
  const clearHistory = useStore(s => s.clearHistory)
  const play = useStore(s => s.play)
  const [expanded, setExpanded] = useState(false)

  const shown = expanded ? historyTracks : historyTracks.slice(0, 5)

  return (
    <SectionCard title="History">
      {historyTracks.length === 0 ? (
        <p className="text-sm text-text-secondary">No history yet. Play some songs!</p>
      ) : (
        <div className="space-y-0">
          {shown.map((track, i) => (
            <div key={track.youtubeVideoID}>
              <TrackRow
                track={track}
                onPlay={() => play(track, historyTracks)}
              />
              {i < shown.length - 1 && <div className="h-px bg-divider ml-16" />}
            </div>
          ))}
          <div className="flex items-center justify-between pt-3">
            {historyTracks.length > 5 && (
              <button onClick={() => setExpanded(v => !v)} className="text-sm font-medium text-accent">
                {expanded ? 'Show less' : `Show all ${historyTracks.length}`}
              </button>
            )}
            <button onClick={clearHistory} className="ml-auto text-sm text-red-400 font-medium">
              Clear History
            </button>
          </div>
        </div>
      )}
    </SectionCard>
  )
}

// ── Liked Songs ───────────────────────────────────────────────────────────────

function LikedSongsSection() {
  const historyTracks = useStore(s => s.historyTracks)
  const featuredTracks = useStore(s => s.featuredTracks)
  const likedTrackIDs = useStore(s => s.likedTrackIDs)
  const likedTracksFromYT = useStore(s => s.likedTracks) ?? []
  const play = useStore(s => s.play)

  // Merge YouTube liked tracks + locally liked tracks from known tracks
  const seen = new Set<string>()
  const locallyLiked = [...historyTracks, ...featuredTracks].filter(t => {
    if (seen.has(t.youtubeVideoID)) return false
    seen.add(t.youtubeVideoID)
    return likedTrackIDs.has(t.youtubeVideoID)
  })
  // Add YouTube liked tracks that aren't already in locallyLiked
  const likedTracks = [
    ...locallyLiked,
    ...likedTracksFromYT.filter(t => !seen.has(t.youtubeVideoID)),
  ]

  return (
    <SectionCard title="Liked Songs">
      {likedTracks.length === 0 ? (
        <p className="text-sm text-text-secondary">Tap the heart on a song to keep it here.</p>
      ) : (
        <div className="space-y-0">
          {likedTracks.map((track, i) => (
            <div key={track.youtubeVideoID}>
              <TrackRow track={track} onPlay={() => play(track, likedTracks)} />
              {i < likedTracks.length - 1 && <div className="h-px bg-divider ml-16" />}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}

// ── Saved Songs ───────────────────────────────────────────────────────────────

function SavedSongsSection() {
  const historyTracks = useStore(s => s.historyTracks)
  const featuredTracks = useStore(s => s.featuredTracks)
  const savedTrackIDs = useStore(s => s.savedTrackIDs)
  const play = useStore(s => s.play)

  const allKnown = [...historyTracks, ...featuredTracks]
  const seen = new Set<string>()
  const savedTracks = allKnown.filter(t => {
    if (seen.has(t.youtubeVideoID)) return false
    seen.add(t.youtubeVideoID)
    return savedTrackIDs.has(t.youtubeVideoID)
  })

  return (
    <SectionCard title="Saved Songs">
      {savedTracks.length === 0 ? (
        <p className="text-sm text-text-secondary">
          Save any song from Search, Home, or the Player and it'll show up here.
        </p>
      ) : (
        <div className="space-y-0">
          {savedTracks.map((track, i) => (
            <div key={track.youtubeVideoID}>
              <TrackRow track={track} onPlay={() => play(track, savedTracks)} />
              {i < savedTracks.length - 1 && <div className="h-px bg-divider ml-16" />}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}

// ── Playlists ─────────────────────────────────────────────────────────────────

function PlaylistsSection() {
  const customPlaylists = useStore(s => s.customPlaylists)
  const playlists = useStore(s => s.playlists)
  const createPlaylist = useStore(s => s.createPlaylist)
  const deletePlaylist = useStore(s => s.deletePlaylist)
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [openPlaylist, setOpenPlaylist] = useState<Playlist | null>(null)

  const allPlaylists = [...customPlaylists, ...playlists]

  if (openPlaylist) {
    return <PlaylistDetail playlist={openPlaylist} onBack={() => setOpenPlaylist(null)} />
  }

  return (
    <SectionCard title="Your Playlists">
      <button
        onClick={() => setCreating(true)}
        className="w-full flex items-center gap-3 py-3 px-4 rounded-2xl bg-control/50 text-sm font-semibold text-text-primary"
      >
        <svg className="w-5 h-5 text-accent" fill="currentColor" viewBox="0 0 24 24">
          <path d="M19 13h-6v6h-2v-6H5v-2h6V5h2v6h6v2z" />
        </svg>
        Create Playlist
      </button>

      {creating && (
        <div className="flex items-center gap-2 mt-2">
          <input
            autoFocus
            value={newName}
            onChange={e => setNewName(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' && newName.trim()) {
                createPlaylist(newName.trim())
                setNewName(''); setCreating(false)
              }
              if (e.key === 'Escape') { setCreating(false); setNewName('') }
            }}
            placeholder="Playlist name…"
            className="flex-1 bg-card text-text-primary text-sm px-3 py-2 rounded-xl outline-none placeholder:text-text-tertiary"
          />
          <button
            onClick={() => { if (newName.trim()) { createPlaylist(newName.trim()); setNewName(''); setCreating(false) } }}
            className="px-3 py-2 bg-accent text-white text-sm font-semibold rounded-xl"
          >
            Create
          </button>
          <button onClick={() => { setCreating(false); setNewName('') }} className="text-text-tertiary text-sm">Cancel</button>
        </div>
      )}

      {allPlaylists.length > 0 && (
        <div className="mt-3 space-y-0">
          {allPlaylists.map((pl, i) => (
            <div key={pl.id}>
              <div className="flex items-center gap-3 py-2 cursor-pointer" onClick={() => setOpenPlaylist(pl)}>
                <ArtworkImage url={pl.artworkURL} alt={pl.title} className="w-13 h-13 rounded-xl" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate">{pl.title}</p>
                  <p className="text-xs text-text-secondary">{pl.itemCount} tracks</p>
                </div>
                {pl.kind === 'custom' && (
                  <button
                    onClick={e => { e.stopPropagation(); deletePlaylist(pl.id) }}
                    className="w-8 h-8 flex items-center justify-center text-red-400"
                  >
                    <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M6 19c0 1.1.9 2 2 2h8c1.1 0 2-.9 2-2V7H6v12zM19 4h-3.5l-1-1h-5l-1 1H5v2h14V4z" />
                    </svg>
                  </button>
                )}
                <svg className="w-4 h-4 text-text-tertiary shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </div>
              {i < allPlaylists.length - 1 && <div className="h-px bg-divider ml-16" />}
            </div>
          ))}
        </div>
      )}

      {allPlaylists.length === 0 && !creating && (
        <p className="text-sm text-text-secondary mt-2">
          Create playlists and add tracks from anywhere in the app.
        </p>
      )}
    </SectionCard>
  )
}

function PlaylistDetail({ playlist, onBack }: { playlist: Playlist; onBack: () => void }) {
  const loadPlaylistTracks = useStore(s => s.loadPlaylistTracks)
  const playlistTracks = useStore(s => s.playlistTracks)
  const play = useStore(s => s.play)
  const [tracks, setTracks] = useState<Track[]>(playlistTracks[playlist.id] ?? [])
  const [loading, setLoading] = useState(tracks.length === 0)

  useEffect(() => {
    if (tracks.length === 0) {
      loadPlaylistTracks(playlist).then(t => { setTracks(t); setLoading(false) })
    }
  }, [])

  return (
    <div>
      <button onClick={onBack} className="flex items-center gap-2 text-accent text-sm font-semibold mb-4">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Library
      </button>
      <SectionCard title={playlist.title}>
        {loading ? (
          <p className="text-sm text-text-secondary">Loading…</p>
        ) : tracks.length === 0 ? (
          <p className="text-sm text-text-secondary">This playlist is empty.</p>
        ) : (
          <div className="space-y-0">
            {tracks.map((track, i) => (
              <div key={track.youtubeVideoID}>
                <TrackRow track={track} onPlay={() => play(track, tracks)} showIndex={i} />
                {i < tracks.length - 1 && <div className="h-px bg-divider ml-16" />}
              </div>
            ))}
          </div>
        )}
      </SectionCard>
    </div>
  )
}

// ── Saved Collections ─────────────────────────────────────────────────────────

function SavedCollectionsSection() {
  const savedCollections = useStore(s => s.savedCollections)
  const toggleCollectionSaved = useStore(s => s.toggleCollectionSaved)
  const play = useStore(s => s.play)
  const accessToken = useStore(s => s.accessToken)
  const [loadingId, setLoadingId] = useState<string | null>(null)

  const handlePlay = async (col: typeof savedCollections[0]) => {
    if (!col.sourceID || loadingId) return
    setLoadingId(col.id)
    try {
      const tracks = await fetchPlaylistTracks(col.sourceID, accessToken ?? undefined)
      if (tracks.length > 0) play(tracks[0], tracks)
    } finally {
      setLoadingId(null)
    }
  }

  return (
    <SectionCard title="Saved Collections">
      {savedCollections.length === 0 ? (
        <p className="text-sm text-text-secondary">
          Save playlists, albums, and artists from Search for quick access later.
        </p>
      ) : (
        <div className="space-y-0">
          {savedCollections.map((col, i) => (
            <div key={col.id}>
              <div
                className="flex items-center gap-3 py-2 cursor-pointer group"
                onClick={() => handlePlay(col)}
              >
                <div className="relative shrink-0">
                  <ArtworkImage
                    url={col.artworkURL}
                    alt={col.title}
                    className={`w-13 h-13 ${col.kind === 'artist' ? 'rounded-full' : 'rounded-xl'}`}
                  />
                  {loadingId === col.id && (
                    <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-black/50">
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-text-primary truncate group-hover:text-accent transition-colors">{col.title}</p>
                  <p className="text-xs text-text-secondary truncate">
                    {col.kind.charAt(0).toUpperCase() + col.kind.slice(1)}
                    {col.subtitle ? ` · ${col.subtitle}` : ''}
                  </p>
                </div>
                <button
                  onClick={e => { e.stopPropagation(); toggleCollectionSaved(col) }}
                  className="w-9 h-9 rounded-full bg-control flex items-center justify-center shrink-0"
                >
                  <svg className="w-4 h-4 text-accent" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5z" />
                  </svg>
                </button>
              </div>
              {i < savedCollections.length - 1 && <div className="h-px bg-divider ml-16" />}
            </div>
          ))}
        </div>
      )}
    </SectionCard>
  )
}

// ── Shared ────────────────────────────────────────────────────────────────────

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="text-lg font-bold text-text-primary mb-3">{title}</h2>
      <div className="p-4 rounded-3xl bg-white/[0.03] border border-glass-stroke backdrop-blur-sm">
        {children}
      </div>
    </div>
  )
}
