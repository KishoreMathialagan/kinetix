'use client'

import { useState } from 'react'
import Link from 'next/link'
import { useRouter, useSearchParams } from 'next/navigation'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, HeartPulse, UserCog, Stethoscope, Eye, EyeOff, Leaf } from 'lucide-react'
import { Button } from '@kinetix/ui'
import { Input } from '@kinetix/ui'
import { Label } from '@kinetix/ui'
import { CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@kinetix/ui'
import { AuthCard } from '@/components/auth-card'
import { Alert, AlertDescription } from '@kinetix/ui'
import { toast } from '@kinetix/ui'
import { login as loginRequest } from '@/services/auth'
import { toApiError } from '@/lib/api-client'
import { useAuthStore, homePathForRole } from '@/stores/auth-store'
import { setSessionCookie, clearSessionCookie } from '@/lib/session'
import { cn } from '@kinetix/utils'
import type { UserRole } from '@kinetix/shared-types'

const schema = z.object({
  email: z.string().email('Enter a valid email address'),
  password: z.string().min(1, 'Password is required'),
})

type LoginValues = z.infer<typeof schema>

const ROLE_OPTIONS: { role: UserRole; label: string; description: string; icon: React.ComponentType<{ className?: string }> }[] = [
  { role: 'patient', label: 'Patient', description: 'Your treatment portal', icon: HeartPulse },
  { role: 'admin', label: 'Admin', description: 'Clinic management', icon: UserCog },
  { role: 'therapist', label: 'Therapist', description: 'Care team portal', icon: Stethoscope },
]

const ROLE_LABEL: Record<UserRole, string> = {
  patient: 'Patient',
  admin: 'Admin',
  therapist: 'Therapist',
}

const PORTAL_COPY: Record<UserRole, { title: string; description: string }> = {
  patient: { title: 'Welcome back', description: 'Sign in to your patient portal' },
  admin: { title: 'Admin portal', description: 'Sign in to manage your clinic' },
  therapist: { title: 'Therapist portal', description: 'Sign in to manage your patients' },
}

function isUserRole(value: string | null): value is UserRole {
  return value === 'patient' || value === 'admin' || value === 'therapist'
}

export default function LoginPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const initialRole = searchParams.get('role')
  const [role, setRole] = useState<UserRole>(isUserRole(initialRole) ? initialRole : 'patient')
  const setTokens = useAuthStore((s) => s.setTokens)
  const setUser = useAuthStore((s) => s.setUser)
  const clear = useAuthStore((s) => s.clear)
  const [serverError, setServerError] = useState<string | null>(null)
  const [showPassword, setShowPassword] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginValues>({ resolver: zodResolver(schema) })

  async function onSubmit(values: LoginValues) {
    setServerError(null)
    try {
      const result = await loginRequest(values)
      setTokens(result.access_token, result.refresh_token)
      const user = result.user
      if (!user || !user.role || user.role !== role) {
        clear()
        clearSessionCookie()
        setServerError(
          user?.role && ROLE_LABEL[user.role]
            ? `This account belongs to the ${ROLE_LABEL[user.role]} portal. Please sign in using the ${ROLE_LABEL[user.role]} login.`
            : `This account isn't registered as ${ROLE_LABEL[role]}. Please check your credentials or contact support.`,
        )
        return
      }
      setUser(user)
      setSessionCookie(user.role)
      toast.success(`Welcome back, ${user.first_name}`)
      const next = searchParams.get('next')
      router.replace(next && next.startsWith('/') ? next : homePathForRole(user.role))
    } catch (error) {
      const apiError = toApiError(error)
      setServerError(apiError.message)
    }
  }

  const copy = PORTAL_COPY[role]

  return (
    <AuthCard>
      <CardHeader className="space-y-1.5 text-center">
          <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/5">
            <Leaf className="h-6 w-6 text-secondary" />
          </div>
          <CardTitle className="text-2xl text-primary">{copy.title}</CardTitle>
          <CardDescription>{copy.description}</CardDescription>
        </CardHeader>
      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Portal type">
            {ROLE_OPTIONS.map((option) => {
              const Icon = option.icon
              const selected = role === option.role
              return (
                <button
                  key={option.role}
                  type="button"
                  onClick={() => setRole(option.role)}
                  aria-pressed={selected}
                  className={cn(
                    'flex flex-col items-center gap-1.5 rounded-xl border px-2 py-3 text-sm font-medium transition-colors',
                    selected
                      ? 'border-primary bg-primary/5 text-primary'
                      : 'border-input bg-card text-muted-foreground hover:border-primary/40 hover:text-foreground',
                  )}
                >
                  <Icon className="h-5 w-5" />
                  {option.label}
                  <span className="text-[10px] font-normal text-muted-foreground">{option.description}</span>
                </button>
              )
            })}
          </div>
          {serverError && (
            <Alert variant="destructive">
              <AlertDescription>{serverError}</AlertDescription>
            </Alert>
          )}
          <div className="space-y-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              autoComplete="email"
              placeholder="you@example.com"
              aria-invalid={!!errors.email}
              {...register('email')}
            />
            {errors.email && <p className="text-sm text-destructive">{errors.email.message}</p>}
          </div>
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <Label htmlFor="password">Password</Label>
              <Link href="/forgot-password" className="text-sm font-medium text-primary hover:underline">
                Forgot password?
              </Link>
            </div>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? 'text' : 'password'}
                autoComplete="current-password"
                placeholder="••••••••"
                aria-invalid={!!errors.password}
                className="pr-11"
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? 'Hide password' : 'Show password'}
                aria-pressed={showPassword}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground"
              >
                {showPassword ? <EyeOff className="h-5 w-5" /> : <Eye className="h-5 w-5" />}
              </button>
            </div>
            {errors.password && <p className="text-sm text-destructive">{errors.password.message}</p>}
          </div>
        </CardContent>
        <CardFooter className="flex-col gap-3">
          <Button type="submit" className="w-full" disabled={isSubmitting}>
            {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Sign in
          </Button>
          <p className="text-sm text-muted-foreground">
            New to Kinetix?{' '}
            <Link href="/register" className="font-medium text-primary hover:underline">
              Create an account
            </Link>
          </p>
        </CardFooter>
      </form>
    </AuthCard>
  )
}
