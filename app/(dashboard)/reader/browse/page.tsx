'use client'
import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import PurchaseButton from '@/components/reader/PurchaseButton'

type Book = {
  id: number
  title: string
  description: string
  cover_url: string | null
  price: number
  is_free: number
  is_featured: number
  category: string
  total_reads: number
  author_name: string
  chapter_count: number
  avg_rating: number
  review_count: number
  is_owned: number
}

type Category = {
  category: string
  count: number
}

export default function BrowsePage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [books, setBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [totalBooks, setTotalBooks] = useState(0)

  const category = searchParams.get('category') || ''
  const sort = searchParams.get('sort') || 'newest'
  const free = searchParams.get('free') || ''
  const search = searchParams.get('search') || ''

  const fetchData = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category) params.set('category', category)
      if (sort) params.set('sort', sort)
      if (free) params.set('free', '1')
      if (search) params.set('search', search)
      params.set('limit', '24')
      params.set('offset', '0')

      const res = await fetch(`/api/catalog?${params.toString()}`)
      if (res.ok) {
        const data = await res.json()
        setBooks(data.books || [])
        setTotalBooks(data.total || 0)
        setCategories(data.categories || [])
      }
    } catch (e) {
      console.error('Failed to fetch books', e)
    } finally {
      setLoading(false)
    }
  }, [category, sort, free, search])

  useEffect(() => {
    fetchData()
  }, [fetchData])

  const updateParams = (key: string, value: string) => {
    const params = new URLSearchParams(searchParams.toString())
    if (value) {
      params.set(key, value)
    } else {
      params.delete(key)
    }
    router.push(`/reader/browse?${params.toString()}`)
  }

  const sortOptions = [
    { value: 'newest', label: '🔥 Newest' },
    { value: 'popular', label: '⭐ Popular' },
    { value: 'price_asc', label: '💰 Price: Low' },
    { value: 'price_desc', label: '💸 Price: High' },
  ]

  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: '#09090b' }}>
      {/* Header */}
      <div style={{
        background: 'linear-gradient(135deg, #18181b 0%, #09090b 100%)',
        borderBottom: '1px solid rgba(255,255,255,0.05)',
        padding: '32px 40px'
      }}>
        <h1 style={{
          fontSize: '32px',
          fontWeight: 800,
          color: '#ffffff',
          marginBottom: '8px',
          letterSpacing: '-0.5px'
        }}>
          Browse Books
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
          Discover {totalBooks} amazing reads
        </p>
      </div>

      {/* Search & Filters */}
      <div style={{ padding: '24px 40px', borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
        {/* Search Bar */}
        <form style={{ marginBottom: '20px' }} onSubmit={(e) => {
          e.preventDefault()
          const formData = new FormData(e.currentTarget)
          updateParams('search', formData.get('search') as string)
        }}>
          <div style={{ position: 'relative', maxWidth: '400px' }}>
            <input
              name="search"
              defaultValue={search}
              placeholder="Search by title or author..."
              style={{
                width: '100%',
                padding: '14px 20px 14px 48px',
                background: 'rgba(255,255,255,0.05)',
                border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px',
                fontSize: '14px',
                color: '#ffffff',
                outline: 'none',
                transition: 'all 0.2s ease'
              }}
            />
            <span style={{
              position: 'absolute',
              left: '16px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'rgba(255,255,255,0.4)',
              fontSize: '16px'
            }}>
              🔍
            </span>
          </div>
        </form>

        {/* Category Pills */}
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
          <button
            onClick={() => updateParams('category', '')}
            style={{
              padding: '8px 18px',
              borderRadius: '20px',
              background: !category && !free ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : 'rgba(255,255,255,0.05)',
              border: '1px solid ' + (!category && !free ? 'transparent' : 'rgba(255,255,255,0.1)'),
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            All
          </button>
          <button
            onClick={() => {
              updateParams('free', free === '1' ? '' : '1')
              updateParams('category', '')
            }}
            style={{
              padding: '8px 18px',
              borderRadius: '20px',
              background: free === '1' ? 'linear-gradient(135deg, #10b981, #34d399)' : 'rgba(255,255,255,0.05)',
              border: '1px solid ' + (free === '1' ? 'transparent' : 'rgba(255,255,255,0.1)'),
              color: '#ffffff',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              transition: 'all 0.2s ease'
            }}
          >
            ✨ Free
          </button>
          {categories.map((cat) => (
            <button
              key={cat.category}
              onClick={() => updateParams('category', category === cat.category ? '' : cat.category)}
              style={{
                padding: '8px 18px',
                borderRadius: '20px',
                background: category === cat.category ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : 'rgba(255,255,255,0.05)',
                border: '1px solid ' + (category === cat.category ? 'transparent' : 'rgba(255,255,255,0.1)'),
                color: '#ffffff',
                fontSize: '13px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {cat.category} <span style={{ opacity: 0.6, marginLeft: '4px' }}>({cat.count})</span>
            </button>
          ))}
        </div>

        {/* Sort Options */}
        <div style={{ display: 'flex', gap: '8px' }}>
          {sortOptions.map((opt) => (
            <button
              key={opt.value}
              onClick={() => updateParams('sort', opt.value)}
              style={{
                padding: '8px 16px',
                borderRadius: '10px',
                background: sort === opt.value ? 'rgba(124,58,237,0.2)' : 'rgba(255,255,255,0.03)',
                border: '1px solid ' + (sort === opt.value ? 'rgba(124,58,237,0.4)' : 'rgba(255,255,255,0.08)'),
                color: sort === opt.value ? '#a78bfa' : 'rgba(255,255,255,0.6)',
                fontSize: '12px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      {/* Books Grid */}
      <div style={{ padding: '32px 40px' }}>
        {loading ? (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '24px'
          }}>
            {[...Array(12)].map((_, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.05)',
                borderRadius: '16px',
                overflow: 'hidden'
              }}>
                <div style={{
                  height: '280px',
                  background: 'linear-gradient(135deg, rgba(255,255,255,0.03), rgba(255,255,255,0.01))',
                  animation: 'pulse 1.5s ease-in-out infinite'
                }} />
                <div style={{ padding: '16px' }}>
                  <div style={{
                    height: '20px',
                    background: 'rgba(255,255,255,0.05)',
                    borderRadius: '4px',
                    marginBottom: '8px',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }} />
                  <div style={{
                    height: '14px',
                    width: '60%',
                    background: 'rgba(255,255,255,0.03)',
                    borderRadius: '4px',
                    animation: 'pulse 1.5s ease-in-out infinite'
                  }} />
                </div>
              </div>
            ))}
          </div>
        ) : books.length === 0 ? (
          <div style={{
            textAlign: 'center',
            padding: '80px 20px',
            color: 'rgba(255,255,255,0.5)'
          }}>
            <div style={{ fontSize: '64px', marginBottom: '16px' }}>📭</div>
            <div style={{ fontSize: '18px', fontWeight: 600, color: '#ffffff', marginBottom: '8px' }}>
              No books found
            </div>
            <p style={{ fontSize: '14px' }}>
              Try adjusting your search or filters
            </p>
          </div>
        ) : (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: '24px'
          }}>
            {books.map((book, idx) => (
              <Link
                key={book.id}
                href={`/reader/books/${book.id}`}
                style={{
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px',
                  overflow: 'hidden',
                  textDecoration: 'none',
                  transition: 'all 0.3s ease',
                  display: 'block',
                  position: 'relative'
                }}
              >
                {/* Badges */}
                <div style={{ position: 'absolute', top: '12px', left: '12px', right: '12px', display: 'flex', justifyContent: 'space-between', zIndex: 2 }}>
                  {book.is_featured === 1 && (
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'linear-gradient(135deg, #f97316, #ef4444)',
                      color: '#ffffff',
                      fontSize: '9px',
                      fontWeight: 700,
                      letterSpacing: '0.5px'
                    }}>
                      ✦ FEATURED
                    </span>
                  )}
                  {book.is_owned === 1 && (
                    <span style={{
                      padding: '4px 10px',
                      borderRadius: '6px',
                      background: 'rgba(16,185,129,0.9)',
                      color: '#ffffff',
                      fontSize: '9px',
                      fontWeight: 700
                    }}>
                      ✓ OWNED
                    </span>
                  )}
                </div>

                {/* Cover */}
                <div style={{
                  height: '280px',
                  background: book.cover_url
                    ? `url(${book.cover_url}) center/cover`
                    : `linear-gradient(135deg, hsl(${idx * 45}, 60%, 25%), hsl(${idx * 45 + 30}, 50%, 15%))`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '56px',
                  transition: 'transform 0.3s ease'
                }}>
                  {!book.cover_url && '📖'}
                </div>

                {/* Info */}
                <div style={{ padding: '16px' }}>
                  <div style={{
                    fontSize: '15px',
                    fontWeight: 700,
                    color: '#ffffff',
                    marginBottom: '4px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {book.title}
                  </div>
                  <div style={{
                    fontSize: '12px',
                    color: 'rgba(255,255,255,0.5)',
                    marginBottom: '10px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}>
                    {book.author_name}
                  </div>

                  {/* Rating */}
                  {book.avg_rating > 0 && (
                    <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                      <span style={{ color: '#fbbf24', fontSize: '12px' }}>
                        {'★'.repeat(Math.round(book.avg_rating))}
                        <span style={{ color: 'rgba(255,255,255,0.2)' }}>
                          {'☆'.repeat(5 - Math.round(book.avg_rating))}
                        </span>
                      </span>
                      <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.4)' }}>
                        ({book.review_count})
                      </span>
                    </div>
                  )}

                  {/* Price & CTA */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{
                      fontSize: '15px',
                      fontWeight: 700,
                      color: book.is_free ? '#34d399' : '#a78bfa'
                    }}>
                      {book.is_free ? 'Free' : `$${parseFloat(String(book.price)).toFixed(2)}`}
                    </span>
                    {book.is_owned === 1 ? (
                      <span style={{
                        padding: '6px 12px',
                        borderRadius: '8px',
                        background: 'rgba(91,164,245,0.15)',
                        color: '#60a5fa',
                        fontSize: '11px',
                        fontWeight: 700
                      }}>
                        Read →
                      </span>
                    ) : (
                      <span
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                        }}
                      >
                        <PurchaseButton bookId={book.id} price={book.price} isFree={book.is_free === 1} compact />
                      </span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <style jsx global>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.4; }
          50% { opacity: 0.7; }
        }
      `}</style>
    </div>
  )
}
