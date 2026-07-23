// Iconos de línea (stroke) minimalistas. Usan currentColor. Sin emojis.
interface P { size?: number; className?: string }

const base = (size: number): React.SVGProps<SVGSVGElement> => ({
  width: size, height: size, viewBox: '0 0 24 24', fill: 'none',
  stroke: 'currentColor', strokeWidth: 1.75, strokeLinecap: 'round', strokeLinejoin: 'round',
})

export const Menu = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}><path d="M3 6h18M3 12h18M3 18h18" /></svg>
)
export const Close = ({ size = 20, className }: P) => (
  <svg {...base(size)} className={className}><path d="M18 6 6 18M6 6l12 12" /></svg>
)
export const Reset = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M3 12a9 9 0 1 0 3-6.7L3 8" /><path d="M3 3v5h5" />
  </svg>
)
export const Download = ({ size = 16, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M12 3v12" /><path d="m7 11 5 5 5-5" /><path d="M5 21h14" />
  </svg>
)
export const Chevron = ({ size = 18, className }: P) => (
  <svg {...base(size)} className={className}><path d="m6 9 6 6 6-6" /></svg>
)
export const Investment = ({ size = 17, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M3 21h18" /><path d="M5 21V7l7-4 7 4v14" /><path d="M9 21v-6h6v6" /><path d="M9 9h.01M15 9h.01" />
  </svg>
)
export const Revenue = ({ size = 17, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M3 17l5-5 4 4 8-8" /><path d="M15 8h5v5" />
  </svg>
)
export const Costs = ({ size = 17, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M4 21v-7M4 10V3M12 21v-9M12 8V3M20 21v-5M20 12V3" />
    <path d="M1 14h6M9 8h6M17 16h6" />
  </svg>
)
export const Bank = ({ size = 17, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M3 10 12 4l9 6" /><path d="M4 10v8M9 10v8M15 10v8M20 10v8" /><path d="M3 21h18" />
  </svg>
)
export const Fiscal = ({ size = 17, className }: P) => (
  <svg {...base(size)} className={className}>
    <path d="M19 5 5 19" /><circle cx="6.5" cy="6.5" r="2.5" /><circle cx="17.5" cy="17.5" r="2.5" />
  </svg>
)
