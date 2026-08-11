'use client'

import { useRouter } from 'next/navigation'
import { Card, CardContent, CardHeader, CardTitle } from '@kinetix/ui'
import { PageHeader } from '@kinetix/ui'
import { TherapistForm } from '@/components/forms/therapist-form'

export default function AdminNewTherapistPage() {
  const router = useRouter()

  return (
    <div className="space-y-6">
      <PageHeader title="Add therapist" description="Create a therapist account with professional details" />
      <Card className="max-w-3xl">
        <CardHeader>
          <CardTitle className="text-lg">Therapist details</CardTitle>
        </CardHeader>
        <CardContent>
          <TherapistForm onSuccess={() => router.push('/admin/therapists')} />
        </CardContent>
      </Card>
    </div>
  )
}
