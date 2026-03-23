'use client'

import { useRef, useState } from 'react'
import Link from 'next/link'

interface Book {
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
  progress?: number
  description?: string
}

interface Book3DCarouselProps {
  books: Book[]
  title?: string
  subtitle?: string
  accentColor?: string
  seeAllHref?: string
}

export default function Book3DCarousel({
  books,
  title,
  subtitle,
  accentColor = '#a855f7',
  seeAllHref
}: Book3DCarouselProps) {
  const scrollRef = useRef<HTMLDivElement>(null)
  const [activeBook, setActiveBook] = useState<number | null>(null)
  const [isDragging, setIsDragging] = useState(false)

  const scroll = (direction: 'left' | 'right') => {
    if (scrollRef.current) {
      const scrollAmount = 240
      scrollRef.current.scrollBy({
        left: direction === 'left' ? -scrollAmount : scrollAmount,
        behavior: 'smooth'
      })
    }
  }

  return (
    <div style={{ marginBottom: '48px' }}>
      {/* Section Header */}
      {title && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: '24px',
          padding: '0 4px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '5px',
              height: '36px',
              borderRadius: '3px',
              background: `linear-gradient(to bottom, ${accentColor}, ${accentColor}80)`
            }} />
            <div>
              <h2 style={{ 
                fontSize: '24px', 
                fontWeight: 800, 
                color: '#fff',
                letterSpacing: '-0.5px',
                margin: 0,
                padding: 0
              }}>
                {title}
              </h2>
              {subtitle && (
                <p style={{ 
                  fontSize: '13px', 
                  color: 'rgba(255,255,255,0.5)',
                  margin: '2px 0 0 0'
                }}>
                  {subtitle}
                </p>
              )}
            </div>
          </div>
          
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => scroll('left')}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              }}
            >
              ‹
            </button>
            <button
              onClick={() => scroll('right')}
              style={{
                width: '36px',
                height: '36px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                color: '#fff',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '16px',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.1)'
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
              }}
            >
              ›
            </button>
            {seeAllHref && (
              <Link 
                href={seeAllHref}
                style={{
                  padding: '8px 16px',
                  borderRadius: '8px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: 'rgba(255,255,255,0.7)',
                  fontSize: '12px',
                  fontWeight: 600,
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center'
                }}
              >
                View all →
              </Link>
            )}
          </div>
        </div>
      )}

      {/* Book Shelf */}
      <div 
        style={{ 
          position: 'relative',
          paddingBottom: '20px'
        }}
      >
        {/* Shelf line */}
        <div style={{
          position: 'absolute',
          bottom: 0,
          left: 0,
          right: 0,
          height: '8px',
          background: 'linear-gradient(to top, rgba(255,255,255,0.1), transparent)',
          borderRadius: '0 0 4px 4px'
        }} />
        
        {/* Books Container */}
        <div 
          ref={scrollRef}
          style={{
            display: 'flex',
            gap: '20px',
            overflowX: 'auto',
            padding: '20px 4px',
            scrollSnapType: 'x mandatory',
            scrollBehavior: 'smooth',
            cursor: isDragging ? 'grabbing' : 'grab',
          }}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
        >
          {books.map((book, idx) => (
            <BookCard
              key={book.id}
              book={book}
              isActive={activeBook === book.id}
              onHover={() => setActiveBook(book.id)}
              onLeave={() => setActiveBook(null)}
              isFirst={idx === 0}
            />
          ))}
        </div>
      </div>

      {/* Custom Scrollbar */}
      <style jsx global>{`
        .book-carousel::-webkit-scrollbar {
          height: 4px;
        }
        .book-carousel::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.05);
          border-radius: 2px;
        }
        .book-carousel::-webkit-scrollbar-thumb {
          background: ${accentColor}50;
          border-radius: 2px;
        }
      `}</style>
    </div>
  )
}

interface BookCardProps {
  book: Book
  isActive: boolean
  onHover: () => void
  onLeave: () => void
  isFirst?: boolean
}

