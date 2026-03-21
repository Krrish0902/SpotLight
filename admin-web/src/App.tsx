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

import Analytics from './pages/Analytics'

function App() {
  const [session, setSession] = useState<Session | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [authReady, setAuthReady] = useState(false)
  const [activeTab, setActiveTab] = useState<'moderation' | 'analytics'>('moderation')

  const hasSessionRef = useRef(false)
// ... (omitted lines for brevity, but I need to replace the whole block)

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

  return (
    <div className="min-h-screen bg-[#09090b] text-[#fafafa]">
      <header className="border-b border-[#18181b] bg-[#09090b]/80 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <h1 className="text-xl font-bold bg-gradient-to-r from-[#a855f7] to-[#ec4899] bg-clip-text text-transparent">
              ArtistHub Admin
            </h1>
            <nav className="flex gap-1">
              <button
                onClick={() => setActiveTab('moderation')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'moderation' ? 'bg-[#18181b] text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Moderation
              </button>
              <button
                onClick={() => setActiveTab('analytics')}
                className={`px-4 py-2 rounded-md transition-colors ${
                  activeTab === 'analytics' ? 'bg-[#18181b] text-white' : 'text-zinc-400 hover:text-white'
                }`}
              >
                Analytics
              </button>
            </nav>
          </div>
          <button 
            onClick={onLogout}
            className="text-sm text-zinc-400 hover:text-white"
          >
            Logout
          </button>
        </div>
      </header>
      <main className="max-w-7xl mx-auto p-6">
        {activeTab === 'moderation' ? <Events onLogout={onLogout} /> : <Analytics />}
      </main>
    </div>
  )
}

export default App
