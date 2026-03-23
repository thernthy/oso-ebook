import { NextRequest } from 'next/server'
import { sessionStore } from '@/lib/session-store'
import { ok, err, requireAuth } from '@/lib/api-helpers'

// ─── GET /api/sessions ───────────────────────────────────────
// Returns list of active sessions
// OSO: all sessions
// Partner/Author: their own sessions only
export async function GET(req: NextRequest) {
  const { session, response } = await requireAuth()
  if (response) return response

  const url = new URL(req.url)
  const format = url.searchParams.get('format')

  // SSE stream - real-time updates
  if (format === 'sse') {
    const encoder = new TextEncoder()
    let intervalId: NodeJS.Timeout

    const isOso = session!.user.role === 'oso'
    const userId = session!.user.id

    const stream = new ReadableStream({
      start(controller) {
        const sessions = isOso 
          ? sessionStore.getAll() 
          : sessionStore.getByUserId(userId)
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'sessions', sessions })}\n\n`))

        intervalId = setInterval(() => {
          const currentSessions = isOso 
            ? sessionStore.getAll() 
            : sessionStore.getByUserId(userId)
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ type: 'sessions', sessions: currentSessions })}\n\n`))
        }, 3000)

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

  // Regular JSON response
  const isOso = session!.user.role === 'oso'
  const userId = session!.user.id

  const sessions = isOso 
    ? sessionStore.getAll() 
    : sessionStore.getByUserId(userId)

  return ok({ sessions, total: sessions.length, isOso })
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
// OSO can delete any session, others can only delete their own
export async function DELETE(req: NextRequest) {
  const url = new URL(req.url)
  const sessionId = url.searchParams.get('sessionId')

  if (!sessionId) {
    return err('sessionId is required')
  }

  const { session, response } = await requireAuth()
  if (response) return response

  // Check if user owns this session or is OSO
  const existingSession = sessionStore.getById(sessionId)
  if (!existingSession) {
    return ok({ message: 'Session not found or already removed' })
  }

  const isOso = session!.user.role === 'oso'
  const isOwner = existingSession.userId === session!.user.id

  if (!isOso && !isOwner) {
    return err('Forbidden: cannot delete another user\'s session', 403)
  }

  sessionStore.remove(sessionId)
  return ok({ message: 'Session removed' })
}
