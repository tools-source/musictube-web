import { useState, useEffect, useRef, useCallback } from 'react'
import { useStore } from '../store'
import { debounce } from '../utils'
import TrackRow from '../components/TrackRow'
import ArtworkImage from '../components/ArtworkImage'
import { SkeletonTrackRow } from '../components/Skeleton'
import { fetchPlaylistTracks } from '../api/youtube'
import type { SearchTab, MusicCollection, Track } from '../types'



const TABS: SearchTab[] = ['Songs', 'Albums', 'Playlists', 'Artists']

export default function SearchView() {
  const searchQuery = useStore(s => s.searchQuery)
  const setSearchQuery = useStore(s => s.setSearchQuery)
  const searchResults = useStore(s => s.searchResults)
  const searchNextPageToken = useStore(s => s.searchNextPageToken)
  const isSearching = useStore(s => s.isSearching)
  const isLoadingMore = useStore(s => s.isLoadingMore)
  const search = useStore(s => s.search)
  const loadMoreSearch = useStore(s => s.loadMoreSearch)
  const clearSearch = useStore(s => s.clearSearch)
  const recentSearches = useStore(s => s.recentSearches)
  const recordRecentSearch = useStore(s => s.recordRecentSearch)
  const removeRecentSearch = useStore(s => s.removeRecentSearch)
  const play = useStore(s => s.play)

  const [tab, setTab] = useState<SearchTab>('Songs')
  const [isFocused, setIsFocused] = useState(false)
  const [openCollection, setOpenCollection] = useState<MusicCollection | null>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  const debouncedSearch = useCallback(
    debounce((q: string) => { if (q.trim()) search(q) }, 500),
    [search]
  )

  useEffect(() => {
    if (searchQuery.trim()) debouncedSearch(searchQuery)
    else clearSearch()
  }, [searchQuery])

  const hasResults = searchResults.songs.length > 0 || searchResults.playlists.length > 0 || searchResults.albums.length > 0 || searchResults.artists.length > 0
  const totalCount = searchResults.songs.length + searchResults.playlists.length + searchResults.albums.length + searchResults.artists.length

  const availableTabs = TABS.filter(t => {
    if (t === 'Songs') return true
    if (t === 'Albums') return searchResults.albums.length > 0
    if (t === 'Playlists') return searchResults.playlists.length > 0
    if (t === 'Artists') return searchResults.artists.length > 0
    return false
  })

  useEffect(() => {
    if (!availableTabs.includes(tab)) setTab(availableTabs[0] ?? 'Songs')
  }, [availableTabs, tab])

  const handleSubmit = () => {
    const q = searchQuery.trim()
    if (q) { recordRecentSearch(q); search(q) }
    inputRef.current?.blur()
    setIsFocused(false)
  }

  const selectSuggestion = (q: string) => {
    setSearchQuery(q)
    recordRecentSearch(q)
    search(q)
    setIsFocused(false)
  }

  const clear = () => {
    setSearchQuery('')
    clearSearch()
    setOpenCollection(null)
    inputRef.current?.focus()
  }

  if (openCollection) {
    return <CollectionDetail collection={openCollection} onBack={() => setOpenCollection(null)} />
  }

  return (
    <div className="flex flex-col gap-4 px-5 pt-3 pb-4">
      {/* Search Bar */}
      <div className="flex items-center gap-3">
        <div className="flex-1 flex items-center gap-3 bg-card rounded-lg px-4 py-3.5 border border-white/[0.06]">
          <svg className="w-4 h-4 text-text-tertiary shrink-0" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
          </svg>
          <input
            ref={inputRef}
            type="search"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setTimeout(() => setIsFocused(false), 150)}
            onKeyDown={e => e.key === 'Enter' && handleSubmit()}
            placeholder="Songs, playlists, albums, artists"
            className="flex-1 bg-transparent text-text-primary placeholder:text-text-tertiary text-sm outline-none"
          />
          {searchQuery && (
            <button onClick={clear} className="text-text-tertiary hover:text-text-secondary shrink-0">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z" />
              </svg>
            </button>
          )}
        </div>
        {isFocused && !searchQuery && (
          <button
            onMouseDown={() => { setSearchQuery(''); setIsFocused(false); inputRef.current?.blur() }}
            className="text-sm font-semibold text-text-primary shrink-0"
          >
            Cancel
          </button>
        )}
      </div>

      {/* Recent searches — always visible when no active query */}
      {!searchQuery && recentSearches.length > 0 && (
        <div>
          <p className="text-xs font-semibold text-text-secondary mb-2">Recent searches</p>
          <div className="space-y-0">
            {recentSearches.slice(0, 8).map((q, i) => (
              <div key={q}>
                <div className="flex items-center gap-3 py-2.5">
                  <button onClick={() => selectSuggestion(q)} className="flex items-center gap-3 flex-1 min-w-0 text-left">
                    <svg className="w-4 h-4 text-text-tertiary shrink-0" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3M21 12a9 9 0 1 1-18 0 9 9 0 0 1 18 0z" />
                    </svg>
                    <span className="text-sm text-text-primary truncate">{q}</span>
                  </button>
                  <button onClick={() => removeRecentSearch(q)} className="text-text-tertiary shrink-0">
                    <svg className="w-4.5 h-4.5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
                    </svg>
                  </button>
                </div>
                {i < recentSearches.slice(0, 8).length - 1 && <div className="h-px bg-divider ml-7" />}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty state — only when no query and no recent searches */}
      {!searchQuery && recentSearches.length === 0 && (
        <div className="py-6 px-4 rounded-lg bg-card border border-white/[0.06]">
          <p className="text-sm text-text-secondary">
            Search for songs, playlists, albums, and artists, then save anything you like to your library.
          </p>
        </div>
      )}

      {/* Searching indicator */}
      {isSearching && !hasResults && (
        <StatusCard label="Searching songs, playlists, albums, and artists…" showProgress />
      )}

      {/* No results */}
      {!isSearching && searchQuery.trim() && !hasResults && (
        <StatusCard label="No results matched that search." />
      )}

      {/* Results */}
      {hasResults && (
        <>
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-text-secondary">{totalCount} results</p>
          </div>

          {/* Tabs */}
          <div className="flex gap-2 overflow-x-auto scrollbar-hide">
            {availableTabs.map(t => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`shrink-0 px-5 py-2.5 rounded-full text-sm font-semibold transition-all ${
                  tab === t ? 'bg-text-primary text-black' : 'bg-control text-text-primary'
                }`}
              >
                {t}
              </button>
            ))}
          </div>

          {/* Song results */}
          {tab === 'Songs' && (
            <SongResults
              songs={searchResults.songs}
              isLoading={isSearching}
              onPlay={(track: Track) => play(track, searchResults.songs)}
            />
          )}

          {/* Album results */}
          {tab === 'Albums' && (
            <CollectionResults
              collections={searchResults.albums}
              title="Albums"
              onOpenCollection={setOpenCollection}
            />
          )}

          {/* Playlist results */}
          {tab === 'Playlists' && (
            <CollectionResults
              collections={searchResults.playlists}
              title="Playlists"
              onOpenCollection={setOpenCollection}
            />
          )}

          {/* Artist results */}
          {tab === 'Artists' && (
            <CollectionResults
              collections={searchResults.artists}
              title="Artists"
            />
          )}

          {/* Load more */}
          {searchNextPageToken && !isSearching && (
            <button
              onClick={loadMoreSearch}
              disabled={isLoadingMore}
              className="w-full py-3.5 rounded-lg bg-control text-sm font-semibold text-text-primary flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isLoadingMore ? (
                <>
                  <div className="w-4 h-4 border-2 border-text-tertiary border-t-text-primary rounded-full animate-spin" />
                  Loading…
                </>
              ) : 'Load more results'}
            </button>
          )}
        </>
      )}
    </div>
  )
}

