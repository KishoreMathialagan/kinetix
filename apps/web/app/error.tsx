'use client'

import { useEffect } from 'react'
import { AlertTriangle } from 'lucide-react'
import { Button } from '@kinetix/ui'

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <div className="gradient-chip-gold h-14 w-14 rounded-full">
        <AlertTriangle className="h-7 w-7" />
      </div>
      <h1 className="text-xl font-semibold text-primary">Something went wrong</h1>
      <p className="max-w-sm text-sm text-muted-foreground">An unexpected error occurred. Try again, or sign in again if the problem persists.</p>
      <Button onClick={reset}>Try again</Button>
    </div>
  )
}
