import { useEffect, useState } from 'react'
import { supabase } from './supabase'
import Login from './pages/Login'
import Events from './pages/Events'

export type UserRole = 'artist' | 'organizer' | 'public' | 'admin'

function App() {
  const [session, setSession] = useState<{ userId: string } | null>(null)
  const [role, setRole] = useState<UserRole | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    supabase.auth.getSession().then(async ({ data: { session: s } }) => {
      if (s?.user) {
        setSession({ userId: s.user.id })
        const { data } = await supabase
          .from('users')
          .select('role')
          .eq('user_id', s.user.id)
          .single()
        setRole(data?.role ?? null)
      } else {
        setSession(null)
        setRole(null)
      }
      setLoading(false)
    })

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, s) => {
        if (s?.user) {
          setSession({ userId: s.user.id })
          const { data } = await supabase
            .from('users')
            .select('role')
            .eq('user_id', s.user.id)
            .single()
          setRole(data?.role ?? null)
        } else {
          setSession(null)
          setRole(null)
        }
      }
    )
    return () => subscription.unsubscribe()
  }, [])

  const onLogout = async () => {
    await supabase.auth.signOut()
    setSession(null)
    setRole(null)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '100vh' }}>
        <span style={{ color: '#94a3b8' }}>Loading…</span>
      </div>
    )
  }

  if (!session || role !== 'admin') {
    return <Login role={role} />
  }

  return <Events onLogout={onLogout} />
}

export default App