function SongResults({
  songs,
  isLoading,
  onPlay,
}: {
  songs: Track[]
  isLoading: boolean
  onPlay: (t: Track) => void
}) {
  if (isLoading && songs.length === 0) {
    return (
      <div className="space-y-0">
        {Array.from({ length: 5 }).map((_, i) => <SkeletonTrackRow key={i} />)}
      </div>
    )
  }

  if (songs.length === 0) {
    return <StatusCard label="No songs matched that search." />
  }

  return (
    <div className="space-y-0">
      {songs.map((track, i) => (
        <div key={track.youtubeVideoID}>
          <TrackRow track={track} onPlay={() => onPlay(track)} />
          {i < songs.length - 1 && <div className="h-px bg-divider ml-16" />}
        </div>
      ))}
    </div>
  )
}

function CollectionResults({
  collections,
  title,
  onOpenCollection,
}: {
  collections: MusicCollection[]
  title: string
  onOpenCollection?: (col: MusicCollection) => void
}) {
  if (collections.length === 0) {
    return <StatusCard label={`No ${title.toLowerCase()} matched that search.`} />
  }

  return (
    <div className="space-y-0">
      <h3 className="text-base font-bold text-text-primary mb-2">{title}</h3>
      {collections.map((col, i) => (
        <div key={col.id}>
          <CollectionRow collection={col} onOpen={onOpenCollection} />
          {i < collections.length - 1 && <div className="h-px bg-divider ml-16" />}
        </div>
      ))}
    </div>
  )
}

