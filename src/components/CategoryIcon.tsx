import type { MapCategory } from '../../types.ts'

type Props = {
  category: MapCategory
  className?: string
}

export function CategoryIcon({ category, className = 'h-4 w-4' }: Props) {
  const common = {
    className,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 1.8,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
    'aria-hidden': true,
  }

  if (category === 'shop') {
    return (
      <svg {...common}>
        <path d="M6 8h12l1 12H5L6 8Zm3 0V6a3 3 0 0 1 6 0v2" />
      </svg>
    )
  }

  if (category === 'vehicle') {
    return (
      <svg {...common}>
        <path d="M5 16h14l-1.5-6h-11L5 16Zm0 0v3m14-3v3M7.5 13h.01M16.5 13h.01" />
      </svg>
    )
  }

  if (category === 'transport') {
    return (
      <svg {...common}>
        <path d="M7 4h10v11H7V4Zm0 11-2 4m14-4 2 4M8.5 8h7" />
      </svg>
    )
  }

  if (category === 'leisure') {
    return (
      <svg {...common}>
        <path d="M12 3 7 11h3l-4 6h12l-4-6h3L12 3Zm0 17v-4" />
      </svg>
    )
  }

  if (category === 'mission') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="7" />
        <circle cx="12" cy="12" r="2" />
        <path d="M12 2v3m0 14v3M2 12h3m14 0h3" />
      </svg>
    )
  }

  if (category === 'collectible') {
    return (
      <svg {...common}>
        <path d="m12 3 2.6 5.6 6.1.8-4.5 4.2 1.2 6L12 16.8l-5.4 2.8 1.2-6L3.3 9.4l6.1-.8L12 3Z" />
      </svg>
    )
  }

  return (
    <svg {...common}>
      <path d="M4 20h16M6 20V8l6-4 6 4v12M9.5 11h.01M14.5 11h.01M9.5 15h.01M14.5 15h.01" />
    </svg>
  )
}
