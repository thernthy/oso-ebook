'use client'

import { useState, useRef } from 'react'
import Link from 'next/link'

interface Book3DCardProps {
  id: number
  title: string
  cover_url?: string | null
  author_name?: string
  category?: string
  price?: number
  is_free?: number
  is_featured?: number
  avg_rating?: number
  review_count?: number
  total_reads?: number
  progress?: number
  description?: string
  showBack?: boolean
  onFlip?: (isFlipped: boolean) => void
  href?: string
  compact?: boolean
}

export default function Book3DCard({
  id,
  title,
  cover_url,
  author_name = 'Unknown Author',
  category,
  price = 0,
  is_free = 0,
  is_featured = 0,
  avg_rating = 0,
  review_count = 0,
  total_reads = 0,
  progress = 0,
  description,
  showBack = true,
  onFlip,
  href,
  compact = false
}: Book3DCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)

  const handleFlip = () => {
    if (showBack) {
      const newState = !isFlipped
      setIsFlipped(newState)
      onFlip?.(newState)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault()
      handleFlip()
    }
  }

  const frontContent = (
    <div style={{
      position: 'absolute',
      width: '100%',
      height: '100%',
      backfaceVisibility: 'hidden',
      WebkitBackfaceVisibility: 'hidden',
      transformStyle: 'preserve-3d',
      borderRadius: compact ? '12px' : '16px',
      overflow: 'hidden',
      background: cover_url 
        ? `url(${cover_url}) center/cover` 
        : `linear-gradient(135deg, hsl(${id * 45 % 360}, 60%, 25%), hsl(${(id * 45 + 40) % 360}, 50%, 15%))`,
      boxShadow: '0 10px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(255,255,255,0.1)',
    }}>
      {/* Spine effect */}
      <div style={{
        position: 'absolute',
        left: 0,
        top: 0,
        bottom: 0,
        width: '8px',
        background: 'linear-gradient(to right, rgba(0,0,0,0.4), transparent)',
        borderRadius: '12px 0 0 12px',
      }} />
      
      {/* Page edges */}
      <div style={{
        position: 'absolute',
        right: 0,
        top: '5%',
        bottom: '5%',
        width: '3px',
        background: 'repeating-linear-gradient(to bottom, rgba(255,255,255,0.1) 0px, rgba(255,255,255,0.1) 1px, transparent 1px, transparent 3px)',
        opacity: 0.5,
      }} />

      {/* Featured badge */}
      {is_featured === 1 && (
        <div style={{
          position: 'absolute',
          top: '12px',
          left: '12px',
          padding: '4px 10px',
          borderRadius: '6px',
          background: 'linear-gradient(135deg, #f97316, #ef4444)',
          fontSize: '9px',
          fontWeight: 800,
          color: '#fff',
          letterSpacing: '0.5px',
          boxShadow: '0 2px 8px rgba(249,115,22,0.4)',
        }}>
          ✦ FEATURED
        </div>
      )}

      {/* Hover flip hint */}
      {showBack && (
        <div style={{
          position: 'absolute',
          bottom: '8px',
          right: '8px',
          padding: '4px 8px',
          borderRadius: '4px',
          background: 'rgba(0,0,0,0.6)',
          backdropFilter: 'blur(4px)',
          fontSize: '10px',
          color: 'rgba(255,255,255,0.7)',
          display: 'flex',
          alignItems: 'center',
          gap: '4px',
          opacity: isHovered ? 1 : 0,
          transition: 'opacity 0.2s ease',
        }}>
          <span>👆</span>
          <span>flip</span>
        </div>
      )}

      {/* Book icon if no cover */}
      {!cover_url && (
        <div style={{
          position: 'absolute',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          fontSize: compact ? '48px' : '64px',
          opacity: 0.3,
        }}>
          📖
        </div>
      )}

      {/* Progress bar */}
      {progress > 0 && (
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '4px',
          background: 'rgba(0,0,0,0.5)',
        }}>
          <div style={{
            height: '100%',
            width: `${progress}%`,
            background: 'linear-gradient(90deg, #a855f7, #ec4899)',
            transition: 'width 0.3s ease',
          }} />
        </div>
      )}
    </div>
  )

  const backContent = (
    <div style={{
      position: 'absolute',
      width: '100%',
      height: '100%',
      backfaceVisibility: 'hidden',
      WebkitBackfaceVisibility: 'hidden',
      transform: 'rotateY(180deg)',
      transformStyle: 'preserve-3d',
      borderRadius: compact ? '12px' : '16px',
      background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
      padding: compact ? '14px' : '20px',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: '0 10px 40px rgba(0,0,0,0.4), 0 0 0 1px rgba(168,85,247,0.2)',
      overflow: 'hidden',
    }}>
      {/* Back spine */}
      <div style={{
        position: 'absolute',
        right: 0,
        top: 0,
        bottom: 0,
        width: '8px',
        background: 'linear-gradient(to left, rgba(168,85,247,0.3), transparent)',
        borderRadius: '0 12px 12px 0',
      }} />

      {/* Title */}
      <h3 style={{
        fontSize: compact ? '13px' : '16px',
        fontWeight: 700,
        color: '#fff',
        marginBottom: compact ? '4px' : '8px',
        overflow: 'hidden',
        textOverflow: 'ellipsis',
        display: '-webkit-box',
        WebkitLineClamp: 2,
        WebkitBoxOrient: 'vertical',
        lineHeight: 1.3,
      }}>
        {title}
      </h3>

      {/* Author */}
      <p style={{
        fontSize: compact ? '10px' : '12px',
        color: '#a855f7',
        marginBottom: compact ? '6px' : '10px',
      }}>
        by {author_name}
      </p>

      {/* Description or category */}
      {description ? (
        <p style={{
          fontSize: compact ? '10px' : '11px',
          color: 'rgba(255,255,255,0.6)',
          lineHeight: 1.5,
          marginBottom: compact ? '6px' : '10px',
          overflow: 'hidden',
          textOverflow: 'ellipsis',
          display: '-webkit-box',
          WebkitLineClamp: compact ? 2 : 3,
          WebkitBoxOrient: 'vertical',
          flex: 1,
        }}>
          {description}
        </p>
      ) : category ? (
        <span style={{
          display: 'inline-block',
          padding: compact ? '2px 8px' : '4px 10px',
          borderRadius: '12px',
          background: 'rgba(168,85,247,0.2)',
          border: '1px solid rgba(168,85,247,0.3)',
          color: '#a855f7',
          fontSize: compact ? '9px' : '10px',
          fontWeight: 600,
          marginBottom: compact ? '6px' : '10px',
          width: 'fit-content',
        }}>
          {category}
        </span>
      ) : null}

      {/* Rating */}
      {avg_rating > 0 && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: compact ? '4px' : '8px' }}>
          <span style={{ color: '#fbbf24', fontSize: compact ? '11px' : '13px' }}>
            {'★'.repeat(Math.round(avg_rating))}
            <span style={{ color: 'rgba(255,255,255,0.2)' }}>
              {'☆'.repeat(5 - Math.round(avg_rating))}
            </span>
          </span>
          <span style={{ fontSize: compact ? '9px' : '11px', color: 'rgba(255,255,255,0.5)' }}>
            ({review_count})
          </span>
        </div>
      )}

      {/* Stats */}
      {total_reads > 0 && (
        <p style={{ fontSize: compact ? '9px' : '10px', color: 'rgba(255,255,255,0.4)', marginBottom: 'auto' }}>
          {total_reads.toLocaleString()} reads
        </p>
      )}

      {/* Price & CTA */}
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        marginTop: 'auto',
        paddingTop: compact ? '6px' : '10px',
        borderTop: '1px solid rgba(255,255,255,0.1)',
      }}>
        <span style={{
          fontSize: compact ? '13px' : '16px',
          fontWeight: 700,
          color: is_free ? '#34d399' : '#a855f7',
        }}>
          {is_free ? 'Free' : `$${parseFloat(String(price)).toFixed(2)}`}
        </span>
        <span style={{
          padding: compact ? '4px 10px' : '6px 14px',
          borderRadius: '6px',
          background: 'linear-gradient(135deg, #a855f7, #6366f1)',
          fontSize: compact ? '10px' : '12px',
          fontWeight: 600,
          color: '#fff',
        }}>
          Read →
        </span>
      </div>

      {/* Flip back hint */}
      <div style={{
        position: 'absolute',
        bottom: '4px',
        left: '50%',
        transform: 'translateX(-50%)',
        fontSize: '9px',
        color: 'rgba(255,255,255,0.3)',
        display: 'flex',
        alignItems: 'center',
        gap: '2px',
      }}>
        click to flip
      </div>
    </div>
  )

  const cardContent = (
    <div
      ref={cardRef}
      onClick={handleFlip}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      tabIndex={0}
      role="button"
      aria-label={`${title} by ${author_name}. ${showBack ? 'Click to flip' : ''}`}
      style={{
        width: compact ? '140px' : '200px',
        height: compact ? '196px' : '280px',
        perspective: '1000px',
        cursor: showBack ? 'pointer' : 'default',
        outline: 'none',
      }}
    >
      <div style={{
        position: 'relative',
        width: '100%',
        height: '100%',
        transformStyle: 'preserve-3d',
        transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
        transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
        ...(isHovered && !isFlipped ? {
          transform: showBack ? 'rotateY(15deg) scale(1.02)' : 'scale(1.02)',
        } : {}),
      }}>
        {frontContent}
        {showBack && backContent}
      </div>
    </div>
  )

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', display: 'inline-block' }}>
        {cardContent}
      </Link>
    )
  }

  return cardContent
}
