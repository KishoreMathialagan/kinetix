'use client'

import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { Input, PageHeader } from '@kinetix/ui'
import { Search, UserRound, ChevronRight } from 'lucide-react'
import { Skeleton } from '@kinetix/ui'
import { formatDate } from '@kinetix/utils'
import { globalSearch } from '@/services/search'
import { listAppointments } from '@/services/appointments'
import { getMyTherapistProfile } from '@/services/therapists'
import { StatusBadge } from '@/components/status-badge'

export default function TherapistPatientsPage() {
  const router = useRouter()
  const [query, setQuery] = useState('')
  const [debounced, setDebounced] = useState('')

  const profile = useQuery({ queryKey: ['my-therapist-profile'], queryFn: getMyTherapistProfile })
  const therapistId = profile.data?.profile.id

  useEffect(() => {
    const t = setTimeout(() => setDebounced(query.trim()), 300)
    return () => clearTimeout(t)
  }, [query])

  const search = useQuery({
    queryKey: ['global-search', debounced],
    queryFn: () => globalSearch(debounced),
    enabled: debounced.length > 0,
  })

  const appointments = useQuery({
    queryKey: ['appointments', 'therapist', therapistId, 'all'],
    queryFn: () => listAppointments({ therapist_id: therapistId, size: 100 }),
    enabled: !!therapistId,
  })

  const myPatients = appointments.data
    ? Array.from(
        new Map(appointments.data.items.map((a) => [a.patient_id, a])).values()
      )
    : []

  return (
    <div className="space-y-6">
      <PageHeader title="Patients" description="Find patients and review care records" />
      <div className="relative">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input
          className="pl-9"
          placeholder="Search patients by name, email or patient codeâ€¦"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
      </div>

      {debounced ? (
        <section className="glass-panel p-5">
          <h2 className="mb-3 font-semibold">Search results</h2>
          {search.isPending ? (
            <div className="space-y-2">
              <Skeleton className="h-12" />
              <Skeleton className="h-12" />
            </div>
          ) : search.data && search.data.patients.length > 0 ? (
            <ul className="divide-y divide-border">
              {search.data.patients.map((p) => (
                <li key={p.id}>
                  <button
                    onClick={() => router.push(`/therapist/patients/${p.id}`)}
                    className="flex w-full items-center justify-between py-2.5 text-left hover:bg-muted/50"
                  >
                    <div>
                      <p className="text-sm font-medium">{p.name ?? 'Patient'}</p>
                      <p className="text-xs text-muted-foreground">{p.email ?? p.patient_code ?? p.id.slice(0, 8)}</p>
                    </div>
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-sm text-muted-foreground">No patients match &ldquo;{debounced}&rdquo;.</p>
          )}
        </section>
      ) : null}

      <section className="glass-panel p-5">
        <h2 className="mb-3 font-semibold">My patients</h2>
        {appointments.isPending ? (
          <div className="space-y-2">
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
            <Skeleton className="h-12" />
          </div>
        ) : myPatients.length === 0 ? (
          <div className="flex flex-col items-center gap-2 py-8 text-center">
            <UserRound className="h-8 w-8 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">No patients yet. Once appointments are assigned you will see them here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-border">
            {myPatients.map((a) => (
              <li key={a.patient_id}>
                <button
                  onClick={() => router.push(`/therapist/patients/${a.patient_id}`)}
                  className="flex w-full items-center justify-between py-2.5 text-left hover:bg-muted/50"
                >
                  <div>
                    <p className="text-sm font-medium">Patient #{a.patient_id.slice(0, 8)}</p>
                    <p className="text-xs text-muted-foreground">
                      Last: {formatDate(a.scheduled_date)} Â· {a.appointment_type ?? 'General'}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <StatusBadge status={a.status} />
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  )
}
