import { useState } from 'react'

interface Props {
  url: string | null
  alt?: string
  size?: number
  radius?: number
  className?: string
}

const PLACEHOLDER =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 1 1'%3E%3Crect fill='%23161620'/%3E%3Cpath d='M.35.28h.3v.14h-.06v.22a.1.1 0 0 1-.03.07.1.1 0 0 1-.07.03.1.1 0 0 1-.07-.03.1.1 0 0 1-.03-.07.1.1 0 0 1 .03-.07.1.1 0 0 1 .05-.02V.42h-.12V.28z' fill='%23333'/%3E%3C/svg%3E"

export default function ArtworkImage({ url, alt = '', className = '' }: Props) {
  const [src, setSrc] = useState(url ?? PLACEHOLDER)

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setSrc(PLACEHOLDER)}
      draggable={false}
      className={`object-cover bg-[#161620] ${className}`}
    />
  )
}
