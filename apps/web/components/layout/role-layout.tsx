'use client'

import { Header } from './header'
import { Sidebar, type NavItem } from './sidebar'
import { BottomNav } from './bottom-nav'

interface RoleLayoutProps {
  title: string
  navItems: NavItem[]
  children: React.ReactNode
  fab?: React.ReactNode
}

export function RoleLayout({ title, navItems, children, fab }: RoleLayoutProps) {
  return (
    <div className="relative min-h-dvh overflow-hidden bg-background">
      <div className="pointer-events-none absolute -top-40 -left-32 h-[28rem] w-[28rem] rounded-full bg-secondary/15 blur-3xl" />
      <div className="pointer-events-none absolute -right-32 bottom-0 h-[30rem] w-[30rem] rounded-full bg-primary/10 blur-3xl" />
      <div className="pointer-events-none absolute top-1/3 left-1/2 h-72 w-72 -translate-x-1/2 rounded-full bg-primary-foreground/20 blur-3xl" />
      <Sidebar items={navItems} />
      <div className="relative lg:pl-64">
        <Header title={title} />
        <main className="mx-auto max-w-6xl px-4 pb-24 pt-6 sm:px-6 lg:pb-10">{children}</main>
      </div>
      <BottomNav items={navItems} />
      {fab && <div className="fixed bottom-20 right-4 z-30 lg:hidden">{fab}</div>}
    </div>
  )
}