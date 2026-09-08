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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  toast,
} from '@kinetix/ui'
import { PageHeader } from '@kinetix/ui'
import { Play, Square, XCircle, CalendarDays, AlertCircle } from 'lucide-react'
import { Alert, AlertDescription } from '@kinetix/ui'
import { DataTable, type DataTableColumn } from '@/components/data-table'
import { StatusBadge } from '@/components/status-badge'
import { listAppointments, rescheduleAppointment, cancelAppointment, completeAppointment } from '@/services/appointments'
import { getMyTherapistProfile } from '@/services/therapists'
import { startSession, endSession } from '@/services/sessions'
import { formatDate } from '@kinetix/utils'
import type { Appointment, AppointmentStatus } from '@kinetix/shared-types'
import { Skeleton } from '@kinetix/ui'

const statuses: (AppointmentStatus | '_all')[] = ['_all', 'scheduled', 'confirmed', 'in_progress', 'completed', 'cancelled', 'missed']

type Action = 'start' | 'end' | 'reschedule' | 'cancel' | null

export default function TherapistAppointmentsPage() {
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<AppointmentStatus | '_all'>('_all')
  const [page, setPage] = useState(1)
  const [action, setAction] = useState<Action>(null)
  const [target, setTarget] = useState<Appointment | null>(null)
  const [sessionIds, setSessionIds] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const profile = useQuery({ queryKey: ['my-therapist-profile'], queryFn: getMyTherapistProfile })
  const therapistId = profile.data?.profile.id

  const query = useQuery({
    queryKey: ['appointments', 'therapist', therapistId, status, page],
    queryFn: () =>
      listAppointments({
        therapist_id: therapistId,
        appt_status: status === '_all' ? undefined : status,
        page,
        size: 10,
      }),
    enabled: !!therapistId,
  })

  const openAction = (a: Appointment, kind: Exclude<Action, null>) => {
    setTarget(a)
    setAction(kind)
  }

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['appointments', 'therapist'] })

  const handleStart = async () => {
    if (!target) return
    setSubmitting(true)
    try {
      const session = await startSession({ appointment_id: target.id })
      setSessionIds((m) => ({ ...m, [target.id]: session.id }))
      toast.success('Session started')
      setAction(null)
      refresh()
    } catch {
      toast.error('Could not start session')
    } finally {
      setSubmitting(false)
    }
  }

  const handleComplete = async (sessionId: string, payload: {
    pain_before?: number | null
    pain_after?: number | null
    treatment_notes?: string | null
    exercises?: string | null
    modalities?: string | null
    response?: string | null
  }) => {
    if (!target) return
    setSubmitting(true)
    try {
      await endSession(sessionId, payload)
      await completeAppointment(target.id)
      toast.success('Session completed')
      setAction(null)
      refresh()
    } catch {
      toast.error('Could not complete session')
    } finally {
      setSubmitting(false)
    }
  }

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
      key: 'patient',
      header: 'Patient',
      render: (a) => <span className="text-sm">Patient #{a.patient_id.slice(0, 8)}</span>,
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
      render: (a) => <StatusBadge status={a.status} />,
    },
    {
      key: 'actions',
      header: '',
      render: (a) => (
        <div className="flex justify-end gap-2" onClick={(e) => e.stopPropagation()}>
          {a.status === 'confirmed' && (
            <Button size="sm" variant="outline" onClick={() => openAction(a, 'start')}>
              <Play className="mr-1 h-3 w-3" /> Start
            </Button>
          )}
          {a.status === 'in_progress' && sessionIds[a.id] && (
            <Button size="sm" onClick={() => openAction(a, 'end')}>
              <Square className="mr-1 h-3 w-3" /> End session
            </Button>
          )}
          {(a.status === 'scheduled' || a.status === 'confirmed') && (
            <>
              <Button size="sm" variant="outline" onClick={() => openAction(a, 'reschedule')}>
                <CalendarDays className="mr-1 h-3 w-3" /> Reschedule
              </Button>
              <Button size="sm" variant="ghost" onClick={() => openAction(a, 'cancel')}>
                <XCircle className="mr-1 h-3 w-3" />
              </Button>
            </>
          )}
        </div>
      ),
      className: 'text-right',
    },
  ]

  const error = profile.error || query.error

  return (
    <div className="space-y-6">
      <PageHeader title="My appointments" description="View and run patient sessions" />
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load appointments. Please try again later.</AlertDescription>
        </Alert>
      )}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={status} onValueChange={(v) => { setStatus(v as AppointmentStatus | '_all'); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s === '_all' ? 'All statuses' : s.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {profile.isPending && <Skeleton className="h-10 w-48" />}
      </div>
      <DataTable<Appointment>
        columns={columns}
        rows={query.data?.items ?? []}
        loading={query.isLoading}
        page={page}
        pageSize={10}
        total={query.data?.total}
        onPageChange={setPage}
        keyField={(a) => a.id}
        emptyTitle="No appointments found"
        emptyDescription={
          query.data && query.data.total === 0 && status === '_all'
            ? 'You have no appointments yet.'
            : 'Try changing the status filter.'
        }
      />

      <Dialog open={action === 'reschedule'} onOpenChange={(o) => !o && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Reschedule appointment</DialogTitle>
            <DialogDescription>Pick a new date and time.</DialogDescription>
          </DialogHeader>
          <RescheduleForm
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
            appointment={target}
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

      <Dialog open={action === 'start'} onOpenChange={(o) => !o && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Start session</DialogTitle>
            <DialogDescription>
              Begin the treatment session for {target ? `appointment on ${formatDate(target.scheduled_date)}` : ''}.
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-3">
            <Button variant="outline" onClick={() => setAction(null)}>Cancel</Button>
            <Button onClick={handleStart} disabled={submitting}>
              <Play className="mr-2 h-4 w-4" /> Start session
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      <Dialog open={action === 'end'} onOpenChange={(o) => !o && setAction(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>End session</DialogTitle>
            <DialogDescription>Record session details before completing.</DialogDescription>
          </DialogHeader>
          {target && sessionIds[target.id] && (
            <SessionEndForm
              sessionId={sessionIds[target.id] as string}
              submitting={submitting}
              onClose={() => setAction(null)}
              onSubmit={(payload) => handleComplete(sessionIds[target.id] as string, payload)}
            />
          )}
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
        <Label htmlFor="rs-date">Date</Label>
        <Input id="rs-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rs-time">Start time</Label>
        <Input id="rs-time" type="time" value={time} onChange={(e) => setTime(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rs-duration">Duration (minutes)</Label>
        <Input id="rs-duration" type="number" min={15} step={15} value={duration} onChange={(e) => setDuration(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label htmlFor="rs-reason">Reason (optional)</Label>
        <Input id="rs-reason" value={reason} onChange={(e) => setReason(e.target.value)} />
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

function CancelForm({ appointment, submitting, onClose, onSubmit }: {
  appointment: Appointment | null
  submitting: boolean
  onClose: () => void
  onSubmit: (reason: string) => Promise<void>
}) {
  const [reason, setReason] = useState('')
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="cx-reason">Reason</Label>
        <Textarea id="cx-reason" value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. patient unavailable" />
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

function SessionEndForm({ sessionId, submitting, onClose, onSubmit }: {
  sessionId: string
  submitting: boolean
  onClose: () => void
  onSubmit: (payload: {
    pain_before?: number | null
    pain_after?: number | null
    treatment_notes?: string | null
    exercises?: string | null
    modalities?: string | null
    response?: string | null
  }) => Promise<void>
}) {
  const [painBefore, setPainBefore] = useState('')
  const [painAfter, setPainAfter] = useState('')
  const [notes, setNotes] = useState('')
  const [exercises, setExercises] = useState('')
  const [modalities, setModalities] = useState('')
  const [response, setResponse] = useState('')

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Pain before (0–10)</Label>
          <Input type="number" min={0} max={10} value={painBefore} onChange={(e) => setPainBefore(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Pain after (0–10)</Label>
          <Input type="number" min={0} max={10} value={painAfter} onChange={(e) => setPainAfter(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Treatment notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Exercises performed</Label>
        <Textarea value={exercises} onChange={(e) => setExercises(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Modalities used</Label>
        <Input value={modalities} onChange={(e) => setModalities(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Response</Label>
        <Input value={response} onChange={(e) => setResponse(e.target.value)} />
      </div>
      <div className="flex justify-end gap-3">
        <Button variant="outline" onClick={onClose}>Cancel</Button>
        <Button disabled={submitting} onClick={() =>
          onSubmit({
            pain_before: painBefore !== '' ? Number(painBefore) : null,
            pain_after: painAfter !== '' ? Number(painAfter) : null,
            treatment_notes: notes || null,
            exercises: exercises || null,
            modalities: modalities || null,
            response: response || null,
          })
        }>
          Complete session
        </Button>
      </div>
    </div>
  )
}
