import NextAuth, { DefaultSession, DefaultUser } from 'next-auth'
import { JWT } from 'next-auth/jwt'

type Role = 'oso' | 'partner' | 'author' | 'reader'

declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      role: Role
      status: string
      partner_id: string | null
    } & DefaultSession['user']
  }

  interface User extends DefaultUser {
    id: string
    role: Role
    status: string
    partner_id: string | null
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    role: Role
    status: string
    partner_id: string | null
  }
}
