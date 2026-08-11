'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@kinetix/utils'
import type { NavItem } from './sidebar'

export function BottomNav({ items, maxItems = 5 }: { items: NavItem[]; maxItems?: number }) {
  const pathname = usePathname()
  const visible = items.slice(0, maxItems)

  return (
    <nav className="fixed inset-x-0 bottom-0 z-30 border-t border-white/50 bg-white/70 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl supports-[backdrop-filter]:bg-white/50 lg:hidden">
      <div className="mx-auto flex max-w-lg items-stretch justify-around">
        {visible.map((item) => {
          const active = item.match ? item.match(pathname) : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex flex-1 flex-col items-center gap-1 py-2.5 text-[11px] font-medium transition-colors',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <span
                className={cn(
                  'flex h-8 w-14 items-center justify-center rounded-full transition-colors',
                  active && 'bg-gradient-to-br from-secondary/30 to-primary/10 text-primary'
                )}
              >
                <Icon className="h-5 w-5" />
              </span>
              {item.label}
            </Link>
          )
        })}
      </div>
    </nav>
  )
}