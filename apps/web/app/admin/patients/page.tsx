'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { UserPlus, ChevronRight } from 'lucide-react'
import { Avatar, AvatarFallback, Badge, Button, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kinetix/ui'
import { PageHeader } from '@kinetix/ui'
import { SearchInput } from '@kinetix/ui'
import { DataTable, type DataTableColumn } from '@/components/data-table'
import { listPatients, searchPatients } from '@/services/patients'
import { listUsers } from '@/services/users'
import type { Gender, Patient, User } from '@kinetix/shared-types'
import { formatDate } from '@kinetix/utils'

const filterGenders: Gender[] = ['male', 'female', 'other']

function initials(first?: string, last?: string) {
  return `${(first ?? '?')[0] ?? ''}${(last ?? '')?.[0] ?? ''}`.toUpperCase() || '?'
}

export default function AdminPatientsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [gender, setGender] = useState<Gender | '_all'>('_all')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [search])

  const query = useQuery({
    queryKey: ['patients', 'admin', debouncedSearch, gender, page],
    queryFn: () =>
      debouncedSearch || gender !== '_all'
        ? searchPatients({
            name: debouncedSearch || undefined,
            gender: gender !== '_all' ? gender : undefined,
            page,
            size: 10,
          })
        : listPatients({ page, size: 10 }),
  })

  const usersQuery = useQuery({
    queryKey: ['users', 'admin'],
    queryFn: () => listUsers({ limit: 1000 }),
  })

  const usersById = new Map<string, User>()
  for (const user of usersQuery.data ?? []) usersById.set(user.id, user)

  const columns: DataTableColumn<Patient>[] = [
    {
      key: 'name',
      header: 'Patient',
      render: (p) => {
        const user = usersById.get(p.user_id)
        return (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{initials(user?.first_name, user?.last_name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-muted-foreground">{user?.email}</p>
            </div>
          </div>
        )
      },
    },
    {
      key: 'code',
      header: 'Patient code',
      render: (p) => <span className="font-mono text-xs">{p.patient_code}</span>,
      hideOnMobile: true,
    },
    {
      key: 'phone',
      header: 'Phone',
      render: (p) => {
        const user = usersById.get(p.user_id)
        return <span className="text-sm">{user?.phone ?? '—'}</span>
      },
      hideOnMobile: true,
    },
    {
      key: 'gender',
      header: 'Gender',
      render: (p) => <span className="text-sm capitalize">{p.gender?.replace(/_/g, ' ') ?? '—'}</span>,
      hideOnMobile: true,
    },
    {
      key: 'created',
      header: 'Registered',
      render: (p) => <span className="text-sm text-muted-foreground">{formatDate(p.created_at)}</span>,
      hideOnMobile: true,
    },
    {
      key: 'actions',
      header: '',
      render: () => <ChevronRight className="h-4 w-4 text-muted-foreground" />,
      className: 'text-right',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Patients"
        description="Manage patient records and registrations"
        actions={
          <Button asChild>
            <Link href="/admin/patients/new">
              <UserPlus className="mr-2 h-4 w-4" /> Add patient
            </Link>
          </Button>
        }
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput placeholder="Search by name, email or code…" value={search} onValueChange={setSearch} className="w-full sm:max-w-sm" />
        <Select value={gender} onValueChange={(v) => setGender(v as Gender | '_all')}>
          <SelectTrigger className="w-full sm:w-44">
            <SelectValue placeholder="All genders" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_all">All genders</SelectItem>
            {filterGenders.map((g) => (
              <SelectItem key={g} value={g}>
                {g.charAt(0).toUpperCase() + g.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DataTable<Patient>
        columns={columns}
        rows={query.data?.items ?? []}
        loading={query.isLoading}
        page={page}
        pageSize={10}
        total={query.data?.total}
        onPageChange={setPage}
        onRowClick={(p) => router.push(`/admin/patients/${p.id}`)}
        keyField={(p) => p.id}
        emptyTitle="No patients found"
        emptyDescription="Try adjusting your search, or register a new patient."
      />
    </div>
  )
}
