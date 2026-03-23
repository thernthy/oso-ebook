'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function AcceptInvitePage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const token        = searchParams.get('token')

  const [loading,     setLoading]     = useState(true)
  const [submitting,  setSubmitting]  = useState(false)
  const [error,       setError]       = useState('')
  const [inviteInfo,  setInviteInfo]  = useState<any>(null)

  const [name,        setName]        = useState('')
  const [password,    setPassword]    = useState('')
  const [confirmPass, setConfirmPass] = useState('')

  // 1. Verify token on mount
  useEffect(() => {
    if (!token) {
      setError('No invitation token provided.')
      setLoading(false)
      return
    }

    fetch(`/api/auth/accept-invite?token=${token}`)
      .then(res => res.json())
      .then(data => {
        if (!data.success) {
          setError(data.error || 'Invalid or expired invitation.')
        } else {
          setInviteInfo(data.data)
        }
        setLoading(false)
      })
      .catch(() => {
        setError('Failed to verify invitation.')
        setLoading(false)
      })
  }, [token])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPass) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters long.')
      return
    }

    setSubmitting(true)

    try {
      const res = await fetch('/api/auth/accept-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, name, password }),
      })

      const data = await res.json()
      if (!data.success) {
        setError(data.error || 'Failed to create account.')
        setSubmitting(false)
      } else {
        // Success! Redirect to login
        router.push('/auth/login?success=account_created')
      }
    } catch (err) {
      setError('A network error occurred.')
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div style={styles.shell}>
        <div style={styles.grid} />
        <div style={styles.loadingText}>Verifying invitation...</div>
      </div>
    )
  }

  return (
    <div style={styles.shell}>
      <div style={styles.grid} />

      <div style={styles.card}>
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>AT</div>
          <div>
            <div style={styles.logoText}>OSO Ebook</div>
            <div style={styles.logoSub}>Author Onboarding</div>
          </div>
        </div>

        {error ? (
          <div style={{ textAlign: 'center' }}>
            <h1 style={styles.heading}>Invite Error</h1>
            <p style={styles.subheading}>{error}</p>
            <button onClick={() => router.push('/auth/login')} style={styles.secondaryBtn}>
              Back to Login
            </button>
          </div>
        ) : (
          <>
            <h1 style={styles.heading}>Complete Your Profile</h1>
            <p style={styles.subheading}>
              You've been invited by <strong style={{ color: '#9d7df5' }}>{inviteInfo?.partner_name}</strong> to join as an Author.
            </p>

            <form onSubmit={handleSubmit} style={styles.form}>
              <div style={styles.field}>
                <label style={styles.label}>Email Address</label>
                <input
                  type="email"
                  value={inviteInfo?.email}
                  disabled
                  style={{ ...styles.input, opacity: 0.6, cursor: 'not-allowed' }}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Display Name / Pen Name</label>
                <input
                  type="text"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Jane Doe"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Create Password</label>
                <input
                  type="password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                  placeholder="Min. 8 characters"
                  required
                  style={styles.input}
                />
              </div>

              <div style={styles.field}>
                <label style={styles.label}>Confirm Password</label>
                <input
                  type="password"
                  value={confirmPass}
                  onChange={e => setConfirmPass(e.target.value)}
                  placeholder="••••••••"
                  required
                  style={styles.input}
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                style={{ ...styles.submitBtn, opacity: submitting ? 0.7 : 1 }}
              >
                {submitting ? 'Creating Account...' : 'Join Platform →'}
              </button>
            </form>
          </>
        )}
      </div>

      <div style={styles.footer}>
        OSO Ebook Platform · v0.1 · © 2026
      </div>
    </div>
  )
}

const styles: Record<string, React.CSSProperties> = {
  shell: {
    minHeight:       '100vh',
    background:      '#0c0c0e',
    display:         'flex',
    flexDirection:   'column',
    alignItems:      'center',
    justifyContent:  'center',
    padding:         '32px 16px',
    position:        'relative',
    fontFamily:      "'Syne', system-ui, sans-serif",
  },
  grid: {
    position:         'fixed',
    inset:            0,
    backgroundImage:  'linear-gradient(rgba(255,255,255,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.02) 1px, transparent 1px)',
    backgroundSize:   '48px 48px',
    pointerEvents:    'none',
  },
  loadingText: {
    color:      '#6b6b78',
    fontSize:   '14px',
    fontFamily: "'JetBrains Mono', monospace",
    zIndex:     1,
  },
  card: {
    background:    '#131316',
    border:        '1px solid #2a2a32',
    borderRadius:  '16px',
    padding:       '36px',
    width:         '100%',
    maxWidth:      '420px',
    position:      'relative',
    zIndex:        1,
  },
  logoRow: {
    display:       'flex',
    alignItems:    'center',
    gap:           '12px',
    marginBottom:  '28px',
  },
  logoIcon: {
    width:          '40px',
    height:         '40px',
    background:     '#9d7df5',
    borderRadius:   '8px',
    display:        'flex',
    alignItems:     'center',
    justifyContent: 'center',
    fontSize:       '15px',
    fontWeight:     800,
    color:          '#0c0c0e',
    flexShrink:     0,
    fontFamily:     "'JetBrains Mono', monospace",
  },
  logoText: {
    fontSize:     '17px',
    fontWeight:   700,
    color:        '#f0efe8',
    letterSpacing:'-0.3px',
  },
  logoSub: {
    fontSize:     '11px',
    color:        '#6b6b78',
    fontFamily:   "'JetBrains Mono', monospace",
    letterSpacing:'1px',
    textTransform:'uppercase',
    marginTop:    '2px',
  },
  heading: {
    fontSize:     '22px',
    fontWeight:   800,
    color:        '#f0efe8',
    letterSpacing:'-0.5px',
    marginBottom: '6px',
  },
  subheading: {
    fontSize:     '13px',
    color:        '#6b6b78',
    marginBottom: '28px',
    fontFamily:   "'JetBrains Mono', monospace",
    lineHeight:   '1.5',
  },
  form: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '18px',
  },
  field: {
    display:       'flex',
    flexDirection: 'column',
    gap:           '7px',
  },
  label: {
    fontSize:     '12px',
    fontWeight:   600,
    color:        '#9a9aa8',
    letterSpacing:'0.3px',
    fontFamily:   "'JetBrains Mono', monospace",
  },
  input: {
    background:   '#1a1a1f',
    border:       '1px solid #2a2a32',
    borderRadius: '8px',
    padding:      '11px 14px',
    fontSize:     '14px',
    color:        '#f0efe8',
    outline:      'none',
    width:        '100%',
    fontFamily:   "'Syne', system-ui, sans-serif",
  },
  submitBtn: {
    background:    '#9d7df5',
    color:         '#fff',
    border:        'none',
    borderRadius:  '8px',
    padding:       '13px',
    fontSize:      '14px',
    fontWeight:    700,
    cursor:        'pointer',
    fontFamily:    "'Syne', system-ui, sans-serif",
    letterSpacing: '-0.2px',
    marginTop:     '4px',
  },
  secondaryBtn: {
    background:    'transparent',
    color:         '#6b6b78',
    border:        '1px solid #2a2a32',
    borderRadius:  '8px',
    padding:       '10px 20px',
    fontSize:      '13px',
    fontWeight:    600,
    cursor:        'pointer',
    marginTop:     '20px',
  },
  footer: {
    marginTop:  '24px',
    fontSize:   '11px',
    color:      '#3a3a44',
    fontFamily: "'JetBrains Mono', monospace",
    zIndex:     1,
  },
}
