'use client'

import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import {
  Button,
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
import type { AppointmentCreate } from '@kinetix/shared-types'
import { toApiError } from '@/lib/api-client'
import { createAppointment } from '@/services/appointments'
import { useNameLookup } from '@/lib/names'

const appointmentTypes = ['Home Visit', 'Clinic Visit', 'Video Consultation', 'Follow-up', 'Initial Assessment'] as const

const schema = z.object({
  patient_id: z.string().min(1, 'Select a patient'),
  therapist_id: z.string().min(1, 'Select a therapist'),
  scheduled_date: z.string().min(1, 'Date is required'),
  start_time: z.string().min(1, 'Start time is required'),
  duration_minutes: z.coerce.number().min(15, 'Minimum 15 minutes').max(240, 'Maximum 4 hours'),
  appointment_type: z.string().optional(),
  address: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

interface AppointmentFormProps {
  defaultPatientId?: string
  onSuccess?: () => void
}

export function AppointmentForm({ defaultPatientId, onSuccess }: AppointmentFormProps) {
  const { patientItems, therapistItems, patientName, therapistName, patientsLoading, therapistsLoading } = useNameLookup()

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: { patient_id: defaultPatientId ?? '', duration_minutes: 60 },
  })

  const patientId = watch('patient_id')
  const therapistId = watch('therapist_id')
  const appointmentType = watch('appointment_type')

  async function onSubmit(values: FormValues) {
    const payload: AppointmentCreate = { ...values } as unknown as AppointmentCreate
    if (payload.appointment_type === '') payload.appointment_type = null
    if (payload.address === '') payload.address = null
    if (payload.notes === '') payload.notes = null
    try {
      await createAppointment(payload)
      toast.success('Appointment scheduled')
      onSuccess?.()
    } catch (error) {
      toast.error(toApiError(error).message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Patient</Label>
          <Select value={patientId} onValueChange={(v) => setValue('patient_id', v)}>
            <SelectTrigger aria-invalid={!!errors.patient_id}>
              <SelectValue placeholder={patientsLoading ? 'Loading patients…' : 'Select patient'} />
            </SelectTrigger>
            <SelectContent>
              {patientItems.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {patientName(p.id)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.patient_id && <p className="text-sm text-destructive">{errors.patient_id.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Therapist</Label>
          <Select value={therapistId} onValueChange={(v) => setValue('therapist_id', v)}>
            <SelectTrigger aria-invalid={!!errors.therapist_id}>
              <SelectValue placeholder={therapistsLoading ? 'Loading therapists…' : 'Select therapist'} />
            </SelectTrigger>
            <SelectContent>
              {therapistItems.map((t) => (
                <SelectItem key={t.id} value={t.id}>
                  {therapistName(t.id)}
                  {t.specialization ? ` — ${t.specialization}` : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.therapist_id && <p className="text-sm text-destructive">{errors.therapist_id.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="scheduled_date">Date</Label>
          <Input id="scheduled_date" type="date" aria-invalid={!!errors.scheduled_date} {...register('scheduled_date')} />
          {errors.scheduled_date && <p className="text-sm text-destructive">{errors.scheduled_date.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="start_time">Start time</Label>
          <Input id="start_time" type="time" aria-invalid={!!errors.start_time} {...register('start_time')} />
          {errors.start_time && <p className="text-sm text-destructive">{errors.start_time.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="duration_minutes">Duration (minutes)</Label>
          <Input id="duration_minutes" type="number" min={15} max={240} step={15} aria-invalid={!!errors.duration_minutes} {...register('duration_minutes')} />
          {errors.duration_minutes && <p className="text-sm text-destructive">{errors.duration_minutes.message}</p>}
        </div>
        <div className="space-y-2">
          <Label>Appointment type</Label>
          <Select value={appointmentType ?? ''} onValueChange={(v) => setValue('appointment_type', v)}>
            <SelectTrigger>
              <SelectValue placeholder="Select type (optional)" />
            </SelectTrigger>
            <SelectContent>
              {appointmentTypes.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Visit address</Label>
          <Textarea id="address" placeholder="Address for home visits (optional)" {...register('address')} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="notes">Notes</Label>
          <Textarea id="notes" placeholder="Any notes for the visit (optional)" {...register('notes')} />
        </div>
      </div>
      <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Schedule appointment
      </Button>
    </form>
  )
}
