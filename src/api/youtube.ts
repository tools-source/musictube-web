import type { Track, MusicCollection, SearchResponse, Playlist } from '../types'
import { parseDuration } from '../utils'

const API_KEY = import.meta.env.VITE_YOUTUBE_API_KEY as string | undefined
const BASE = 'https://www.googleapis.com/youtube/v3'

function apiKey(): string {
  return API_KEY ?? ''
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function bestThumbnail(thumbnails: Record<string, { url: string }> | undefined): string | null {
  if (!thumbnails) return null
  return (thumbnails.maxres ?? thumbnails.high ?? thumbnails.medium ?? thumbnails.default)?.url ?? null
}

function videoToTrack(item: YoutubeVideoItem): Track {
  const snippet = item.snippet
  const details = item.contentDetails
  const stats = item.statistics
  return {
    id: item.id,
    title: snippet.title,
    artist: snippet.channelTitle,
    artworkURL: bestThumbnail(snippet.thumbnails),
    duration: details ? parseDuration(details.duration) : null,
    youtubeVideoID: item.id,
    viewCount: stats?.viewCount ? parseInt(stats.viewCount) : null,
  }
}

function searchItemToTrack(item: YoutubeSearchItem): Track {
  return {
    id: item.id.videoId,
    title: item.snippet.title,
    artist: item.snippet.channelTitle,
    artworkURL: bestThumbnail(item.snippet.thumbnails),
    duration: null,
    youtubeVideoID: item.id.videoId,
    viewCount: null,
  }
}

function searchItemToCollection(item: YoutubeSearchItem, kind: 'playlist' | 'album' | 'artist'): MusicCollection {
  return {
    id: `${kind}:${item.id.playlistId ?? item.id.channelId ?? item.id.videoId}`,
    sourceID: item.id.playlistId ?? item.id.channelId ?? '',
    title: item.snippet.title,
    subtitle: item.snippet.channelTitle,
    artworkURL: bestThumbnail(item.snippet.thumbnails),
    itemCount: 0,
    kind,
  }
}

// ── Raw YouTube API types ────────────────────────────────────────────────────

interface YoutubeSearchItem {
  id: { videoId: string; playlistId?: string; channelId?: string }
  snippet: {
    title: string
    channelTitle: string
    thumbnails: Record<string, { url: string }>
  }
}

interface YoutubeVideoItem {
  id: string
  snippet: {
    title: string
    channelTitle: string
    thumbnails: Record<string, { url: string }>
  }
  contentDetails?: { duration: string }
  statistics?: { viewCount: string }
}

interface YoutubePlaylistItem {
  id: string
  snippet: {
    title: string
    description: string
    thumbnails: Record<string, { url: string }>
  }
  contentDetails: { itemCount: number }
}

// ── Public API ───────────────────────────────────────────────────────────────

export async function searchYouTube(
  query: string,
  pageToken?: string,
  accessToken?: string,
): Promise<SearchResponse> {
  const params = new URLSearchParams({
    part: 'snippet',
    q: query,
    maxResults: '20',
    type: 'video,playlist,channel',
    ...(pageToken ? { pageToken } : {}),
    ...(accessToken ? {} : { key: apiKey() }),
  })

  const headers: Record<string, string> = {}
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

  const res = await fetch(`${BASE}/search?${params}`, { headers })
  if (!res.ok) throw new Error(`YouTube search error: ${res.status}`)
  const json = await res.json()

  const items: YoutubeSearchItem[] = json.items ?? []
  const videoIDs = items.filter(i => i.id.videoId).map(i => i.id.videoId)

  let videoDetails: Record<string, YoutubeVideoItem> = {}
  if (videoIDs.length > 0) {
    videoDetails = await fetchVideoDetails(videoIDs, accessToken)
  }

  const songs: Track[] = items
    .filter(i => i.id.videoId)
    .map(i => videoDetails[i.id.videoId] ? videoToTrack(videoDetails[i.id.videoId]) : searchItemToTrack(i))

  const playlists: MusicCollection[] = items
    .filter(i => i.id.playlistId)
    .map(i => searchItemToCollection(i, 'playlist'))

  const artists: MusicCollection[] = items
    .filter(i => i.id.channelId)
    .map(i => searchItemToCollection(i, 'artist'))

  return { songs, playlists, albums: [], artists, nextPageToken: json.nextPageToken }
}

export async function fetchVideoDetails(
  ids: string[],
  accessToken?: string,
): Promise<Record<string, YoutubeVideoItem>> {
  const params = new URLSearchParams({
    part: 'snippet,contentDetails,statistics',
    id: ids.join(','),
    ...(accessToken ? {} : { key: apiKey() }),
  })
  const headers: Record<string, string> = {}
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

  const res = await fetch(`${BASE}/videos?${params}`, { headers })
  if (!res.ok) return {}
  const json = await res.json()
  const result: Record<string, YoutubeVideoItem> = {}
  for (const item of json.items ?? []) result[item.id] = item
  return result
}

export async function fetchMyPlaylists(accessToken: string): Promise<Playlist[]> {
  const params = new URLSearchParams({
    part: 'snippet,contentDetails',
    mine: 'true',
    maxResults: '50',
  })
  const res = await fetch(`${BASE}/playlists?${params}`, {
    headers: { Authorization: `Bearer ${accessToken}` },
  })
  if (!res.ok) return []
  const json = await res.json()

  return (json.items ?? []).map((item: YoutubePlaylistItem): Playlist => ({
    id: item.id,
    title: item.snippet.title,
    description: item.snippet.description,
    artworkURL: bestThumbnail(item.snippet.thumbnails),
    itemCount: item.contentDetails.itemCount,
    kind: 'standard',
  }))
}

export async function fetchPlaylistTracks(
  playlistId: string,
  accessToken?: string,
): Promise<Track[]> {
  const params = new URLSearchParams({
    part: 'snippet',
    playlistId,
    maxResults: '50',
    ...(accessToken ? {} : { key: apiKey() }),
  })
  const headers: Record<string, string> = {}
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

  const res = await fetch(`${BASE}/playlistItems?${params}`, { headers })
  if (!res.ok) return []
  const json = await res.json()

  const videoIDs: string[] = (json.items ?? [])
    .map((i: { snippet: { resourceId: { videoId: string } } }) => i.snippet.resourceId.videoId)
    .filter(Boolean)

  if (videoIDs.length === 0) return []
  const details = await fetchVideoDetails(videoIDs, accessToken)
  return videoIDs.map(id => details[id]).filter(Boolean).map(videoToTrack)
}

export async function fetchLikedSongs(accessToken: string): Promise<Track[]> {
  return fetchPlaylistTracks('LL', accessToken)
}

export async function fetchTrendingMusic(accessToken?: string): Promise<Track[]> {
  const params = new URLSearchParams({
    part: 'snippet,contentDetails,statistics',
    chart: 'mostPopular',
    videoCategoryId: '10',
    maxResults: '20',
    regionCode: 'US',
    ...(accessToken ? {} : { key: apiKey() }),
  })
  const headers: Record<string, string> = {}
  if (accessToken) headers['Authorization'] = `Bearer ${accessToken}`

  const res = await fetch(`${BASE}/videos?${params}`, { headers })
  if (!res.ok) return []
  const json = await res.json()
  return (json.items ?? []).map(videoToTrack)
}

export async function fetchRelatedTracks(
  artistName: string,
  excludeVideoID: string,
  accessToken?: string,
): Promise<Track[]> {
  const clean = artistName.replace(/ - Topic$/i, '').trim()
  try {
    const results = await searchYouTube(`${clean} music`, undefined, accessToken)
    return results.songs.filter(t => t.youtubeVideoID !== excludeVideoID).slice(0, 15)
  } catch {
    return []
  }
}

export async function searchSuggestions(query: string): Promise<string[]> {
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&q=${encodeURIComponent(query)}&ds=yt`
    const res = await fetch(url)
    if (!res.ok) return []
    const json = await res.json()
    return (json[1] ?? []).slice(0, 8) as string[]
  } catch {
    return []
  }
}
