'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, MailCheck, Leaf } from 'lucide-react'
import { Button, Input, Label, CardContent, CardDescription, CardFooter, CardHeader, CardTitle, Alert, AlertDescription, toast } from '@kinetix/ui'
import { AuthCard } from '@/components/auth-card'
import { forgotPassword } from '@/services/auth'
import { toApiError } from '@/lib/api-client'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
})

type ForgotValues = z.infer<typeof schema>

export default function ForgotPasswordPage() {
  const [sent, setSent] = useState(false)
  const [serverError, setServerError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<ForgotValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: ForgotValues) {
    setServerError(null)
    try {
      await forgotPassword(values)
      toast.success('If the account exists, an OTP has been sent')
      setSent(true)
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
          <CardTitle className="text-2xl text-primary">Reset your password</CardTitle>
          <CardDescription>We&apos;ll email you a one-time code to reset it</CardDescription>
        </CardHeader>
      {sent ? (
        <CardContent className="flex flex-col items-center gap-3 text-center">
          <MailCheck className="h-10 w-10 text-success" />
          <p className="text-sm text-muted-foreground">
            Check your inbox. Use the code on the reset page.
          </p>
          <Button asChild variant="outline" className="w-full">
            <Link href="/reset-password">Go to reset</Link>
          </Button>
        </CardContent>
      ) : (
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
          </CardContent>
          <CardFooter className="flex-col gap-3">
            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Send reset code
            </Button>
            <p className="text-sm text-muted-foreground">
              Remembered it?{' '}
              <Link href="/login" className="font-medium text-primary hover:underline">
                Back to sign in
              </Link>
            </p>
          </CardFooter>
        </form>
      )}
    </AuthCard>
  )
}
