'use client'

import { useQuery } from '@tanstack/react-query'
import { Card, CardContent, CardHeader, CardTitle, Skeleton } from '@kinetix/ui'
import { PageHeader } from '@kinetix/ui'
import { DataTable } from '@/components/data-table'
import { getAdminAnalytics, getAdminDashboard } from '@/services/dashboards'
import { formatCurrency } from '@kinetix/utils'
import type { TherapistProductivity } from '@kinetix/shared-types'

function Metric({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{label}</CardTitle>
      </CardHeader>
      <CardContent className="text-2xl font-bold">{value}</CardContent>
    </Card>
  )
}

export default function AdminAnalyticsPage() {
  const analyticsQuery = useQuery({ queryKey: ['admin', 'analytics'], queryFn: getAdminAnalytics })
  const dashboardQuery = useQuery({ queryKey: ['admin', 'dashboard'], queryFn: getAdminDashboard })

  const analytics = analyticsQuery.data
  const dashboard = dashboardQuery.data

  return (
    <div className="space-y-6">
      <PageHeader title="Analytics" description="Clinic performance and revenue insights" />
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Metric label="Total patients" value={dashboard?.total_patients ?? <Skeleton className="h-8 w-16" />} />
        <Metric label="Total appointments" value={dashboard?.total_appointments ?? <Skeleton className="h-8 w-16" />} />
        <Metric label="Completed sessions" value={dashboard?.completed_sessions ?? <Skeleton className="h-8 w-16" />} />
        <Metric label="Avg feedback rating" value={dashboard?.overall_avg_feedback_rating ?? '—'} />
        <Metric label="Revenue billed" value={analytics?.revenue ? formatCurrency(analytics.revenue.billed) : '—'} />
        <Metric label="Revenue collected" value={analytics?.revenue ? formatCurrency(analytics.revenue.collected) : '—'} />
        <Metric label="Outstanding" value={analytics?.revenue ? formatCurrency(analytics.revenue.outstanding) : '—'} />
        <Metric label="Avg invoice value" value={analytics?.revenue?.avg_invoice_value != null ? formatCurrency(analytics.revenue.avg_invoice_value) : '—'} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Therapist productivity</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable<TherapistProductivity>
            columns={[
              { key: 'name', header: 'Therapist', render: (t) => <span className="text-sm font-medium">{t.name ?? t.therapist_id}</span> },
              { key: 'sessions', header: 'Completed sessions', render: (t) => <span className="text-sm">{t.completed_sessions}</span> },
              { key: 'patients', header: 'Active patients', render: (t) => <span className="text-sm">{t.active_patients}</span> },
            ]}
            rows={analytics?.therapist_productivity ?? []}
            loading={analyticsQuery.isLoading}
            keyField={(t) => t.therapist_id}
            emptyTitle="No productivity data"
            emptyDescription="Therapist productivity will appear once sessions are recorded."
          />
        </CardContent>
      </Card>
    </div>
  )
}
