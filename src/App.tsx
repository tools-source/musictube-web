import { useState, useEffect } from 'react'
import { useStore } from './store'
import HomeView from './views/HomeView'
import SearchView from './views/SearchView'
import LibraryView from './views/LibraryView'
import MiniPlayer from './components/MiniPlayer'
import FullPlayer from './components/FullPlayer'
import YouTubePlayer from './components/YouTubePlayer'

const NAV_ITEMS = [
  {
    id: 'home' as const,
    label: 'Home',
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    id: 'search' as const,
    label: 'Search',
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth={active ? 2.5 : 2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 1 1 5 11a6 6 0 0 1 12 0z" />
      </svg>
    ),
  },
  {
    id: 'library' as const,
    label: 'Library',
    icon: (active: boolean) => (
      <svg className="w-6 h-6" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth={active ? 0 : 2} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01" />
      </svg>
    ),
  },
]

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function App() {
  const activeTab = useStore(s => s.activeTab)
  const setActiveTab = useStore(s => s.setActiveTab)
  const nowPlaying = useStore(s => s.nowPlaying)
  const [installPrompt, setInstallPrompt] = useState<BeforeInstallPromptEvent | null>(null)
  const [installDismissed, setInstallDismissed] = useState(false)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallPrompt(e as BeforeInstallPromptEvent)
    }
    window.addEventListener('beforeinstallprompt', handler)
    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [])

  const handleInstall = async () => {
    if (!installPrompt) return
    await installPrompt.prompt()
    const { outcome } = await installPrompt.userChoice
    if (outcome === 'accepted') setInstallPrompt(null)
    else setInstallDismissed(true)
  }

  const showInstallBanner = !!installPrompt && !installDismissed

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* PWA install banner — shown on desktop Chrome/Edge/Android when installable */}
      {showInstallBanner && (
        <div className="flex items-center gap-3 px-4 py-3 bg-accent/20 border-b border-accent/30 shrink-0">
          <svg className="w-5 h-5 text-accent shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M19 9h-4V3H9v6H5l7 7 7-7zm-8 2V5h2v6h1.17L12 13.17 9.83 11H11zm-6 7h14v2H5v-2z" />
          </svg>
          <p className="flex-1 text-sm text-text-primary">Add MusicTube to your home screen for the best experience.</p>
          <button
            onClick={handleInstall}
            className="px-3 py-1.5 rounded-full bg-accent text-white text-xs font-semibold shrink-0"
          >
            Install
          </button>
          <button
            onClick={() => setInstallDismissed(true)}
            className="text-text-tertiary shrink-0"
            aria-label="Dismiss"
          >
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 24 24">
              <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12z" />
            </svg>
          </button>
        </div>
      )}

      {/* Main scrollable content */}
      <main
        className="flex-1 overflow-y-auto scrollbar-hide"
        style={{ paddingBottom: nowPlaying ? '136px' : '72px' }}
      >
        {activeTab === 'home' && <HomeView />}
        {activeTab === 'search' && <SearchView />}
        {activeTab === 'library' && <LibraryView />}
      </main>

      {/* Mini player */}
      <MiniPlayer />

      {/* Full-screen player */}
      <FullPlayer />

      {/* Hidden YouTube player */}
      <YouTubePlayer />

      {/* Tab bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-50 flex items-center justify-around bg-black/60 backdrop-blur-xl border-t border-white/[0.07]"
        style={{ height: '64px', paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        {NAV_ITEMS.map(item => {
          const isActive = activeTab === item.id
          return (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`flex flex-col items-center gap-1 px-6 py-1 transition-colors ${
                isActive ? 'text-text-primary' : 'text-text-tertiary'
              }`}
            >
              {item.icon(isActive)}
              <span className={`text-[10px] font-medium ${isActive ? 'text-text-primary' : 'text-text-tertiary'}`}>
                {item.label}
              </span>
            </button>
          )
        })}
      </nav>
    </div>
  )
}
