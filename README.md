# MusicTube Web

A web version of the MusicTube iOS app — same design, same YouTube API.

## Setup

1. **Install dependencies**
   ```bash
   bun install   # or: npm install
   ```

2. **Configure API keys** — copy the example and fill in your keys:
   ```bash
   cp .env.example .env.local
   ```

   | Variable | Where to get it |
   |---|---|
   | `VITE_YOUTUBE_API_KEY` | [Google Cloud Console](https://console.cloud.google.com) → APIs → YouTube Data API v3 |
   | `VITE_GOOGLE_CLIENT_ID` | Google Cloud Console → OAuth 2.0 Client IDs (Web application type) |

3. **Run the dev server**
   ```bash
   bun run dev   # or: npm run dev
   ```
   Open `http://localhost:5173`

## Features

- **Home** — filter chips (All, Arabic, Worship, Playlists, Recent), continue listening, trending/recommended tracks
- **Search** — search YouTube for songs, albums, and artists; tabbed results; save collections
- **Library** — history, liked songs, saved songs, custom playlists, saved collections — all persisted locally
- **Player** — mini player bar, full-screen player with scrubber, shuffle/repeat, up-next queue, YouTube link
- **YouTube Auth** — optional Google OAuth to import your actual YouTube liked songs and playlists

## Tech Stack

- React 18 + TypeScript
- Vite
- Tailwind CSS
- Zustand (state + localStorage persistence)
- YouTube Data API v3
- YouTube IFrame Player API

## Notes

- Playback uses the YouTube IFrame API; audio quality and availability depend on YouTube.
- Without an API key the app runs in guest mode: search and trending won't work, but the player, history, and local library still function if you paste a YouTube video ID directly.
- Add your domain to the allowed referrers list in Google Cloud Console when deploying to production.

## GitHub Pages

The deploy workflow reads these GitHub repository secrets during the build:

- `VITE_YOUTUBE_API_KEY`
- `VITE_GOOGLE_CLIENT_ID`

Do not commit `.env` or `.env.local`. For GitHub Pages, restrict the YouTube API key in Google Cloud Console to your Pages origin, such as `https://tools-source.github.io/*`, and add the exact Pages origin to the Google OAuth client's authorized JavaScript origins.
