import {
  Check, Clock, Fence, Landmark, Leaf, Mail, MapPin, Phone, RotateCw, SquareParking, Store, Trees, type LucideProps,
} from 'lucide-react'

// Lucide React icons (ISC), mapped to the names used in site.json so editors never import components.
const ICONS = {
  parking: SquareParking,
  trees: Trees,
  store: Store,
  bridge: Landmark,
  balcony: Fence,
  leaf: Leaf,
  pin: MapPin,
  phone: Phone,
  mail: Mail,
  clock: Clock,
  rotate: RotateCw,
  check: Check,
}

export type IconName = keyof typeof ICONS

export const isIconName = (n: string): n is IconName => n in ICONS

export function Icon({ name, strokeWidth = 1.6, ...props }: { name: IconName } & LucideProps) {
  const C = ICONS[name]
  return <C aria-hidden="true" strokeWidth={strokeWidth} {...props} />
}
