'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Textarea,
  toast,
} from '@kinetix/ui'
import { PageHeader } from '@kinetix/ui'
import { Alert, AlertDescription } from '@kinetix/ui'
import { DataTable, type DataTableColumn } from '@/components/data-table'
import { StatusBadge } from '@/components/status-badge'
import { listAppointments, rescheduleAppointment, cancelAppointment } from '@/services/appointments'
import { formatDate } from '@kinetix/utils'
import type { Appointment } from '@kinetix/shared-types'

type Action = 'reschedule' | 'cancel' | null

export default function PatientAppointmentsPage() {
  const queryClient = useQueryClient()
  const [page, setPage] = useState(1)
  const [action, setAction] = useState<Action>(null)
  const [target, setTarget] = useState<Appointment | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const query = useQuery({
    queryKey: ['appointments', 'me', page],
    queryFn: () => listAppointments({ page, size: 10 }),
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['appointments', 'me'] })

  const columns: DataTableColumn<Appointment>[] = [
    {
      key: 'date',
      header: 'Date',
      render: (a) => <span className="text-sm font-medium">{formatDate(a.scheduled_date)}</span>,
    },
    {
      key: 'time',
      header: 'Time',
      render: (a) => <span className="text-sm">{a.start_time} – {a.end_time}</span>,
      hideOnMobile: true,
    },
    {
      key: 'type',
      header: 'Type',
      render: (a) => <span className="text-sm">{a.appointment_type ?? 'General'}</span>,
    },
    {
      key: 'status',
      header: 'Status',
      render: (a) => <StatusBadge status={a.status} />,
    },
    {
      key: 'actions',
      header: '',
      render: (a) =>
        a.status === 'scheduled' || a.status === 'confirmed' ? (
          <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
            <Button size="sm" variant="outline" onClick={() => { setTarget(a); setAction('reschedule') }}>
              Reschedule
            </Button>
            <Button size="sm" variant="ghost" onClick={() => { setTarget(a); setAction('cancel') }}>
              Cancel
            </Button>
          </div>
        ) : null,
      className: 'text-right',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader title="My appointments" description="Booked sessions and treatment visits" />
      {query.isError ? (
        <Alert variant="destructive">
          <AlertDescription>Failed to load appointments. Please try again later.</AlertDescription>
        </Alert>
      ) : (
      <DataTable<Appointment>
        columns={columns}
        rows={query.data?.items ?? []}
        loading={query.isLoading}
        page={page}
        pageSize={10}
        total={query.data?.total}
        onPageChange={setPage}
        keyField={(a) => a.id}
        emptyTitle="No appointments"
        emptyDescription="You have no appointments yet."
      />
      )}

      <Dialog open={action === 'reschedule'} onOpenChange={(o) => !o && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule appointment</DialogTitle>
            <DialogDescription>Pick a new date and time.</DialogDescription>
          </DialogHeader>
          <RescheduleForm
            key={target?.id ?? 'none'}
            appointment={target}
            submitting={submitting}
            onClose={() => setAction(null)}
            onSubmit={async (payload) => {
              if (!target) return
              setSubmitting(true)
              try {
                await rescheduleAppointment(target.id, payload)
                toast.success('Appointment rescheduled')
                setAction(null)
                refresh()
              } catch {
                toast.error('Could not reschedule')
              } finally {
                setSubmitting(false)
              }
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={action === 'cancel'} onOpenChange={(o) => !o && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel appointment</DialogTitle>
            <DialogDescription>Please provide a reason for cancellation.</DialogDescription>
          </DialogHeader>
          <CancelForm
            submitting={submitting}
            onClose={() => setAction(null)}
            onSubmit={async (reason) => {
              if (!target) return
              setSubmitting(true)
              try {
                await cancelAppointment(target.id, { reason })
                toast.success('Appointment cancelled')
                setAction(null)
                refresh()
              } catch {
                toast.error('Could not cancel appointment')
              } finally {
                setSubmitting(false)
              }
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}

function RescheduleForm({ appointment, submitting, onClose, onSubmit }: {
  appointment: Appointment | null
  submitting: boolean
  onClose: () => void
  onSubmit: (payload: { scheduled_date: string; start_time: string; duration_minutes: number; reason?: string | null }) => Promise<void>
}) {
  const [date, setDate] = useState(appointment?.scheduled_date ?? '')
  const [time, setTime] = useState(appointment?.start_time ?? '')
  const [duration, setDuration] = useState(String(appointment?.duration_minutes ?? 60))
  const [reason, setReason] = useState('')

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pr-date">Date</Label>
        <Input id="pr-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pr-time">Start time</Label>
        <Input id="pr-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pr-duration">Duration (minutes)</Label>
        <Input id="pr-duration" type="number" min={15} step={15} value={duration} onChange={(e) => setDuration(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="pr-reason">Reason (optional)</Label>
        <Input id="pr-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button
          disabled={submitting || !date || !time}
          onClick={() => onSubmit({ scheduled_date: date, start_time: time, duration_minutes: Number(duration) || 60, reason: reason || null })}
        >
          Reschedule
        </Button>
      </div>
    </div>
  )
}

function CancelForm({ submitting, onClose, onSubmit }: {
  submitting: boolean
  onClose: () => void
  onSubmit: (reason: string) => Promise<void>
}) {
  const [reason, setReason] = useState('')
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="pc-reason">Reason</Label>
        <Textarea id="pc-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. unable to attend" />
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button variant="destructive" disabled={submitting || !reason.trim()} onClick={() => onSubmit(reason.trim())}>
          Cancel appointment
        </Button>
      </div>
    </div>
  )
}
