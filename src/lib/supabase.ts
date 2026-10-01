import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.VITE_SUPABASE_URL as string | undefined
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY as string | undefined

/**
 * Supabase client, or null when the env vars are missing.
 * Without Supabase the site runs in demo mode (JSON data + changes kept in this browser only).
 */
export const supabase = url && anonKey ? createClient(url, anonKey) : null

export const backendMode: 'supabase' | 'demo' = supabase ? 'supabase' : 'demo'
