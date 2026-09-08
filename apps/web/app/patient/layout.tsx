'use client'

import { RoleLayout } from '@/components/layout/role-layout'
import { patientNavItems } from '@/components/layout/nav'
import { ProfileGate } from '@/components/profile-gate'

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleLayout title="Patient" navItems={patientNavItems}>
      <ProfileGate>{children}</ProfileGate>
    </RoleLayout>
  )
}
