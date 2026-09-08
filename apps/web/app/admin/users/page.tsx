'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge, Button, Card, CardContent, Switch, toast } from '@kinetix/ui'
import { PageHeader } from '@kinetix/ui'
import { KeyRound } from 'lucide-react'
import { DataTable } from '@/components/data-table'
import { ConfirmDialog } from '@/components/confirm-dialog'
import { ResetPasswordDialog } from '@/components/reset-password-dialog'
import { useState } from 'react'
import { listUsers, updateUser } from '@/services/users'
import { toApiError } from '@/lib/api-client'
import { formatDate } from '@kinetix/utils'
import type { User } from '@kinetix/shared-types'

function initials(first?: string, last?: string) {
  return `${(first ?? '?')[0] ?? ''}${(last ?? '')?.[0] ?? ''}`.toUpperCase() || '?'
}

export default function AdminUsersPage() {
  const queryClient = useQueryClient()
  const [deactivateTarget, setDeactivateTarget] = useState<User | null>(null)
  const [resetTarget, setResetTarget] = useState<User | null>(null)

  const query = useQuery({ queryKey: ['users', 'admin'], queryFn: () => listUsers({ limit: 1000 }) })

  async function handleToggleActive() {
    if (!deactivateTarget) return
    try {
      await updateUser(deactivateTarget.id, { is_active: !deactivateTarget.is_active })
      toast.success(deactivateTarget.is_active ? 'User deactivated' : 'User activated')
      queryClient.invalidateQueries({ queryKey: ['users'] })
    } catch (error) {
      toast.error(toApiError(error).message)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Users" description="Manage system user accounts" />
      <Card>
        <CardContent className="p-0">
          <DataTable<User>
            columns={[
              {
                key: 'name',
                header: 'User',
                render: (u) => (
                  <div>
                    <p className="text-sm font-medium">
                      {u.first_name} {u.last_name}
                    </p>
                    <p className="text-xs text-muted-foreground">{u.email}</p>
                  </div>
                ),
              },
              { key: 'phone', header: 'Phone', render: (u) => <span className="text-sm">{u.phone ?? '—'}</span>, hideOnMobile: true },
              {
                key: 'status',
                header: 'Status',
                render: (u) => <Badge variant={u.is_active ? 'default' : 'secondary'}>{u.is_active ? 'Active' : 'Inactive'}</Badge>,
              },
              { key: 'verified', header: 'Verified', render: (u) => <span className="text-sm">{u.is_verified ? 'Yes' : 'No'}</span>, hideOnMobile: true },
              { key: 'created', header: 'Created', render: (u) => <span className="text-sm text-muted-foreground">{formatDate(u.created_at)}</span>, hideOnMobile: true },
              {
                key: 'toggle',
                header: 'Active',
                render: (u) => (
                  <Switch checked={u.is_active} onCheckedChange={() => setDeactivateTarget(u)} aria-label={`Toggle ${u.first_name} ${u.last_name}`} />
                ),
                className: 'text-right',
              },
              {
                key: 'actions',
                header: 'Actions',
                render: (u) => (
                  <Button size="sm" variant="outline" onClick={() => setResetTarget(u)}>
                    <KeyRound className="mr-2 h-4 w-4" /> Reset password
                  </Button>
                ),
                className: 'text-right',
              },
            ]}
            rows={query.data ?? []}
            loading={query.isLoading}
            keyField={(u) => u.id}
            emptyTitle="No users found"
            emptyDescription="User accounts will appear here."
          />
        </CardContent>
      </Card>
      <ConfirmDialog
        open={!!deactivateTarget}
        onOpenChange={(open) => { if (!open) setDeactivateTarget(null) }}
        title={deactivateTarget?.is_active ? 'Deactivate user?' : 'Activate user?'}
        description={`${deactivateTarget?.first_name} ${deactivateTarget?.last_name} will be ${deactivateTarget?.is_active ? 'blocked from signing in' : 'allowed to sign in again'}.`}
        confirmLabel={deactivateTarget?.is_active ? 'Deactivate' : 'Activate'}
        variant={deactivateTarget?.is_active ? 'destructive' : 'default'}
        onConfirm={handleToggleActive}
      />
      <ResetPasswordDialog
        open={!!resetTarget}
        onOpenChange={(open) => { if (!open) setResetTarget(null) }}
        userId={resetTarget?.id}
        userLabel={resetTarget ? `${resetTarget.first_name} ${resetTarget.last_name}` : undefined}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['users'] })}
      />
    </div>
  )
}
