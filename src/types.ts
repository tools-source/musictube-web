export interface Track {
  id: string
  title: string
  artist: string
  artworkURL: string | null
  duration: number | null
  youtubeVideoID: string
  viewCount: number | null
}

export interface Playlist {
  id: string
  title: string
  description: string
  artworkURL: string | null
  itemCount: number
  kind: 'standard' | 'likedMusic' | 'uploads' | 'savedSongs' | 'custom'
}

export interface MusicCollection {
  id: string
  sourceID: string
  title: string
  subtitle: string
  artworkURL: string | null
  itemCount: number
  kind: 'playlist' | 'album' | 'artist'
}

export interface SearchResponse {
  songs: Track[]
  playlists: MusicCollection[]
  albums: MusicCollection[]
  artists: MusicCollection[]
  nextPageToken?: string
}

export interface TasteProfile {
  artists: Record<string, number>
  terms: Record<string, number>
  updatedAt: number
}

export interface YouTubeUser {
  name: string
  email: string
  picture: string | null
}

export type HomeFilter = 'All' | 'Arabic' | 'Worship' | 'Playlists' | 'Recent'
export type SearchTab = 'Songs' | 'Albums' | 'Playlists' | 'Artists'
export type LibraryTab = 'home' | 'search' | 'library'

export interface PlaybackState {
  isPlaying: boolean
  currentTime: number
  duration: number
  bufferedFraction: number
  isLoading: boolean
}

export type RepeatMode = 'off' | 'all' | 'one'
