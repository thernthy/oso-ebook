'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'

type Follower = {
  id: number
  display_name: string
  nickname: string | null
  avatar_url: string | null
  email: string
  followed_at: string
}

export default function AuthorFollowersPage() {
  const [followers, setFollowers] = useState<Follower[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadFollowers()
  }, [])

  async function loadFollowers() {
    setLoading(true)
    try {
      const res = await fetch('/api/author/followers')
      const data = await res.json()
      if (data.success) {
        setFollowers(data.data || [])
      }
    } catch (e) {
      console.error('Failed to load followers:', e)
    } finally {
      setLoading(false)
    }
  }

  const filteredFollowers = followers.filter(f => {
    const searchLower = search.toLowerCase()
    return (
      f.display_name?.toLowerCase().includes(searchLower) ||
      f.nickname?.toLowerCase().includes(searchLower) ||
      f.email?.toLowerCase().includes(searchLower)
    )
  })

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', background: '#0d0c10', color: '#eeecf8' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Followers</h1>
        <p style={{ fontSize: '13px', color: '#635e80' }}>
          People following your profile
        </p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
        <div style={{ 
          background: 'rgba(255,255,255,0.03)', 
          border: '1px solid #272635', 
          borderRadius: '8px',
          padding: '8px 16px',
          width: '300px'
        }}>
          <input
            type="text"
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search followers..."
            style={{
              width: '100%',
              background: 'transparent',
              border: 'none',
              color: '#eeecf8',
              fontSize: '14px',
              outline: 'none'
            }}
          />
        </div>
        <div style={{ fontSize: '14px', color: '#635e80' }}>
          {followers.length} follower{followers.length !== 1 ? 's' : ''}
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '40px', textAlign: 'center', color: '#635e80' }}>
          Loading...
        </div>
      ) : followers.length === 0 ? (
        <div style={{ 
          padding: '60px', 
          textAlign: 'center', 
          background: 'rgba(255,255,255,0.03)',
          borderRadius: '16px',
          border: '1px solid #272635'
        }}>
          <div style={{ fontSize: '48px', marginBottom: '16px' }}>👥</div>
          <div style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>No followers yet</div>
          <div style={{ fontSize: '13px', color: '#635e80' }}>
            Share your books to get more followers
          </div>
        </div>
      ) : (
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', 
          gap: '16px' 
        }}>
          {filteredFollowers.map(follower => (
            <div 
              key={follower.id}
              style={{
                background: 'rgba(255,255,255,0.03)',
                border: '1px solid #272635',
                borderRadius: '12px',
                padding: '16px',
                display: 'flex',
                alignItems: 'center',
                gap: '12px',
                transition: 'transform 0.2s ease, box-shadow 0.2s ease'
              }}
            >
              <div style={{
                width: '48px',
                height: '48px',
                borderRadius: '50%',
                background: follower.avatar_url 
                  ? `url(${follower.avatar_url}) center/cover`
                  : 'linear-gradient(135deg, #9d7df5, #7c3aed)',
                flexShrink: 0
              }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {follower.display_name || follower.nickname || 'Anonymous'}
                </div>
                <div style={{ fontSize: '12px', color: '#635e80', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {follower.email}
                </div>
                <div style={{ fontSize: '11px', color: '#635e80', marginTop: '4px' }}>
                  Following since {new Date(follower.followed_at).toLocaleDateString()}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && search && filteredFollowers.length === 0 && (
        <div style={{ 
          padding: '40px', 
          textAlign: 'center', 
          color: '#635e80' 
        }}>
          No followers match your search
        </div>
      )}
    </div>
  )
}