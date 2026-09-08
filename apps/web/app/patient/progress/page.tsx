'use client'

import { useQuery } from '@tanstack/react-query'
import { PageHeader, EmptyState } from '@kinetix/ui'
import { Skeleton } from '@kinetix/ui'
import { Alert, AlertDescription } from '@kinetix/ui'
import { TrendingUp } from 'lucide-react'
import { formatDate } from '@kinetix/utils'
import { getMyPatientProfile } from '@/services/patients'
import { getPatientProgress, listMeasurements } from '@/services/progress'

export default function PatientProgressPage() {
  const profile = useQuery({ queryKey: ['my-patient-profile'], queryFn: getMyPatientProfile })
  const patientId = profile.data?.profile.id

  const progress = useQuery({
    queryKey: ['progress', patientId],
    queryFn: () => getPatientProgress(patientId as string),
    enabled: !!patientId,
  })
  const measurements = useQuery({
    queryKey: ['measurements', patientId],
    queryFn: () => listMeasurements(patientId as string),
    enabled: !!patientId,
  })

  const painTrend = progress.data?.pain_trend ?? []
  const maxPain = Math.max(10, ...painTrend.map((p) => p.value ?? 0))

  return (
    <div className="space-y-6">
      <PageHeader title="My progress" description="Track your recovery over time" />

      {progress.isPending ? (
        <Skeleton className="h-40" />
      ) : progress.isError ? (
        <Alert variant="destructive">
          <AlertDescription>Failed to load progress data. Please try again later.</AlertDescription>
        </Alert>
      ) : progress.data ? (
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
            <StatBox label="Latest pain" value={painTrend.length ? String(painTrend[painTrend.length - 1]?.value ?? 'â€”') : 'â€”'} />
            <StatBox label="First pain" value={painTrend.length ? String(painTrend[0]?.value ?? 'â€”') : 'â€”'} />
            <StatBox label="Sessions" value={String(progress.data.session_timeline.length)} />
            <StatBox label="ROM points" value={String(progress.data.rom_trend.length)} />
          </div>

          {painTrend.length > 0 && (
            <section className="glass-panel p-5">
              <h2 className="mb-4 flex items-center gap-2 font-semibold">
                <TrendingUp className="h-4 w-4" /> Pain trend
              </h2>
              <div className="flex h-40 items-end gap-2">
                {painTrend.map((p) => (
                  <div key={p.date + String(p.value)} className="flex flex-1 flex-col items-center gap-1">
                    <span className="text-xs text-muted-foreground">{p.value ?? 'â€”'}</span>
                    <div
                      className="w-full rounded-t bg-primary/70"
                      style={{ height: `${Math.max(4, ((p.value ?? 0) / maxPain) * 100)}%` }}
                    />
                    <span className="text-[10px] text-muted-foreground">{formatDate(p.date).slice(5)}</span>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="glass-panel p-5">
            <h2 className="mb-3 font-semibold">Measurements</h2>
            {measurements.isPending ? (
              <Skeleton className="h-24" />
            ) : !measurements.data || measurements.data.length === 0 ? (
              <EmptyState icon={TrendingUp} title="No measurements yet" description="Your therapist will record measurements during sessions." />
            ) : (
              <ul className="divide-y divide-border">
                {measurements.data.map((m) => (
                  <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                    <span>
                      <span className="capitalize">{m.assessment_type ?? 'measurement'}</span>
                      <span className="ml-2 text-xs text-muted-foreground">{formatDate(m.measured_at)}</span>
                    </span>
                    <span className="text-xs text-muted-foreground">
                      Pain {m.pain_score ?? 'â€”'} Â· ROM {m.rom_degrees ?? 'â€”'} Â· Strength {m.strength_scale ?? 'â€”'}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </div>
      ) : (
        <EmptyState icon={TrendingUp} title="No progress data" description="Progress appears after your first session." />
      )}
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}
