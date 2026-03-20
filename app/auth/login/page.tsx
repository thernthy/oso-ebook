'use client'

import { useState, FormEvent } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'

export default function LoginPage() {
  const router       = useRouter()
  const searchParams = useSearchParams()
  const callbackUrl  = searchParams.get('callbackUrl') || ''

  const [email,    setEmail]    = useState('')
  const [password, setPassword] = useState('')
  const [error,    setError]    = useState('')
  const [loading,  setLoading]  = useState(false)

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setLoading(true)

    const result = await signIn('credentials', {
      email,
      password,
      redirect: false,
    })

    setLoading(false)

    if (!result?.ok) {
      setError(result?.error || 'Invalid email or password.')
      return
    }

    // Redirect to callback or let middleware send to role dashboard
    if (callbackUrl) {
      router.push(callbackUrl)
    } else {
      // Fetch session to get role and redirect
      const res  = await fetch('/api/auth/session')
      const data = await res.json()
      const roleRoutes: Record<string, string> = {
        oso:     '/oso',
        partner: '/partner',
        author:  '/author',
        reader:  '/reader',
      }
      router.push(roleRoutes[data?.user?.role] ?? '/reader')
    }
  }

  return (
    <div style={styles.shell}>
      {/* Background grid effect */}
      <div style={styles.grid} />

      <div style={styles.card}>
        {/* Logo */}
        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>OS</div>
          <div>
            <div style={styles.logoText}>OSO Ebook</div>
            <div style={styles.logoSub}>Platform Login</div>
          </div>
        </div>

        <h1 style={styles.heading}>Welcome back</h1>
        <p style={styles.subheading}>Sign in to your account to continue</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Email address</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={styles.input}
              onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={e  => Object.assign(e.target.style, styles.input)}
            />
          </div>

          <div style={styles.field}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <label style={styles.label}>Password</label>
              <span style={styles.forgot}>Forgot password?</span>
            </div>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="••••••••"
              required
              style={styles.input}
              onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={e  => Object.assign(e.target.style, styles.input)}
            />
          </div>

          {error && (
            <div style={styles.errorBox}>
              <span style={{ marginRight: 8 }}>⚠</span>{error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            style={{ ...styles.submitBtn, opacity: loading ? 0.7 : 1 }}
          >
            {loading ? 'Signing in…' : 'Sign in →'}
          </button>
        </form>

        {/* Role hints */}
        <div style={styles.roleHints}>
          <div style={styles.roleHintLabel}>Access levels</div>
          <div style={styles.roleRow}>
            {[
              { role:'OSO',     color:'#e8c547', desc:'Super Admin' },
              { role:'Partner', color:'#3dd6a3', desc:'Publisher'   },
              { role:'Author',  color:'#9d7df5', desc:'Writer'      },
              { role:'Reader',  color:'#5ba4f5', desc:'Subscriber'  },
            ].map(r => (
              <div key={r.role} style={styles.roleChip}>
                <span style={{ ...styles.roleDot, background: r.color }} />
                <span style={styles.roleChipText}>{r.role}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div style={styles.footer}>
        OSO Ebook Platform · v0.1 · © 2026
      </div>
    </div>
  )
}

// ─── Inline styles (matches dashboard dark theme) ─────────────
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
    background:     '#e8c547',
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
    transition:   'border-color .15s',
  },
  inputFocus: {
    background:   '#1a1a1f',
    border:       '1px solid #e8c547',
    borderRadius: '8px',
    padding:      '11px 14px',
    fontSize:     '14px',
    color:        '#f0efe8',
    outline:      'none',
    width:        '100%',
    fontFamily:   "'Syne', system-ui, sans-serif",
  },
  forgot: {
    fontSize:  '12px',
    color:     '#e8c547',
    cursor:    'pointer',
    fontFamily:"'JetBrains Mono', monospace",
  },
  errorBox: {
    background:   'rgba(240,112,96,0.1)',
    border:       '1px solid rgba(240,112,96,0.3)',
    borderRadius: '8px',
    padding:      '10px 14px',
    fontSize:     '13px',
    color:        '#f07060',
    display:      'flex',
    alignItems:   'center',
  },
  submitBtn: {
    background:    '#e8c547',
    color:         '#0c0c0e',
    border:        'none',
    borderRadius:  '8px',
    padding:       '13px',
    fontSize:      '14px',
    fontWeight:    700,
    cursor:        'pointer',
    fontFamily:    "'Syne', system-ui, sans-serif",
    letterSpacing: '-0.2px',
    marginTop:     '4px',
    transition:    'background .15s',
  },
  roleHints: {
    marginTop:  '28px',
    paddingTop: '20px',
    borderTop:  '1px solid #2a2a32',
  },
  roleHintLabel: {
    fontSize:     '10px',
    color:        '#6b6b78',
    fontFamily:   "'JetBrains Mono', monospace",
    letterSpacing:'1.5px',
    textTransform:'uppercase',
    marginBottom: '10px',
  },
  roleRow: {
    display: 'flex',
    gap:     '8px',
    flexWrap:'wrap',
  },
  roleChip: {
    display:      'flex',
    alignItems:   'center',
    gap:          '6px',
    background:   '#1a1a1f',
    border:       '1px solid #2a2a32',
    borderRadius: '6px',
    padding:      '4px 10px',
  },
  roleDot: {
    width:        '6px',
    height:       '6px',
    borderRadius: '50%',
    flexShrink:   0,
  },
  roleChipText: {
    fontSize:   '11px',
    color:      '#9a9aa8',
    fontFamily: "'JetBrains Mono', monospace",
  },
  footer: {
    marginTop:  '24px',
    fontSize:   '11px',
    color:      '#3a3a44',
    fontFamily: "'JetBrains Mono', monospace",
    zIndex:     1,
  },
}