function BookCard({ book, isActive, onHover, onLeave, isFirst }: BookCardProps) {
  const [isFlipped, setIsFlipped] = useState(false)

  const cardStyle: React.CSSProperties = {
    flexShrink: 0,
    width: '160px',
    height: '220px',
    perspective: '1000px',
    scrollSnapAlign: 'start',
    transform: isActive 
      ? 'translateY(-12px) scale(1.05)' 
      : isFirst 
        ? 'translateY(0)' 
        : 'translateY(0)',
    transition: 'transform 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
    transformStyle: 'preserve-3d',
  }

  const innerStyle: React.CSSProperties = {
    position: 'relative',
    width: '100%',
    height: '100%',
    transformStyle: 'preserve-3d',
    transition: 'transform 0.6s cubic-bezier(0.4, 0, 0.2, 1)',
    transform: isFlipped ? 'rotateY(180deg)' : 'rotateY(0deg)',
    cursor: 'pointer',
  }

  const faceStyle: React.CSSProperties = {
    position: 'absolute',
    width: '100%',
    height: '100%',
    backfaceVisibility: 'hidden',
    WebkitBackfaceVisibility: 'hidden',
    borderRadius: '12px',
    overflow: 'hidden',
    boxShadow: isActive 
      ? '0 20px 40px rgba(0,0,0,0.5), 0 0 20px rgba(168,85,247,0.3)' 
      : '0 8px 24px rgba(0,0,0,0.3)',
  }

  const frontStyle: React.CSSProperties = {
    ...faceStyle,
    background: book.cover_url 
      ? `url(${book.cover_url}) center/cover` 
      : `linear-gradient(135deg, hsl(${(book.id * 37) % 360}, 60%, 25%), hsl(${(book.id * 37 + 40) % 360}, 50%, 15%))`,
  }

  const backStyle: React.CSSProperties = {
    ...faceStyle,
    transform: 'rotateY(180deg)',
    background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
    padding: '14px',
    display: 'flex',
    flexDirection: 'column',
  }

  return (
    <div 
      style={cardStyle}
      onMouseEnter={onHover}
      onMouseLeave={onLeave}
    >
      <div 
        style={innerStyle}
        onClick={() => setIsFlipped(!isFlipped)}
      >
        {/* Front Cover */}
        <div style={frontStyle}>
          {/* Book spine */}
          <div style={{
            position: 'absolute',
            left: 0,
            top: 0,
            bottom: 0,
            width: '6px',
            background: 'linear-gradient(to right, rgba(0,0,0,0.4), transparent)',
          }} />
          
          {/* Featured badge */}
          {book.is_featured === 1 && (
            <div style={{
              position: 'absolute',
              top: '8px',
              left: '8px',
              padding: '3px 8px',
              borderRadius: '4px',
              background: 'linear-gradient(135deg, #f97316, #ef4444)',
              fontSize: '8px',
              fontWeight: 800,
              color: '#fff',
            }}>
              ✦
            </div>
          )}
          
          {/* Hover hint */}
          <div style={{
            position: 'absolute',
            bottom: '6px',
            right: '6px',
            padding: '3px 6px',
            borderRadius: '4px',
            background: 'rgba(0,0,0,0.7)',
            fontSize: '9px',
            color: 'rgba(255,255,255,0.8)',
            opacity: isActive ? 1 : 0,
            transition: 'opacity 0.2s ease',
          }}>
            flip ↻
          </div>

          {/* Progress */}
          {book.progress && book.progress > 0 && (
            <div style={{
              position: 'absolute',
              bottom: 0,
              left: 0,
              right: 0,
              height: '3px',
              background: 'rgba(0,0,0,0.5)',
            }}>
              <div style={{
                height: '100%',
                width: `${book.progress}%`,
                background: 'linear-gradient(90deg, #a855f7, #ec4899)',
              }} />
            </div>
          )}

          {/* Placeholder */}
          {!book.cover_url && (
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              fontSize: '40px',
              opacity: 0.3,
            }}>
              📖
            </div>
          )}
        </div>

        {/* Back Cover */}
        <div style={backStyle}>
          <h4 style={{
            fontSize: '13px',
            fontWeight: 700,
            color: '#fff',
            marginBottom: '4px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 2,
            WebkitBoxOrient: 'vertical',
            lineHeight: 1.3,
          }}>
            {book.title}
          </h4>
          
          <p style={{
            fontSize: '10px',
            color: '#a855f7',
            marginBottom: '8px',
          }}>
            {book.author_name}
          </p>

          {book.avg_rating && book.avg_rating > 0 && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginBottom: '6px' }}>
              <span style={{ color: '#fbbf24', fontSize: '11px' }}>
                {'★'.repeat(Math.round(book.avg_rating))}
              </span>
            </div>
          )}

          <p style={{
            fontSize: '10px',
            color: 'rgba(255,255,255,0.5)',
            lineHeight: 1.4,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            display: '-webkit-box',
            WebkitLineClamp: 3,
            WebkitBoxOrient: 'vertical',
            flex: 1,
          }}>
            {book.description || 'Discover this amazing story and dive into a world of imagination.'}
          </p>

          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            marginTop: 'auto',
            paddingTop: '8px',
            borderTop: '1px solid rgba(255,255,255,0.1)'
          }}>
            <span style={{
              fontSize: '14px',
              fontWeight: 700,
              color: book.is_free ? '#34d399' : '#a855f7',
            }}>
              {book.is_free ? 'Free' : `$${parseFloat(String(book.price || 0)).toFixed(2)}`}
            </span>
            <Link 
              href={`/reader/read/${book.id}`}
              onClick={(e) => e.stopPropagation()}
              style={{
                padding: '4px 10px',
                borderRadius: '6px',
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                fontSize: '10px',
                fontWeight: 600,
                color: '#fff',
                textDecoration: 'none',
              }}
            >
              Read →
            </Link>
          </div>

          <p style={{
            fontSize: '8px',
            color: 'rgba(255,255,255,0.3)',
            textAlign: 'center',
            marginTop: '6px',
          }}>
            click to flip back
          </p>
        </div>
      </div>
    </div>
  )
}
