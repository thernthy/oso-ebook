import { getServerSession } from 'next-auth'
import { authOptions }      from '@/app/api/auth/[...nextauth]/route'
import { redirect }         from 'next/navigation'
import Link                 from 'next/link'

const nav = [
  { section: 'Overview' },
  { label: 'Command Center', href: '/oso',          icon: '⬡' },
  { label: 'Analytics',      href: '/oso/analytics', icon: '◈' },
  { section: 'Management' },
  { label: 'All Users',      href: '/oso/users',    icon: '◎' },
  { label: 'Partners',       href: '/oso/partners', icon: '◇' },
  { label: 'Books Catalog',  href: '/oso/books',    icon: '▭' },
  { section: 'Finance' },
  { label: 'Revenue',        href: '/oso/revenue',  icon: '◈' },
  { label: 'Payouts',        href: '/oso/payouts',  icon: '◁' },
  { section: 'System' },
  { label: 'Platform Settings', href: '/oso/settings', icon: '⊙' },
  { label: 'Storage Config', href: '/oso/settings#storage', icon: '◫' },
]

export default async function OsoLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session || session.user.role !== 'oso') redirect('/auth/login')

  const user = session.user

  return (
    <div style={{ display:'flex', height:'100vh', overflow:'hidden', background:'#0c0c0e', fontFamily:"'Syne',system-ui,sans-serif" }}>
      <aside style={{ width:220, minWidth:220, background:'#131316', borderRight:'1px solid #2a2a32', display:'flex', flexDirection:'column', overflow:'hidden' }}>

        {/* Logo */}
        <div style={{ padding:'24px 20px 20px', borderBottom:'1px solid #2a2a32' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, background:'#e8c547', borderRadius:6, display:'flex', alignItems:'center', justifyContent:'center', fontSize:13, fontWeight:800, color:'#0c0c0e', flexShrink:0, fontFamily:"'JetBrains Mono',monospace" }}>OS</div>
            <div>
              <div style={{ fontSize:15, fontWeight:700, color:'#f0efe8' }}>OSO Ebook</div>
              <div style={{ fontSize:10, color:'#e8c547', fontFamily:"'JetBrains Mono',monospace", letterSpacing:'1.5px', textTransform:'uppercase', marginTop:2 }}>Super Admin</div>
            </div>
          </div>
        </div>

        {/* Nav */}
        <nav style={{ flex:1, padding:'8px 0', overflowY:'auto' }}>
          {nav.map((item, i) => {
            if ('section' in item) {
              return (
                <div key={i} style={{ padding:'14px 20px 5px', fontSize:10, fontWeight:600, color:'#6b6b78', letterSpacing:'2px', textTransform:'uppercase', fontFamily:"'JetBrains Mono',monospace" }}>
                  {item.section}
                </div>
              )
            }
            return (
              <Link key={item.href} href={item.href!}
                style={{ display:'flex', alignItems:'center', gap:10, padding:'9px 20px', color:'#6b6b78', fontSize:13, fontWeight:500, textDecoration:'none', borderLeft:'2px solid transparent', transition:'all .15s' }}>
                <span style={{ width:16, textAlign:'center', fontSize:14, flexShrink:0 }}>{item.icon}</span>
                {item.label}
              </Link>
            )
          })}
        </nav>

        {/* Profile */}
        <div style={{ padding:'16px 20px', borderTop:'1px solid #2a2a32' }}>
          <div style={{ display:'flex', alignItems:'center', gap:10 }}>
            <div style={{ width:32, height:32, borderRadius:'50%', background:'linear-gradient(135deg,#e8c547,#9d7df5)', display:'flex', alignItems:'center', justifyContent:'center', fontSize:12, fontWeight:700, color:'#0c0c0e', flexShrink:0 }}>
              {user.name?.slice(0,2).toUpperCase()}
            </div>
            <div>
              <div style={{ fontSize:13, fontWeight:600, color:'#f0efe8' }}>{user.name}</div>
              <div style={{ fontSize:10, color:'#e8c547', fontFamily:"'JetBrains Mono',monospace" }}>OSO · root</div>
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
