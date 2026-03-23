import { NextRequest } from 'next/server'
import { sessionStore } from '@/lib/session-store'
import { ok, err, requireAuth } from '@/lib/api-helpers'

// ─── GET /api/sessions ───────────────────────────────────────
// Returns list of active sessions (OSO only)
// OR opens SSE stream for real-time updates
export async function GET(req: NextRequest) {
  const url = new URL(req.url)
  const format = url.searchParams.get('format')

  // SSE stream - real-time updates
  if (format === 'sse') {
    const { session, response } = await requireAuth()
    if (response) return response

    const encoder = new TextEncoder()
    let intervalId: NodeJS.Timeout

    const stream = new ReadableStream({
      start(controller) {
        // Send initial data
        const sessions = sessionStore.getAll()
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'sessions', sessions })}\n\n`))

        // Set up interval for regular updates
        intervalId = setInterval(() => {
          const currentSessions = sessionStore.getAll()
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'sessions', sessions: currentSessions })}\n\n`))
        }, 3000) // Update every 3 seconds

        // Send heartbeat to keep connection alive
        const heartbeatId = setInterval(() => {
          try {
            controller.enqueue(encoder.encode(`: heartbeat\n\n`))
          } catch {
            clearInterval(heartbeatId)
          }
        }, 15000)
      },
      cancel() {
        clearInterval(intervalId)
      }
    })

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  }

  // Regular JSON response (OSO only)
  const { response: authResponse } = await requireAuth()
  if (authResponse) return authResponse

  const sessions = sessionStore.getAll()
  return ok({ sessions, total: sessions.length })
}

// ─── POST /api/sessions ─────────────────────────────────────
// Register a new session (called when user logs in)
export async function POST(req: NextRequest) {
  const body = await req.json()
  const { sessionId, userId, userName, userRole, userEmail, ip, userAgent, page } = body

  if (!sessionId || !userId) {
    return err('sessionId and userId are required')
  }

  sessionStore.add({
    id: sessionId,
    userId,
    userName: userName || 'Unknown',
    userRole: userRole || 'reader',
    userEmail: userEmail || '',
    ip: ip || req.headers.get('x-forwarded-for') || 'unknown',
    userAgent: userAgent || req.headers.get('user-agent') || 'unknown',
    connectedAt: Date.now(),
    lastActivity: Date.now(),
    page: page || '/'
  })

  return ok({ message: 'Session registered' })
}

// ─── PATCH /api/sessions ────────────────────────────────────
// Update session activity (called on page navigation)
export async function PATCH(req: NextRequest) {
  const body = await req.json()
  const { sessionId, page } = body

  if (!sessionId) {
    return err('sessionId is required')
  }

  sessionStore.updateActivity(sessionId, page)
  return ok({ message: 'Session updated' })
}

// ─── DELETE /api/sessions ───────────────────────────────────
// Remove a session (called on logout)
export async function DELETE(req: NextRequest) {
  const url = new URL(req.url)
  const sessionId = url.searchParams.get('sessionId')

  if (!sessionId) {
    return err('sessionId is required')
  }

  sessionStore.remove(sessionId)
  return ok({ message: 'Session removed' })
}
