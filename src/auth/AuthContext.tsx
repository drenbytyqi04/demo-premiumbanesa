import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'
import { backendMode, supabase } from '../lib/supabase'

export interface AdminUser {
  email: string
}

interface AuthValue {
  user: AdminUser | null
  loading: boolean
  mode: 'supabase' | 'demo'
  signIn(email: string, password: string): Promise<void>
  signOut(): Promise<void>
}

const Ctx = createContext<AuthValue | null>(null)

// Demo mode only: credentials ship in the JS bundle, so this is NOT real security.
const DEMO_EMAIL = (import.meta.env.VITE_DEMO_ADMIN_EMAIL as string | undefined) ?? 'admin@demo.local'
const DEMO_PASSWORD = (import.meta.env.VITE_DEMO_ADMIN_PASSWORD as string | undefined) ?? 'aurora-demo'
const DEMO_KEY = 'aurora-demo-admin-session'

/** A signed-in Supabase user counts as admin only if listed in the `admins` table. */
async function isAdmin(userId: string) {
  const { data, error } = await supabase!.from('admins').select('user_id').eq('user_id', userId).maybeSingle()
  return !error && !!data
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AdminUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!supabase) {
      try {
        const email = sessionStorage.getItem(DEMO_KEY)
        if (email) setUser({ email })
      } catch {
        /* storage blocked */
      }
      setLoading(false)
      return
    }
    let active = true
    const apply = async (session: { user: { id: string; email?: string } } | null) => {
      if (!session) {
        if (active) setUser(null)
      } else if (await isAdmin(session.user.id)) {
        if (active) setUser({ email: session.user.email ?? '' })
      } else {
        await supabase!.auth.signOut()
        if (active) setUser(null)
      }
      if (active) setLoading(false)
    }
    supabase.auth.getSession().then(({ data }) => apply(data.session))
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      // defer: don't call Supabase from inside the auth callback
      setTimeout(() => apply(session), 0)
    })
    return () => {
      active = false
      sub.subscription.unsubscribe()
    }
  }, [])

  const signIn = useCallback(async (email: string, password: string) => {
    if (!supabase) {
      if (email.trim().toLowerCase() !== DEMO_EMAIL.toLowerCase() || password !== DEMO_PASSWORD)
        throw new Error('Email-i ose fjalëkalimi është i pasaktë.')
      try {
        sessionStorage.setItem(DEMO_KEY, DEMO_EMAIL)
      } catch {
        /* ignore */
      }
      setUser({ email: DEMO_EMAIL })
      return
    }
    const { data, error } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    if (error) throw new Error(error.message === 'Invalid login credentials' ? 'Email-i ose fjalëkalimi është i pasaktë.' : error.message)
    if (!(await isAdmin(data.user.id))) {
      await supabase.auth.signOut()
      throw new Error('Ky përdorues nuk ka qasje në panelin e menaxhimit.')
    }
    setUser({ email: data.user.email ?? email })
  }, [])

  const signOut = useCallback(async () => {
    if (supabase) await supabase.auth.signOut()
    else
      try {
        sessionStorage.removeItem(DEMO_KEY)
      } catch {
        /* ignore */
      }
    setUser(null)
  }, [])

  return <Ctx.Provider value={{ user, loading, mode: backendMode, signIn, signOut }}>{children}</Ctx.Provider>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useAuth() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useAuth must be used inside <AuthProvider>')
  return v
}
