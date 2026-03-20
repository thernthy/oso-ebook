import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'

const ROLE_HOME: Record<string, string> = {
  oso:     '/dashboard/oso',
  partner: '/dashboard/partner',
  author:  '/dashboard/author',
  reader:  '/dashboard/reader',
}

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) redirect('/auth/login')

  const home = ROLE_HOME[session.user.role] ?? '/dashboard/reader'
  redirect(home)
}
