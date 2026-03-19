import { NextRequest, NextResponse } from 'next/server';

// Mock login - replace with real DB call
export async function POST(request: NextRequest) {
  try {
    const { email, password } = await request.json();

    // TODO: Validate credentials against database
    // TODO: Generate JWT token
    
    // Mock response
    const mockUser = {
      id: 1,
      uuid: 'user-uuid-123',
      email,
      display_name: 'Test User',
      username: 'testuser',
      role: 'oso_admin', // or 'partner', 'author', 'reader'
      status: 'active',
      email_verified: true,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    return NextResponse.json({
      user: mockUser,
      token: 'mock-jwt-token',
      expires_at: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Invalid credentials' },
      { status: 401 }
    );
  }
}
