'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type NavItem = {
  label: string
  href: string
  icon: string
}

export default function ReaderNavItems({ items }: { items: NavItem[] }) {
  const pathname = usePathname()
  
  return (
    <>
      {items.map((item) => {
        const isActive = item.href === '/reader' 
          ? pathname === '/reader' || pathname === '/reader/'
          : pathname.startsWith(item.href)
        return (
          <Link 
            key={item.href} 
            href={item.href}
            style={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: '12px',
              padding: '12px 14px',
              marginBottom: '4px',
              borderRadius: '10px',
              color: isActive ? '#ffffff' : 'rgba(255,255,255,0.5)',
              fontSize: '14px',
              fontWeight: isActive ? 600 : 500,
              textDecoration: 'none',
              background: isActive ? 'linear-gradient(135deg, rgba(124,58,237,0.2), rgba(236,72,153,0.15))' : 'transparent',
              border: isActive ? '1px solid rgba(124,58,237,0.3)' : '1px solid transparent',
              transition: 'all 0.2s ease'
            }}
          >
            <span style={{ fontSize: '18px', width: '24px', textAlign: 'center' }}>{item.icon}</span>
            {item.label}
          </Link>
        )
      })}
    </>
  )
}
