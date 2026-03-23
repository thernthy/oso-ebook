'use client'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import Book3DCarousel from '@/components/ui/Book3DCarousel'
import { useLanguage } from '@/lib/i18n/LanguageContext'

type Book = {
  id: number
  title: string
  cover_url: string | null
  author_name: string
  category: string
  description: string
  price: number
  is_free: number
  is_featured: number
  avg_rating: number
  review_count: number
  total_reads: number
}

type Category = {
  category: string
  count: number
}

export default function PublicLanding() {
  const { t, language } = useLanguage()
  const [featuredBooks, setFeaturedBooks] = useState<Book[]>([])
  const [trendingBooks, setTrendingBooks] = useState<Book[]>([])
  const [newBooks, setNewBooks] = useState<Book[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchPublicData()
  }, [])

  const fetchPublicData = async () => {
    try {
      const [featuredRes, trendingRes, newRes] = await Promise.all([
        fetch('/api/public/catalog?featured=1&limit=10'),
        fetch('/api/public/catalog?sort=popular&limit=10'),
        fetch('/api/public/catalog?sort=newest&limit=10')
      ])

      const [featuredData, trendingData, newData] = await Promise.all([
        featuredRes.json(),
        trendingRes.json(),
        newRes.json()
      ])

      setFeaturedBooks(featuredData.books || [])
      setTrendingBooks(trendingData.books || [])
      setNewBooks(newData.books || [])
      setCategories(featuredData.categories || trendingData.categories || [])
    } catch (e) {
      console.error('Failed to load public data', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: '#09090b',
      fontFamily: "'Inter', system-ui, sans-serif",
      color: '#fff'
    }}>
      {/* Navigation */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'rgba(9,9,11,0.85)',
        backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(255,255,255,0.06)'
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 32px',
          height: '72px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between'
        }}>
          {/* Logo */}
          <Link href="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '12px' }}>
            <div style={{
              width: '44px',
              height: '44px',
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              borderRadius: '10px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '16px',
              fontWeight: 800,
              color: '#fff'
            }}>
              OSO
            </div>
            <span style={{ fontSize: '20px', fontWeight: 700, color: '#fff' }}>OSO</span>
          </Link>

          {/* Nav Links */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '32px' }}>
            <Link href="#browse" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontWeight: 500 }}>{t('browse')}</Link>
            <Link href="#categories" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontWeight: 500 }}>{t('categories')}</Link>
            <Link href="#features" style={{ fontSize: '14px', color: 'rgba(255,255,255,0.7)', textDecoration: 'none', fontWeight: 500 }}>{t('features')}</Link>
          </div>

          {/* Auth Buttons */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <Link 
              href="/auth/login"
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                background: 'rgba(255,255,255,0.08)',
                border: '1px solid rgba(255,255,255,0.12)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                transition: 'all 0.2s ease'
              }}
            >
              {t('signInButton')}
            </Link>
            <Link 
              href="/auth/login"
              style={{
                padding: '10px 20px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                boxShadow: '0 4px 16px rgba(168,85,247,0.3)'
              }}
            >
              {t('getStartedButton')} →
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section style={{
        position: 'relative',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        paddingTop: '72px',
        overflow: 'hidden'
      }}>
        {/* Background Effects */}
        <div style={{
          position: 'absolute',
          inset: 0,
          background: 'radial-gradient(ellipse 80% 50% at 50% -20%, rgba(168,85,247,0.3), transparent)'
        }} />
        <div style={{
          position: 'absolute',
          top: '20%',
          right: '10%',
          width: '600px',
          height: '600px',
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)',
          filter: 'blur(100px)'
        }} />

        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '80px 32px',
          position: 'relative',
          zIndex: 1
        }}>
          <div style={{ maxWidth: '720px' }}>
            {/* Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              padding: '8px 16px',
              borderRadius: '24px',
              background: 'rgba(168,85,247,0.15)',
              border: '1px solid rgba(168,85,247,0.3)',
              marginBottom: '24px'
            }}>
              <span style={{ fontSize: '14px' }}>✨</span>
              <span style={{ fontSize: '13px', fontWeight: 600, color: '#a855f7' }}>
                {t('genZReadingPlatform')}
              </span>
            </div>

            <h1 style={{
              fontSize: 'clamp(40px, 8vw, 72px)',
              fontWeight: 800,
              lineHeight: 1.05,
              letterSpacing: '-2px',
              marginBottom: '24px',
              background: 'linear-gradient(135deg, #fff 0%, rgba(255,255,255,0.7) 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}>
              {t('readDiscoverRepeat')}
            </h1>

            <p style={{
              fontSize: '18px',
              lineHeight: 1.7,
              color: 'rgba(255,255,255,0.6)',
              marginBottom: '40px',
              maxWidth: '540px'
            }}>
              {t('thousandsOfBooks')} {t('findYourNextStory')} {t('joinThousands')}.
            </p>

            {/* CTA Buttons */}
            <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap' }}>
              <Link 
                href="/auth/login"
                style={{
                  padding: '16px 32px',
                  borderRadius: '14px',
                  background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 700,
                  textDecoration: 'none',
                  boxShadow: '0 8px 32px rgba(168,85,247,0.4)'
                }}
              >
                {t('startReadingFree')} →
              </Link>
              <Link 
                href="#browse"
                style={{
                  padding: '16px 32px',
                  borderRadius: '14px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.15)',
                  color: '#fff',
                  fontSize: '16px',
                  fontWeight: 600,
                  textDecoration: 'none'
                }}
              >
                {t('browseCatalog')}
              </Link>
            </div>

            {/* Social Proof */}
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '32px',
              marginTop: '48px',
              paddingTop: '32px',
              borderTop: '1px solid rgba(255,255,255,0.08)'
            }}>
              {[
                { value: '10K+', label: t('books') },
                { value: '50K+', label: 'Readers' },
                { value: '4.9★', label: t('rating') }
              ].map((stat, idx) => (
                <div key={idx}>
                  <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }}>{stat.value}</div>
                  <div style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* 3D Book Carousel - Featured */}
      <section id="browse" style={{ padding: '60px 0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px' }}>
          {featuredBooks.length > 0 && (
            <Book3DCarousel
              books={featuredBooks}
              title={`✦ ${t('featuredReads')}`}
              subtitle={t('handpickedForYou')}
              accentColor="#f97316"
            />
          )}
        </div>
      </section>

      {/* Trending Section */}
      <section style={{ padding: '60px 0', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px' }}>
          {trendingBooks.length > 0 && (
            <Book3DCarousel
              books={trendingBooks}
              title={`🔥 ${t('trendingNow')}`}
              subtitle={t('whatEveryoneReading')}
              accentColor="#10b981"
            />
          )}
        </div>
      </section>

      {/* New Releases */}
      <section style={{ padding: '60px 0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px' }}>
          {newBooks.length > 0 && (
            <Book3DCarousel
              books={newBooks}
              title={`✨ ${t('newReleases')}`}
              subtitle={t('freshFromPublishers')}
              accentColor="#fbbf24"
            />
          )}
        </div>
      </section>

      {/* Categories */}
      <section id="categories" style={{ padding: '80px 0', background: 'rgba(255,255,255,0.02)' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px' }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '16px',
            marginBottom: '40px'
          }}>
            <div style={{
              width: '5px',
              height: '40px',
              borderRadius: '3px',
              background: 'linear-gradient(to bottom, #a855f7, #6366f1)'
            }} />
            <div>
              <h2 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-0.5px' }}>{t('browseByCategory')}</h2>
              <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>{t('findYourGenre')}</p>
            </div>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', 
            gap: '16px' 
          }}>
            {[
              { name: 'Fiction', emoji: '📚', color: '#a855f7' },
              { name: 'Fantasy', emoji: '🧙', color: '#8b5cf6' },
              { name: 'Romance', emoji: '💕', color: '#f472b6' },
              { name: 'Sci-Fi', emoji: '🚀', color: '#06b6d4' },
              { name: 'Mystery', emoji: '🔍', color: '#6366f1' },
              { name: 'Horror', emoji: '👻', color: '#ef4444' },
              { name: 'Self-Help', emoji: '💡', color: '#fbbf24' },
              { name: 'Biography', emoji: '👤', color: '#10b981' },
            ].map((cat) => (
              <Link 
                key={cat.name}
                href="/auth/login"
                style={{
                  padding: '24px 20px',
                  background: `${cat.color}10`,
                  border: `1px solid ${cat.color}30`,
                  borderRadius: '16px',
                  textDecoration: 'none',
                  textAlign: 'center',
                  transition: 'all 0.2s ease'
                }}
              >
                <div style={{ fontSize: '32px', marginBottom: '12px' }}>{cat.emoji}</div>
                <div style={{ fontSize: '14px', fontWeight: 600, color: '#fff' }}>{cat.name}</div>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" style={{ padding: '100px 0' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 32px' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{ fontSize: '40px', fontWeight: 800, marginBottom: '16px', letterSpacing: '-1px' }}>
              {t('whyReadersLoveUs')}
            </h2>
            <p style={{ fontSize: '16px', color: 'rgba(255,255,255,0.5)', maxWidth: '500px', margin: '0 auto' }}>
              {t('builtForNextGen')}
            </p>
          </div>

          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(3, 1fr)', 
            gap: '24px' 
          }}>
            {[
              { icon: '📱', title: t('readAnywhere'), desc: t('seamlessExperience'), color: '#a855f7' },
              { icon: '✨', title: t('aiPowered'), desc: t('smartRecommendations'), color: '#ec4899' },
              { icon: '💰', title: t('affordable'), desc: t('thousandsFree'), color: '#10b981' },
              { icon: '⚡', title: t('instantAccess'), desc: t('startInSeconds'), color: '#fbbf24' },
              { icon: '📊', title: t('trackProgress'), desc: t('beautifulStats'), color: '#06b6d4' },
              { icon: '🌙', title: t('customizable'), desc: t('darkModeFonts'), color: '#8b5cf6' },
            ].map((feature, idx) => (
              <div key={idx} style={{
                padding: '32px',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid rgba(255,255,255,0.06)',
                borderRadius: '20px',
              }}>
                <div style={{
                  width: '64px',
                  height: '64px',
                  borderRadius: '16px',
                  background: `${feature.color}20`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '28px',
                  marginBottom: '20px'
                }}>
                  {feature.icon}
                </div>
                <h3 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '12px' }}>{feature.title}</h3>
                <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.6)', lineHeight: 1.6 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section style={{
        padding: '100px 0',
        background: 'linear-gradient(135deg, rgba(168,85,247,0.2) 0%, rgba(236,72,153,0.2) 100%)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        <div style={{
          position: 'absolute',
          inset: 0,
          backgroundImage: `radial-gradient(circle at 2px 2px, rgba(255,255,255,0.05) 1px, transparent 0)`,
          backgroundSize: '32px 32px'
        }} />

        <div style={{
          maxWidth: '800px',
          margin: '0 auto',
          padding: '0 32px',
          textAlign: 'center',
          position: 'relative',
          zIndex: 1
        }}>
          <h2 style={{
            fontSize: 'clamp(32px, 5vw, 48px)',
            fontWeight: 800,
            marginBottom: '20px',
            letterSpacing: '-1px'
          }}>
            {t('readyToStart')}
            <br />
            <span style={{ background: 'linear-gradient(135deg, #a855f7, #ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              {t('readingJourney')}?
            </span>
          </h2>
          <p style={{
            fontSize: '18px',
            color: 'rgba(255,255,255,0.7)',
            marginBottom: '40px',
            maxWidth: '500px',
            margin: '0 auto 40px'
          }}>
            {t('joinThousands')}. {t('freeToStart')}.
          </p>
          <Link 
            href="/auth/login"
            style={{
              padding: '18px 40px',
              borderRadius: '14px',
              background: '#fff',
              color: '#09090b',
              fontSize: '16px',
              fontWeight: 700,
              textDecoration: 'none',
              boxShadow: '0 8px 32px rgba(0,0,0,0.2)',
              display: 'inline-block'
            }}
          >
            {t('getStartedFree')} →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer style={{
        padding: '48px 32px',
        borderTop: '1px solid rgba(255,255,255,0.06)',
        textAlign: 'center'
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '16px' }}>
            <div style={{
              width: '32px',
              height: '32px',
              background: 'linear-gradient(135deg, #a855f7, #ec4899)',
              borderRadius: '8px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '12px',
              fontWeight: 800,
              color: '#fff'
            }}>
              OSO
            </div>
            <span style={{ fontSize: '16px', fontWeight: 700 }}>OSO Ebook</span>
          </div>
          <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.4)' }}>
            © 2026 {t('copyright')} OSO Ebook Platform. {t('allRightsReserved')}.
          </p>
        </div>
      </footer>

      <style jsx global>{`
        * {
          scrollbar-width: thin;
          scrollbar-color: rgba(168,85,247,0.3) transparent;
        }
        *::-webkit-scrollbar {
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
