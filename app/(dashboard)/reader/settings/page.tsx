'use client'

import { useState, useEffect } from 'react'

type Tab = 'profile' | 'security' | 'preferences'

type Settings = {
  id: number
  email: string
  display_name: string
  nickname: string | null
  avatar_url: string | null
  bio: string | null
  two_factor_enabled: boolean
  preferred_languages: string[]
  preferred_genres: number[]
}

export default function ReaderSettingsPage() {
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

  useEffect(() => {
    loadSettings()
  }, [])

  async function loadSettings() {
    try {
      const res = await fetch('/api/reader/settings')
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
      const res = await fetch('/api/reader/settings', {
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
      const res = await fetch('/api/reader/settings', {
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

  if (loading) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0a0a0f' }}>
        <div style={{ color: '#a78bfa', fontSize: '14px' }}>Loading settings...</div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 32px', background: '#0a0a0f', color: '#fff' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 800, marginBottom: '8px' }}>Settings</h1>
        <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
          Manage your account settings and preferences
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '32px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '16px' }}>
        {[
          { key: 'profile' as Tab, label: 'Profile', icon: '👤' },
          { key: 'security' as Tab, label: 'Security', icon: '🔒' },
          { key: 'preferences' as Tab, label: 'Preferences', icon: '⚙️' },
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
              background: tab === t.key ? 'linear-gradient(135deg, #7c3aed, #ec4899)' : 'rgba(255,255,255,0.05)',
              color: tab === t.key ? '#fff' : 'rgba(255,255,255,0.5)',
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

      {/* Message */}
      {message.text && (
        <div style={{
          padding: '12px 16px',
          borderRadius: '8px',
          marginBottom: '24px',
          background: message.type === 'success' ? 'rgba(52, 211, 153, 0.1)' : 'rgba(248, 113, 113, 0.1)',
          border: `1px solid ${message.type === 'success' ? 'rgba(52, 211, 153, 0.3)' : 'rgba(248, 113, 113, 0.3)'}`,
          color: message.type === 'success' ? '#34d399' : '#f87171',
          fontSize: '13px'
        }}>
          {message.text}
        </div>
      )}

      {/* Profile Tab */}
      {tab === 'profile' && (
        <div style={{ maxWidth: '600px' }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.06)', 
            borderRadius: '16px', 
            padding: '24px',
            marginBottom: '24px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '20px' }}>Profile Information</h3>
            
            {/* Avatar */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
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
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Display Name */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
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
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Nickname */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
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
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none'
                }}
              />
            </div>

            {/* Bio */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
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
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  resize: 'vertical',
                  fontFamily: 'inherit'
                }}
              />
            </div>

            {/* Email (read-only) */}
            <div style={{ marginBottom: '24px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
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
                  border: '1px solid rgba(255,255,255,0.05)',
                  color: 'rgba(255,255,255,0.3)',
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
                background: saving ? 'rgba(124, 58, 237, 0.5)' : 'linear-gradient(135deg, #7c3aed, #ec4899)',
                color: '#fff',
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

      {/* Security Tab */}
      {tab === 'security' && (
        <div style={{ maxWidth: '600px' }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.06)', 
            borderRadius: '16px', 
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Two-Factor Authentication</h3>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '24px' }}>
              Add an extra layer of security to your account by enabling two-factor authentication.
            </p>

            <div style={{ 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'space-between',
              padding: '16px',
              background: 'rgba(0,0,0,0.2)',
              borderRadius: '12px',
              border: '1px solid rgba(255,255,255,0.05)'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '12px',
                  background: settings?.two_factor_enabled ? 'rgba(52, 211, 153, 0.15)' : 'rgba(255,255,255,0.05)',
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
                  <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>
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
                  background: settings?.two_factor_enabled ? 'rgba(248, 113, 113, 0.15)' : 'rgba(52, 211, 153, 0.15)',
                  color: settings?.two_factor_enabled ? '#f87171' : '#34d399',
                  fontSize: '13px',
                  fontWeight: 600,
                  border: `1px solid ${settings?.two_factor_enabled ? 'rgba(248, 113, 113, 0.3)' : 'rgba(52, 211, 153, 0.3)'}`,
                  cursor: saving ? 'not-allowed' : 'pointer',
                  transition: 'all 0.2s ease'
                }}
              >
                {saving ? 'Processing...' : settings?.two_factor_enabled ? 'Disable' : 'Enable'}
              </button>
            </div>
          </div>

          {/* Password Change */}
          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.06)', 
            borderRadius: '16px', 
            padding: '24px',
            marginTop: '24px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Change Password</h3>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '24px' }}>
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
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
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
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
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
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
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
                color: '#fff',
                fontSize: '14px',
                fontWeight: 600,
                border: '1px solid rgba(255,255,255,0.1)',
                cursor: 'pointer'
              }}
            >
              Update Password
            </button>
          </div>
        </div>
      )}

      {/* Preferences Tab */}
      {tab === 'preferences' && (
        <div style={{ maxWidth: '600px' }}>
          <div style={{ 
            background: 'rgba(255,255,255,0.03)', 
            border: '1px solid rgba(255,255,255,0.06)', 
            borderRadius: '16px', 
            padding: '24px'
          }}>
            <h3 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '8px' }}>Reading Preferences</h3>
            <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginBottom: '24px' }}>
              Customize your reading experience.
            </p>

            <div style={{ marginBottom: '20px' }}>
              <label style={{ display: 'block', fontSize: '12px', color: 'rgba(255,255,255,0.5)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Preferred Language
              </label>
              <select
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  background: 'rgba(0,0,0,0.3)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#fff',
                  fontSize: '14px',
                  outline: 'none',
                  cursor: 'pointer'
                }}
              >
                <option value="en">English</option>
                <option value="kh">Khmer</option>
                <option value="th">Thai</option>
              </select>
            </div>
          </div>
        </div>
      )}

      <style jsx global>{`
        input:focus, textarea:focus, select:focus {
          border-color: #7c3aed !important;
        }
      `}</style>
    </div>
  )
}
