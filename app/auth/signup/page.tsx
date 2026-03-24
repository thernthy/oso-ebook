'use client'

import { useState, useEffect, FormEvent } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useLanguage } from '@/lib/i18n/LanguageContext'
import LanguageSwitcher from '@/components/ui/LanguageSwitcher'

const DEFAULT_PREFIXES = ['+855', '+66', '+86']

export default function SignupPage() {
  const t = useLanguage().t
  const router = useRouter()

  const [name,         setName]         = useState('')
  const [email,        setEmail]        = useState('')
  const [phone,        setPhone]        = useState('')
  const [phonePrefix,  setPhonePrefix]  = useState('+855')
  const [phoneOptions, setPhoneOptions] = useState<string[]>(DEFAULT_PREFIXES)
  const [password,     setPassword]     = useState('')
  const [confirmPass,  setConfirmPass]  = useState('')
  const [error,        setError]        = useState('')
  const [loading,      setLoading]      = useState(false)

  useEffect(() => {
    fetch('/api/platform/config?key=phone_prefix')
      .then(res => res.json())
      .then(data => {
        if (data.success && data.settings?.phone_prefix) {
          const prefixes = data.settings.phone_prefix
            .split(',')
            .map((p: string) => p.trim())
            .filter((p: string) => p.startsWith('+'))
          if (prefixes.length > 0) {
            setPhoneOptions(prefixes)
            setPhonePrefix(prefixes[0])
          }
        }
      })
      .catch(() => {})
  }, [])

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')

    if (password !== confirmPass) {
      setError('Passwords do not match.')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)

    try {
      const fullPhone = phone ? `${phonePrefix}${phone}` : ''
      const res = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email, phone: fullPhone, password }),
      })

      const data = await res.json()

      if (!data.success) {
        setError(data.error || 'Failed to create account.')
        setLoading(false)
        return
      }

      router.push('/auth/login?success=account_created')
    } catch {
      setError('A network error occurred.')
      setLoading(false)
    }
  }

  return (
    <div style={styles.shell}>
      <div style={styles.grid} />

      <div style={styles.card}>
        <div style={{ position:'absolute', top:20, right:20 }}>
          <LanguageSwitcher />
        </div>

        <div style={styles.logoRow}>
          <div style={styles.logoIcon}>OS</div>
          <div>
            <div style={styles.logoText}>OSO Ebook</div>
            <div style={styles.logoSub}>Reader Signup</div>
          </div>
        </div>

        <h1 style={styles.heading}>Join as a Reader</h1>
        <p style={styles.subheading}>Create your account to start reading</p>

        <form onSubmit={handleSubmit} style={styles.form}>
          <div style={styles.field}>
            <label style={styles.label}>Display Name</label>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Your name"
              required
              style={styles.input}
              onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={e => Object.assign(e.target.style, styles.input)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>{t('email')}</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              style={styles.input}
              onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={e => Object.assign(e.target.style, styles.input)}
            />
          </div>

          <div style={styles.field}>
            <label style={styles.label}>Phone Number</label>
            <div style={styles.phoneRow}>
              <select
                value={phonePrefix}
                onChange={e => setPhonePrefix(e.target.value)}
                style={styles.phoneSelect}
              >
                {phoneOptions.map(prefix => (
                  <option key={prefix} value={prefix}>{prefix}</option>
                ))}
              </select>
              <input
                type="tel"
                value={phone}
                onChange={e => setPhone(e.target.value.replace(/\D/g, ''))}
                placeholder="12 345 678"
                style={styles.phoneInput}
                onFocus={e => Object.assign(e.target.style, styles.phoneInputFocus)}
                onBlur={e => Object.assign(e.target.style, styles.phoneInput)}
              />
            </div>
          </div>

          <div style={styles.field}>
            <label style={styles.label}>{t('password')}</label>
            <input
              type="password"
              value={password}
              onChange={e => setPassword(e.target.value)}
              placeholder="Min. 8 characters"
              required
              style={styles.input}
              onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={e => Object.assign(e.target.style, styles.input)}
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
              onFocus={e => Object.assign(e.target.style, styles.inputFocus)}
              onBlur={e => Object.assign(e.target.style, styles.input)}
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
            {loading ? t('loading') : 'Create Account →'}
          </button>
        </form>

        <div style={styles.footer}>
          <span style={styles.footerText}>{t('haveAccount')}</span>
          <Link href="/auth/login" style={styles.loginLink}>
            {t('signIn')}
          </Link>
        </div>
      </div>

      <div style={styles.pageFooter}>
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
    background:     '#5ba4f5',
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
  phoneRow: {
    display:    'flex',
    gap:        '8px',
  },
  phoneSelect: {
    background:   '#1a1a1f',
    border:       '1px solid #2a2a32',
    borderRadius: '8px',
    padding:      '11px 12px',
    fontSize:     '14px',
    color:        '#f0efe8',
    fontFamily:   "'JetBrains Mono', monospace",
    cursor:       'pointer',
    minWidth:     '70px',
  },
  phoneInput: {
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
  phoneInputFocus: {
    background:   '#1a1a1f',
    border:       '1px solid #5ba4f5',
    borderRadius: '8px',
    padding:      '11px 14px',
    fontSize:     '14px',
    color:        '#f0efe8',
    outline:      'none',
    width:        '100%',
    fontFamily:   "'Syne', system-ui, sans-serif",
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
    border:       '1px solid #5ba4f5',
    borderRadius: '8px',
    padding:      '11px 14px',
    fontSize:     '14px',
    color:        '#f0efe8',
    outline:      'none',
    width:        '100%',
    fontFamily:   "'Syne', system-ui, sans-serif",
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
    background:    '#5ba4f5',
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
  footer: {
    marginTop:  '24px',
    paddingTop: '20px',
    borderTop:  '1px solid #2a2a32',
    display:    'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap:        '6px',
  },
  footerText: {
    fontSize:   '13px',
    color:      '#6b6b78',
    fontFamily: "'JetBrains Mono', monospace",
  },
  loginLink: {
    fontSize:   '13px',
    color:      '#5ba4f5',
    fontFamily: "'JetBrains Mono', monospace",
    textDecoration: 'none',
    fontWeight: 600,
  },
  pageFooter: {
    marginTop:  '24px',
    fontSize:   '11px',
    color:      '#3a3a44',
    fontFamily: "'JetBrains Mono', monospace",
    zIndex:     1,
  },
}
