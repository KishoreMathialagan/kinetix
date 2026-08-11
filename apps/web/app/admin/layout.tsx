import type { Metadata } from 'next'
import { RoleLayout } from '@/components/layout/role-layout'
import { adminNavItems } from '@/components/layout/nav'

export const metadata: Metadata = {
  title: 'Admin',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleLayout title="Admin" navItems={adminNavItems}>
      {children}
    </RoleLayout>
  )
}
