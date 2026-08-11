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
} from '@kinetix/ui'
import type { TherapistStatus, TherapistUpdate } from '@kinetix/shared-types'

const schema = z.object({
  department: z.string().optional(),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  languages: z.string().optional(),
  years_experience: z.coerce.number().min(0).optional(),
  address: z.string().optional(),
  emergency_contact: z.string().optional(),
  status: z.enum(['active', 'inactive', 'on_leave']).optional(),
  capacity: z.coerce.number().min(1).optional(),
})

type FormValues = z.infer<typeof schema>

interface TherapistUpdateFormProps {
  defaultValues?: Partial<TherapistUpdate>
  onSubmit: (payload: TherapistUpdate) => Promise<void>
}

export function TherapistUpdateForm({ defaultValues, onSubmit }: TherapistUpdateFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: {
      department: defaultValues?.department ?? '',
      qualification: defaultValues?.qualification ?? '',
      specialization: defaultValues?.specialization ?? '',
      languages: defaultValues?.languages ?? '',
      address: defaultValues?.address ?? '',
      emergency_contact: defaultValues?.emergency_contact ?? '',
      years_experience: defaultValues?.years_experience ?? undefined,
      capacity: defaultValues?.capacity ?? undefined,
      status: defaultValues?.status ?? undefined,
    },
  })

  const status = watch('status')

  async function handleSubmitForm(values: FormValues) {
    const payload: TherapistUpdate = {}
    for (const [key, value] of Object.entries(values)) {
      if (value !== '' && value !== undefined) {
        (payload as Record<string, unknown>)[key] =
          key === 'years_experience' || key === 'capacity' ? Number(value) : value
      }
    }
    await onSubmit(payload)
  }

  return (
    <form onSubmit={handleSubmit(handleSubmitForm)} noValidate className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Input id="department" placeholder="e.g. Physiotherapy" {...register('department')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="specialization">Specialization</Label>
          <Input id="specialization" placeholder="e.g. Neuro rehabilitation" {...register('specialization')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="qualification">Qualification</Label>
          <Input id="qualification" placeholder="e.g. MPT (Ortho)" {...register('qualification')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="languages">Languages</Label>
          <Input id="languages" placeholder="e.g. English, Hindi, Tamil" {...register('languages')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="years_experience">Years of experience</Label>
          <Input id="years_experience" type="number" min={0} {...register('years_experience')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacity">Daily capacity</Label>
          <Input id="capacity" type="number" min={1} {...register('capacity')} />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status ?? ''} onValueChange={(v) => setValue('status', v as TherapistStatus)}>
            <SelectTrigger>
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="on_leave">On leave</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Textarea id="address" placeholder="Full address" {...register('address')} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="emergency_contact">Emergency contact</Label>
          <Input id="emergency_contact" placeholder="Contact person" {...register('emergency_contact')} />
        </div>
      </div>
      <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Save changes
      </Button>
    </form>
  )
}
