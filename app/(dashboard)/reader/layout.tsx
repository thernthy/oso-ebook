import { getServerSession } from 'next-auth'
import { authOptions }      from '@/lib/auth'
import { redirect }         from 'next/navigation'
import ReaderLayoutClient   from '@/components/reader/ReaderLayoutClient'

export default async function ReaderLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions)
  if (!session) redirect('/auth/login')

  return <ReaderLayoutClient user={session.user}>{children}</ReaderLayoutClient>
}
