'use client'

import { useLanguage } from '@/lib/i18n/LanguageContext'
import { useState, useRef, useEffect } from 'react'

const languages = [
  { code: 'en', label: 'English', flag: '🇺🇸' },
  { code: 'kh', label: 'ភាសាខ្មែរ', flag: '🇰🇭' },
  { code: 'th', label: 'ภาษาไทย', flag: '🇹🇭' },
  { code: 'zh', label: '中文', flag: '🇨🇳' },
]

export default function LanguageSwitcher({ variant = 'dropdown' }: { variant?: 'dropdown' | 'buttons' }) {
  const { language, setLanguage } = useLanguage()
  const [isOpen, setIsOpen] = useState(false)
  const dropdownRef = useRef<HTMLDivElement>(null)

  const currentLang = languages.find(l => l.code === language) || languages[0]

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  if (variant === 'buttons') {
    return (
      <div style={{ display: 'flex', gap: '8px' }}>
        {languages.map((lang) => (
          <button
            key={lang.code}
            onClick={() => setLanguage(lang.code as any)}
            style={{
              padding: '6px 12px',
              borderRadius: '8px',
              background: language === lang.code 
                ? 'linear-gradient(135deg, #a855f7, #6366f1)' 
                : 'rgba(255,255,255,0.05)',
              border: `1px solid ${language === lang.code ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
              color: '#fff',
              fontSize: '12px',
              fontWeight: 600,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <span>{lang.flag}</span>
            <span>{lang.code.toUpperCase()}</span>
          </button>
        ))}
      </div>
    )
  }

  return (
    <div ref={dropdownRef} style={{ position: 'relative' }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          padding: '8px 12px',
          borderRadius: '8px',
          background: 'rgba(255,255,255,0.05)',
          border: '1px solid rgba(255,255,255,0.1)',
          color: '#fff',
          fontSize: '13px',
          cursor: 'pointer',
          transition: 'all 0.2s ease'
        }}
      >
        <span>{currentLang.flag}</span>
        <span>{currentLang.label}</span>
        <span style={{ fontSize: '10px', opacity: 0.7 }}>▼</span>
      </button>

      {isOpen && (
        <div style={{
          position: 'absolute',
          top: 'calc(100% + 8px)',
          right: 0,
          background: '#1a1a2e',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '12px',
          padding: '8px',
          minWidth: '180px',
          zIndex: 1000,
          boxShadow: '0 10px 40px rgba(0,0,0,0.5)',
          animation: 'fadeIn 0.2s ease'
        }}>
          {languages.map((lang) => (
            <button
              key={lang.code}
              onClick={() => {
                setLanguage(lang.code as any)
                setIsOpen(false)
              }}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '10px 12px',
                borderRadius: '8px',
                background: language === lang.code ? 'rgba(168,85,247,0.2)' : 'transparent',
                border: 'none',
                color: '#fff',
                fontSize: '14px',
                cursor: 'pointer',
                textAlign: 'left',
                transition: 'background 0.15s ease'
              }}
              onMouseEnter={(e) => {
                if (language !== lang.code) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.05)'
                }
              }}
              onMouseLeave={(e) => {
                if (language !== lang.code) {
                  e.currentTarget.style.background = 'transparent'
                }
              }}
            >
              <span style={{ fontSize: '18px' }}>{lang.flag}</span>
              <span style={{ flex: 1 }}>{lang.label}</span>
              {language === lang.code && (
                <span style={{ color: '#a855f7', fontSize: '14px' }}>✓</span>
              )}
            </button>
          ))}
        </div>
      )}

      <style jsx global>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
