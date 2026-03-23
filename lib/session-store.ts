// In-memory session store for active connections
// In production, consider using Redis for multi-instance deployments

interface ActiveSession {
  id: string
  userId: string
  userName: string
  userRole: string
  userEmail: string
  ip: string
  userAgent: string
  connectedAt: number
  lastActivity: number
  page: string
}

class SessionStore {
  private sessions: Map<string, ActiveSession> = new Map()

  add(session: ActiveSession) {
    this.sessions.set(session.id, session)
  }

  remove(sessionId: string) {
    this.sessions.delete(sessionId)
  }

  updateActivity(sessionId: string, page?: string) {
    const session = this.sessions.get(sessionId)
    if (session) {
      session.lastActivity = Date.now()
      if (page) session.page = page
    }
  }

  getAll(): ActiveSession[] {
    const now = Date.now()
    const timeout = 5 * 60 * 1000 // 5 minutes without activity = inactive
    
    // Clean up inactive sessions
    const entries = Array.from(this.sessions.entries())
    for (const [id, session] of entries) {
      if (now - session.lastActivity > timeout) {
        this.sessions.delete(id)
      }
    }
    
    return Array.from(this.sessions.values()).sort((a, b) => b.connectedAt - a.connectedAt)
  }

  getByUserId(userId: string): ActiveSession[] {
    return this.getAll().filter(s => s.userId === userId)
  }

  getById(sessionId: string): ActiveSession | undefined {
    return this.sessions.get(sessionId)
  }

  count(): number {
    return this.getAll().length
  }

  cleanup() {
    const now = Date.now()
    const timeout = 5 * 60 * 1000
    const entries = Array.from(this.sessions.entries())
    for (const [id, session] of entries) {
      if (now - session.lastActivity > timeout) {
        this.sessions.delete(id)
      }
    }
  }
}

export const sessionStore = new SessionStore()

// Cleanup inactive sessions every minute
setInterval(() => {
  sessionStore.cleanup()
}, 60 * 1000)
