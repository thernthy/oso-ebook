'use client'
import Link from 'next/link'
import AccountPopup from '@/components/ui/AccountPopup'
import ReaderNavItems from '@/components/reader/ReaderNavItems'

const navItems = [
  { label: 'Home', href: '/reader', icon: '🏠' },
  { label: 'Continue', href: '/reader/library', icon: '▶' },
  { label: 'Browse', href: '/reader/browse', icon: '🔥' },
  { label: 'Bookmarks', href: '/reader/bookmarks', icon: '★' },
]

type User = {
  id: string | number
  name?: string | null
  email?: string | null
  role: string
}

export default function ReaderLayoutClient({ children, user }: { children: React.ReactNode, user: User }) {
  return (
    <div style={{ 
      display: 'flex', 
      height: '100vh', 
      overflow: 'hidden', 
      background: '#09090b', 
      fontFamily: "'Syne', system-ui, sans-serif" 
    }}>
      {/* Sidebar */}
      <aside style={{ 
        width: '260px', 
        minWidth: '260px', 
        background: 'linear-gradient(180deg, #18181b 0%, #09090b 100%)',
        borderRight: '1px solid rgba(255,255,255,0.06)', 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden' 
      }}>
        {/* Logo */}
        <div style={{ padding: '28px 24px 24px', borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
          <Link href="/reader" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '14px' }}>
            <div style={{ 
              width: '40px', 
              height: '40px', 
              background: 'linear-gradient(135deg, #7c3aed, #ec4899)',
              borderRadius: '10px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              fontSize: '18px', 
              fontWeight: 800, 
              color: '#ffffff',
              flexShrink: 0,
              boxShadow: '0 4px 12px rgba(124,58,237,0.3)'
            }}>
              OSO
            </div>
            <div>
              <div style={{ fontSize: '16px', fontWeight: 700, color: '#ffffff' }}>OSO Ebook</div>
              <div style={{ fontSize: '10px', color: '#a78bfa', fontWeight: 600, letterSpacing: '1.5px', textTransform: 'uppercase', marginTop: '2px' }}>
                Reader
              </div>
            </div>
          </Link>
        </div>

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '16px 12px', overflowY: 'auto' }}>
          <div style={{ marginBottom: '8px' }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '1.5px', textTransform: 'uppercase', padding: '8px 12px 12px' }}>
              Menu
            </div>
            <ReaderNavItems items={navItems} />
          </div>

          {/* Quick Stats in Sidebar */}
          <div style={{ 
            margin: '16px 0',
            padding: '16px',
            background: 'rgba(255,255,255,0.02)',
            borderRadius: '12px',
            border: '1px solid rgba(255,255,255,0.05)'
          }}>
            <div style={{ fontSize: '10px', fontWeight: 700, color: 'rgba(255,255,255,0.3)', letterSpacing: '1.5px', textTransform: 'uppercase', marginBottom: '12px' }}>
              Quick Stats
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Books</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#a78bfa' }}>—</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>Reading</span>
                <span style={{ fontSize: '14px', fontWeight: 700, color: '#f472b6' }}>—</span>
              </div>
            </div>
          </div>
        </nav>

        {/* User Section */}
        <div style={{ padding: '16px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
          <AccountPopup user={user} />
        </div>
      </aside>

      {/* Main Content */}
      <main style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {children}
      </main>
    </div>
  )
}
