'use client'

import { useState, useRef, useEffect } from 'react'
import { signOut } from 'next-auth/react'
import Link from 'next/link'

interface AccountPopupProps {
  user: {
    name?: string | null
    email?: string | null
    role?: string
  }
  align?: 'left' | 'right' | 'top' // simplified alignment
}

export default function AccountPopup({ user, align = 'top' }: AccountPopupProps) {
  const [isOpen, setIsOpen] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)

  // Close on click outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const roleColor: Record<string, string> = {
    oso: '#e8c547',
    partner: '#3dd6a3',
    author: '#9d7df5',
    reader: '#5ba4f5'
  }

  const userColor = roleColor[user.role as string] || '#5ba4f5'

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      {/* Trigger: User Avatar Area */}
      <div 
        onClick={() => setIsOpen(!isOpen)}
        style={{ 
          display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', 
          padding: '4px 8px', borderRadius: 6, transition: 'background .2s',
          background: isOpen ? 'rgba(255,255,255,0.05)' : 'transparent'
        }}
      >
        <div style={{ 
          width: 32, height: 32, borderRadius: '50%', 
          background: `linear-gradient(135deg, ${userColor}, ${userColor}88)`, 
          display: 'flex', alignItems: 'center', justifyContent: 'center', 
          fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 
        }}>
          {user.name?.slice(0, 2).toUpperCase()}
        </div>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: '#eeecf8' }}>{user.name}</div>
          <div style={{ fontSize: 10, color: userColor, fontFamily: "'JetBrains Mono',monospace", textTransform:'uppercase' }}>
            {user.role}
          </div>
        </div>
        <div style={{ fontSize: 10, color: '#635e80', marginLeft: 'auto' }}>
          {isOpen ? '▲' : '▼'}
        </div>
      </div>

      {/* Dropdown Menu */}
      {isOpen && (
        <div style={{
          position: 'absolute',
          bottom: align === 'top' ? '120%' : 'auto',
          top: align === 'top' ? 'auto' : '120%',
          left: 0,
          width: 240,
          background: '#1a1924',
          border: '1px solid #2f2e3d',
          borderRadius: 8,
          boxShadow: '0 4px 20px rgba(0,0,0,0.5)',
          zIndex: 100,
          overflow: 'hidden',
          animation: 'fadeIn .1s ease-out'
        }}>
          {/* Account Info Header */}
          <div style={{ padding: '16px 16px', borderBottom: '1px solid #2f2e3d', background: '#201f2b' }}>
            <div style={{ fontSize: 13, fontWeight: 700, color: '#fff' }}>{user.name}</div>
            <div style={{ fontSize: 11, color: '#8a87a0', marginTop: 2 }}>{user.email}</div>
          </div>

          {/* Menu Items */}
          <div style={{ padding: '8px 0' }}>
            <Link href={`/${user.role}/settings`} onClick={() => setIsOpen(false)} style={{ display: 'block', padding: '10px 16px', fontSize: 13, color: '#c4c2d6', textDecoration: 'none', transition: 'background .15s' }} className="menu-item">
              Settings
            </Link>
            
            {/* Session Device Info (Mockup for now) */}
            <div style={{ padding: '10px 16px', borderTop:'1px solid #2f2e3d', marginTop:4 }}>
               <div style={{ fontSize:10, color:'#635e80', textTransform:'uppercase', letterSpacing:'1px', marginBottom:4 }}>Current Session</div>
               <div style={{ display:'flex', alignItems:'center', gap:6 }}>
                 <span style={{ fontSize:14 }}>💻</span>
                 <div style={{ fontSize:11, color:'#8a87a0' }}>Windows PC · Chrome</div>
               </div>
               <div style={{ fontSize:10, color:'#3dd6a3', marginTop:2 }}>● Active Now</div>
            </div>

            <div style={{ height: 1, background: '#2f2e3d', margin: '4px 0' }} />
            
            <button 
              onClick={() => signOut({ callbackUrl: '/auth/login' })}
              style={{ 
                width: '100%', textAlign: 'left', padding: '10px 16px', 
                background: 'transparent', border: 'none', 
                fontSize: 13, color: '#f07060', cursor: 'pointer', fontWeight: 600 
              }}
              className="menu-item"
            >
              Sign Out
            </button>
          </div>
        </div>
      )}
      <style jsx>{`
        .menu-item:hover { background: #2f2e3d !important; color: #fff !important; }
      `}</style>
    </div>
  )
}
