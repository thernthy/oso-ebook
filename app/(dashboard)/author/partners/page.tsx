'use client'

import { useState, useEffect } from 'react'
import { useLanguage } from '@/lib/i18n/LanguageContext'

export default function AuthorPartnersPage() {
  const { t } = useLanguage()
  const [partnerCode, setPartnerCode] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)
  const [myPartner, setMyPartner] = useState<any>(null)
  const [loadingPartner, setLoadingPartner] = useState(true)

  useEffect(() => {
    fetchMyPartner()
  }, [])

  const fetchMyPartner = async () => {
    try {
      const res = await fetch('/api/authors/partner')
      if (res.ok) {
        const data = await res.json()
        setMyPartner(data.partner)
      }
    } catch (e) {
      console.error('Failed to fetch partner', e)
    } finally {
      setLoadingPartner(false)
    }
  }

  const handleJoinPartner = async () => {
    if (!partnerCode.trim()) {
      setMessage({ type: 'error', text: 'Please enter a partner code' })
      return
    }

    setLoading(true)
    setMessage(null)

    try {
      const res = await fetch('/api/partner-codes/request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ partner_code: partnerCode.trim() })
      })

      const data = await res.json()

      if (res.ok) {
        setMessage({ type: 'success', text: `Successfully joined ${data.partner_name}!` })
        setPartnerCode('')
        fetchMyPartner()
      } else {
        setMessage({ type: 'error', text: data.error || 'Failed to join partner' })
      }
    } catch (e) {
      setMessage({ type: 'error', text: 'An error occurred' })
    } finally {
      setLoading(false)
    }
  }

  if (loadingPartner) {
    return (
      <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', background: '#0a0a0f', color: '#fff' }}>
        <div style={{ textAlign: 'center', padding: '60px' }}>Loading...</div>
      </div>
    )
  }

  return (
    <div style={{ flex: 1, overflowY: 'auto', padding: '24px 28px', background: '#0a0a0f', color: '#fff' }}>
      {/* Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, marginBottom: '4px' }}>
          {t('partnerNetwork')}
        </h1>
        <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)' }}>
          Connect with partners to grow your author career
        </p>
      </div>

      {/* My Partner Status */}
      {myPartner ? (
        <div style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid rgba(255,255,255,0.08)',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '32px'
        }}>
          <h2 style={{ fontSize: '16px', fontWeight: 700, marginBottom: '16px', color: 'rgba(255,255,255,0.7)' }}>
            {t('currentPartner')}
          </h2>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, #10b981, #34d399)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '20px',
              fontWeight: 800
            }}>
              {myPartner.name?.charAt(0).toUpperCase()}
            </div>
            <div style={{ flex: 1 }}>
              <h3 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '4px' }}>
                {myPartner.name}
              </h3>
              <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)' }}>
                {myPartner.email}
              </p>
            </div>
            <span style={{
              padding: '6px 14px',
              borderRadius: '8px',
              fontSize: '12px',
              fontWeight: 600,
              background: myPartner.status === 'active' ? 'rgba(52,211,153,0.15)' : 
                         myPartner.status === 'paused' ? 'rgba(251,191,36,0.15)' : 
                         'rgba(239,68,68,0.15)',
              color: myPartner.status === 'active' ? '#34d399' : 
                     myPartner.status === 'paused' ? '#fbbf24' : '#ef4444'
            }}>
              {myPartner.status}
            </span>
          </div>
        </div>
      ) : (
        <div style={{
          background: 'rgba(255,255,255,0.02)',
          border: '1px solid rgba(255,255,255,0.06)',
          borderRadius: '16px',
          padding: '32px',
          marginBottom: '32px'
        }}>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <div style={{ fontSize: '48px', marginBottom: '12px' }}>🤝</div>
            <h2 style={{ fontSize: '20px', fontWeight: 700, marginBottom: '8px' }}>
              {t('joinPartner')}
            </h2>
            <p style={{ fontSize: '14px', color: 'rgba(255,255,255,0.5)', maxWidth: '400px', margin: '0 auto' }}>
              Enter a partner code to connect with a publisher or organization that can help promote your work
            </p>
          </div>

          {/* Join Form */}
          <div style={{ maxWidth: '400px', margin: '0 auto' }}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: 600, marginBottom: '8px', display: 'block' }}>
                {t('partnerCode')}
              </label>
              <input
                type="text"
                value={partnerCode}
                onChange={(e) => setPartnerCode(e.target.value.toUpperCase())}
                placeholder="e.g., PART-ABC12345"
                style={{
                  width: '100%',
                  padding: '14px 16px',
                  background: 'rgba(255,255,255,0.05)',
                  border: '1px solid rgba(255,255,255,0.1)',
                  borderRadius: '12px',
                  fontSize: '16px',
                  color: '#fff',
                  outline: 'none',
                  textAlign: 'center',
                  fontFamily: 'monospace',
                  letterSpacing: '2px'
                }}
              />
            </div>

            {message && (
              <div style={{
                padding: '12px 16px',
                borderRadius: '10px',
                marginBottom: '16px',
                fontSize: '14px',
                textAlign: 'center',
                background: message.type === 'success' ? 'rgba(52,211,153,0.15)' : 'rgba(239,68,68,0.15)',
                border: `1px solid ${message.type === 'success' ? 'rgba(52,211,153,0.3)' : 'rgba(239,68,68,0.3)'}`,
                color: message.type === 'success' ? '#34d399' : '#ef4444'
              }}>
                {message.text}
              </div>
            )}

            <button
              onClick={handleJoinPartner}
              disabled={loading}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '12px',
                background: 'linear-gradient(135deg, #a855f7, #6366f1)',
                border: 'none',
                color: '#fff',
                fontSize: '15px',
                fontWeight: 700,
                cursor: loading ? 'wait' : 'pointer',
                opacity: loading ? 0.7 : 1
              }}
            >
              {loading ? 'Joining...' : `${t('joinPartner')}`}
            </button>
          </div>
        </div>
      )}

      {/* How it Works */}
      <div style={{
        background: 'rgba(255,255,255,0.02)',
        border: '1px solid rgba(255,255,255,0.06)',
        borderRadius: '16px',
        padding: '24px'
      }}>
        <h2 style={{ fontSize: '18px', fontWeight: 700, marginBottom: '20px' }}>
          How Partner Network Works
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '20px' }}>
          {[
            { icon: '🔍', title: 'Find a Partner', desc: 'Get a partner code from a publisher or organization' },
            { icon: '🤝', title: t('joinPartner'), desc: 'Enter the code to connect with the partner' },
            { icon: '📚', title: t('submitForReview'), desc: 'Partners can review and manage your books' },
            { icon: '⭐', title: t('writeReview'), desc: 'Receive ratings and feedback from partners' }
          ].map((item, idx) => (
            <div key={idx} style={{ textAlign: 'center' }}>
              <div style={{ fontSize: '32px', marginBottom: '12px' }}>{item.icon}</div>
              <h3 style={{ fontSize: '14px', fontWeight: 700, marginBottom: '6px' }}>{item.title}</h3>
              <p style={{ fontSize: '12px', color: 'rgba(255,255,255,0.5)' }}>{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
