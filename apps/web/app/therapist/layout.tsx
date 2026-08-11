import type { Metadata } from 'next'
import { RoleLayout } from '@/components/layout/role-layout'
import { therapistNavItems } from '@/components/layout/nav'

export const metadata: Metadata = {
  title: 'Therapist',
}

export default function TherapistLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleLayout title="Therapist" navItems={therapistNavItems}>
      {children}
    </RoleLayout>
  )
}
