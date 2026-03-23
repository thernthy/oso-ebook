import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'
import PublicLanding from '@/components/PublicLanding'

const ROLE_HOME: Record<string, string> = {
  oso:     '/oso',
  partner: '/partner',
  author:  '/author',
  reader:  '/reader',
}

export default async function Home() {
  const session = await getServerSession(authOptions)

  // Not logged in - show public landing page
  if (!session) {
    return <PublicLanding />
  }

  // Logged in - redirect to appropriate dashboard
  const home = ROLE_HOME[session.user.role] ?? '/reader'
  redirect(home)
}
