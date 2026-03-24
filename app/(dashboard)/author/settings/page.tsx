'use client'

import { useState, useEffect } from 'react'

type Tab = 'profile' | 'security' | 'ip-blocking' | 'announcements'

type Settings = {
  id: number
  email: string
  display_name: string
  nickname: string | null
  avatar_url: string | null
  bio: string | null
  two_factor_enabled: boolean
  ip_block_list: string[]
  announcements: Announcement[]
}

type Announcement = {
  id: string
  title: string
  content: string
  created_at: string
  is_active: boolean
}

export default function AuthorSettingsPage() {
  const [tab, setTab] = useState<Tab>('profile')
  const [settings, setSettings] = useState<Settings | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState({ type: '', text: '' })

  const [formData, setFormData] = useState({
    display_name: '',
    nickname: '',
    bio: '',
    avatar_url: ''
  })

  const [ipInput, setIpInput] = useState('')
  const [announcementForm, setAnnouncementForm] = useState({ title: '', content: '' })

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const res = await fetch('/api/author/settings')
      const data = await res.json()
      if (data.success) {
        setSettings(data.data)
        setFormData({
          display_name: data.data.display_name || '',
          nickname: data.data.nickname || '',
          bio: data.data.bio || '',
          avatar_url: data.data.avatar_url || ''
        })
      }
    } catch (e) {
      console.error('Failed to load settings:', e)
    } finally {
      setLoading(false)
    }
  }

  async function saveProfile() {
    setSaving(true)
    setMessage({ type: '', text: '' })
    try {
      const res = await fetch('/api/author/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ type: 'success', text: 'Profile updated successfully!' })
        loadSettings()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to update profile' })
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to save changes' })
    } finally {
      setSaving(false)
    }
  }

  async function toggle2FA() {
    if (!settings) return
    
    const newValue = !settings.two_factor_enabled
    setSaving(true)
    setMessage({ type: '', text: '' })
    try {
      const res = await fetch('/api/author/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ two_factor_enabled: newValue })
      })
      const data = await res.json()
      if (data.success) {
        setMessage({ 
          type: 'success', 
          text: newValue ? '2FA enabled successfully!' : '2FA disabled successfully!' 
        })
        loadSettings()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to toggle 2FA' })
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'Failed to update 2FA settings' })
    } finally {
      setSaving(false)
    }
  }

  async function addIP() {
    if (!ipInput.trim() || !settings) return
    
    const newList = [...settings.ip_block_list, ipInput.trim()]
    setSaving(true)
    try {
      const res = await fetch('/api/author/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip_block_list: newList })
      })
      const data = await res.json()
      if (data.success) {
        setIpInput('')
        loadSettings()
      }
    } finally {
      setSaving(false)
    }
  }

  async function removeIP(ip: string) {
    if (!settings) return
    
    const newList = settings.ip_block_list.filter(i => i !== ip)
    setSaving(true)
    try {
      const res = await fetch('/api/author/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ip_block_list: newList })
      })
      const data = await res.json()
      if (data.success) {
        loadSettings()
      }
    } finally {
      setSaving(false)
    }
  }

  async function toggleIP(ip: string, isBlocked: boolean) {
    if (!settings) return
    
    if (isBlocked) {
      await removeIP(ip)
    } else {
      setIpInput(ip)
      await addIP()
    }
  }

  async function saveAnnouncement() {
    if (!announcementForm.title.trim() || !announcementForm.content.trim()) return
    
    const newAnnouncement = {
      id: Date.now().toString(),
      title: announcementForm.title,
      content: announcementForm.content,
      created_at: new Date().toISOString(),
      is_active: true
    }

    const newAnnouncements = [...(settings?.announcements || []), newAnnouncement]
    
    setSaving(true)
    try {
      const res = await fetch('/api/author/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcements: newAnnouncements })
      })
      const data = await res.json()
      if (data.success) {
        setAnnouncementForm({ title: '', content: '' })
        loadSettings()
        setMessage({ type: 'success', text: 'Announcement published!' })
      }
    } finally {
      setSaving(false)
    }
  }

  async function toggleAnnouncement(id: string, isActive: boolean) {
    if (!settings) return
    
    const newAnnouncements = settings.announcements.map(a => 
      a.id === id ? { ...a, is_active: !isActive } : a
    )
    
    setSaving(true)
    try {
      const res = await fetch('/api/author/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcements: newAnnouncements })
      })
      const data = await res.json()
      if (data.success) {
        loadSettings()
      }
    } finally {
      setSaving(false)
    }
  }

  async function deleteAnnouncement(id: string) {
    if (!settings || !confirm('Delete this announcement?')) return
    
    const newAnnouncements = settings.announcements.filter(a => a.id !== id)
    
    setSaving(true)
    try {
      const res = await fetch('/api/author/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ announcements: newAnnouncements })
      })
      const data = await res.json()
      if (data.success) {
        loadSettings()
      }
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0d0c10' }}>
        <div style={{ color: '#9d7df5', fontSize: '14px' }}>Loading settings...</div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', background: '#0d0c10', color: '#eeecf8' }}>
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Settings</h1>
        <p style={{ fontSize: '13px', color: '#635e80' }}>
          Manage your account settings and preferences
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '1px solid #272635', paddingBottom: '16px' }}>
        {[
          { key: 'profile' as Tab, label: 'Profile', icon: '👤' },
          { key: 'security' as Tab, label: 'Security', icon: '🔒' },
          { key: 'ip-blocking' as Tab, label: 'IP Blocking', icon: '🛡️' },
          { key: 'announcements' as Tab, label: 'Announcements', icon: '📢' },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            style={{
              padding: '10px 20px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              cursor: 'pointer',
              background: tab === t.key ? '#9d7df5' : 'rgba(255,255,255,0.05)',
              color: tab === t.key ? '#0d0c10' : '#635e80',
              border: 'none',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              transition: 'all 0.2s ease'
            }}
          >
            <span>{t.icon}</span> {t.label}
          </button>
        ))}
      </div>

      {message.text && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '24px',
          background: message.type === 'success' ? 'rgba(61, 214, 163, 0.1)' : 'rgba(240, 112, 96, 0.1)',
          border: `1px solid ${message.type === 'success' ? 'rgba(61, 214, 163, 0.3)' : 'rgba(240, 112, 96, 0.3)'}`,
          color: message.type === 'success' ? '#3dd6a3' : '#f07060',
          fontSize: '13px'
        }}>
          {message.text}
        </div>
      )}

      {tab === 'profile' && (
        <div style={{ maxWidth: '600px' }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid #272635', 
            borderRadius: '16px', 
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Profile Information</h3>
            
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#635e80', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Avatar URL
              </label>
              <input
                type="text"
                value={formData.avatar_url}
                onChange={e => setFormData({ ...formData, avatar_url: e.target.value })}
                placeholder="https://example.com/avatar.jpg"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid #272635',
                  color: '#eeecf8',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#635e80', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Display Name
              </label>
              <input
                type="text"
                value={formData.display_name}
                onChange={e => setFormData({ ...formData, display_name: e.target.value })}
                placeholder="Your display name"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid #272635',
                  color: '#eeecf8',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#635e80', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Nickname
              </label>
              <input
                type="text"
                value={formData.nickname}
                onChange={e => setFormData({ ...formData, nickname: e.target.value })}
                placeholder="Your nickname (optional)"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid #272635',
                  color: '#eeecf8',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#635e80', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Bio
              </label>
              <textarea
                value={formData.bio}
                onChange={e => setFormData({ ...formData, bio: e.target.value })}
                placeholder="Tell us about yourself..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid #272635',
                  color: '#eeecf8',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: '#635e80', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Email Address
              </label>
              <input
                type="email"
                value={settings?.email || ''}
                disabled
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.2)',
                  border: '1px solid #272635',
                  color: 'rgba(238, 236, 248, 0.3)',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'not-allowed'
                }}
              />
            </div>

            <button
              onClick={saveProfile}
              disabled={saving}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                background: saving ? 'rgba(157, 125, 245, 0.5)' : '#9d7df5',
                color: '#0d0c10',
                fontSize: '14px',
                fontWeight: 700,
                border: 'none',
                cursor: saving ? 'not-allowed' : 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      )}

      {tab === 'security' && (
        <div style={{ maxWidth: '600px' }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid #272635', 
            borderRadius: '16px', 
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Two-Factor Authentication</h3>
            <p style={{ fontSize: '13px', color: '#635e80', marginBottom: '24px' }}>
              Add an extra layer of security to your account by enabling two-factor authentication.
            </p>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '16px',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '12px',
              border: '1px solid #272635'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: settings?.two_factor_enabled ? 'rgba(61, 214, 163, 0.15)' : 'rgba(255,255,255,0.05)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '24px'
                }}>
                  {settings?.two_factor_enabled ? '🔐' : '🔓'}
                </div>
                <div>
                  <div style={{ fontSize: '14px', fontWeight: 600, marginBottom: '2px' }}>
                    {settings?.two_factor_enabled ? '2FA Enabled' : '2FA Disabled'}
                  </div>
                  <div style={{ fontSize: '12px', color: '#635e80' }}>
                    {settings?.two_factor_enabled ? 'Your account is protected' : 'Enable to secure your account'}
                  </div>
                </div>
              </div>

              <button
                onClick={toggle2FA}
                disabled={saving}
                style={{
                  padding: '10px 20px',
                  borderRadius: '8px',
                  background: settings?.two_factor_enabled ? 'rgba(240, 112, 96, 0.15)' : 'rgba(61, 214, 163, 0.15)',
                  color: settings?.two_factor_enabled ? '#f07060' : '#3dd6a3',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: `1px solid ${settings?.two_factor_enabled ? 'rgba(240, 112, 96, 0.3)' : 'rgba(61, 214, 163, 0.3)'}`,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {saving ? 'Processing...' : settings?.two_factor_enabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>

          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid #272635', 
            borderRadius: '16px', 
            padding: '24px',
            marginTop: '24px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Change Password</h3>
            <p style={{ fontSize: '13px', color: '#635e80', marginBottom: '24px' }}>
              Update your password to keep your account secure.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <input
                type="password"
                placeholder="Current password"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid #272635',
                  color: '#eeecf8',
                  fontSize: '14px',
                  outline: 'none',
                  marginBottom: '12px'
                }}
              />
              <input
                type="password"
                placeholder="New password"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid #272635',
                  color: '#eeecf8',
                  fontSize: '14px',
                  outline: 'none',
                  marginBottom: '12px'
                }}
              />
              <input
                type="password"
                placeholder="Confirm new password"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid #272635',
                  color: '#eeecf8',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            <button
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                background: 'rgba(255,255,255,0.1)',
                color: '#eeecf8',
                fontSize: '14px',
                fontWeight: 600,
                border: '1px solid #272635',
                cursor: 'pointer'
              }}
            >
              Update Password
            </button>
          </div>
        </div>
      )}

      {tab === 'ip-blocking' && (
        <div style={{ maxWidth: '600px' }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid #272635', 
            borderRadius: '16px', 
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>IP Blocking</h3>
            <p style={{ fontSize: '13px', color: '#635e80', marginBottom: '24px' }}>
              Block specific IP addresses from accessing your content or activities.
            </p>

            <div style={{ display: 'flex', gap: '8px', marginBottom: '24px' }}>
              <input
                type="text"
                value={ipInput}
                onChange={e => setIpInput(e.target.value)}
                placeholder="Enter IP address (e.g., 192.168.1.1)"
                style={{
                  flex: 1,
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid #272635',
                  color: '#eeecf8',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
              <button
                onClick={addIP}
                disabled={saving || !ipInput.trim()}
                style={{
                  padding: '12px 24px',
                  borderRadius: '8px',
                  background: '#9d7df5',
                  color: '#0d0c10',
                  fontSize: '14px',
                  fontWeight: 600,
                  border: 'none',
                  cursor: saving || !ipInput.trim() ? 'not-allowed' : 'pointer'
                }}
              >
                Block IP
              </button>
            </div>

            {settings?.ip_block_list && settings.ip_block_list.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {settings.ip_block_list.map((ip, idx) => (
                  <div key={idx} style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '12px 16px',
                    background: 'rgba(240, 112, 96, 0.1)',
                    border: '1px solid rgba(240, 112, 96, 0.2)',
                    borderRadius: '8px'
                  }}>
                    <span style={{ fontFamily: "'JetBrains Mono',monospace", fontSize: '13px' }}>{ip}</span>
                    <button
                      onClick={() => removeIP(ip)}
                      style={{
                        padding: '6px 12px',
                        borderRadius: '4px',
                        background: 'transparent',
                        border: '1px solid rgba(240, 112, 96, 0.3)',
                        color: '#f07060',
                        fontSize: '12px',
                        cursor: 'pointer'
                      }}
                    >
                      Unblock
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                padding: '40px', 
                textAlign: 'center', 
                color: '#635e80',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '8px'
              }}>
                No IP addresses blocked
              </div>
            )}
          </div>
        </div>
      )}

      {tab === 'announcements' && (
        <div style={{ maxWidth: '800px' }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid #272635', 
            borderRadius: '16px', 
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Create Announcement</h3>
            <p style={{ fontSize: '13px', color: '#635e80', marginBottom: '24px' }}>
              Publish announcements for your readers about new releases, updates, etc.
            </p>

            <div style={{ marginBottom: '16px' }}>
              <input
                type="text"
                value={announcementForm.title}
                onChange={e => setAnnouncementForm({ ...announcementForm, title: e.target.value })}
                placeholder="Announcement title"
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid #272635',
                  color: '#eeecf8',
                  fontSize: '14px',
                  outline: 'none',
                  marginBottom: '12px'
                }}
              />
              <textarea
                value={announcementForm.content}
                onChange={e => setAnnouncementForm({ ...announcementForm, content: e.target.value })}
                placeholder="Write your announcement content..."
                rows={4}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid #272635',
                  color: '#eeecf8',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            <button
              onClick={saveAnnouncement}
              disabled={saving || !announcementForm.title.trim() || !announcementForm.content.trim()}
              style={{
                padding: '12px 24px',
                borderRadius: '8px',
                background: saving || !announcementForm.title.trim() || !announcementForm.content.trim() ? 'rgba(157, 125, 245, 0.5)' : '#9d7df5',
                color: '#0d0c10',
                fontSize: '14px',
                fontWeight: 700,
                border: 'none',
                cursor: saving || !announcementForm.title.trim() || !announcementForm.content.trim() ? 'not-allowed' : 'pointer'
              }}
            >
              {saving ? 'Publishing...' : 'Publish Announcement'}
            </button>
          </div>

          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid #272635', 
            borderRadius: '16px', 
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Your Announcements</h3>

            {settings?.announcements && settings.announcements.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {settings.announcements.map(a => (
                  <div key={a.id} style={{
                    padding: '16px',
                    background: 'rgba(0,0,0,0.2)',
                    border: '1px solid #272635',
                    borderRadius: '12px'
                  }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: '15px', fontWeight: 600, marginBottom: '4px' }}>{a.title}</div>
                        <div style={{ fontSize: '12px', color: '#635e80' }}>
                          {new Date(a.created_at).toLocaleDateString()} · {a.is_active ? 'Active' : 'Draft'}
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => toggleAnnouncement(a.id, a.is_active)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '4px',
                            background: a.is_active ? 'rgba(240, 112, 96, 0.1)' : 'rgba(61, 214, 163, 0.1)',
                            border: `1px solid ${a.is_active ? 'rgba(240, 112, 96, 0.2)' : 'rgba(61, 214, 163, 0.2)'}`,
                            color: a.is_active ? '#f07060' : '#3dd6a3',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          {a.is_active ? 'Deactivate' : 'Activate'}
                        </button>
                        <button
                          onClick={() => deleteAnnouncement(a.id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '4px',
                            background: 'transparent',
                            border: '1px solid rgba(240, 112, 96, 0.2)',
                            color: '#f07060',
                            fontSize: '11px',
                            cursor: 'pointer'
                          }}
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                    <p style={{ fontSize: '13px', color: '#635e80', lineHeight: 1.5 }}>{a.content}</p>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ 
                padding: '40px', 
                textAlign: 'center', 
                color: '#635e80',
                background: 'rgba(0,0,0,0.2)',
                borderRadius: '8px'
              }}>
                No announcements yet
              </div>
            )}
          </div>
        </div>
      )}

      <style jsx global>{`
        input:focus, textarea:focus, select:focus {
          border-color: #9d7df5 !important;
        }
      `}</style>
    </div>
  )
}