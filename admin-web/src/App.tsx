import { useEffect, useState, useRef } from 'react'
import { Session } from '@supabase/supabase-js'
import { supabase, getStoredSession } from './supabase'
import Login from './pages/Login'
import Events from './pages/Events'

export type UserRole = 'artist' | 'organizer' | 'public' | 'admin'

async function fetchRole(userId: string): Promise<UserRole | null> {
  try {
    const { data } = await supabase.from('users').select('role').eq('user_id', userId).single()
    return data?.role ?? null
  } catch {
    return null
  }
}

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [authReady, setAuthReady] = useState(false)

  const hasSessionRef = useRef(false)

  useEffect(() => {
    let cancelled = false
    const timeout = setTimeout(() => {
      if (!cancelled) setAuthReady(true)
    }, 3000)

    // Important: do NOT call supabase.* inside onAuthStateChange – it causes signInWithPassword to deadlock
    const applySession = (s: Session | null) => {
      if (cancelled) return
      hasSessionRef.current = !!s?.user
      if (s?.user) {
        setSession(s)
      } else {
        setSession(null)
        setRole(null)
      }
      setAuthReady(true)
      clearTimeout(timeout)
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        if (cancelled) return
        applySession(s)
      }
    )

    // Fallback: auth client can miss session after custom sign-in + reload. Check localStorage.
    const fallback = setTimeout(() => {
      if (cancelled || hasSessionRef.current) return
      const stored = getStoredSession()
      if (stored?.user) {
        applySession(stored)
      }
    }, 800)

    return () => {
      cancelled = true
      clearTimeout(timeout)
      clearTimeout(fallback)
      subscription.unsubscribe()
    }
  }, [])

  // Fetch role in a separate effect – never inside onAuthStateChange to avoid auth deadlock
  useEffect(() => {
    if (!session?.user) {
      setRole(null)
      return
    }
    let cancelled = false
    fetchRole(session.user.id).then((r) => {
      if (!cancelled) setRole(r)
    })
    return () => {
      cancelled = true
    }
  }, [session?.user?.id])

  const onLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setRole(null)
  }

  if (!authReady) {
    return (
      <div style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        minHeight: '100vh',
        background: '#09090b',
      }}>
        <span style={{ color: '#71717a', fontSize: 14 }}>Loading…</span>
      </div>
    )
  }

  if (!session?.user || role !== 'admin') {
    return <Login role={role} />
  }

  return <Events onLogout={onLogout} />
}

export default App
