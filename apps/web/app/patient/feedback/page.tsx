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
  Label,
  Textarea,
  toast,
} from '@kinetix/ui'
import { PageHeader, EmptyState } from '@kinetix/ui'
import { Skeleton } from '@kinetix/ui'
import { Star, Send } from 'lucide-react'
import { formatDate } from '@kinetix/utils'
import { getMyPatientProfile } from '@/services/patients'
import { listFeedback, submitFeedback } from '@/services/feedback'
import { listAppointments } from '@/services/appointments'
import type { FeedbackCreate } from '@kinetix/shared-types'

export default function PatientFeedbackPage() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)

  const profile = useQuery({ queryKey: ['my-patient-profile'], queryFn: getMyPatientProfile })
  const patientId = profile.data?.profile.id

  const feedback = useQuery({
    queryKey: ['feedback', 'me'],
    queryFn: () => listFeedback({ patient_id: patientId, size: 20 }),
    enabled: !!patientId,
  })
  const appointments = useQuery({
    queryKey: ['appointments', 'me', 'all'],
    queryFn: () => listAppointments({ size: 50, appt_status: 'completed' }),
  })

  const myFeedback = feedback.data?.items ?? []

  return (
    <div className="space-y-6">
      <PageHeader
        title="Feedback"
        description="Rate your therapy sessions"
        actions={
          <Button onClick={() => setOpen(true)}>
            <Star className="mr-2 h-4 w-4" /> Leave feedback
          </Button>
        }
      />

      {feedback.isPending ? (
        <Skeleton className="h-40" />
      ) : myFeedback.length === 0 ? (
        <EmptyState icon={Star} title="No feedback yet" description="Share your experience with your therapist." />
      ) : (
        <section className="glass-panel p-5">
          <ul className="divide-y divide-border">
            {myFeedback.map((f) => (
              <li key={f.id} className="py-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <Star key={i} className={`h-4 w-4 ${i < f.rating ? 'fill-primary text-primary' : 'text-muted'}`} />
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">{formatDate(f.created_at)}</p>
                </div>
                {f.comments ? <p className="mt-2 text-sm text-muted-foreground">{f.comments}</p> : null}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Leave feedback</DialogTitle>
            <DialogDescription>Rate a completed session with your therapist.</DialogDescription>
          </DialogHeader>
          {patientId && (
            <FeedbackForm
              patientId={patientId}
              appointments={appointments.data?.items ?? []}
              onSuccess={() => {
                setOpen(false)
                queryClient.invalidateQueries({ queryKey: ['feedback'] })
                toast.success('Thank you for your feedback!')
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function FeedbackForm({ patientId, appointments, onSuccess }: {
  patientId: string
  appointments: { id: string; therapist_id: string; scheduled_date: string; appointment_type: string | null }[]
  onSuccess: () => void
}) {
  const [therapistId, setTherapistId] = useState('')
  const [rating, setRating] = useState(0)
  const [comments, setComments] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    setSubmitting(true)
    const payload: FeedbackCreate = {
      patient_id: patientId,
      therapist_id: therapistId,
      rating,
      comments: comments || null,
    }
    try {
      await submitFeedback(payload)
      onSuccess()
    } catch {
      toast.error('Could not submit feedback')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Therapist</Label>
        <select
          value={therapistId}
          onChange={(e) => setTherapistId(e.target.value)}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        >
          <option value="">Select a therapistâ€¦</option>
          {Array.from(new Map(appointments.map((a) => [a.therapist_id, a])).values()).map((a) => (
            <option key={a.therapist_id} value={a.therapist_id}>
              Therapist #{a.therapist_id.slice(0, 8)} Â· {a.scheduled_date}
            </option>
          ))}
        </select>
      </div>
      <div className="space-y-2">
        <Label>Rating</Label>
        <div className="flex gap-1">
          {Array.from({ length: 5 }).map((_, i) => (
            <button key={i} type="button" onClick={() => setRating(i + 1)} aria-label={`${i + 1} stars`}>
              <Star className={`h-7 w-7 ${i < rating ? 'fill-primary text-primary' : 'text-muted'}`} />
            </button>
          ))}
        </div>
      </div>
      <div className="space-y-2">
        <Label>Comments</Label>
        <Textarea value={comments} onChange={(e) => setComments(e.target.value)} />
      </div>
      <div className="flex justify-end">
        <Button disabled={submitting || !therapistId || rating === 0} onClick={submit}>
          <Send className="mr-2 h-4 w-4" /> Submit
        </Button>
      </div>
    </div>
  )
}
