import Link from 'next/link'
import { Compass } from 'lucide-react'
import { Button } from '@kinetix/ui'
import { Brand } from '@/components/brand'

export default function NotFound() {
  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4 bg-background px-4 text-center">
      <Brand compact />
      <div className="gradient-chip mt-4 h-14 w-14 rounded-full">
        <Compass className="h-7 w-7" />
      </div>
      <h1 className="text-3xl font-bold text-primary">404</h1>
      <p className="max-w-sm text-sm text-muted-foreground">The page you&apos;re looking for doesn&apos;t exist or may have been moved.</p>
      <Button asChild>
        <Link href="/">Back to home</Link>
      </Button>
    </div>
  )
}
