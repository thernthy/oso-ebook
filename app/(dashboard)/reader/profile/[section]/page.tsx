'use client'

import { useState, useEffect } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'

type Book = {
  id: number
  title: string
  cover_url: string | null
  author_name: string
}

type Review = {
  id: number
  book_id: number
  book_title: string
  book_cover: string | null
  rating: number
  review_text: string
  created_at: string
}

type User = {
  id: number
  name: string
  avatar_url: string | null
}

const SECTIONS = [
  { key: 'followed', label: 'Followed Authors', icon: '👥', href: '/reader/profile/followed' },
  { key: 'reviews', label: 'My Reviews', icon: '⭐', href: '/reader/profile/reviews' },
  { key: 'favorites', label: 'Favorites', icon: '❤️', href: '/reader/profile/favorites' },
  { key: 'reading_now', label: 'Reading Now', icon: '📖', href: '/reader/profile/reading_now' },
  { key: 'bookmarks', label: 'Bookmarks', icon: '🔖', href: '/reader/profile/bookmarks' },
  { key: 'borrowed', label: 'Borrowed', icon: '📚', href: '/reader/profile/borrowed' },
]

export default function ReaderProfileSection() {
  const params = useParams()
  const section = params.section as string
  
  const [loading, setLoading] = useState(true)
  const [data, setData] = useState<any[]>([])

  useEffect(() => {
    loadData()
  }, [section])

  async function loadData() {
    setLoading(true)
    try {
      let endpoint = ''
      switch (section) {
        case 'followed':
          endpoint = '/api/reader/followed'
          break
        case 'reviews':
          endpoint = '/api/reader/reviews'
          break
        case 'favorites':
          endpoint = '/api/reader/favorites'
          break
        case 'reading_now':
          endpoint = '/api/reader/reading-now'
          break
        case 'bookmarks':
          endpoint = '/api/reader/bookmarks'
          break
        case 'borrowed':
          endpoint = '/api/reader/borrowed'
          break
        default:
          setData([])
          setLoading(false)
          return
      }

      const res = await fetch(endpoint)
      const json = await res.json()
      if (json.success) {
        setData(json.data || [])
      }
    } catch (e) {
      console.error('Failed to load data:', e)
    } finally {
      setLoading(false)
    }
  }

  const currentSection = SECTIONS.find(s => s.key === section)

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', background: '#0a0a0f', color: '#fff' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>
          {currentSection?.label || 'Profile'}
        </h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
          Manage your {currentSection?.label?.toLowerCase() || 'profile'}
        </p>
      </div>

      {/* Sub-navigation */}
      <div style={{ 
        display: 'flex', 
        gap: '8px', 
        marginBottom: '32px', 
        borderBottom: '1px solid rgba(255,255,255,0.1)', 
        paddingBottom: '16px',
        overflowX: 'auto'
      }}>
        {SECTIONS.map(s => (
          <Link
            key={s.key}
            href={s.href}
            style={{
              padding: '10px 16px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              background: section === s.key ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : 'transparent',
              color: section === s.key ? '#fff' : 'rgba(255,255,255,0.5)',
              border: 'none',
              textDecoration: 'none',
              whiteSpace: 'nowrap',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <span>{s.icon}</span> {s.label}
          </Link>
        ))}
      </div>

      {/* Content */}
      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: 'rgba(255,255,255,0.5)' }}>
          Loading...
        </div>
      ) : data.length === 0 ? (
        <div style={{ 
          padding: '60px', 
          textAlign: 'center', 
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '16px',
          border: '1px solid rgba(255,255,255,0.06)'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>{currentSection?.icon}</div>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>No {currentSection?.label?.toLowerCase()} yet</div>
          <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
            {section === 'followed' && 'Start following authors to see them here'}
            {section === 'reviews' && 'Your book reviews will appear here'}
            {section === 'favorites' && 'Mark books as favorites to see them here'}
            {section === 'reading_now' && 'Books you\'re reading will appear here'}
            {section === 'bookmarks' && 'Your bookmarks will appear here'}
            {section === 'borrowed' && 'Borrowed books will appear here'}
          </div>
          <Link 
            href="/reader/browse"
            style={{
              display: 'inline-block',
              marginTop: '20px',
              padding: '10px 20px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              color: '#fff',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none'
            }}
          >
            Browse Books
          </Link>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '20px' }}>
          {data.map((item: any) => (
            <div 
              key={item.id}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '12px',
                overflow: 'hidden',
                transition: 'transform 0.2s ease'
              }}
            >
              <div style={{ 
                height: '160px', 
                background: item.cover_url 
                  ? `url(${item.cover_url}) center/cover` 
                  : 'linear-gradient(135deg, #374151, #1f2937)',
                position: 'relative'
              }}>
                {item.rating && (
                  <div style={{
                    position: 'absolute',
                    top: '8px',
                    right: '8px',
                    background: 'rgba(0,0,0,0.7)',
                    padding: '4px 8px',
                    borderRadius: '4px',
                    fontSize: '12px',
                    fontWeight: 600,
                    color: '#fbbf24'
                  }}>
                    ★ {item.rating}
                  </div>
                )}
              </div>
              <div style={{ padding: '12px' }}>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '4px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {item.title || item.book_title || item.name}
                </div>
                {item.author_name && (
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                    {item.author_name}
                  </div>
                )}
                {item.review_text && (
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.7)', marginTop: '8px' }}>
                    {item.review_text.substring(0, 80)}...
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
