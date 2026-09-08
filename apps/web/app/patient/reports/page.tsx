'use client'

import { useQuery } from '@tanstack/react-query'
import { PageHeader, EmptyState, StatCard } from '@kinetix/ui'
import { Skeleton } from '@kinetix/ui'
import { Alert, AlertDescription } from '@kinetix/ui'
import { FileText, TrendingUp, HeartPulse, ClipboardCheck, Dumbbell, CalendarClock } from 'lucide-react'
import { formatDate } from '@kinetix/utils'
import { getMyPatientProfile } from '@/services/patients'
import { getPatientReport } from '@/services/reports'

interface LatestMeasurement {
  pain_score: number | null
  rom_degrees: number | null
  strength_scale: string | null
  measured_at: string | null
}

interface LatestAssessment {
  assessment_type: string | null
  pain_score: number | null
  diagnosis: string | null
  goals: string | null
}

interface PatientReport {
  report_type: string
  generated_at: string
  patient?: { id: string; patient_code: string | null; name: string | null; email: string | null } | null
  appointments?: Record<string, number>
  total_sessions?: number
  completed_sessions?: number
  avg_pain_before?: number | null
  avg_pain_after?: number | null
  latest_progress_measurement?: LatestMeasurement | null
  latest_assessment?: LatestAssessment | null
  active_treatment_plans?: number
  exercise_compliance?: { total_exercise_items: number; completed_exercise_items: number; score: number } | null
}

const STATUS_LABELS: Record<string, string> = {
  scheduled: 'Scheduled',
  confirmed: 'Confirmed',
  in_progress: 'In progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  missed: 'Missed',
}

export default function PatientReportsPage() {
  const profile = useQuery({ queryKey: ['my-patient-profile'], queryFn: getMyPatientProfile })
  const patientId = profile.data?.profile.id

  const report = useQuery<PatientReport>({
    queryKey: ['report', 'patient', patientId],
    queryFn: () => getPatientReport(patientId as string) as unknown as Promise<PatientReport>,
    enabled: !!patientId,
  })

  const data = report.data
  const compliance = data?.exercise_compliance

  return (
    <div className="space-y-6">
      <PageHeader title="My reports" description="Progress, sessions, exercises and outcome measures" />

      {report.isPending ? (
        <Skeleton className="h-64" />
      ) : report.isError ? (
        <Alert variant="destructive">
          <AlertDescription>Failed to load report. Please try again later.</AlertDescription>
        </Alert>
      ) : !data ? (
        <EmptyState icon={FileText} title="No report available" description="Your treatment report will appear after your first session." />
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatCard icon={ClipboardCheck} label="Sessions completed" value={data.completed_sessions ?? 0} />
            <StatCard icon={HeartPulse} label="Avg pain before" value={data.avg_pain_before ?? 'â€”'} />
            <StatCard icon={HeartPulse} label="Avg pain after" value={data.avg_pain_after ?? 'â€”'} />
            <StatCard
              icon={Dumbbell}
              label="Exercise compliance"
              value={compliance ? `${Math.round(compliance.score)}%` : 'â€”'}
            />
          </div>

          <section className="glass-panel p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <TrendingUp className="h-4 w-4" /> Latest assessment
            </h2>
            {data.latest_assessment ? (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="Type" value={data.latest_assessment.assessment_type?.replace(/_/g, ' ')} />
                <Field label="Pain score" value={data.latest_assessment.pain_score != null ? String(data.latest_assessment.pain_score) : null} />
                <Field label="Diagnosis" value={data.latest_assessment.diagnosis} />
                <div className="md:col-span-3">
                  <Field label="Goals" value={data.latest_assessment.goals} />
                </div>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No assessment recorded yet.</p>
            )}
          </section>

          <section className="glass-panel p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <TrendingUp className="h-4 w-4" /> Latest progress measurement
            </h2>
            {data.latest_progress_measurement ? (
              <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
                <Field label="Pain" value={data.latest_progress_measurement.pain_score != null ? String(data.latest_progress_measurement.pain_score) : null} />
                <Field label="ROM (degrees)" value={data.latest_progress_measurement.rom_degrees != null ? String(data.latest_progress_measurement.rom_degrees) : null} />
                <Field label="Strength" value={data.latest_progress_measurement.strength_scale} />
                <Field label="Measured" value={data.latest_progress_measurement.measured_at ? formatDate(data.latest_progress_measurement.measured_at) : null} />
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No measurements recorded yet.</p>
            )}
          </section>

          <section className="glass-panel p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <CalendarClock className="h-4 w-4" /> Appointment summary
            </h2>
            {data.appointments && Object.keys(data.appointments).length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {Object.entries(data.appointments).map(([status, count]) => (
                  <span key={status} className="inline-flex items-center gap-1.5 rounded-lg bg-muted px-3 py-1.5 text-sm">
                    <span className="font-semibold">{count}</span>
                    <span className="text-muted-foreground">{STATUS_LABELS[status] ?? status.replace(/_/g, ' ')}</span>
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">No appointments recorded yet.</p>
            )}
          </section>
        </div>
      )}
    </div>
  )
}

function Field({ label, value }: { label: string; value?: string | number | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value ?? 'â€”'}</p>
    </div>
  )
}
