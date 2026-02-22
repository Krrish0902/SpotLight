import { createClient, type Session } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL ?? ''
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

export const supabase = createClient(url, anonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: false,
    storage: typeof window !== 'undefined' ? window.localStorage : undefined,
  },
})

/** Sign in using the Supabase client so the session is stored and recognized correctly. */
export async function signInWithPassword(email: string, password: string) {
  const { error } = await supabase.auth.signInWithPassword({ email, password })
  if (error) throw new Error(error.message)
}

/** Read session from localStorage (same key as supabase-js). Fallback when auth client misses it after reload. */
export function getStoredSession(): Session | null {
  if (typeof window === 'undefined') return null
  let projectRef = 'auth'
  try {
    if (url) projectRef = new URL(url).hostname.split('.')[0] || projectRef
  } catch {
    return null
  }
  const storageKey = `sb-${projectRef}-auth-token`
  const raw = window.localStorage.getItem(storageKey)
  if (!raw) return null
  try {
    const data = JSON.parse(raw)
    if (data?.access_token && data?.refresh_token && data?.user?.id) return data as Session
  } catch {
    //
  }
  return null
}
