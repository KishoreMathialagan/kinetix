'use client'

import { useQuery } from '@tanstack/react-query'
import Link from 'next/link'
import { PageHeader, StatCard, EmptyState } from '@kinetix/ui'
import { Skeleton } from '@kinetix/ui'
import { Button } from '@kinetix/ui'
import { CalendarClock, ListChecks, ClipboardCheck, Star, Stethoscope, UserRound } from 'lucide-react'
import { formatDate, formatTime } from '@kinetix/utils'
import { getTherapistDashboard } from '@/services/dashboards'
import { getMyTherapistProfile, getTherapistDashboardById } from '@/services/therapists'
import { listAppointments } from '@/services/appointments'
import { StatusBadge } from '@/components/status-badge'

export default function TherapistDashboardPage() {
  const profile = useQuery({ queryKey: ['my-therapist-profile'], queryFn: getMyTherapistProfile })
  const stats = useQuery({ queryKey: ['dashboard', 'therapist'], queryFn: getTherapistDashboard })
  const dayStats = useQuery({
    queryKey: ['dashboard', 'therapist', 'day', profile.data?.profile.id],
    queryFn: () => getTherapistDashboardById(profile.data!.profile.id),
    enabled: !!profile.data?.profile.id,
  })
  const appointments = useQuery({
    queryKey: ['appointments', 'therapist', profile.data?.profile.id],
    queryFn: () => listAppointments({ therapist_id: profile.data!.profile.id, size: 10 }),
    enabled: !!profile.data?.profile.id,
  })

  const pending = profile.isPending || stats.isPending

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Your day at a glance" />
      {pending ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={CalendarClock} label="Total appointments" value={stats.data?.total_appointments ?? 0} />
          <StatCard icon={ListChecks} label="Upcoming" value={stats.data?.upcoming_appointments ?? 0} />
          <StatCard icon={ClipboardCheck} label="Sessions completed" value={stats.data?.total_sessions ?? 0} />
          <StatCard icon={Star} label="Avg. rating" value={stats.data?.avg_feedback_rating != null ? `${stats.data.avg_feedback_rating} / 5` : 'â€”'} />
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-2">
        <section className="glass-panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="panel-heading">Today</h2>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Stethoscope className="h-4 w-4" />
              {dayStats.data ? `${dayStats.data.todays_appointments_count} appointments Â· ${dayStats.data.availability_status}` : 'â€”'}
            </div>
          </div>
          {dayStats.data ? (
            <div className="mb-4 grid grid-cols-2 gap-4">
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Active patients</p>
                <p className="text-2xl font-bold">{dayStats.data.active_patients_count}</p>
              </div>
              <div className="rounded-lg bg-muted p-3">
                <p className="text-xs text-muted-foreground">Profile completion</p>
                <p className="text-2xl font-bold">{dayStats.data.profile_completion_percentage}%</p>
              </div>
            </div>
          ) : (
            <Skeleton className="h-20" />
          )}
          <Button asChild variant="outline" className="w-full">
            <Link href="/therapist/profile">Manage availability</Link>
          </Button>
        </section>

        <section className="glass-panel p-5">
          <div className="mb-4 flex items-center justify-between">
            <h2 className="panel-heading">Upcoming appointments</h2>
            <Button asChild variant="ghost" size="sm">
              <Link href="/therapist/appointments">View all</Link>
            </Button>
          </div>
          {appointments.isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : !appointments.data || appointments.data.items.length === 0 ? (
            <EmptyState icon={UserRound} title="No appointments" description="You have no upcoming appointments." />
          ) : (
            <ul className="divide-y divide-border">
              {appointments.data.items.slice(0, 5).map((a) => (
                <li key={a.id}>
                  <Link href={`/therapist/appointments`} className="flex items-center justify-between py-2.5 hover:bg-muted/50">
                    <div>
                      <p className="text-sm font-medium">
                        {formatDate(a.scheduled_date)} Â· {formatTime(a.start_time)}
                      </p>
                      <p className="text-xs text-muted-foreground">{a.appointment_type ?? 'General'} Â· {a.duration_minutes} min</p>
                    </div>
                    <StatusBadge status={a.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  )
}
