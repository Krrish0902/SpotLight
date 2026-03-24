import { useState } from 'react'
import { signInWithPassword } from '../supabase'
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
      await signInWithPassword(email, password)
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
      background: 'radial-gradient(circle at top, #101a34 0%, #09090b 52%)',
    }}>
      <div style={{
        width: '100%',
        maxWidth: 420,
        background: 'rgba(255,255,255,0.04)',
        borderRadius: 24,
        padding: 30,
        border: '1px solid rgba(255,255,255,0.12)',
        backdropFilter: 'blur(10px)',
      }}>
        <p style={{ margin: '0 0 4px', color: 'rgba(255,255,255,0.45)', fontSize: 11, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase' }}>
          Admin Access
        </p>
        <h1 style={{ margin: '0 0 6px', fontSize: 28, fontWeight: 800, color: '#fafafa', letterSpacing: '-0.03em' }}>
          SpotLight Admin
        </h1>
        <p style={{ margin: '0 0 28px', color: 'rgba(255,255,255,0.5)', fontSize: 13 }}>
          Sign in to moderate events
        </p>
        {role && role !== 'admin' && (
          <div style={{
            padding: '10px 14px',
            marginBottom: 20,
            background: 'rgba(234,179,8,0.08)',
            borderRadius: 6,
            color: '#eab308',
            fontSize: 13,
          }}>
            Your account is not an admin. Only admin users can access this page.
          </div>
        )}
        <form onSubmit={handleLogin}>
          <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: '#71717a', fontWeight: 500 }}>
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px 12px',
              marginBottom: 18,
              fontSize: 14,
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(12,16,28,0.8)',
              color: '#fafafa',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => { e.target.style.borderColor = 'rgba(34,211,238,0.5)' }}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.12)' }}
          />
          <label style={{ display: 'block', marginBottom: 6, fontSize: 12, color: '#71717a', fontWeight: 500 }}>
            Password
          </label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            style={{
              width: '100%',
              padding: '10px 12px',
              marginBottom: 20,
              fontSize: 14,
              borderRadius: 10,
              border: '1px solid rgba(255,255,255,0.12)',
              background: 'rgba(12,16,28,0.8)',
              color: '#fafafa',
              transition: 'border-color 0.15s',
            }}
            onFocus={(e) => { e.target.style.borderColor = 'rgba(34,211,238,0.5)' }}
            onBlur={(e) => { e.target.style.borderColor = 'rgba(255,255,255,0.12)' }}
          />
          {error && (
            <div style={{ marginBottom: 18, color: '#ef4444', fontSize: 13 }}>
              {error}
            </div>
          )}
          <button
            type="submit"
            disabled={loading}
            style={{
              width: '100%',
              padding: '10px 14px',
              fontSize: 14,
              fontWeight: 500,
              borderRadius: 100,
              border: 'none',
              background: '#FDF2FF',
              color: '#162447',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
              transition: 'opacity 0.15s',
            }}
          >
            {loading ? 'Signing in…' : 'Sign in'}
          </button>
        </form>
      </div>
    </div>
  )
}
