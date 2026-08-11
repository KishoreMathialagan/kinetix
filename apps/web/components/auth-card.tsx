import { Card } from '@kinetix/ui'
import { cn } from '@kinetix/utils'

const WIDTHS = {
  md: 'max-w-md',
  '2xl': 'max-w-2xl',
} as const

export function AuthCard({
  width = 'md',
  className,
  children,
}: {
  width?: keyof typeof WIDTHS
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('relative mx-auto w-full', WIDTHS[width], className)}>
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-3 -bottom-4 top-10 -rotate-1 rounded-2xl border border-primary/10 bg-gradient-to-br from-secondary/20 via-primary/5 to-primary/15"
      />
      <Card className="relative z-10 rounded-2xl border-white/60 border-t-white/20 bg-white/70 shadow-[0_8px_32px_rgba(18,57,60,0.18),inset_0_1px_0_rgba(255,255,255,0.6)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/40">
        {children}
      </Card>
    </div>
  )
}