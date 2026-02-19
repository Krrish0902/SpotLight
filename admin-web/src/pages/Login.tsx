import { useState } from 'react'
import { supabase } from '../supabase'
import type { UserRole } from '../App'

interface Props {
  role: UserRole | null
}

export default function Login({ role }: Props) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const { error: err } = await supabase.auth.signInWithPassword({ email, password })
      if (err) throw err
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{
        width: '100%',
        maxWidth: 360,
        background: 'rgba(30,41,59,0.8)',
        borderRadius: 12,
        padding: 28,
        border: '1px solid rgba(148,163,184,0.15)',
      }}>
        <h1 style={{ margin: '0 0 8px', fontSize: 24, color: '#f1f5f9' }}>
          SpotLight Admin
        </h1>
        <p style={{ margin: '0 0 24px', color: '#94a3b8', fontSize: 14 }}>
          Sign in to moderate events
        </p>
        {role && role !== 'admin' && (
          <div style={{
            padding: 12,
            marginBottom: 16,
            background: 'rgba(234,179,8,0.15)',
            borderRadius: 8,
            color: '#facc15',
          }}>
            Your account is not an admin. Only admin users can access this page.
          </div>
        )}
        <form onSubmit={handleLogin}>
          <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#cbd5e1' }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: 12,
              marginBottom: 16,
              fontSize: 16,
              borderRadius: 8,
              border: '1px solid rgba(148,163,184,0.3)',
              background: 'rgba(15,23,42,0.8)',
              color: '#e2e8f0',
            }}
          />
          <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: '#cbd5e1' }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: 12,
              marginBottom: 16,
              fontSize: 16,
              borderRadius: 8,
              border: '1px solid rgba(148,163,184,0.3)',
              background: 'rgba(15,23,42,0.8)',
              color: '#e2e8f0',
            }}
          />
          {error && (
            <div style={{ marginBottom: 16, color: '#f87171', fontSize: 14 }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: 12,
              fontSize: 16,
              fontWeight: 600,
              borderRadius: 8,
              border: 'none',
              background: '#a855f7',
              color: '#fff',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
