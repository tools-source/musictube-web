interface Props {
  label: string
  selected: boolean
  onClick: () => void
}

export default function FilterChip({ label, selected, onClick }: Props) {
  return (
    <button
      onClick={onClick}
      className={`shrink-0 px-4 py-1.5 rounded-full text-sm font-semibold transition-all ${
        selected
          ? 'bg-text-primary text-black'
          : 'bg-control-strong text-text-primary hover:bg-control'
      }`}
    >
      {label}
    </button>
  )
}
