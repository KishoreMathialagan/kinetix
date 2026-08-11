'use client'

import { Suspense, useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Leaf } from 'lucide-react'
import { Button, Input, Label, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Alert, AlertDescription, toast } from '@kinetix/ui'
import { AuthCard } from '@/components/auth-card'
import { verifyOtp } from '@/services/auth'
import { toApiError } from '@/lib/api-client'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  otp: z.string().min(4, 'Enter the code from your email'),
})

type VerifyValues = z.infer<typeof schema>

function VerifyForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<VerifyValues>({
    resolver: zodResolver(schema),
    defaultValues: { email: searchParams.get('email') ?? '' },
  })

  async function onSubmit(values: VerifyValues) {
    setServerError(null)
    try {
      await verifyOtp({ ...values, purpose: 'registration' })
      toast.success('Email verified — you can now sign in')
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
          <CardTitle className="text-2xl text-primary">Verify your email</CardTitle>
          <CardDescription>Enter the one-time code we emailed you</CardDescription>
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
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Verify email
          </Button>
          <p className="text-sm text-muted-foreground">
            Done?{' '}
            <Link href="/login" className="font-medium text-primary hover:underline">
              Go to sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </AuthCard>
  )
}

export default function VerifyPage() {
  return (
    <Suspense>
      <VerifyForm />
    </Suspense>
  )
}
