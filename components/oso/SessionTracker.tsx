'use client'

import { useEffect } from 'react'

export default function SessionTracker() {
  useEffect(() => {
    // Generate or retrieve session ID
    let id = sessionStorage.getItem('session_tracking_id')
    if (!id) {
      id = typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2)
      sessionStorage.setItem('session_tracking_id', id)
    }

    async function registerSession() {
      try {
        await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: id,
            userId: 'current',
            userName: 'User',
            userRole: 'oso',
            page: window.location.pathname
          })
        })
      } catch (e) {
        console.error('Failed to register session:', e)
      }
    }

    async function updateSession() {
      try {
        await fetch('/api/sessions', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: id,
            page: window.location.pathname
          })
        })
      } catch (e) {
        console.error('Failed to update session:', e)
      }
    }

    async function removeSession() {
      try {
        await fetch(`/api/sessions?sessionId=${id}`, { method: 'DELETE' })
      } catch (e) {
        console.error('Failed to remove session:', e)
      }
    }

    // Register on mount
    registerSession()

    // Heartbeat to keep session alive
    const heartbeat = setInterval(updateSession, 30000)

    // Cleanup on unmount
    return () => {
      removeSession()
      clearInterval(heartbeat)
    }
  }, [])

  return null
}
