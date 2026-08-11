'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, UserCheck, XCircle } from 'lucide-react'
import {
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Skeleton,
  toast,
} from '@kinetix/ui'
import { PageHeader } from '@kinetix/ui'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { getAppointment, completeAppointment, cancelAppointment, getRecommendations, manualAssign } from '@/services/appointments'
import { useNameLookup } from '@/lib/names'
import { toApiError } from '@/lib/api-client'
import { formatDate } from '@kinetix/utils'
import type { AssignmentRecommendation } from '@kinetix/shared-types'

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  scheduled: 'secondary',
  confirmed: 'default',
  in_progress: 'default',
  completed: 'outline',
  cancelled: 'destructive',
  missed: 'destructive',
}

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value ?? '—'}</dd>
    </div>
  )
}

export default function AdminAppointmentDetailPage() {
  const params = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const [completeOpen, setCompleteOpen] = useState(false)
  const [cancelOpen, setCancelOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const [cancelReason, setCancelReason] = useState('')
  const [assigning, setAssigning] = useState(false)
  const [busyAction, setBusyAction] = useState<string | null>(null)
  const { patientName, therapistName, patientEmail, therapistEmail } = useNameLookup()

  const appointmentQuery = useQuery({
    queryKey: ['appointments', params.id],
    queryFn: () => getAppointment(params.id),
    enabled: !!params.id,
  })

  const recommendationsQuery = useQuery({
    queryKey: ['assignments', 'recommendations', params.id],
    queryFn: () => getRecommendations({ patient_id: appointmentQuery.data?.patient_id }),
    enabled: !!params.id && !!appointmentQuery.data?.patient_id,
  })

  const appointment = appointmentQuery.data

  async function runAction(action: string, fn: () => Promise<unknown>) {
    setBusyAction(action)
    try {
      await fn()
      toast.success(action === 'complete' ? 'Appointment completed' : 'Appointment cancelled')
      queryClient.invalidateQueries({ queryKey: ['appointments'] })
    } catch (error) {
      toast.error(toApiError(error).message)
    } finally {
      setBusyAction(null)
    }
  }

  async function handleAssign(therapistId: string) {
    if (!appointment) return
    setAssigning(true)
    try {
      await manualAssign(appointment.patient_id, { therapist_id: therapistId, reason: `Assigned from appointment ${appointment.id}` })
      toast.success('Therapist assigned to patient')
      setAssignOpen(false)
      queryClient.invalidateQueries({ queryKey: ['assignments'] })
    } catch (error) {
      toast.error(toApiError(error).message)
    } finally {
      setAssigning(false)
    }
  }

  return (
    <div className="space-y-6">
      {appointmentQuery.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <PageHeader
          title="Appointment details"
          description={appointment ? `${formatDate(appointment.scheduled_date)} · ${appointment.start_time} – ${appointment.end_time}` : ''}
          actions={
            <>
              {appointment && !['completed', 'cancelled', 'missed'].includes(appointment.status) && (
                <Button variant="outline" onClick={() => setCompleteOpen(true)} disabled={busyAction !== null}>
                  <CheckCircle2 className="mr-2 h-4 w-4" /> Complete
                </Button>
              )}
              {appointment && !['cancelled', 'completed', 'missed'].includes(appointment.status) && (
                <Button variant="outline" onClick={() => setCancelOpen(true)} disabled={busyAction !== null}>
                  <XCircle className="mr-2 h-4 w-4" /> Cancel
                </Button>
              )}
              <Button onClick={() => setAssignOpen(true)}>
                <UserCheck className="mr-2 h-4 w-4" /> Assign therapist
              </Button>
            </>
          }
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Details</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid gap-4 sm:grid-cols-2">
              <Field label="Status" value={appointment ? <Badge variant={statusVariant[appointment.status]}>{appointment.status.replace(/_/g, ' ')}</Badge> : undefined} />
              <Field label="Appointment type" value={appointment?.appointment_type} />
              <Field label="Patient" value={appointment ? `${patientName(appointment.patient_id)}` : undefined} />
              <Field label="Patient email" value={appointment ? patientEmail(appointment.patient_id) : undefined} />
              <Field label="Therapist" value={appointment ? therapistName(appointment.therapist_id) : undefined} />
              <Field label="Therapist email" value={appointment ? therapistEmail(appointment.therapist_id) : undefined} />
              <Field label="Duration" value={appointment ? `${appointment.duration_minutes} minutes` : undefined} />
              <Field label="Address" value={appointment?.address} />
              <Field label="Notes" value={appointment?.notes} />
              <Field label="Cancellation reason" value={appointment?.cancellation_reason} />
              <Field label="Created by" value={appointment?.created_by ?? '—'} />
            </dl>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Assignment recommendations</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {recommendationsQuery.isLoading && <Skeleton className="h-20 w-full" />}
            {recommendationsQuery.data?.length === 0 && (
              <p className="text-sm text-muted-foreground">No recommendations available.</p>
            )}
            {recommendationsQuery.data?.map((r) => (
              <div key={r.therapist_id} className="rounded-lg border border-border p-3">
                <div className="flex items-center justify-between gap-2">
                  <p className="text-sm font-medium">
                    {r.first_name} {r.last_name}
                  </p>
                  <Badge variant="secondary">{Math.round(r.score)}%</Badge>
                </div>
                <p className="text-xs text-muted-foreground">{r.specialization ?? 'General'}</p>
                <Button size="sm" className="mt-2" disabled={assigning} onClick={() => handleAssign(r.therapist_id)}>
                  Assign
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <ConfirmDialog
        open={completeOpen}
        onOpenChange={setCompleteOpen}
        title="Complete appointment?"
        description="Mark this appointment as completed."
        confirmLabel="Complete"
        variant="default"
        onConfirm={() => runAction('complete', () => completeAppointment(params.id))}
      />
      <Dialog open={cancelOpen} onOpenChange={setCancelOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Cancel appointment</DialogTitle>
            <DialogDescription>Please provide a reason for cancellation.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="cancel-reason">Reason</Label>
              <Input id="cancel-reason" placeholder="Why is this appointment being cancelled?" value={cancelReason} onChange={(e) => setCancelReason(e.target.value)} />
            </div>
            <Button
              variant="destructive"
              disabled={!cancelReason.trim() || busyAction !== null}
              onClick={() => runAction('cancel', () => cancelAppointment(params.id, { reason: cancelReason.trim() }))}
            >
              Cancel appointment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
      <Dialog open={assignOpen} onOpenChange={setAssignOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Assign therapist</DialogTitle>
            <DialogDescription>Select a therapist to assign as the patient&apos;s care provider.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            {recommendationsQuery.data?.length === 0 && (
              <p className="text-sm text-muted-foreground">No recommendations available for this patient.</p>
            )}
            {recommendationsQuery.data?.map((r: AssignmentRecommendation) => (
              <div key={r.therapist_id} className="flex items-center justify-between gap-2 rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">
                    {r.first_name} {r.last_name}
                  </p>
                  <p className="text-xs text-muted-foreground">{r.specialization ?? 'General'} · {Math.round(r.score)}% match</p>
                </div>
                <Button size="sm" disabled={assigning} onClick={() => handleAssign(r.therapist_id)}>
                  Assign
                </Button>
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
