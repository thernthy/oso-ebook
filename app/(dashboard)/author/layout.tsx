import { getServerSession } from 'next-auth'
import { authOptions }      from '@/lib/auth'
import { redirect }         from 'next/navigation'
import Link                 from 'next/link'
import AccountPopup         from '@/components/ui/AccountPopup'
import LanguageSwitcher     from '@/components/ui/LanguageSwitcher'
import SessionTracker       from '@/components/oso/SessionTracker'
import { getTranslations }  from '@/lib/i18n/server'

export default async function AuthorLayout({ children }: { children: React.ReactNode }) {
  const t = getTranslations()
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')
  if (!['author', 'oso'].includes(session.user.role)) redirect('/auth/login')

  const user = session.user

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#0d0c10', fontFamily:"'Syne',system-ui,sans-serif" }}>

      {/* Sidebar */}
      <aside style={{ width:220, minWidth:220, background:'#151420', borderRight:'1px solid #272635', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'24px 20px 20px', borderBottom:'1px solid #272635' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, background:'#9d7df5', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#0d0c10' }}>AU</div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:'#eeecf8' }}>OSO Ebook</div>
              <div style={{ fontSize:10, color:'#9d7df5', fontFamily:"'JetBrains Mono',monospace", letterSpacing:'1.5px', textTransform:'uppercase', marginTop:2 }}>Author</div>
            </div>
          </div>
        </div>

        <nav style={{ flex:1, padding:'12px 0', overflowY:'auto' }}>
          {[
            { label:t('home'),     href:'/author',              icon:'⬡' },
            { label:t('myBooks'),     href:'/author/books',         icon:'▭' },
            { label:t('newBook'),     href:'/author/books/new',     icon:'+' },
            { label:t('partners'),     href:'/author/partners',      icon:'🤝' },
            { label:'Reviews',     href:'/author/reviews',        icon:'⭐' },
            { label:'Earnings',    href:'/author/revenue',        icon:'◈' },
            { label:'Sessions',    href:'/author/sessions',        icon:'◉' },
          ].map(item => (
            <NavItem key={item.href} {...item} />
          ))}
        </nav>

        <div style={{ padding:'16px 20px', borderTop:'1px solid #272635' }}>
          <LanguageSwitcher />
          <AccountPopup user={user} />
        </div>
      </aside>

      {/* Main content */}
      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <SessionTracker />
        {children}
      </main>
    </div>
  )
}

function NavItem({ label, href, icon }: { label: string; href: string; icon: string }) {
  return (
    <Link href={href} style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 20px', color:'#635e80', fontSize:13, fontWeight:500, textDecoration:'none', borderLeft:'2px solid transparent', transition:'all .15s' }}
      className="nav-link">
      <span style={{ width:16, textAlign:'center', fontSize:14 }}>{icon}</span>
      {label}
    </Link>
  )
}
