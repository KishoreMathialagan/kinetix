'use client'

import { QueryClientProvider } from '@tanstack/react-query'
import { Toaster } from '@kinetix/ui'
import { queryClient } from '@/lib/query'

export function AppProviders({ children }: { children: React.ReactNode }) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster position="top-center" richColors closeButton />
    </QueryClientProvider>
  )
}
