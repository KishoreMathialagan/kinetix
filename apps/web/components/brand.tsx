import Link from 'next/link'
import { Activity } from 'lucide-react'
import { cn } from '@kinetix/utils'

export function Brand({ compact = false, light = false }: { compact?: boolean; light?: boolean }) {
  return (
    <Link href="/" className="flex items-center gap-2.5">
      <span
        className={cn(
          'flex h-10 w-10 items-center justify-center rounded-xl',
          light ? 'bg-primary-foreground text-primary' : 'bg-primary text-primary-foreground',
        )}
      >
        <Activity className="h-5 w-5" />
      </span>
      {!compact && (
        <span className="leading-tight">
          <span className={cn('block text-lg font-semibold tracking-tight', light ? 'text-primary-foreground' : 'text-primary')}>
            Kinetix
          </span>
          <span className={cn('block text-xs', light ? 'text-primary-foreground/60' : 'text-muted-foreground')}>Home Care</span>
        </span>
      )}
    </Link>
  )
}