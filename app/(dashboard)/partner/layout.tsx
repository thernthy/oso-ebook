import { getServerSession } from 'next-auth'
import { authOptions }      from '@/app/api/auth/[...nextauth]/route'
import { redirect }         from 'next/navigation'
import Link                 from 'next/link'
import AccountPopup         from '@/components/ui/AccountPopup'
import LanguageSwitcher     from '@/components/ui/LanguageSwitcher'
import SessionTracker       from '@/components/oso/SessionTracker'
import { getTranslations }  from '@/lib/i18n/server'

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
  const t = getTranslations()
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')
  if (!['partner', 'oso'].includes(session.user.role)) redirect('/auth/login')

  const user = session.user

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#0c0e0f', fontFamily:"'Syne',system-ui,sans-serif" }}>
      <aside style={{ width:220, minWidth:220, background:'#131618', borderRight:'1px solid #252c30', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'24px 20px 20px', borderBottom:'1px solid #252c30' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, background:'#3dd6a3', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#0c0e0f' }}>PT</div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:'#edf0f0' }}>OSO Ebook</div>
              <div style={{ fontSize:10, color:'#3dd6a3', fontFamily:"'JetBrains Mono',monospace", letterSpacing:'1.5px', textTransform:'uppercase', marginTop:2 }}>Partner</div>
            </div>
          </div>
        </div>
        <nav style={{ flex:1, padding:'12px 0', overflowY:'auto' }}>
          {[
            { label:t('dashboard'),     href:'/partner',                  icon:'⬡' },
            { label:t('reviewQueue'),  href:'/partner/books',            icon:'⏳' },
            { label:t('authorStats'),    href:'/partner/authors/manage',    icon:'👥' },
            { label:t('revenue'),       href:'/partner/revenue',          icon:'◈'  },
            { label:t('inviteAuthor'), href:`/partner/authors/invite`,    icon:'+' },
            { label:'Sessions', href:'/partner/sessions', icon:'◉' },
            { label:'Settings', href:'/partner/settings', icon:'⊙' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 20px', color:'#5e6b70', fontSize:13, fontWeight:500, textDecoration:'none', borderLeft:'2px solid transparent' }}>
              <span style={{ width:16, textAlign:'center', fontSize:14 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding:'16px 20px', borderTop:'1px solid #252c30' }}>
          <LanguageSwitcher />
          <AccountPopup user={user} />
        </div>
      </aside>
      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <SessionTracker />
        {children}
      </main>
    </div>
  )
}
