import { zodResolver } from '@hookform/resolvers/zod'
import { AnimatePresence, motion } from 'motion/react'
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { useForm } from 'react-hook-form'
import { useSearchParams } from 'react-router-dom'
import { useData } from '../../data/DataContext'
import site, { telHref } from '../../data/site'
import { roomType } from '../../lib/domain'
import { inquirySchema, MIN_FILL_MS, toInquiry, type InquiryInput, type InquiryValues } from '../../lib/inquiry'
import { backendMode } from '../../lib/supabase'
import { Icon } from '../icons'
import { RevealHeading } from '../motion'
import { Pending } from '../ui'

const field =
  'mt-1.5 w-full rounded-xs border-0 bg-white px-4 py-3 text-base text-navy-900 ring-1 ring-stone-200 transition placeholder:text-navy-400 focus:ring-2 focus:ring-gold-600 focus:outline-none aria-[invalid=true]:ring-2 aria-[invalid=true]:ring-sold'

const newId = () => (crypto.randomUUID ? crypto.randomUUID() : `${Date.now()}-${Math.random().toString(36).slice(2)}`)

export default function ContactSection() {
  const { buildings, apartments, submitInquiry } = useData()
  const [params] = useSearchParams()
  const apt = apartments.find((a) => a.id === params.get('banesa'))

  const [sent, setSent] = useState<string | null>(null)
  const [failure, setFailure] = useState<string | null>(null)
  // one id per filled-in form: a double click or a retry after a timeout cannot create two requests
  const clientId = useRef(newId())
  const shownAt = useRef(Date.now())

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<InquiryInput, unknown, InquiryValues>({
    resolver: zodResolver(inquirySchema),
    shouldFocusError: true,
    defaultValues: { name: '', phone: '', email: '', buildingId: '', rooms: '', apartmentId: '', message: '', consent: false, website: '' },
  })

  // "Kërko informacion" on an apartment page links here with ?banesa=ID
  useEffect(() => {
    if (!apt) return
    setValue('apartmentId', apt.id)
    setValue('buildingId', apt.buildingId)
    setValue('rooms', String(apt.rooms) as InquiryInput['rooms'])
  }, [apt, setValue])

  const onSubmit = async (v: InquiryValues) => {
    setFailure(null)
    if (Date.now() - shownAt.current < MIN_FILL_MS) {
      setFailure('Forma u dërgua shumë shpejt. Ju lutemi provoni përsëri.')
      return
    }
    try {
      await submitInquiry(toInquiry(v, clientId.current))
      setSent(v.name.split(' ')[0])
      clientId.current = newId()
      reset()
    } catch (e) {
      // never show success when storing failed
      setFailure(e instanceof Error ? e.message : 'Kërkesa nuk u dërgua. Provoni përsëri.')
    }
  }

  const err = (name: keyof InquiryInput) => ({
    'aria-invalid': errors[name] ? true : undefined,
    'aria-describedby': errors[name] ? `err-${name}` : undefined,
  })
  const { phone, email, office, hours } = site.contact

  return (
    <section id="kontakt" className="bg-navy-900 py-24 text-white sm:py-36" aria-labelledby="contact-title">
      <div className="mx-auto grid max-w-[1400px] gap-12 px-5 sm:px-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <RevealHeading id="contact-title" className="font-display text-[2.6rem] leading-[1.02] sm:text-6xl">{'Rezervoni një takim me zyrën e shitjes'}</RevealHeading>
          <p className="mt-4 max-w-md text-lg text-navy-200">Na tregoni çfarë banese kërkoni dhe ju kontaktojmë për planet, çmimet dhe një takim.</p>
          <ul className="mt-10 space-y-5">
            <ContactRow icon="phone" href={telHref(phone)} value={phone} />
            <ContactRow icon="mail" href={email ? `mailto:${email}` : undefined} value={email} />
            <ContactRow icon="pin" value={office && site.location.address ? `${office}, ${site.location.address}` : office ?? site.location.address} />
            <ContactRow icon="clock" value={hours} />
          </ul>
        </div>

        <div className="lg:col-span-6 lg:col-start-7">
          <div className="rounded-xs bg-stone-50 p-6 text-navy-900 sm:p-8">
            <AnimatePresence mode="wait" initial={false}>
              {sent !== null ? (
                <motion.div key="sent" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="py-10 text-center" role="status">
                  <span className="mx-auto grid size-14 place-items-center rounded-full bg-available/15 text-available-ink">
                    <Icon name="check" className="size-7" strokeWidth={2.2} />
                  </span>
                  <h3 className="mt-5 font-display text-4xl">Faleminderit, {sent}</h3>
                  <p className="mx-auto mt-2 max-w-sm text-navy-600">
                    {backendMode === 'demo'
                      ? 'Kërkesa u ruajt në këtë shfletues (modaliteti demo). Në versionin final i dërgohet zyrës së shitjes.'
                      : 'Kërkesa u pranua. Zyra e shitjes do t’ju kontaktojë.'}
                  </p>
                  <button
                    onClick={() => {
                      setSent(null)
                      shownAt.current = Date.now()
                    }}
                    className="mt-6 min-h-11 rounded-xs px-5 font-medium text-navy-700 ring-1 ring-stone-200 hover:bg-white"
                  >
                    Dërgo një kërkesë tjetër
                  </button>
                </motion.div>
              ) : (
                <motion.form key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onSubmit={handleSubmit(onSubmit)} noValidate className="grid gap-5 sm:grid-cols-2" aria-label="Kërkesë për takim">
                  {apt && (
                    <p className="text-sm text-navy-600 sm:col-span-2">
                      Kërkesë për banesën <strong className="font-semibold text-navy-900">Nr. {apt.number}</strong>, {buildings.find((b) => b.id === apt.buildingId)?.name}, kati {apt.floor}.
                    </p>
                  )}
                  <Field id="name" label="Emri dhe mbiemri" error={errors.name?.message} className="sm:col-span-2">
                    <input id="name" autoComplete="name" className={field} {...register('name')} {...err('name')} />
                  </Field>
                  <Field id="phone" label="Telefoni" error={errors.phone?.message}>
                    <input id="phone" type="tel" autoComplete="tel" inputMode="tel" placeholder="+383 44 123 456" className={field} {...register('phone')} {...err('phone')} />
                  </Field>
                  <Field id="email" label="Email (opsional)" error={errors.email?.message}>
                    <input id="email" type="email" autoComplete="email" className={field} {...register('email')} {...err('email')} />
                  </Field>
                  <Field id="buildingId" label="Lamela">
                    <select id="buildingId" className={field} {...register('buildingId')}>
                      <option value="">Pa preferencë</option>
                      {buildings.map((b) => (
                        <option key={b.id} value={b.id}>
                          {b.name}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field id="rooms" label="Tipi i banesës">
                    <select id="rooms" className={field} {...register('rooms')}>
                      <option value="">Pa preferencë</option>
                      {[1, 2, 3, 4].map((r) => (
                        <option key={r} value={r}>
                          {roomType(r)}
                        </option>
                      ))}
                    </select>
                  </Field>
                  <Field id="message" label="Mesazhi (opsional)" error={errors.message?.message} className="sm:col-span-2">
                    <textarea id="message" rows={3} className={`${field} resize-none`} placeholder="P.sh. kur mund të vij për një takim?" {...register('message')} {...err('message')} />
                  </Field>

                  {/* honeypot: invisible to people and screen readers */}
                  <div className="absolute -left-[9999px] size-px overflow-hidden" aria-hidden="true">
                    <label>
                      Website
                      <input tabIndex={-1} autoComplete="off" {...register('website')} />
                    </label>
                  </div>

                  <div className="sm:col-span-2">
                    <label className="flex items-start gap-3 text-sm text-navy-700">
                      <input type="checkbox" className="mt-0.5 size-5 shrink-0 accent-gold-500" {...register('consent')} {...err('consent')} />
                      <span>
                        Pranoj që të dhënat e mia të përdoren vetëm për t’u kontaktuar për këtë kërkesë. Ato nuk u jepen palëve të treta dhe mund të kërkoj fshirjen e tyre në çdo kohë.
                      </span>
                    </label>
                    {errors.consent && (
                      <span id="err-consent" className="mt-1.5 block text-sm text-sold-ink">
                        {errors.consent.message}
                      </span>
                    )}
                  </div>

                  {failure && (
                    <p role="alert" className="bg-sold/8 px-4 py-3 text-sm text-sold-ink ring-1 ring-sold/30 sm:col-span-2">
                      {failure}
                    </p>
                  )}

                  <div className="flex flex-col gap-3 sm:col-span-2 sm:flex-row sm:items-center sm:justify-between">
                    <p className="text-sm text-navy-500">{backendMode === 'demo' ? 'Demo: kërkesa ruhet vetëm në këtë shfletues.' : 'Fushat pa “opsional” janë të detyrueshme.'}</p>
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className="inline-flex min-h-12 items-center justify-center gap-2 rounded-xs bg-gold-500 px-7 font-semibold text-navy-950 transition hover:bg-gold-400 disabled:cursor-wait disabled:opacity-60"
                    >
                      {isSubmitting && <span className="size-4 animate-spin rounded-full border-2 border-white/40 border-t-white" aria-hidden="true" />}
                      {isSubmitting ? 'Duke dërguar…' : 'Rezervo takim'}
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

function ContactRow({ icon, value, href }: { icon: 'phone' | 'mail' | 'pin' | 'clock'; value: string | null; href?: string }) {
  const body = (
    <>
      <Icon name={icon} className="size-5 shrink-0 text-gold-400" />
      <span className={href ? 'text-lg font-medium' : ''}>{value ?? <Pending className="text-navy-300" />}</span>
    </>
  )
  return <li>{href && value ? <a href={href} className="flex items-center gap-4 hover:text-gold-300">{body}</a> : <span className="flex items-center gap-4">{body}</span>}</li>
}

function Field({ id, label, error, className = '', children }: { id: string; label: string; error?: string; className?: string; children: ReactNode }) {
  return (
    <div className={className}>
      <label htmlFor={id} className="block text-sm font-medium text-navy-700">
        {label}
      </label>
      {children}
      {error && (
        <span id={`err-${id}`} className="mt-1.5 block text-sm text-sold-ink">
          {error}
        </span>
      )}
    </div>
  )
}
