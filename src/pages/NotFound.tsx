import { Link } from 'react-router-dom'

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-24 text-center">
      <div className="font-display text-8xl text-navy-200">404</div>
      <h1 className="mt-4 font-display text-4xl">Faqja nuk u gjet</h1>
      <p className="mt-2 text-navy-500">Ndërtesa ose apartamenti që kërkuat nuk ekziston.</p>
      <Link to="/" className="mt-6 inline-block rounded-xs bg-navy-900 px-5 py-2.5 font-medium text-white hover:bg-navy-700">
        Kthehu në ballinë
      </Link>
    </div>
  )
}
