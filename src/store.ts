import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  Track,
  Playlist,
  MusicCollection,
  SearchResponse,
  YouTubeUser,
  HomeFilter,
  LibraryTab,
  PlaybackState,
  RepeatMode,
} from './types'
import {
  searchYouTube,
  fetchTrendingMusic,
  fetchMyPlaylists,
  fetchLikedSongs,
  fetchPlaylistTracks,
  fetchRelatedTracks,
} from './api/youtube'

// ── Types ─────────────────────────────────────────────────────────────────────

interface AppStore {
  // Auth
  user: YouTubeUser | null
  accessToken: string | null
  isSigningIn: boolean
  signIn: () => Promise<void>
  signOut: () => void

  // Navigation
  activeTab: LibraryTab
  setActiveTab: (tab: LibraryTab) => void
  isPlayerOpen: boolean
  openPlayer: () => void
  closePlayer: () => void

  // Home
  homeFilter: HomeFilter
  setHomeFilter: (f: HomeFilter) => void
  featuredTracks: Track[]
  isLoadingHome: boolean
  hasLoadedHome: boolean
  loadHome: () => Promise<void>

  // Search
  searchQuery: string
  setSearchQuery: (q: string) => void
  searchResults: SearchResponse
  searchNextPageToken: string | null
  isSearching: boolean
  isLoadingMore: boolean
  search: (query: string) => Promise<void>
  loadMoreSearch: () => Promise<void>
  clearSearch: () => void

  // Library
  recentSearches: string[]
  recordRecentSearch: (q: string) => void
  removeRecentSearch: (q: string) => void
  likedTrackIDs: Set<string>
  likedTracks: Track[]
  toggleLike: (track: Track) => void
  savedTrackIDs: Set<string>
  toggleSave: (track: Track) => void
  historyTracks: Track[]
  addToHistory: (track: Track) => void
  clearHistory: () => void
  playlists: Playlist[]
  loadPlaylists: () => Promise<void>
  customPlaylists: Playlist[]
  createPlaylist: (title: string) => void
  deletePlaylist: (id: string) => void
  addTrackToPlaylist: (track: Track, playlistId: string) => void
  playlistTracks: Record<string, Track[]>
  loadPlaylistTracks: (playlist: Playlist) => Promise<Track[]>
  savedCollections: MusicCollection[]
  toggleCollectionSaved: (col: MusicCollection) => void

  // Playback
  queue: Track[]
  queueIndex: number
  nowPlaying: Track | null
  playbackState: PlaybackState
  shuffleMode: boolean
  repeatMode: RepeatMode
  play: (track: Track, queue?: Track[]) => void
  playNext: () => void
  playPrev: () => void
  toggleShuffle: () => void
  cycleRepeat: () => void
  setPlaybackState: (state: Partial<PlaybackState>) => void
  stopPlayback: () => void
  autoQueueRelated: () => Promise<void>
}

const EMPTY_SEARCH: SearchResponse = { songs: [], playlists: [], albums: [], artists: [] }
const EMPTY_PLAYBACK: PlaybackState = {
  isPlaying: false,
  currentTime: 0,
  duration: 0,
  bufferedFraction: 0,
  isLoading: false,
}

// ── Store ─────────────────────────────────────────────────────────────────────

