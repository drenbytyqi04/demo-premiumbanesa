import { useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import ContactSection from '../components/home/ContactSection'
import HeroSitePlan from '../components/home/HeroSitePlan'
import LocationFeatures from '../components/home/LocationFeatures'
import PaymentPlan from '../components/home/PaymentPlan'
import StackingPlan from '../components/home/StackingPlan'
import TourBand from '../components/home/TourBand'
import UnitTypes from '../components/home/UnitTypes'

export default function ComplexPage() {
  const [params] = useSearchParams()
  const section = params.get('s')

  // "#/?s=kontakt" scrolls to a section (HashRouter leaves no room for #anchors)
  useEffect(() => {
    if (!section) return
    const t = window.setTimeout(() => document.getElementById(section)?.scrollIntoView({ behavior: 'smooth' }), 60)
    return () => window.clearTimeout(t)
  }, [section])

  return (
    <>
      <HeroSitePlan />
      <StackingPlan />
      <UnitTypes />
      <TourBand />
      <LocationFeatures />
      <PaymentPlan />
      <ContactSection />
    </>
  )
}
