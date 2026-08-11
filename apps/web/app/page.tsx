'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'
import { useAuthStore, homePathForRole } from '@/stores/auth-store'

export default function Home() {
  const router = useRouter()

  useEffect(() => {
    const user = useAuthStore.getState().user
    router.replace(homePathForRole(user?.role ?? null))
  }, [router])

  return (
    <div className="flex min-h-dvh items-center justify-center bg-background">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  )
}
