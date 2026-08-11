'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { listPatients } from '@/services/patients'
import { listTherapists } from '@/services/therapists'
import { listUsers } from '@/services/users'

/**
 * Admin-only helper that joins names for profiles whose API responses
 * only expose user_id / patient_id / therapist_id.
 */
export function useNameLookup() {
  const usersQuery = useQuery({
    queryKey: ['users', 'lookup'],
    queryFn: () => listUsers({ limit: 1000 }),
  })
  const patientsQuery = useQuery({
    queryKey: ['patients', 'lookup'],
    queryFn: () => listPatients({ size: 200 }),
  })
  const therapistsQuery = useQuery({
    queryKey: ['therapists', 'lookup'],
    queryFn: () => listTherapists({ size: 200 }),
  })

  const usersById = useMemo(() => {
    const map = new Map<string, { first_name: string; last_name: string; email: string; phone: string | null }>()
    for (const u of usersQuery.data ?? []) map.set(u.id, u)
    return map
  }, [usersQuery.data])

  const patientUserIds = useMemo(() => {
    const map = new Map<string, string>()
    for (const p of patientsQuery.data?.items ?? []) map.set(p.id, p.user_id)
    return map
  }, [patientsQuery.data])

  const therapistUserIds = useMemo(() => {
    const map = new Map<string, string>()
    for (const t of therapistsQuery.data?.items ?? []) map.set(t.id, t.user_id)
    return map
  }, [therapistsQuery.data])

  function userName(userId?: string | null) {
    const user = userId ? usersById.get(userId) : undefined
    return user ? `${user.first_name} ${user.last_name}` : '—'
  }

  function patientName(patientId?: string | null) {
    return userName(patientId ? patientUserIds.get(patientId) : undefined)
  }

  function therapistName(therapistId?: string | null) {
    return userName(therapistId ? therapistUserIds.get(therapistId) : undefined)
  }

  function patientEmail(patientId?: string | null) {
    const userId = patientId ? patientUserIds.get(patientId) : undefined
    return userId ? usersById.get(userId)?.email : undefined
  }

  function therapistEmail(therapistId?: string | null) {
    const userId = therapistId ? therapistUserIds.get(therapistId) : undefined
    return userId ? usersById.get(userId)?.email : undefined
  }

  return {
    userName,
    patientName,
    therapistName,
    patientEmail,
    therapistEmail,
    patientItems: patientsQuery.data?.items ?? [],
    therapistItems: therapistsQuery.data?.items ?? [],
    patientsLoading: patientsQuery.isLoading,
    therapistsLoading: therapistsQuery.isLoading,
  }
}
