'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@kinetix/ui'
import { PageHeader } from '@kinetix/ui'
import { PatientForm } from '@/components/forms/patient-form'

export default function AdminNewPatientPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <PageHeader title="Register patient" description="Create a new patient record with login credentials" />
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-lg">Patient details</CardTitle>
        </CardHeader>
        <CardContent>
          <PatientForm mode="create" onSuccess={() => router.push('/admin/patients')} />
        </CardContent>
      </Card>
    </div>
  )
}
