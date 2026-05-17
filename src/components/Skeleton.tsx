export function SkeletonCard({ className = '' }: { className?: string }) {
  return <div className={`rounded-2xl bg-control animate-pulse ${className}`} />
}

export function SkeletonTrackRow() {
  return (
    <div className="flex items-center gap-3 py-2">
      <SkeletonCard className="w-13 h-13 rounded-xl" />
      <div className="flex-1 space-y-2">
        <SkeletonCard className="h-3 w-3/4 rounded" />
        <SkeletonCard className="h-2.5 w-1/3 rounded" />
      </div>
    </div>
  )
}

export function SkeletonContinueCard() {
  return (
    <div className="flex flex-col gap-2 w-40 shrink-0">
      <SkeletonCard className="w-40 h-40 rounded-2xl" />
      <SkeletonCard className="h-3 w-4/5 rounded" />
      <SkeletonCard className="h-2.5 w-1/2 rounded" />
    </div>
  )
}
