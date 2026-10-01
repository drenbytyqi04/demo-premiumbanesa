import { AnimatePresence, motion } from 'motion/react'
import { useState, type FormEvent, type ReactElement, type ReactNode } from 'react'
import { useData } from '../../data/DataContext'
import site from '../../data/site.json'
import { Icon } from '../icons'

type Errors = Partial<Record<'name' | 'phone' | 'email', string>>

const field =
  'mt-1.5 w-full rounded-xl border-0 bg-white px-4 py-3 text-base text-navy-900 ring-1 ring-stone-200 transition placeholder:text-navy-300 focus:ring-2 focus:ring-gold-500 focus:outline-none aria-[invalid=true]:ring-red-400'

export default function ContactSection() {
  const { buildings } = useData()
  const [errors, setErrors] = useState<Errors>({})
  const [state, setState] = useState<'idle' | 'sending' | 'sent'>('idle')
  const [name, setName] = useState('')

  const submit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const f = new FormData(e.currentTarget)
    const next: Errors = {}
    const n = String(f.get('name') ?? '').trim()
    const phone = String(f.get('phone') ?? '').replace(/\s/g, '')
    const email = String(f.get('email') ?? '').trim()
    if (n.length < 2) next.name = 'Shkruani emrin dhe mbiemrin.'
    if (!/^\+?\d{8,15}$/.test(phone)) next.phone = 'Shkruani një numër telefoni, p.sh. +383 44 123 456.'
    if (email && !/^\S+@\S+\.\S+$/.test(email)) next.email = 'Kjo adresë emaili nuk duket e saktë.'
    setErrors(next)
    if (Object.keys(next).length) {
      ;(e.currentTarget.elements.namedItem(Object.keys(next)[0]) as HTMLElement)?.focus()
      return
    }
    setState('sending')
    // Demo: nothing is sent. With Supabase this becomes an insert into a "leads" table.
    await new Promise((r) => setTimeout(r, 800))
    setName(n.split(' ')[0])
    setState('sent')
  }

  return (
    <section id="kontakt" className="bg-navy-900 py-20 text-white sm:py-28" aria-labelledby="contact-title">
      <div className="mx-auto grid max-w-7xl gap-12 px-4 sm:px-6 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <h2 id="contact-title" className="font-display text-3xl font-semibold leading-tight sm:text-4xl">
            Rezervoni një takim në zyrën e shitjes
          </h2>
          <p className="mt-4 max-w-md text-lg text-navy-200">
            Ju tregojmë banesat që ju interesojnë, planet e detajuara dhe kantierin. Ju telefonojmë brenda një dite pune.
          </p>
          <ul className="mt-10 space-y-5">
            <li>
              <a href={`tel:${site.contact.phone.replace(/\s/g, '')}`} className="flex items-center gap-4 hover:text-gold-300">
                <Icon name="phone" className="size-5 text-gold-400" />
                <span className="text-lg font-medium">{site.contact.phone}</span>
              </a>
            </li>
            <li>
              <a href={`mailto:${site.contact.email}`} className="flex items-center gap-4 hover:text-gold-300">
                <Icon name="mail" className="size-5 text-gold-400" />
                <span className="text-lg font-medium">{site.contact.email}</span>
              </a>
            </li>
            <li className="flex items-start gap-4">
              <Icon name="pin" className="mt-0.5 size-5 shrink-0 text-gold-400" />
              <span>
                {site.contact.office}
                <br />
                <span className="text-navy-300">{site.location.address}</span>
              </span>
            </li>
            <li className="flex items-center gap-4">
              <Icon name="clock" className="size-5 text-gold-400" />
              <span>{site.contact.hours}</span>
            </li>
          </ul>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <div className="rounded-3xl bg-stone-50 p-6 text-navy-900 sm:p-8">
            <AnimatePresence mode="wait" initial={false}>
              {state === 'sent' ? (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, y: 12 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="py-10 text-center"
                  role="status"
                >
                  <span className="mx-auto grid size-14 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                    <Icon name="check" className="size-7" strokeWidth={2.2} />
                  </span>
                  <h3 className="mt-5 font-display text-2xl font-semibold">Faleminderit, {name}</h3>
                  <p className="mx-auto mt-2 max-w-sm text-navy-600">Kërkesa për takim u dërgua. Do t'ju telefonojmë brenda një dite pune.</p>
                  <button onClick={() => setState('idle')} className="mt-6 min-h-11 rounded-full px-5 font-medium text-navy-700 ring-1 ring-stone-200 hover:bg-white">
                    Dërgo një kërkesë tjetër
                  </button>
                </motion.div>
              ) : (
                <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={submit} noValidate className="grid gap-5 sm:grid-cols-2">
                  <Field label="Emri dhe mbiemri" error={errors.name} className="sm:col-span-2">
                    <input name="name" autoComplete="name" className={field} aria-invalid={!!errors.name} aria-describedby="err-name" />
                  </Field>
                  <Field label="Telefoni" error={errors.phone}>
                    <input name="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="+383 44 123 456" className={field} aria-invalid={!!errors.phone} aria-describedby="err-phone" />
                  </Field>
                  <Field label="Email (opsional)" error={errors.email}>
                    <input name="email" type="email" autoComplete="email" className={field} aria-invalid={!!errors.email} aria-describedby="err-email" />
                  </Field>
                  <Field label="Ndërtesa">
                    <select name="building" className={field} defaultValue="">
                      <option value="">Pa preferencë</option>
                      {buildings.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Numri i dhomave">
                    <select name="rooms" className={field} defaultValue="">
                      <option value="">Pa preferencë</option>
                      {[1, 2, 3, 4].map((r) => (
                        <option key={r} value={r}>
                          {r === 1 ? '1 dhomë' : `${r} dhoma`}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field label="Mesazhi (opsional)" className="sm:col-span-2">
                    <textarea name="message" rows={3} className={`${field} resize-none`} placeholder="P.sh. kur mund ta shoh banesën?" />
                  </Field>
                  <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-navy-500">Demo: kërkesa nuk dërgohet realisht.</p>
                    <button
                      type="submit"
                      disabled={state === 'sending'}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-full bg-navy-900 px-7 font-semibold text-white transition hover:bg-navy-700 disabled:opacity-60"
                    >
                      {state === 'sending' && <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
                      {state === 'sending' ? 'Duke dërguar…' : 'Rezervo takim'}
                    </button>
                  </div>
                </motion.form>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </section>
  )
}

function Field({ label, error, className = '', children }: { label: string; error?: string; className?: string; children: ReactNode }) {
  const id = (children as ReactElement<{ name?: string }>).props.name
  return (
    <label className={`block text-sm font-medium text-navy-700 ${className}`}>
      {label}
      {children}
      {error && (
        <span id={`err-${id}`} className="mt-1.5 block text-sm font-normal text-red-600">
          {error}
        </span>
      )}
    </label>
  )
}
