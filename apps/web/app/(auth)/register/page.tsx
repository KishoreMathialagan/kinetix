'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Leaf } from 'lucide-react'
import { Button, Input, Label, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Alert, AlertDescription, toast } from '@kinetix/ui'
import { AuthCard } from '@/components/auth-card'
import { register as registerRequest } from '@/services/auth'
import { toApiError } from '@/lib/api-client'
import { Genders, BloodGroups } from '@kinetix/shared-types'

const schema = z
  .object({
    first_name: z.string().min(1, 'First name is required'),
    last_name: z.string().min(1, 'Last name is required'),
    email: z.string().email('Enter a valid email address'),
    phone: z.string().optional(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
    confirm_password: z.string().min(8, 'Confirm your password'),
    gender: z.enum(Genders).optional(),
    blood_group: z.enum(BloodGroups).optional(),
    dob: z.string().optional(),
    address: z.string().optional(),
  })
  .refine((data) => data.password === data.confirm_password, {
    message: 'Passwords do not match',
    path: ['confirm_password'],
  })

type RegisterValues = z.infer<typeof schema>

export default function RegisterPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<RegisterValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: RegisterValues) {
    setServerError(null)
    try {
      await registerRequest({
        first_name: values.first_name,
        last_name: values.last_name,
        email: values.email,
        phone: values.phone || null,
        password: values.password,
        dob: values.dob || null,
        gender: values.gender,
        blood_group: values.blood_group,
        address: values.address || null,
      })
      toast.success('Account created — verify your email to continue')
      router.replace(`/verify?email=${encodeURIComponent(values.email)}`)
    } catch (error) {
      setServerError(toApiError(error).message)
    }
  }

  return (
    <AuthCard width="2xl">
      <CardHeader className="space-y-1.5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5">
            <Leaf className="h-6 w-6 text-secondary" />
          </div>
          <CardTitle className="text-2xl text-primary">Create your account</CardTitle>
          <CardDescription>Register as a patient to get started</CardDescription>
        </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="first_name">First name</Label>
              <Input id="first_name" placeholder="Aarav" aria-invalid={!!errors.first_name} {...register('first_name')} />
              {errors.first_name && <p className="text-sm text-destructive">{errors.first_name.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="last_name">Last name</Label>
              <Input id="last_name" placeholder="Sharma" aria-invalid={!!errors.last_name} {...register('last_name')} />
              {errors.last_name && <p className="text-sm text-destructive">{errors.last_name.message}</p>}
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input id="phone" type="tel" placeholder="+91 98••• •••••" {...register('phone')} />
            </div>
            <div className="space-y-2">
              <Label htmlFor="dob">Date of birth</Label>
              <Input id="dob" type="date" {...register('dob')} />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="gender">Gender</Label>
              <select id="gender" className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm" {...register('gender')}>
                <option value="">Prefer not to say</option>
                {Genders.filter((g) => g !== 'prefer_not_to_say').map((g) => (
                  <option key={g} value={g}>
                    {g.charAt(0).toUpperCase() + g.slice(1)}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="blood_group">Blood group</Label>
              <select id="blood_group" className="h-11 w-full rounded-xl border border-input bg-card px-3 text-sm" {...register('blood_group')}>
                <option value="">Unknown</option>
                {BloodGroups.filter((b) => b !== 'unknown').map((b) => (
                  <option key={b} value={b}>
                    {b}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="address">Address</Label>
            <Input id="address" placeholder="Home address" {...register('address')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" type="password" autoComplete="new-password" placeholder="Min. 8 characters" aria-invalid={!!errors.password} {...register('password')} />
              {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm_password">Confirm password</Label>
              <Input id="confirm_password" type="password" autoComplete="new-password" aria-invalid={!!errors.confirm_password} {...register('confirm_password')} />
              {errors.confirm_password && <p className="text-sm text-destructive">{errors.confirm_password.message}</p>}
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Create account
          </Button>
          <p className="text-sm text-muted-foreground">
            Already registered?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </AuthCard>
  )
}
