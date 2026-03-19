import { NextResponse } from 'next/server';

// GET /api/oso/stats - Get OSO dashboard stats
export async function GET() {
  // TODO: Verify OSO admin authentication
  // TODO: Query database for real stats

  const mockStats = {
    totalUsers: 1247,
    totalPartners: 12,
    totalAuthors: 89,
    totalReaders: 1146,
    totalBooks: 456,
    totalChapters: 3240,
    pendingVerifications: 5,
    recentSignups: [
      {
        id: 1,
        display_name: 'John Doe',
        username: 'johndoe',
        created_at: new Date().toISOString(),
      },
      {
        id: 2,
        display_name: 'Jane Smith',
        username: 'janesmith',
        created_at: new Date(Date.now() - 86400000).toISOString(),
      },
    ],
  };

  return NextResponse.json(mockStats);
}
