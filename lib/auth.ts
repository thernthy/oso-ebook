import NextAuth, { NextAuthOptions } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'
import { Role } from '@/lib/permissions'

export const authOptions: NextAuthOptions = {
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60,
  },

  pages: {
    signIn:  '/auth/login',
    error:   '/auth/login',
  },

  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email:    { label: 'Email',    type: 'email' },
        password: { label: 'Password', type: 'password' },
      },

      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null

        const [rows] = await pool.execute(
          'SELECT id, name, email, password, role, status, partner_id FROM users WHERE email = ? LIMIT 1',
          [credentials.email]
        ) as any[]

        const user = rows[0]
        if (!user) return null

        if (user.status === 'suspended') {
          throw new Error('Account suspended. Contact support.')
        }
        if (user.status === 'pending') {
          throw new Error('Account pending approval.')
        }

        const valid = await bcrypt.compare(credentials.password, user.password)
        if (!valid) return null

        return {
          id:         user.id,
          name:       user.name,
          email:      user.email,
          role:       user.role as Role,
          status:     user.status,
          partner_id: user.partner_id ?? null,
        }
      },
    }),
  ],

  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id         = user.id
        token.role       = user.role as Role
        token.status     = user.status
        token.partner_id = user.partner_id
      }
      return token
    },

    async session({ session, token }) {
      session.user.id         = token.id
      session.user.role       = token.role
      session.user.status     = token.status
      session.user.partner_id = token.partner_id
      return session
    },

    async redirect({ url, baseUrl }) {
      if (url.startsWith(baseUrl)) return url
      return baseUrl
    },
  },
}
