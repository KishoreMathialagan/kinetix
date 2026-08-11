'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CalendarPlus, ChevronRight } from 'lucide-react'
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kinetix/ui'
import { PageHeader } from '@kinetix/ui'
import { DataTable, type DataTableColumn } from '@/components/data-table'
import { AppointmentForm } from '@/components/forms/appointment-form'
import { listAppointments } from '@/services/appointments'
import { useNameLookup } from '@/lib/names'
import { formatDate } from '@kinetix/utils'
import type { Appointment, AppointmentStatus } from '@kinetix/shared-types'

const statuses: (AppointmentStatus | '')[] = ['', 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'missed']

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  scheduled: 'secondary',
  confirmed: 'default',
  in_progress: 'default',
  completed: 'outline',
  cancelled: 'destructive',
  missed: 'destructive',
}

export default function AdminAppointmentsPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<AppointmentStatus | ''>('')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const { patientName, therapistName } = useNameLookup()

  const query = useQuery({
    queryKey: ['appointments', 'admin', status, page],
    queryFn: () =>
      listAppointments({
        appt_status: status || undefined,
        page,
        size: 10,
      }),
  })

  const columns: DataTableColumn<Appointment>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (a) => <span className="text-sm font-medium">{formatDate(a.scheduled_date)}</span>,
    },
    {
      key: 'time',
      header: 'Time',
      render: (a) => (
        <span className="text-sm">{a.start_time} – {a.end_time}</span>
      ),
      hideOnMobile: true,
    },
    {
      key: 'patient',
      header: 'Patient',
      render: (a) => <span className="text-sm">{patientName(a.patient_id)}</span>,
    },
    {
      key: 'therapist',
      header: 'Therapist',
      render: (a) => <span className="text-sm">{therapistName(a.therapist_id)}</span>,
      hideOnMobile: true,
    },
    {
      key: 'type',
      header: 'Type',
      render: (a) => <span className="text-sm">{a.appointment_type ?? '—'}</span>,
      hideOnMobile: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => <Badge variant={statusVariant[a.status] ?? 'secondary'}>{a.status.replace(/_/g, ' ')}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: () => <ChevronRight className="h-4 w-4 text-muted-foreground" />,
      className: 'text-right',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Appointments"
        description="Schedule and manage patient appointments"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <CalendarPlus className="mr-2 h-4 w-4" /> Schedule appointment
          </Button>
        }
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={status} onValueChange={(v) => { setStatus(v as AppointmentStatus | ''); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s === '' ? 'All statuses' : s.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DataTable<Appointment>
        columns={columns}
        rows={query.data?.items ?? []}
        loading={query.isLoading}
        page={page}
        pageSize={10}
        total={query.data?.total}
        onPageChange={setPage}
        onRowClick={(a) => router.push(`/admin/appointments/${a.id}`)}
        keyField={(a) => a.id}
        emptyTitle="No appointments found"
        emptyDescription="Schedule an appointment to get started."
      />
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Schedule appointment</DialogTitle>
            <DialogDescription>Choose a patient, therapist and time slot.</DialogDescription>
          </DialogHeader>
          <AppointmentForm
            onSuccess={() => {
              setCreateOpen(false)
              queryClient.invalidateQueries({ queryKey: ['appointments'] })
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