export const useStore = create<AppStore>()(
  persist(
    (set, get) => ({
      // ── Auth ───────────────────────────────────────────────────────────────
      user: null,
      accessToken: null,
      isSigningIn: false,

      signIn: async () => {
        const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID as string | undefined
        if (!clientId) {
          alert('Set VITE_GOOGLE_CLIENT_ID in your .env.local to enable YouTube sign-in.')
          return
        }
        set({ isSigningIn: true })
        try {
          const token = await requestGoogleToken(clientId)
          const me = await fetchGoogleProfile(token)
          set({ accessToken: token, user: me, isSigningIn: false })
          await get().loadPlaylists()
        } catch {
          set({ isSigningIn: false })
        }
      },

      signOut: () => {
        set({ user: null, accessToken: null, playlists: [], likedTrackIDs: new Set(), likedTracks: [], savedTrackIDs: new Set() })
      },

      // ── Navigation ─────────────────────────────────────────────────────────
      activeTab: 'home',
      setActiveTab: tab => set({ activeTab: tab }),
      isPlayerOpen: false,
      openPlayer: () => set({ isPlayerOpen: true }),
      closePlayer: () => set({ isPlayerOpen: false }),

      // ── Home ───────────────────────────────────────────────────────────────
      homeFilter: 'All',
      setHomeFilter: f => set({ homeFilter: f }),
      featuredTracks: [],
      isLoadingHome: false,
      hasLoadedHome: false,

      loadHome: async () => {
        if (get().isLoadingHome) return
        set({ isLoadingHome: true })
        try {
          const { accessToken } = get()
          const tracks = await fetchTrendingMusic(accessToken ?? undefined)
          set({ featuredTracks: tracks, hasLoadedHome: true })
        } finally {
          set({ isLoadingHome: false })
        }
      },

      // ── Search ─────────────────────────────────────────────────────────────
      searchQuery: '',
      setSearchQuery: q => set({ searchQuery: q }),
      searchResults: EMPTY_SEARCH,
      searchNextPageToken: null,
      isSearching: false,
      isLoadingMore: false,

      search: async (query: string) => {
        if (!query.trim()) { get().clearSearch(); return }
        set({ isSearching: true, searchNextPageToken: null })
        try {
          const { accessToken } = get()
          const results = await searchYouTube(query, undefined, accessToken ?? undefined)
          set({ searchResults: results, searchNextPageToken: results.nextPageToken ?? null })
        } finally {
          set({ isSearching: false })
        }
      },

      loadMoreSearch: async () => {
        const { searchQuery, searchNextPageToken, isLoadingMore, accessToken } = get()
        if (!searchQuery.trim() || !searchNextPageToken || isLoadingMore) return
        set({ isLoadingMore: true })
        try {
          const more = await searchYouTube(searchQuery, searchNextPageToken, accessToken ?? undefined)
          set(s => ({
            searchResults: {
              songs: [...s.searchResults.songs, ...more.songs],
              playlists: [...s.searchResults.playlists, ...more.playlists],
              albums: [...s.searchResults.albums, ...more.albums],
              artists: [...s.searchResults.artists, ...more.artists],
            },
            searchNextPageToken: more.nextPageToken ?? null,
          }))
        } finally {
          set({ isLoadingMore: false })
        }
      },

      clearSearch: () => set({ searchResults: EMPTY_SEARCH, searchQuery: '', searchNextPageToken: null }),

      // ── Library ────────────────────────────────────────────────────────────
      recentSearches: [],
      recordRecentSearch: q => {
        set(s => {
          const list = [q, ...s.recentSearches.filter(r => r !== q)].slice(0, 12)
          return { recentSearches: list }
        })
      },
      removeRecentSearch: q => set(s => ({ recentSearches: s.recentSearches.filter(r => r !== q) })),

      likedTrackIDs: new Set(),
      likedTracks: [],
      toggleLike: track => {
        set(s => {
          const ids = new Set(s.likedTrackIDs)
          if (ids.has(track.youtubeVideoID)) ids.delete(track.youtubeVideoID)
          else ids.add(track.youtubeVideoID)
          return { likedTrackIDs: ids }
        })
      },

      savedTrackIDs: new Set(),
      toggleSave: track => {
        set(s => {
          const ids = new Set(s.savedTrackIDs)
          if (ids.has(track.youtubeVideoID)) ids.delete(track.youtubeVideoID)
          else ids.add(track.youtubeVideoID)
          return { savedTrackIDs: ids }
        })
      },

      historyTracks: [],
      addToHistory: track => {
        set(s => {
          const list = [track, ...s.historyTracks.filter(t => t.youtubeVideoID !== track.youtubeVideoID)].slice(0, 100)
          return { historyTracks: list }
        })
      },
      clearHistory: () => set({ historyTracks: [] }),

      playlists: [],
      loadPlaylists: async () => {
        const { accessToken } = get()
        if (!accessToken) return
        const pl = await fetchMyPlaylists(accessToken)
        set({ playlists: pl })
        const liked = await fetchLikedSongs(accessToken)
        const likedIDs = new Set(liked.map(t => t.youtubeVideoID))
        set(s => ({
          likedTrackIDs: likedIDs,
          likedTracks: liked,
          playlistTracks: { ...s.playlistTracks, LL: liked },
        }))
      },

      customPlaylists: [],
      createPlaylist: title => {
        const pl: Playlist = {
          id: `custom-${Date.now()}`,
          title,
          description: '',
          artworkURL: null,
          itemCount: 0,
          kind: 'custom',
        }
        set(s => ({ customPlaylists: [...s.customPlaylists, pl] }))
      },
      deletePlaylist: id => {
        set(s => ({ customPlaylists: s.customPlaylists.filter(p => p.id !== id) }))
      },
      addTrackToPlaylist: (track, playlistId) => {
        set(s => {
          const existing = s.playlistTracks[playlistId] ?? []
          if (existing.some(t => t.youtubeVideoID === track.youtubeVideoID)) return s
          return {
            playlistTracks: { ...s.playlistTracks, [playlistId]: [...existing, track] },
            customPlaylists: s.customPlaylists.map(p =>
              p.id === playlistId ? { ...p, itemCount: p.itemCount + 1 } : p
            ),
          }
        })
      },

      playlistTracks: {},
      loadPlaylistTracks: async (playlist: Playlist): Promise<Track[]> => {
        const { accessToken, playlistTracks } = get()
        if (playlist.kind === 'custom') return playlistTracks[playlist.id] ?? []
        if (playlist.kind === 'likedMusic') {
          const cached = playlistTracks.LL ?? get().likedTracks
          if (cached.length > 0) return cached
          if (!accessToken) return []
          const tracks = await fetchLikedSongs(accessToken)
          set(s => ({
            likedTracks: tracks,
            likedTrackIDs: new Set(tracks.map(t => t.youtubeVideoID)),
            playlistTracks: { ...s.playlistTracks, LL: tracks },
          }))
          return tracks
        }
        if (playlist.kind === 'savedSongs') {
          const { savedTrackIDs, historyTracks, featuredTracks, likedTracks } = get()
          const seen = new Set<string>()
          return [...historyTracks, ...featuredTracks, ...likedTracks].filter(track => {
            if (seen.has(track.youtubeVideoID)) return false
            seen.add(track.youtubeVideoID)
            return savedTrackIDs.has(track.youtubeVideoID)
          })
        }
        const tracks = await fetchPlaylistTracks(playlist.id, accessToken ?? undefined)
        set(s => ({ playlistTracks: { ...s.playlistTracks, [playlist.id]: tracks } }))
        return tracks
      },

      savedCollections: [],
      toggleCollectionSaved: col => {
        set(s => {
          const exists = s.savedCollections.some(c => c.id === col.id)
          return {
            savedCollections: exists
              ? s.savedCollections.filter(c => c.id !== col.id)
              : [...s.savedCollections, col],
          }
        })
      },

      // ── Playback ───────────────────────────────────────────────────────────
      queue: [],
      queueIndex: 0,
      nowPlaying: null,
      playbackState: EMPTY_PLAYBACK,
      shuffleMode: false,
      repeatMode: 'off',

      play: (track, queue) => {
        const q = queue ?? [track]
        const idx = q.findIndex(t => t.youtubeVideoID === track.youtubeVideoID)
        get().addToHistory(track)
        set({
          queue: q,
          queueIndex: idx >= 0 ? idx : 0,
          nowPlaying: track,
          playbackState: { ...EMPTY_PLAYBACK, isLoading: true },
        })
      },

      playNext: () => {
        const { queue, queueIndex, repeatMode, shuffleMode } = get()
        if (queue.length === 0) return
        let next: number
        if (repeatMode === 'one') {
          next = queueIndex
        } else if (shuffleMode) {
          next = Math.floor(Math.random() * queue.length)
        } else {
          next = queueIndex + 1
          if (next >= queue.length) {
            if (repeatMode === 'all') next = 0
            else return
          }
        }
        const track = queue[next]
        get().addToHistory(track)
        set({ queueIndex: next, nowPlaying: track, playbackState: { ...EMPTY_PLAYBACK, isLoading: true } })
      },

      playPrev: () => {
        const { queue, queueIndex, playbackState } = get()
        if (playbackState.currentTime > 3) {
          set(s => ({ playbackState: { ...s.playbackState, currentTime: 0 } }))
          return
        }
        const prev = Math.max(0, queueIndex - 1)
        const track = queue[prev]
        if (!track) return
        set({ queueIndex: prev, nowPlaying: track, playbackState: { ...EMPTY_PLAYBACK, isLoading: true } })
      },

      toggleShuffle: () => set(s => ({ shuffleMode: !s.shuffleMode })),

      cycleRepeat: () => {
        set(s => {
          const next: RepeatMode = s.repeatMode === 'off' ? 'all' : s.repeatMode === 'all' ? 'one' : 'off'
          return { repeatMode: next }
        })
      },

      setPlaybackState: state => set(s => ({ playbackState: { ...s.playbackState, ...state } })),

      stopPlayback: () => set({ nowPlaying: null, queue: [], queueIndex: 0, playbackState: EMPTY_PLAYBACK, isPlayerOpen: false }),

      autoQueueRelated: async () => {
        const { nowPlaying, queue, queueIndex, accessToken } = get()
        if (!nowPlaying) return
        if (queue.length - queueIndex - 1 > 3) return // enough tracks ahead
        const related = await fetchRelatedTracks(nowPlaying.artist, nowPlaying.youtubeVideoID, accessToken ?? undefined)
        if (related.length === 0) return
        const existing = new Set(get().queue.map(t => t.youtubeVideoID))
        const fresh = related.filter(t => !existing.has(t.youtubeVideoID))
        if (fresh.length > 0) set(s => ({ queue: [...s.queue, ...fresh] }))
      },
    }),
    {
      name: 'musictube-storage',
      partialize: s => ({
        user: s.user,
        accessToken: s.accessToken,
        recentSearches: s.recentSearches,
        likedTrackIDs: [...s.likedTrackIDs],
        likedTracks: s.likedTracks,
        savedTrackIDs: [...s.savedTrackIDs],
        historyTracks: s.historyTracks.slice(0, 50),
        customPlaylists: s.customPlaylists,
        playlistTracks: s.playlistTracks,
        savedCollections: s.savedCollections,
        shuffleMode: s.shuffleMode,
        repeatMode: s.repeatMode,
      }),
      merge: (persisted: unknown, current) => {
        const p = persisted as Partial<AppStore> & { likedTrackIDs?: string[]; savedTrackIDs?: string[] }
        return {
          ...current,
          ...p,
          // Always reconstruct these to avoid undefined from stale persisted state
          likedTrackIDs: new Set(p.likedTrackIDs ?? []),
          savedTrackIDs: new Set(p.savedTrackIDs ?? []),
          likedTracks: Array.isArray(p.likedTracks) ? p.likedTracks : [],
          historyTracks: Array.isArray(p.historyTracks) ? p.historyTracks : [],
          customPlaylists: Array.isArray(p.customPlaylists) ? p.customPlaylists : [],
          savedCollections: Array.isArray(p.savedCollections) ? p.savedCollections : [],
          recentSearches: Array.isArray(p.recentSearches) ? p.recentSearches : [],
        }
      },
    }
  )
)

// ── Google OAuth helpers ──────────────────────────────────────────────────────

function requestGoogleToken(clientId: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const client = (window as Window & { google?: { accounts: { oauth2: { initTokenClient: (cfg: unknown) => { requestAccessToken: () => void } } } } }).google?.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: 'https://www.googleapis.com/auth/youtube.readonly https://www.googleapis.com/auth/userinfo.profile https://www.googleapis.com/auth/userinfo.email',
      callback: (response: { access_token?: string; error?: string }) => {
        if (response.access_token) resolve(response.access_token)
        else reject(new Error(response.error ?? 'OAuth failed'))
      },
    })
    client?.requestAccessToken()
  })
}

async function fetchGoogleProfile(token: string): Promise<YouTubeUser> {
  const res = await fetch('https://www.googleapis.com/oauth2/v3/userinfo', {
    headers: { Authorization: `Bearer ${token}` },
  })
  const json = await res.json()
  return { name: json.name ?? 'YouTube User', email: json.email ?? '', picture: json.picture ?? null }
}
