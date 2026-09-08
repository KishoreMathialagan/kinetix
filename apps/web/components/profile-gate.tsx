'use client'

import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuthStore } from '@/stores/auth-store'

const PROFILE_PAGES = ['/patient/profile']

export function ProfileGate({ children }: { children: React.ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const user = useAuthStore((s) => s.user)

  const isProfilePage = PROFILE_PAGES.some((p) => pathname.startsWith(p))

  useEffect(() => {
    if (user?.role === 'patient' && user?.profile_completed === false && !isProfilePage) {
      router.replace('/patient/profile')
    }
  }, [user, isProfilePage, router])

  if (user?.role === 'patient' && user?.profile_completed === false && !isProfilePage) {
    return null
  }

  return <>{children}</>
}
