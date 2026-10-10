import { lazy, Suspense, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import { scrollToTarget } from '../lib/smoothScroll'
import Architecture from '../components/home/Architecture'
import ConstructionProgress from '../components/home/ConstructionProgress'
import Faq from '../components/home/Faq'
import HeroSitePlan from '../components/home/HeroSitePlan'
import LocationFeatures from '../components/home/LocationFeatures'
import PaymentPlan from '../components/home/PaymentPlan'
import ProjectFacts from '../components/home/ProjectFacts'
import ProjectGallery from '../components/home/ProjectGallery'
import StackingPlan from '../components/home/StackingPlan'
import TourBand from '../components/home/TourBand'
import UnitTypes from '../components/home/UnitTypes'

// the form (React Hook Form + validation) loads separately; the placeholder keeps #kontakt scrollable
const ContactSection = lazy(() => import('../components/home/ContactSection'))

export default function ComplexPage() {
  const [params] = useSearchParams()
  const section = params.get('s')

  // "#/?s=kontakt" scrolls to a section (HashRouter leaves no room for #anchors)
  useEffect(() => {
    if (!section) return
    const t = window.setTimeout(() => { const el = document.getElementById(section); if (el) scrollToTarget(el) }, 60)
    return () => window.clearTimeout(t)
  }, [section])

  return (
    <>
      <HeroSitePlan />
      <ProjectFacts />
      <Architecture />
      <ProjectGallery />
      <StackingPlan />
      <UnitTypes />
      <TourBand />
      <LocationFeatures />
      <ConstructionProgress />
      <PaymentPlan />
      <Faq />
      <Suspense fallback={<section id="kontakt" className="min-h-[760px] bg-navy-900" aria-busy="true" />}>
        <ContactSection />
      </Suspense>
    </>
  )
}
