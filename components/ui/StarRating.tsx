'use client'

import { useState } from 'react'

interface StarRatingProps {
  value: number
  onChange?: (value: number) => void
  readonly?: boolean
  size?: 'sm' | 'md' | 'lg'
}

export default function StarRating({ value, onChange, readonly = false, size = 'md' }: StarRatingProps) {
  const [hover, setHover] = useState(0)

  const sizeMap = {
    sm: '16px',
    md: '20px',
    lg: '28px'
  }

  const fontSize = sizeMap[size]

  return (
    <div style={{ display: 'flex', gap: '2px' }}>
      {[1, 2, 3, 4, 5].map((star) => {
        const isFilled = star <= (hover || value)
        return (
          <span
            key={star}
            onClick={() => !readonly && onChange?.(star)}
            onMouseEnter={() => !readonly && setHover(star)}
            onMouseLeave={() => !readonly && setHover(0)}
            style={{
              fontSize,
              cursor: readonly ? 'default' : 'pointer',
              color: isFilled ? '#fbbf24' : '#3f3f46',
              transition: 'all 0.15s ease',
              transform: isFilled && !readonly ? 'scale(1.1)' : 'scale(1)',
            }}
          >
            ★
          </span>
        )
      })}
    </div>
  )
}

interface RatingDisplayProps {
  rating: number
  count?: number
  size?: 'sm' | 'md' | 'lg'
  showCount?: boolean
}

export function RatingDisplay({ rating, count, size = 'md', showCount = true }: RatingDisplayProps) {
  const sizeMap = {
    sm: '12px',
    md: '14px',
    lg: '18px'
  }

  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
      <span style={{ fontSize: sizeMap[size], color: '#fbbf24' }}>
        {'★'.repeat(Math.round(rating))}
        <span style={{ color: '#3f3f46' }}>
          {'☆'.repeat(5 - Math.round(rating))}
        </span>
      </span>
      {showCount && (
        <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
          {rating.toFixed(1)} {count ? `(${count})` : ''}
        </span>
      )}
    </div>
  )
}
