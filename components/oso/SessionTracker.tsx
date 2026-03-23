'use client'

import { useEffect, useState } from 'react'

interface UserInfo {
  id: string
  name: string
  email: string
  role: string
}

export default function SessionTracker() {
  const [userInfo, setUserInfo] = useState<UserInfo | null>(null)

  useEffect(() => {
    // Get user info from session
    fetch('/api/auth/session')
      .then(r => r.json())
      .then(j => {
        if (j.user) {
          setUserInfo({
            id: j.user.id,
            name: j.user.name,
            email: j.user.email,
            role: j.user.role
          })
        }
      })
      .catch(() => console.error('Failed to get session'))
  }, [])

  useEffect(() => {
    if (!userInfo) return

    let id = sessionStorage.getItem('session_tracking_id')
    if (!id) {
      id = typeof crypto !== 'undefined' ? crypto.randomUUID() : Math.random().toString(36).slice(2)
      sessionStorage.setItem('session_tracking_id', id)
    }

    async function registerSession() {
      if (!userInfo) return
      try {
        await fetch('/api/sessions', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            sessionId: id,
            userId: userInfo.id,
            userName: userInfo.name,
            userRole: userInfo.role,
            userEmail: userInfo.email,
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
  }, [userInfo])

  return null
}
