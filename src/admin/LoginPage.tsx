import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth/AuthContext'
import { useData } from '../data/DataContext'

const field =
  'mt-1.5 w-full rounded-xs border-0 bg-white px-4 py-3 text-base text-navy-900 ring-1 ring-stone-200 transition focus:ring-2 focus:ring-gold-500 focus:outline-none'

export default function LoginPage() {
  const { signIn, mode } = useAuth()
  const { complex } = useData()
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    setBusy(true)
    setError(null)
    try {
      await signIn(String(f.get('email') ?? ''), String(f.get('password') ?? ''))
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="grid min-h-dvh place-items-center bg-navy-950 px-4 py-10">
      <div className="w-full max-w-sm">
        <div className="mb-6 text-center text-white">
          <div className="font-display text-2xl font-semibold">{complex.name}</div>
          <div className="mt-1 text-sm text-navy-300">Paneli i menaxhimit</div>
        </div>
        <form onSubmit={submit} className="rounded-xs bg-stone-50 p-6 shadow-2xl sm:p-8">
          <h1 className="font-display text-xl font-semibold text-navy-900">Kyçu</h1>
          <label className="mt-5 block text-sm font-medium text-navy-700">
            Email
            <input name="email" type="email" autoComplete="username" required className={field} autoFocus />
          </label>
          <label className="mt-4 block text-sm font-medium text-navy-700">
            Fjalëkalimi
            <input name="password" type="password" autoComplete="current-password" required className={field} />
          </label>
          {error && (
            <p role="alert" className="mt-4 rounded-xs bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </p>
          )}
          <button
            type="submit"
            disabled={busy}
            className="mt-6 flex min-h-12 w-full items-center justify-center gap-2 rounded-xs bg-navy-900 font-semibold text-white transition hover:bg-navy-700 disabled:opacity-60"
          >
            {busy && <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
            {busy ? 'Duke u kyçur…' : 'Kyçu'}
          </button>
          {mode === 'demo' && (
            <p className="mt-5 rounded-xs bg-amber-50 px-3 py-2 text-xs leading-relaxed text-amber-900">
              Modaliteti demo (pa Supabase): ndryshimet ruhen vetëm në këtë shfletues. Kredencialet demo janë te <code>.env.example</code>.
            </p>
          )}
        </form>
      </div>
    </div>
  )
}