function CollectionRow({
  collection,
  onOpen,
}: {
  collection: MusicCollection
  onOpen?: (col: MusicCollection) => void
}) {
  const toggleCollectionSaved = useStore(s => s.toggleCollectionSaved)
  const savedCollections = useStore(s => s.savedCollections)
  const isSaved = savedCollections.some(c => c.id === collection.id)

  const kindLabel = collection.kind === 'playlist' ? 'Playlist' : collection.kind === 'album' ? 'Album' : 'Artist'

  const handleOpen = () => {
    if (collection.kind === 'artist' || !onOpen) return
    onOpen(collection)
  }

  return (
    <div className={`flex items-center gap-3 py-2 group ${collection.kind === 'artist' ? '' : 'cursor-pointer'}`} onClick={handleOpen}>
      <div className="relative shrink-0">
        <ArtworkImage
          url={collection.artworkURL}
          alt={collection.title}
          className={`w-13 h-13 ${collection.kind === 'artist' ? 'rounded-full' : 'rounded-lg'}`}
        />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-text-primary truncate group-hover:text-accent transition-colors">{collection.title}</p>
        <p className="text-xs text-text-secondary truncate">
          {kindLabel}{collection.subtitle ? ` · ${collection.subtitle}` : ''}
          {collection.itemCount > 0 ? ` · ${collection.itemCount} tracks` : ''}
        </p>
      </div>
      <button
        onClick={e => { e.stopPropagation(); toggleCollectionSaved(collection) }}
        className="shrink-0 w-9 h-9 rounded-full bg-control flex items-center justify-center"
      >
        <svg
          className={`w-4 h-4 ${isSaved ? 'text-accent' : 'text-text-primary'}`}
          fill={isSaved ? 'currentColor' : 'none'}
          stroke="currentColor"
          strokeWidth={2}
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M5 5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16l-7-3.5L5 21V5z" />
        </svg>
      </button>
    </div>
  )
}

function CollectionDetail({ collection, onBack }: { collection: MusicCollection; onBack: () => void }) {
  const accessToken = useStore(s => s.accessToken)
  const play = useStore(s => s.play)
  const [tracks, setTracks] = useState<Track[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let active = true
    setLoading(true)
    fetchPlaylistTracks(collection.sourceID, accessToken ?? undefined)
      .then(result => {
        if (!active) return
        setTracks(result)
      })
      .finally(() => {
        if (active) setLoading(false)
      })
    return () => { active = false }
  }, [collection.sourceID, accessToken])

  return (
    <div className="flex flex-col gap-4 px-5 pt-3 pb-4">
      <button onClick={onBack} className="flex items-center gap-2 text-accent text-sm font-semibold">
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Search
      </button>

      <div className="flex items-center gap-4 p-4 rounded-lg bg-white/[0.035] border border-glass-stroke">
        <ArtworkImage url={collection.artworkURL} alt={collection.title} className="w-24 h-24 rounded-lg" />
        <div className="min-w-0">
          <p className="text-xs font-semibold uppercase tracking-[0.16em] text-accent">
            {collection.kind === 'album' ? 'Album' : 'Playlist'}
          </p>
          <h1 className="text-xl font-bold text-text-primary leading-tight mt-1 line-clamp-2">{collection.title}</h1>
          <p className="text-sm text-text-secondary truncate mt-1">{collection.subtitle}</p>
          {tracks.length > 0 && (
            <button
              onClick={() => play(tracks[0], tracks)}
              className="mt-3 px-4 py-2 rounded-lg bg-accent text-white text-xs font-bold"
            >
              Play all
            </button>
          )}
        </div>
      </div>

      {loading ? (
        <StatusCard label="Loading tracks…" showProgress />
      ) : tracks.length === 0 ? (
        <StatusCard label="No playable tracks found in this collection." />
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
    </div>
  )
}

function StatusCard({ label, showProgress = false }: { label: string; showProgress?: boolean }) {
  return (
    <div className="flex items-center gap-3 py-4 px-4 rounded-lg bg-card border border-white/[0.06]">
      {showProgress && (
        <div className="w-4 h-4 border-2 border-text-tertiary border-t-text-primary rounded-full animate-spin shrink-0" />
      )}
      <p className="text-sm text-text-secondary">{label}</p>
    </div>
  )
}
