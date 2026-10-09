import site from '../../data/site.json'

const SHADES = ['bg-gold-500', 'bg-navy-500', 'bg-navy-700', 'bg-navy-900']

/** Payment schedule: a proportional bar + the steps in order (a real sequence, so numbered). */
export default function PaymentPlan() {
  return (
    <section className="bg-stone-100 py-24 sm:py-36" aria-labelledby="payment-title">
      <div className="mx-auto max-w-[1400px] px-5 sm:px-8">
        <h2 id="payment-title" className="max-w-2xl font-display text-[2.6rem] leading-[1.02] text-navy-950 sm:text-6xl">
          Paguani sipas ecurisë së ndërtimit
        </h2>
        <p className="mt-4 max-w-xl text-lg text-navy-600">Pa kredi të detyrueshme dhe pa kamatë. Çmimi fiksohet me kontratë.</p>

        <div className="mt-14 flex h-[3px] overflow-hidden" aria-hidden="true">
          {site.payment.map((p, i) => (
            <span key={p.title} className={SHADES[i % SHADES.length]} style={{ width: p.share }} />
          ))}
        </div>

        <ol className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
          {site.payment.map((p, i) => (
            <li key={p.title} className="flex gap-4 lg:block">
              <span className={`mt-1 size-3 shrink-0 rounded-full lg:mb-5 lg:mt-0 lg:block lg:h-1 lg:w-12 ${SHADES[i % SHADES.length]}`} aria-hidden="true" />
              <div>
                <div className="font-display text-6xl tabular-nums text-navy-950">{p.share}</div>
                <h3 className="mt-2 font-semibold text-navy-900">
                  <span className="sr-only">Hapi {i + 1}: </span>
                  {p.title}
                </h3>
                <p className="mt-1 text-navy-600">{p.text}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  )
}
