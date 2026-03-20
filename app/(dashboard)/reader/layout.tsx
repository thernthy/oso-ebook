import { getServerSession } from 'next-auth'
import { authOptions }      from '@/app/api/auth/[...nextauth]/route'
import { redirect }         from 'next/navigation'
import Link                 from 'next/link'
import AccountPopup         from '@/components/ui/AccountPopup'

export default async function ReaderLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  const user = session.user

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#0c0d10', fontFamily:"'Syne',system-ui,sans-serif" }}>
      <aside style={{ width:220, minWidth:220, background:'#131520', borderRight:'1px solid #252840', display:'flex', flexDirection:'column', overflow:'hidden' }}>
        <div style={{ padding:'24px 20px 20px', borderBottom:'1px solid #252840' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, background:'#5ba4f5', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#0c0d10', flexShrink:0 }}>RE</div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:'#e8eaf8' }}>OSO Ebook</div>
              <div style={{ fontSize:10, color:'#5ba4f5', fontFamily:"'JetBrains Mono',monospace", letterSpacing:'1.5px', textTransform:'uppercase', marginTop:2 }}>Reader</div>
            </div>
          </div>
        </div>
        <nav style={{ flex:1, padding:'12px 0', overflowY:'auto' }}>
          {[
            { label:'My Library',      href:'/reader',          icon:'⬡' },
            { label:'Continue Reading',href:'/reader/library',  icon:'▷' },
            { label:'Browse Books',    href:'/reader/browse',   icon:'▭' },
            { label:'Bookmarks',       href:'/reader/bookmarks',icon:'★' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 20px', color:'#5a5e80', fontSize:13, fontWeight:500, textDecoration:'none', borderLeft:'2px solid transparent' }}>
              <span style={{ width:16, textAlign:'center', fontSize:14 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding:'16px 20px', borderTop:'1px solid #252840' }}>
          <AccountPopup user={user} />
        </div>
      </aside>
      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {children}
      </main>
    </div>
  )
}
