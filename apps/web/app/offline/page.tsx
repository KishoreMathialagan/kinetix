import type { Metadata } from 'next'
import Link from 'next/link'
import { WifiOff } from 'lucide-react'
import { Button } from '@kinetix/ui'
import { Brand } from '@/components/brand'

export const metadata: Metadata = {
  title: 'Offline',
}

export default function OfflinePage() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <Brand compact />
      <div className="gradient-chip mt-4 h-14 w-14 rounded-full">
        <WifiOff className="h-7 w-7" />
      </div>
      <h1 className="text-xl font-semibold text-primary">You&apos;re offline</h1>
      <p className="max-w-sm text-sm text-muted-foreground">
        This page hasn&apos;t been cached yet. Reconnect to the internet and try again.
      </p>
      <Button asChild variant="outline">
        <Link href="/">Try again</Link>
      </Button>
    </div>
  )
}
