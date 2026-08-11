'use client'

import { useQuery } from '@tanstack/react-query'
import { PageHeader, StatCard } from '@kinetix/ui'
import { Skeleton } from '@kinetix/ui'
import { Users, Stethoscope, CalendarClock, Star } from 'lucide-react'
import { getAdminDashboard } from '@/services/dashboards'

export default function AdminDashboardPage() {
  const { data, isPending } = useQuery({ queryKey: ['dashboard', 'admin'], queryFn: getAdminDashboard })

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="Clinic overview at a glance" />
      {isPending || !data ? (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
          <Skeleton className="h-28" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard icon={Users} label="Total patients" value={data.total_patients} />
          <StatCard icon={Stethoscope} label="Total therapists" value={data.total_therapists} />
          <StatCard icon={CalendarClock} label="Upcoming appointments" value={data.upcoming_appointments} />
          <StatCard icon={Star} label="Avg. rating" value={data.overall_avg_feedback_rating != null ? `${data.overall_avg_feedback_rating} / 5` : '—'} />
        </div>
      )}
    </div>
  )
}
