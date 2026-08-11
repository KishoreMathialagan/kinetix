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
import { resetPassword } from '@/services/auth'
import { toApiError } from '@/lib/api-client'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  otp: z.string().min(4, 'Enter the code from your email'),
  new_password: z.string().min(8, 'Password must be at least 8 characters'),
})

type ResetValues = z.infer<typeof schema>

export default function ResetPasswordPage() {
  const router = useRouter()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: ResetValues) {
    setServerError(null)
    try {
      await resetPassword(values)
      toast.success('Password updated — sign in with your new password')
      router.replace('/login')
    } catch (error) {
      setServerError(toApiError(error).message)
    }
  }

  return (
    <AuthCard>
      <CardHeader className="space-y-1.5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5">
            <Leaf className="h-6 w-6 text-secondary" />
          </div>
          <CardTitle className="text-2xl text-primary">Enter the reset code</CardTitle>
          <CardDescription>Use the OTP sent to your email with a new password</CardDescription>
        </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input id="email" type="email" autoComplete="email" placeholder="you@example.com" aria-invalid={!!errors.email} {...register('email')} />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="otp">One-time code</Label>
            <Input id="otp" inputMode="numeric" placeholder="6-digit code" aria-invalid={!!errors.otp} {...register('otp')} />
            {errors.otp && <p className="text-sm text-destructive">{errors.otp.message}</p>}
          </div>
          <div className="space-y-2">
            <Label htmlFor="new_password">New password</Label>
            <Input id="new_password" type="password" autoComplete="new-password" placeholder="Min. 8 characters" aria-invalid={!!errors.new_password} {...register('new_password')} />
            {errors.new_password && <p className="text-sm text-destructive">{errors.new_password.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Reset password
          </Button>
          <p className="text-sm text-muted-foreground">
            Didn&apos;t get a code?{' '}
            <Link href="/forgot-password" className="font-medium text-primary hover:underline">
              Request again
            </Link>
          </p>
        </CardFooter>
      </form>
    </AuthCard>
  )
}
