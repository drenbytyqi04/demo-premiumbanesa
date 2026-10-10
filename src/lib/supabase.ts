import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
// publishable key (sb_publishable_…) or the legacy anon key; both are safe in the browser with RLS.
// Never put the service-role / secret key in a VITE_ variable: it would be shipped to every visitor.
const anonKey = (import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY) as string | undefined

/**
 * Supabase client, or null when the env vars are missing.
 * Without Supabase the site runs in demo mode (JSON data + changes kept in this browser only).
 */
export const supabase = url && anonKey ? createClient(url, anonKey) : null

export const backendMode: 'supabase' | 'demo' = supabase ? 'supabase' : 'demo'
