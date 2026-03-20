import { getServerSession } from 'next-auth'
import { authOptions } from './api/auth/[...nextauth]/route'
import { redirect } from 'next/navigation'

const ROLE_HOME: Record<string, string> = {
  oso:     '/oso',
  partner: '/partner',
  author:  '/author',
  reader:  '/reader',
}

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session) redirect('/auth/login')

  const home = ROLE_HOME[session.user.role] ?? '/reader'
  redirect(home)
}
