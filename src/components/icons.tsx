import type { SVGProps } from 'react'

// Stroke icons in the style of Lucide (ISC), drawn inline so no icon package is needed.
const PATHS: Record<string, string> = {
  parking: 'M4 4h16v16H4z M9 17V7h4a3 3 0 0 1 0 6H9',
  heat: 'M12 3c1 3 5 5 5 10a5 5 0 0 1-10 0c0-2 1-3.5 2-4.5 0 2 1 3 2 3 0-3-1-5 1-8.5z',
  shield: 'M12 3l8 3v6c0 4.5-3.4 8.3-8 9-4.6-.7-8-4.5-8-9V6l8-3z M9 12l2 2 4-4',
  tree: 'M12 22v-6 M8 16h8l-2.5-3.5H16L12 6l-4 6.5h2.5z M12 6V2',
  window: 'M4 3h16v18H4z M4 12h16 M12 3v18',
  lift: 'M5 3h14v18H5z M9 9l3-3 3 3 M9 15l3 3 3-3',
  pin: 'M12 21s-7-6.2-7-11.5A7 7 0 0 1 19 9.5C19 14.8 12 21 12 21z M12 12a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5z',
  phone: 'M5 3h4l2 5-2.5 1.5a11 11 0 0 0 6 6L16 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 5a2 2 0 0 1 2-2z',
  mail: 'M3 5h18v14H3z M3 6l9 7 9-7',
  clock: 'M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18z M12 7v5l3 2',
  rotate: 'M3 12a9 9 0 0 1 15.5-6.2L21 8 M21 3v5h-5 M21 12a9 9 0 0 1-15.5 6.2L3 16 M3 21v-5h5',
  check: 'M5 12l5 5 9-10',
}

export type IconName = keyof typeof PATHS

export function Icon({ name, ...props }: { name: IconName } & SVGProps<SVGSVGElement>) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      <path d={PATHS[name]} />
    </svg>
  )
}
