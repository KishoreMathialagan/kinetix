'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { cn } from '@kinetix/utils'
import { Brand } from '@/components/brand'

export interface NavItem {
  label: string
  href: string
  icon: React.ComponentType<{ className?: string }>
  match?: (pathname: string) => boolean
}

export function Sidebar({ items }: { items: NavItem[] }) {
  const pathname = usePathname()

  return (
    <aside className="fixed inset-y-0 left-0 z-30 hidden w-64 flex-col overflow-hidden border-r border-white/60 bg-white/50 shadow-[0_8px_32px_rgba(18,57,60,0.18),0_1px_0_rgba(255,255,255,0.6)_inset] backdrop-blur-xl supports-[backdrop-filter]:bg-white/40 lg:flex">
      <div className="pointer-events-none absolute -right-16 -top-16 h-52 w-52 rounded-full bg-secondary/30 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-16 h-64 w-64 rounded-full bg-primary/20 blur-3xl" />
      <div className="relative px-6 py-5">
        <Brand />
      </div>
      <nav className="relative flex-1 space-y-1 px-3 py-2">
        {items.map((item) => {
          const active = item.match ? item.match(pathname) : pathname.startsWith(item.href)
          const Icon = item.icon
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-colors',
                active
                  ? 'bg-gradient-to-br from-primary to-primary/70 text-primary-foreground shadow-[0_4px_12px_rgba(18,57,60,0.25)]'
                  : 'text-muted-foreground hover:bg-primary/5 hover:text-primary',
              )}
            >
              <Icon className="h-4.5 w-4.5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="relative border-t border-border px-6 py-4 text-xs text-muted-foreground">
        Kinetix Home Care
        <span className="block text-[10px]">v1.0.0</span>
      </div>
    </aside>
  )
}