'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { PageHeader, StatCard, EmptyState } from '@kinetix/ui'
import { Skeleton } from '@kinetix/ui'
import { Button } from '@kinetix/ui'
import { CalendarClock, Dumbbell, ClipboardCheck, Bell, HeartPulse, Star, Stethoscope, UserX } from 'lucide-react'
import { formatDate, formatTime } from '@kinetix/utils'
import { getPatientDashboard } from '@/services/dashboards'
import { getMyPatientProfile } from '@/services/patients'
import { listAppointments } from '@/services/appointments'
import { listPrograms } from '@/services/exercises'
import { StatusBadge } from '@/components/status-badge'

export default function PatientDashboardPage() {
  const profile = useQuery({ queryKey: ['my-patient-profile'], queryFn: getMyPatientProfile })
  const stats = useQuery({ queryKey: ['dashboard', 'patient'], queryFn: getPatientDashboard })
  const appointments = useQuery({
    queryKey: ['appointments', 'me'],
    queryFn: () => listAppointments({ size: 5 }),
  })
  const programs = useQuery({
    queryKey: ['programs', 'me'],
    queryFn: () => listPrograms({ size: 5 }),
  })

  const firstName = profile.data?.user.first_name
  const isPending = profile.isPending || stats.isPending

  return (
    <div className="space-y-6">
      <PageHeader
        title={firstName ? `Hello, ${firstName}` : 'Dashboard'}
        description="Your recovery at a glance"
        actions={
          <Button asChild variant="outline">
            <Link href="/patient/feedback">
              <Star className="mr-2 h-4 w-4" /> Leave feedback
            </Link>
          </Button>
        }
      />
      {isPending ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={CalendarClock} label="Upcoming appointments" value={stats.data?.upcoming_appointments ?? 0} />
          <StatCard icon={ClipboardCheck} label="Sessions completed" value={stats.data?.total_sessions ?? 0} />
          <StatCard icon={Dumbbell} label="Exercise programs" value={stats.data?.exercise_programs ?? 0} />
          <StatCard icon={Bell} label="Unread notifications" value={stats.data?.unread_notifications ?? 0} />
        </div>
      )}

      <section className="glass-panel p-5">
        <div className="mb-4 flex items-center justify-between">
          <h2 className="panel-heading">Your therapist</h2>
        </div>
        {!stats.data?.assigned_therapist ? (
          <EmptyState
            icon={UserX}
            title="No therapist assigned yet"
            description="Your care team will assign a therapist after your first assessment."
          />
        ) : (
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary">
              <Stethoscope className="h-6 w-6" />
            </div>
            <div>
              <p className="text-sm font-semibold">{stats.data.assigned_therapist.name ?? 'Your therapist'}</p>
              {stats.data.assigned_therapist.specialization ? (
                <p className="text-xs capitalize text-muted-foreground">
                  {stats.data.assigned_therapist.specialization.replace(/_/g, ' ')}
                </p>
              ) : null}
            </div>
          </div>
        )}
      </section>

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass-panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="panel-heading">Upcoming appointments</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/patient/appointments">View all</Link>
            </Button>
          </div>
          {appointments.isPending ? (
            <Skeleton className="h-24" />
          ) : !appointments.data || appointments.data.items.length === 0 ? (
            <EmptyState icon={CalendarClock} title="No appointments" description="You have no upcoming appointments." />
          ) : (
            <ul className="divide-y divide-border">
              {appointments.data.items.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium">
                      {formatDate(a.scheduled_date)} Â· {formatTime(a.start_time)}
                    </p>
                    <p className="text-xs text-muted-foreground">{a.appointment_type ?? 'General'} Â· {a.duration_minutes} min</p>
                  </div>
                  <StatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="glass-panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="panel-heading">Your exercise programs</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/patient/exercises">View all</Link>
            </Button>
          </div>
          {programs.isPending ? (
            <Skeleton className="h-24" />
          ) : !programs.data || programs.data.items.length === 0 ? (
            <EmptyState icon={HeartPulse} title="No programs yet" description="Your therapist will assign exercises soon." />
          ) : (
            <ul className="divide-y divide-border">
              {programs.data.items.map((p) => (
                <li key={p.id} className="flex items-center justify-between py-2.5">
                  <div>
                    <p className="text-sm font-medium">{p.title}</p>
                    <p className="text-xs text-muted-foreground">{p.frequency ?? 'â€”'} Â· {p.duration ?? 'â€”'}</p>
                  </div>
                  <span className="text-xs text-muted-foreground">{p.exercise_items.length} items</span>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
