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
import type { TherapistCreate } from '@kinetix/shared-types'
import { toApiError } from '@/lib/api-client'
import { createTherapist } from '@/services/therapists'

const genders = ['male', 'female', 'other', 'prefer_not_to_say'] as const

const schema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  license_number: z.string().min(1, 'License number is required'),
  registration_number: z.string().min(1, 'Registration number is required'),
  department: z.string().optional(),
  qualification: z.string().optional(),
  specialization: z.string().optional(),
  languages: z.string().optional(),
  years_experience: z.coerce.number().min(0).optional(),
  gender: z.enum(genders).optional(),
  dob: z.string().optional(),
  address: z.string().optional(),
  emergency_contact: z.string().optional(),
  joining_date: z.string().optional(),
  capacity: z.coerce.number().min(1, 'Capacity must be at least 1').optional(),
})

type FormValues = z.infer<typeof schema>

interface TherapistFormProps {
  onSuccess?: () => void
}

export function TherapistForm({ onSuccess }: TherapistFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({ resolver: zodResolver(schema) as unknown as Resolver<FormValues> })

  const gender = watch('gender')

  async function onSubmit(values: FormValues) {
    const raw = { ...values } as Record<string, unknown>
    for (const key of Object.keys(raw)) {
      if (raw[key] === '' || raw[key] === undefined) raw[key] = null
    }
    const payload = raw as unknown as TherapistCreate
    try {
      await createTherapist(payload)
      toast.success('Therapist created successfully')
      onSuccess?.()
    } catch (error) {
      toast.error(toApiError(error).message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="first_name">First name</Label>
          <Input id="first_name" placeholder="Jane" aria-invalid={!!errors.first_name} {...register('first_name')} />
          {errors.first_name && <p className="text-sm text-destructive">{errors.first_name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last name</Label>
          <Input id="last_name" placeholder="Smith" aria-invalid={!!errors.last_name} {...register('last_name')} />
          {errors.last_name && <p className="text-sm text-destructive">{errors.last_name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="jane@example.com" aria-invalid={!!errors.email} {...register('email')} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" type="tel" placeholder="+91 98765 43210" aria-invalid={!!errors.phone} {...register('phone')} />
          {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="password">Password</Label>
          <Input id="password" type="password" placeholder="At least 8 characters" aria-invalid={!!errors.password} {...register('password')} />
          {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="license_number">License number</Label>
          <Input id="license_number" placeholder="RCI / state license" aria-invalid={!!errors.license_number} {...register('license_number')} />
          {errors.license_number && <p className="text-sm text-destructive">{errors.license_number.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="registration_number">Registration number</Label>
          <Input id="registration_number" placeholder="Registration number" aria-invalid={!!errors.registration_number} {...register('registration_number')} />
          {errors.registration_number && <p className="text-sm text-destructive">{errors.registration_number.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="specialization">Specialization</Label>
          <Input id="specialization" placeholder="e.g. Neuro rehabilitation" {...register('specialization')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="department">Department</Label>
          <Input id="department" placeholder="e.g. Physiotherapy" {...register('department')} />
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
          <Input id="years_experience" type="number" min={0} placeholder="5" {...register('years_experience')} />
        </div>
        <div className="space-y-2">
          <Label>Gender</Label>
          <Select value={gender ?? ''} onValueChange={(v) => setValue('gender', v as FormValues['gender'])}>
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              {genders.map((g) => (
                <SelectItem key={g} value={g}>
                  {g.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="dob">Date of birth</Label>
          <Input id="dob" type="date" {...register('dob')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="joining_date">Joining date</Label>
          <Input id="joining_date" type="date" {...register('joining_date')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="capacity">Daily capacity</Label>
          <Input id="capacity" type="number" min={1} placeholder="8" {...register('capacity')} />
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
        Create therapist
      </Button>
    </form>
  )
}
