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
import type { PatientRegistrationRequest, PatientUpdateRequest } from '@kinetix/shared-types'
import { toApiError } from '@/lib/api-client'
import { registerPatient, updatePatient } from '@/services/patients'

const genders = ['male', 'female', 'other', 'prefer_not_to_say'] as const
const bloodGroups = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown'] as const

const createSchema = z.object({
  first_name: z.string().min(1, 'First name is required'),
  last_name: z.string().min(1, 'Last name is required'),
  email: z.string().email('Enter a valid email address'),
  phone: z.string().min(7, 'Enter a valid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  dob: z.string().optional(),
  gender: z.enum(genders).optional(),
  blood_group: z.enum(bloodGroups).optional(),
  address: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  medical_history: z.string().optional(),
  allergies: z.string().optional(),
  medications: z.string().optional(),
})

const editSchema = z.object({
  first_name: z.string().optional(),
  last_name: z.string().optional(),
  email: z.string().optional(),
  phone: z.string().optional(),
  password: z.string().optional(),
  dob: z.string().optional(),
  gender: z.enum(genders).optional(),
  blood_group: z.enum(bloodGroups).optional(),
  address: z.string().optional(),
  emergency_contact: z.string().optional(),
  emergency_phone: z.string().optional(),
  medical_history: z.string().optional(),
  allergies: z.string().optional(),
  medications: z.string().optional(),
  diagnosis: z.string().optional(),
  referred_by: z.string().optional(),
  occupation: z.string().optional(),
})

type BaseValues = z.infer<typeof editSchema>

interface PatientFormProps {
  mode: 'create' | 'edit'
  patientId?: string
  defaultValues?: Partial<BaseValues>
  onSuccess?: () => void
  submitLabel?: string
}

export function PatientForm({ mode, patientId, defaultValues, onSuccess, submitLabel }: PatientFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<BaseValues>({
    resolver: (mode === 'create' ? zodResolver(createSchema) : zodResolver(editSchema)) as unknown as Resolver<BaseValues>,
    defaultValues: {
      first_name: '',
      last_name: '',
      email: '',
      phone: '',
      password: '',
      ...defaultValues,
    },
  })

  const gender = watch('gender')
  const bloodGroup = watch('blood_group')

  async function onSubmit(values: BaseValues) {
    const clean: Record<string, string | undefined> = { ...values }
    for (const key of Object.keys(clean)) {
      if (clean[key] === '') clean[key] = undefined
    }
    try {
      if (mode === 'create') {
        await registerPatient(clean as unknown as PatientRegistrationRequest)
        toast.success('Patient registered successfully')
      } else if (patientId) {
        const update: PatientUpdateRequest = {}
        for (const [key, value] of Object.entries(clean)) {
          if (value && key !== 'first_name' && key !== 'last_name' && key !== 'email' && key !== 'phone' && key !== 'password') {
            (update as Record<string, string>)[key] = value
          }
        }
        await updatePatient(patientId, update)
        toast.success('Patient updated successfully')
      }
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
          <Input id="first_name" placeholder="John" aria-invalid={!!errors.first_name} {...register('first_name')} />
          {errors.first_name && <p className="text-sm text-destructive">{errors.first_name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="last_name">Last name</Label>
          <Input id="last_name" placeholder="Doe" aria-invalid={!!errors.last_name} {...register('last_name')} />
          {errors.last_name && <p className="text-sm text-destructive">{errors.last_name.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input id="email" type="email" placeholder="john@example.com" aria-invalid={!!errors.email} {...register('email')} />
          {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="phone">Phone</Label>
          <Input id="phone" type="tel" placeholder="+91 98765 43210" aria-invalid={!!errors.phone} {...register('phone')} />
          {errors.phone && <p className="text-sm text-destructive">{errors.phone.message}</p>}
        </div>
        {mode === 'create' && (
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor="password">Password</Label>
            <Input id="password" type="password" placeholder="At least 8 characters" aria-invalid={!!errors.password} {...register('password')} />
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
        )}
        <div className="space-y-2">
          <Label htmlFor="dob">Date of birth</Label>
          <Input id="dob" type="date" {...register('dob')} />
        </div>
        <div className="space-y-2">
          <Label>Gender</Label>
          <Select value={gender ?? ''} onValueChange={(v) => setValue('gender', v as BaseValues['gender'])}>
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
          <Label>Blood group</Label>
          <Select value={bloodGroup ?? ''} onValueChange={(v) => setValue('blood_group', v as BaseValues['blood_group'])}>
            <SelectTrigger>
              <SelectValue placeholder="Select blood group" />
            </SelectTrigger>
            <SelectContent>
              {bloodGroups.map((bg) => (
                <SelectItem key={bg} value={bg}>
                  {bg}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="address">Address</Label>
          <Textarea id="address" placeholder="Full address" {...register('address')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emergency_contact">Emergency contact name</Label>
          <Input id="emergency_contact" placeholder="Contact person" {...register('emergency_contact')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="emergency_phone">Emergency phone</Label>
          <Input id="emergency_phone" type="tel" placeholder="Emergency number" {...register('emergency_phone')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="medical_history">Medical history</Label>
          <Textarea id="medical_history" placeholder="Relevant medical history" {...register('medical_history')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="allergies">Allergies</Label>
          <Textarea id="allergies" placeholder="Known allergies" {...register('allergies')} />
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="medications">Medications</Label>
          <Textarea id="medications" placeholder="Current medications" {...register('medications')} />
        </div>
        {mode === 'edit' && (
          <>
            <div className="space-y-2">
              <Label htmlFor="diagnosis">Diagnosis</Label>
              <Input id="diagnosis" placeholder="Primary diagnosis" {...register('diagnosis')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="referred_by">Referred by</Label>
              <Input id="referred_by" placeholder="Referring doctor / hospital" {...register('referred_by')} />
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="occupation">Occupation</Label>
              <Input id="occupation" placeholder="Patient occupation" {...register('occupation')} />
            </div>
          </>
        )}
      </div>
      <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {submitLabel ?? (mode === 'create' ? 'Register patient' : 'Save changes')}
      </Button>
    </form>
  )
}
