import { getServerSession } from 'next-auth'
import { authOptions }      from '@/app/api/auth/[...nextauth]/route'
import { redirect }         from 'next/navigation'
import Link                 from 'next/link'

export default async function PartnerLayout({ children }: { children: React.ReactNode }) {
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
            { label:'Dashboard',     href:'/dashboard/partner',              icon:'⬡' },
            { label:'Review Queue',  href:'/dashboard/partner/books',        icon:'⏳' },
            { label:'My Authors',    href:'/dashboard/partner/authors',      icon:'△'  },
            { label:'Revenue',       href:'/dashboard/partner/revenue',      icon:'◈'  },
            { label:'Invite Author', href:`/dashboard/partner/authors/invite`, icon:'+' },
          ].map(item => (
            <Link key={item.href} href={item.href}
              style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 20px', color:'#5e6b70', fontSize:13, fontWeight:500, textDecoration:'none', borderLeft:'2px solid transparent' }}>
              <span style={{ width:16, textAlign:'center', fontSize:14 }}>{item.icon}</span>
              {item.label}
            </Link>
          ))}
        </nav>
        <div style={{ padding:'16px 20px', borderTop:'1px solid #252c30' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#3dd6a3,#5ba4f5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#fff', flexShrink:0 }}>
              {user.name?.slice(0,2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'#edf0f0' }}>{user.name}</div>
              <div style={{ fontSize:10, color:'#3dd6a3', fontFamily:"'JetBrains Mono',monospace" }}>Partner</div>
            </div>
          </div>
        </div>
      </aside>
      <main style={{ flex:1, display:'flex', flexDirection:'column', overflow:'hidden' }}>
        {children}
      </main>
    </div>
  )
}
