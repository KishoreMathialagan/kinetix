import type { Metadata } from 'next'
import { RoleLayout } from '@/components/layout/role-layout'
import { patientNavItems } from '@/components/layout/nav'

export const metadata: Metadata = {
  title: 'Patient',
}

export default function PatientLayout({ children }: { children: React.ReactNode }) {
  return (
    <RoleLayout title="Patient" navItems={patientNavItems}>
      {children}
    </RoleLayout>
  )
}
