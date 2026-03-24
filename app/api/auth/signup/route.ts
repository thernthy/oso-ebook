import { NextRequest, NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import pool from '@/lib/db'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email, phone, password } = body

    if (!name || !email || !password) {
      return NextResponse.json(
        { success: false, error: 'Name, email, and password are required.' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { success: false, error: 'Password must be at least 8 characters.' },
        { status: 400 }
      )
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { success: false, error: 'Invalid email format.' },
        { status: 400 }
      )
    }

    const [existing] = await pool.execute(
      'SELECT id FROM users WHERE email = ? LIMIT 1',
      [email]
    ) as any[]

    if (existing.length > 0) {
      return NextResponse.json(
        { success: false, error: 'An account with this email already exists.' },
        { status: 409 }
      )
    }

    const hashedPassword = await bcrypt.hash(password, 12)

    const [result] = await pool.execute(
      `INSERT INTO users (name, email, phone, password, role, status, created_at, updated_at)
       VALUES (?, ?, ?, ?, 'reader', 'active', NOW(), NOW())`,
      [name, email, phone || null, hashedPassword]
    ) as any[]

    return NextResponse.json(
      { success: true, message: 'Account created successfully.', userId: result.insertId },
      { status: 201 }
    )
  } catch (error) {
    console.error('Signup error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to create account. Please try again.' },
      { status: 500 }
    )
  }
}
