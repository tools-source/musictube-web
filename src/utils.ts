export function formatDuration(seconds: number | null): string | null {
  if (seconds === null || seconds <= 0) return null
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = Math.floor(seconds % 60)
  if (h > 0) return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  return `${m}:${String(s).padStart(2, '0')}`
}

export function formatViewCount(n: number | null): string | null {
  if (!n || n <= 0) return null
  if (n >= 1_000_000_000) return `${(n / 1_000_000_000).toFixed(n >= 10_000_000_000 ? 0 : 1).replace(/\.0$/, '')}B views`
  if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(n >= 10_000_000 ? 0 : 1).replace(/\.0$/, '')}M views`
  if (n >= 1_000) return `${(n / 1_000).toFixed(n >= 10_000 ? 0 : 1).replace(/\.0$/, '')}K views`
  return `${n} views`
}

export function parseDuration(iso: string): number {
  const match = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/)
  if (!match) return 0
  return (parseInt(match[1] ?? '0') * 3600) + (parseInt(match[2] ?? '0') * 60) + parseInt(match[3] ?? '0')
}

export function greeting(): string {
  const h = new Date().getHours()
  if (h >= 5 && h < 12) return 'Good morning,'
  if (h >= 12 && h < 17) return 'Good afternoon,'
  if (h >= 17 && h < 21) return 'Good evening,'
  return 'Good night,'
}

export function initials(name: string): string {
  return name.split(' ').filter(Boolean).slice(0, 2).map(p => p[0]).join('').toUpperCase()
}

export function isArabic(title: string, artist: string): boolean {
  const text = `${title} ${artist}`
  return [...text].some(ch => {
    const code = ch.codePointAt(0) ?? 0
    return (code >= 0x0600 && code <= 0x06FF) || (code >= 0x0750 && code <= 0x077F)
  })
}

export function isWorship(title: string, artist: string): boolean {
  const text = `${title} ${artist}`.toLowerCase()
  return ['worship', 'praise', 'jesus', 'god', 'holy', 'awakening', 'hillsong', 'bethel', 'elevation'].some(k => text.includes(k))
}

export function debounce<T extends unknown[]>(fn: (...args: T) => void, delay: number) {
  let timer: ReturnType<typeof setTimeout>
  return (...args: T) => {
    clearTimeout(timer)
    timer = setTimeout(() => fn(...args), delay)
  }
}
