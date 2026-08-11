'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { UserPlus, ChevronRight } from 'lucide-react'
import { Avatar, AvatarFallback, Badge, Button } from '@kinetix/ui'
import { PageHeader } from '@kinetix/ui'
import { SearchInput } from '@kinetix/ui'
import { DataTable, type DataTableColumn } from '@/components/data-table'
import { listTherapists, searchTherapists } from '@/services/therapists'
import { listUsers } from '@/services/users'
import type { Therapist, User } from '@kinetix/shared-types'

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  on_leave: 'secondary',
  inactive: 'destructive',
}

function initials(first?: string, last?: string) {
  return `${(first ?? '?')[0] ?? ''}${(last ?? '')?.[0] ?? ''}`.toUpperCase() || '?'
}

export default function AdminTherapistsPage() {
  const router = useRouter()
  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search)
      setPage(1)
    }, 350)
    return () => clearTimeout(timer)
  }, [search])

  const query = useQuery({
    queryKey: ['therapists', 'admin', debouncedSearch, page],
    queryFn: () =>
      debouncedSearch
        ? searchTherapists({ name: debouncedSearch, page, size: 10 })
        : listTherapists({ page, size: 10 }),
  })

  const usersQuery = useQuery({
    queryKey: ['users', 'admin'],
    queryFn: () => listUsers({ limit: 1000 }),
  })

  const usersById = new Map<string, User>()
  for (const user of usersQuery.data ?? []) usersById.set(user.id, user)

  const columns: DataTableColumn<Therapist>[] = [
    {
      key: 'name',
      header: 'Therapist',
      render: (t) => {
        const user = usersById.get(t.user_id)
        return (
          <div className="flex items-center gap-3">
            <Avatar>
              <AvatarFallback>{initials(user?.first_name, user?.last_name)}</AvatarFallback>
            </Avatar>
            <div>
              <p className="font-medium">
                {user?.first_name} {user?.last_name}
              </p>
              <p className="text-xs text-muted-foreground">{t.license_number}</p>
            </div>
          </div>
        )
      },
    },
    {
      key: 'specialization',
      header: 'Specialization',
      render: (t) => <span className="text-sm">{t.specialization ?? '—'}</span>,
      hideOnMobile: true,
    },
    {
      key: 'department',
      header: 'Department',
      render: (t) => <span className="text-sm">{t.department ?? '—'}</span>,
      hideOnMobile: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (t) => <Badge variant={statusVariant[t.status] ?? 'secondary'}>{t.status.replace(/_/g, ' ')}</Badge>,
    },
    {
      key: 'capacity',
      header: 'Capacity',
      render: (t) => <span className="text-sm">{t.capacity}</span>,
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
        title="Therapists"
        description="Manage therapist profiles, licenses and availability"
        actions={
          <Button asChild>
            <Link href="/admin/therapists/new">
              <UserPlus className="mr-2 h-4 w-4" /> Add therapist
            </Link>
          </Button>
        }
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <SearchInput placeholder="Search by name, email, phone…" value={search} onValueChange={setSearch} className="w-full sm:max-w-sm" />
      </div>
      <DataTable<Therapist>
        columns={columns}
        rows={query.data?.items ?? []}
        loading={query.isLoading}
        page={page}
        pageSize={10}
        total={query.data?.total}
        onPageChange={setPage}
        onRowClick={(t) => router.push(`/admin/therapists/${t.id}`)}
        keyField={(t) => t.id}
        emptyTitle="No therapists found"
        emptyDescription="Try adjusting your search, or add a new therapist."
      />
    </div>
  )
}
