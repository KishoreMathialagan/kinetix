'use client'

import { useParams } from 'next/navigation'
import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { PageHeader } from '@kinetix/ui'
import { Badge } from '@kinetix/ui'
import { Skeleton } from '@kinetix/ui'
import { Alert, AlertDescription } from '@kinetix/ui'
import { CalendarClock, ClipboardCheck, Dumbbell, FileHeart, AlertCircle } from 'lucide-react'
import { formatDate } from '@kinetix/utils'
import { getPatient } from '@/services/patients'
import { listAppointments } from '@/services/appointments'
import { listAssessments } from '@/services/assessments'
import { listPrograms } from '@/services/exercises'
import { getPatientProgress } from '@/services/progress'
import { getMyTherapistProfile } from '@/services/therapists'
import { StatusBadge } from '@/components/status-badge'

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value || 'â€”'}</p>
    </div>
  )
}

export default function TherapistPatientDetailPage() {
  const params = useParams<{ id: string }>()
  const patientId = params.id

  const profile = useQuery({ queryKey: ['my-therapist-profile'], queryFn: getMyTherapistProfile })
  const patient = useQuery({ queryKey: ['patient', patientId], queryFn: () => getPatient(patientId) })
  const appointments = useQuery({
    queryKey: ['appointments', 'patient', patientId],
    queryFn: () => listAppointments({ patient_id: patientId, size: 10 }),
  })
  const assessments = useQuery({
    queryKey: ['assessments', 'patient', patientId],
    queryFn: () => listAssessments({ patient_id: patientId, size: 10 }),
  })
  const programs = useQuery({
    queryKey: ['programs', 'patient', patientId],
    queryFn: () => listPrograms({ patient_id: patientId, size: 10 }),
  })
  const progress = useQuery({
    queryKey: ['progress', patientId],
    queryFn: () => getPatientProgress(patientId),
    enabled: !!profile.data?.profile.id,
  })

  const latestPain = progress.data?.pain_trend[progress.data.pain_trend.length - 1]

  return (
    <div className="space-y-6">
      <PageHeader
        title={patient.data ? `Patient ${patient.data.patient_code}` : 'Patient'}
        description="Care record"
      />
      {patient.error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load patient data. Please try again later.</AlertDescription>
        </Alert>
      )}

      {patient.isPending ? (
        <Skeleton className="h-40" />
      ) : patient.data ? (
        <section className="glass-panel p-5">
          <div className="mb-4 flex items-center gap-2">
            <Badge>{patient.data.patient_code}</Badge>
            {patient.data.gender ? <Badge variant="secondary">{patient.data.gender.replace(/_/g, ' ')}</Badge> : null}
            <Badge variant="outline">{patient.data.blood_group ?? 'Blood group n/a'}</Badge>
          </div>
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
            <Field label="Date of birth" value={patient.data.dob} />
            <Field label="Phone" value={patient.data.emergency_phone} />
            <Field label="Address" value={patient.data.address} />
            <Field label="Occupation" value={patient.data.occupation} />
            <Field label="Referred by" value={patient.data.referred_by} />
            <Field label="Diagnosis" value={patient.data.diagnosis} />
          </div>
          {patient.data.medical_history || patient.data.allergies || patient.data.medications ? (
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="Medical history" value={patient.data.medical_history} />
              <Field label="Allergies" value={patient.data.allergies} />
              <Field label="Medications" value={patient.data.medications} />
            </div>
          ) : null}
        </section>
      ) : null}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass-panel p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <CalendarClock className="h-4 w-4" /> Appointments
          </h2>
          {appointments.isPending ? (
            <Skeleton className="h-24" />
          ) : !appointments.data || appointments.data.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No appointments recorded.</p>
          ) : (
            <ul className="divide-y divide-border">
              {appointments.data.items.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{formatDate(a.scheduled_date)} Â· {a.start_time}</p>
                    <p className="text-xs text-muted-foreground">{a.appointment_type ?? 'General'} Â· {a.duration_minutes} min</p>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="glass-panel p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <ClipboardCheck className="h-4 w-4" /> Assessments
          </h2>
          {assessments.isPending ? (
            <Skeleton className="h-24" />
          ) : !assessments.data || assessments.data.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No assessments yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {assessments.data.items.map((a) => (
                <li key={a.id} className="py-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-medium capitalize">{a.assessment_type} assessment</p>
                    <p className="text-xs text-muted-foreground">{formatDate(a.created_at)}</p>
                  </div>
                  {a.diagnosis ? <p className="mt-1 text-xs text-muted-foreground">{a.diagnosis}</p> : null}
                  {a.pain_score != null ? <p className="mt-1 text-xs">Pain: {a.pain_score}/10</p> : null}
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="glass-panel p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <Dumbbell className="h-4 w-4" /> Exercise programs
          </h2>
          {programs.isPending ? (
            <Skeleton className="h-24" />
          ) : !programs.data || programs.data.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">No exercise programs yet.</p>
          ) : (
            <ul className="divide-y divide-border">
              {programs.data.items.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2">
                  <div>
                    <p className="text-sm font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.frequency ?? 'â€”'} Â· {p.duration ?? 'â€”'}</p>
                  </div>
                  <Badge variant="secondary">{p.exercise_items.length} items</Badge>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="glass-panel p-5">
          <h2 className="mb-3 flex items-center gap-2 font-semibold">
            <FileHeart className="h-4 w-4" /> Progress
          </h2>
          {progress.isPending ? (
            <Skeleton className="h-24" />
          ) : progress.data ? (
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Latest pain</p>
                <p className="text-2xl font-bold">{latestPain?.value ?? 'â€”'}</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Sessions</p>
                <p className="text-2xl font-bold">{progress.data.session_timeline.length}</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Trend points</p>
                <p className="text-2xl font-bold">{progress.data.pain_trend.length}</p>
              </div>
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">No progress data.</p>
          )}
        </section>
      </div>

      <div className="flex gap-3">
        <Link href={`/therapist/treatments?patient=${patientId}`} className="inline-flex h-9 items-center rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90">
          Manage care
        </Link>
        <Link href={`/therapist/appointments`} className="inline-flex h-9 items-center rounded-md border border-input bg-background px-4 text-sm font-medium hover:bg-accent">
          View appointments
        </Link>
      </div>
    </div>
  )
}
