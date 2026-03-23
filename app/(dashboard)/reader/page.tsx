'use client'
import Link from 'next/link'
import { useEffect, useState } from 'react'
import Book3DCarousel from '@/components/ui/Book3DCarousel'

type Book = {
  id: number
  title: string
  cover_url: string | null
  author_name: string
  category: string
  progress?: number
  total_chapters?: number
  current_chapter_num?: number
  current_chapter_title?: string
  scroll_pct?: number
  price?: number
  is_free?: number
  is_featured?: number
  avg_rating?: number
  review_count?: number
  description?: string
  total_reads?: number
}

type Stats = {
  books_owned: number
  time_spent_s: number
  bookmarks: number
  completed: number
}

export default function ReaderHomePage() {
  const [inProgress, setInProgress] = useState<Book[]>([])
  const [recentBooks, setRecentBooks] = useState<Book[]>([])
  const [featuredBook, setFeaturedBook] = useState<Book | null>(null)
  const [stats, setStats] = useState<Stats | null>(null)
  const [trendingBooks, setTrendingBooks] = useState<Book[]>([])
  const [newBooks, setNewBooks] = useState<Book[]>([])
  const [freeBooks, setFreeBooks] = useState<Book[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const [homeRes, trendingRes, newRes, freeRes] = await Promise.all([
        fetch('/api/reader/home'),
        fetch('/api/catalog?sort=popular&limit=10'),
        fetch('/api/catalog?sort=newest&limit=10'),
        fetch('/api/catalog?free=1&limit=10')
      ])
      
      if (homeRes.ok) {
        const homeData = await homeRes.json()
        setInProgress(homeData.inProgress || [])
        setRecentBooks(homeData.recentBooks || [])
        setFeaturedBook(homeData.featuredBook || null)
        setStats(homeData.stats || null)
      }
      
      if (trendingRes.ok) setTrendingBooks((await trendingRes.json()).books || [])
      if (newRes.ok) setNewBooks((await newRes.json()).books || [])
      if (freeRes.ok) setFreeBooks((await freeRes.json()).books || [])
    } catch (e) {
      console.error('Failed to load data', e)
    } finally {
      setLoading(false)
    }
  }

  const hoursRead = Math.floor((stats?.time_spent_s || 0) / 3600)

  return (
    <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', background: '#0a0a0f' }}>
      {/* Hero Section */}
      {featuredBook && (
        <div style={{
          position: 'relative',
          height: '500px',
          overflow: 'hidden',
          marginBottom: '48px'
        }}>
          {/* Background */}
          <div style={{
            position: 'absolute',
            inset: 0,
            background: featuredBook.cover_url
              ? `linear-gradient(135deg, rgba(10,10,15,0.8) 0%, rgba(10,10,15,0.5) 50%, rgba(10,10,15,0.95) 100%), url(${featuredBook.cover_url}) center/cover`
              : 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f0f23 100%)',
          }} />
          
          {/* Gradient */}
          <div style={{
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '70%',
            background: 'linear-gradient(to top, #0a0a0f 0%, transparent 100%)'
          }} />
          
          {/* Glow */}
          <div style={{
            position: 'absolute',
            top: '10%',
            right: '15%',
            width: '400px',
            height: '400px',
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(168,85,247,0.2) 0%, transparent 70%)',
            filter: 'blur(80px)'
          }} />

          <div style={{
            position: 'relative',
            height: '100%',
            maxWidth: '1400px',
            margin: '0 auto',
            padding: '0 48px',
            display: 'flex',
            alignItems: 'center',
            gap: '56px'
          }}>
            {/* 3D Book Cover */}
            <div style={{
              width: '220px',
              height: '320px',
              perspective: '1000px',
              flexShrink: 0,
            }}>
              <div style={{
                width: '100%',
                height: '100%',
                borderRadius: '12px',
                background: featuredBook.cover_url 
                  ? `url(${featuredBook.cover_url}) center/cover` 
                  : 'linear-gradient(135deg, #6366f1, #8b5cf6)',
                boxShadow: '0 30px 60px -12px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.1)',
                transform: 'perspective(1000px) rotateY(-15deg)',
                transformStyle: 'preserve-3d',
                transition: 'transform 0.5s ease',
              }}>
                <div style={{
                  position: 'absolute',
                  left: 0,
                  top: 0,
                  bottom: 0,
                  width: '15px',
                  background: 'linear-gradient(to right, rgba(0,0,0,0.4), transparent)',
                  borderRadius: '12px 0 0 12px',
                }} />
                {!featuredBook.cover_url && (
                  <div style={{
                    position: 'absolute',
                    top: '50%',
                    left: '50%',
                    transform: 'translate(-50%, -50%)',
                    fontSize: '64px',
                    opacity: 0.5,
                  }}>📖</div>
                )}
              </div>
            </div>

            {/* Info */}
            <div style={{ flex: 1, maxWidth: '580px' }}>
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '8px 16px',
                borderRadius: '24px',
                background: 'linear-gradient(135deg, #f97316, #ef4444)',
                color: '#fff',
                fontSize: '11px',
                fontWeight: 700,
                letterSpacing: '1.5px',
                textTransform: 'uppercase',
                marginBottom: '16px',
                boxShadow: '0 4px 12px rgba(249,115,22,0.3)'
              }}>
                ✦ Featured Pick
              </div>
              
              <h1 style={{
                fontSize: '44px',
                fontWeight: 800,
                color: '#fff',
                lineHeight: 1.05,
                marginBottom: '12px',
                letterSpacing: '-1px'
              }}>
                {featuredBook.title}
              </h1>
              
              <p style={{
                fontSize: '16px',
                color: 'rgba(255,255,255,0.6)',
                marginBottom: '12px',
              }}>
                by <span style={{ color: '#a855f7', fontWeight: 600 }}>{featuredBook.author_name}</span>
              </p>

              <p style={{
                fontSize: '15px',
                color: 'rgba(255,255,255,0.5)',
                lineHeight: 1.7,
                marginBottom: '20px',
                maxWidth: '480px'
              }}>
                {featuredBook.description || 'An extraordinary journey awaits. Discover this captivating story.'}
              </p>

              {featuredBook.avg_rating ? (
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '20px' }}>
                  <span style={{ color: '#fbbf24', fontSize: '16px' }}>
                    {'★'.repeat(Math.round(featuredBook.avg_rating))}
                  </span>
                  <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: '13px' }}>
                    {featuredBook.review_count} reviews
                  </span>
                </div>
              ) : null}

              <div style={{ display: 'flex', gap: '12px' }}>
                <Link 
                  href={`/reader/read/${featuredBook.id}`}
                  style={{
                    padding: '14px 32px',
                    borderRadius: '12px',
                    background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: 700,
                    textDecoration: 'none',
                    boxShadow: '0 8px 24px rgba(168,85,247,0.4)'
                  }}
                >
                  Read Now →
                </Link>
                <Link 
                  href={`/reader/books/${featuredBook.id}`}
                  style={{
                    padding: '14px 24px',
                    borderRadius: '12px',
                    background: 'rgba(255,255,255,0.08)',
                    border: '1px solid rgba(255,255,255,0.15)',
                    color: '#fff',
                    fontSize: '15px',
                    fontWeight: 600,
                    textDecoration: 'none'
                  }}
                >
                  Details
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Content */}
      <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 48px 64px' }}>
        {/* Stats */}
        {stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(4, 1fr)',
            gap: '16px',
            marginBottom: '48px'
          }}>
            {[
              { label: 'Books Owned', value: stats.books_owned || 0, icon: '📚', color: '#a855f7' },
              { label: 'Hours Read', value: `${hoursRead}h`, icon: '⏱', color: '#f472b6' },
              { label: 'Completed', value: stats.completed || 0, icon: '✓', color: '#34d399' },
              { label: 'Bookmarks', value: stats.bookmarks || 0, icon: '★', color: '#fbbf24' },
            ].map((stat) => (
              <div key={stat.label} style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '16px',
                padding: '20px 24px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px'
              }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: `${stat.color}15`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '20px'
                }}>
                  {stat.icon}
                </div>
                <div>
                  <div style={{ fontSize: '24px', fontWeight: 800, color: '#fff' }}>{stat.value}</div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{stat.label}</div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Continue Reading */}
        {inProgress.length > 0 && (
          <Book3DCarousel
            books={inProgress.map(b => ({ ...b, progress: b.scroll_pct }))}
            title="Continue Reading"
            subtitle={`${inProgress.length} books in progress`}
            accentColor="#a855f7"
          />
        )}

        {/* Trending Now */}
        {trendingBooks.length > 0 && (
          <Book3DCarousel
            books={trendingBooks}
            title="🔥 Trending Now"
            subtitle="What everyone's reading"
            accentColor="#f97316"
            seeAllHref="/reader/browse?sort=popular"
          />
        )}

        {/* New Releases */}
        {newBooks.length > 0 && (
          <Book3DCarousel
            books={newBooks}
            title="✨ New Releases"
            subtitle="Fresh from publishers"
            accentColor="#fbbf24"
            seeAllHref="/reader/browse?sort=newest"
          />
        )}

        {/* Free Books */}
        {freeBooks.length > 0 && (
          <Book3DCarousel
            books={freeBooks}
            title="💰 Free to Read"
            subtitle="No cost, unlimited enjoyment"
            accentColor="#34d399"
            seeAllHref="/reader/browse?free=1"
          />
        )}

        {/* Quick Actions */}
        <section>
          <h2 style={{
            fontSize: '22px',
            fontWeight: 800,
            color: '#fff',
            marginBottom: '20px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <span>⚡</span> Quick Actions
          </h2>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
            {[
              { href: '/reader/browse', icon: '🔍', title: 'Browse All', desc: 'Explore the full catalog', color: '#6366f1' },
              { href: '/reader/bookmarks', icon: '★', title: 'Bookmarks', desc: 'Your saved moments', color: '#f59e0b' },
              { href: '/reader/library', icon: '📚', title: 'My Library', desc: 'All your books', color: '#10b981' },
            ].map((link) => (
              <Link 
                key={link.href}
                href={link.href}
                style={{
                  padding: '24px',
                  background: 'rgba(255,255,255,0.02)',
                  border: '1px solid rgba(255,255,255,0.06)',
                  borderRadius: '16px',
                  textDecoration: 'none',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '16px',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{
                  width: '52px',
                  height: '52px',
                  borderRadius: '12px',
                  background: `${link.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '22px'
                }}>
                  {link.icon}
                </div>
                <div>
                  <div style={{ fontSize: '15px', fontWeight: 700, color: '#fff', marginBottom: '2px' }}>
                    {link.title}
                  </div>
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
                    {link.desc}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      </div>

      <style jsx global>{`
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(168,85,247,0.3) transparent;
        }
        *::-webkit-scrollbar {
          height: 6px;
          width: 6px;
        }
        *::-webkit-scrollbar-thumb {
          background: rgba(168,85,247,0.3);
          border-radius: 3px;
        }
      `}</style>
    </div>
  )
}
