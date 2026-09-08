'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Badge, Card, CardContent, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@kinetix/ui'
import { PageHeader } from '@kinetix/ui'
import { DataTable } from '@/components/data-table'
import { listAuditLogs } from '@/services/admin'
import { formatDateTime } from '@kinetix/utils'
import type { AuditLog } from '@kinetix/shared-types'

const entities = ['_all', 'patient', 'therapist', 'appointment', 'user', 'invoice', 'consent', 'document', 'feedback', 'exercise', 'settings'] as const

export default function AdminAuditLogsPage() {
  const [entity, setEntity] = useState<string>('_all')
  const [page, setPage] = useState(1)

  const query = useQuery({
    queryKey: ['audit-logs', entity, page],
    queryFn: () =>
      listAuditLogs({
        entity_type: entity !== '_all' ? entity : undefined,
        page,
        size: 20,
      }),
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Audit logs" description="Track administrative actions across the system" />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={entity} onValueChange={(v) => { setEntity(v); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All entities" />
          </SelectTrigger>
          <SelectContent>
            {entities.map((e) => (
              <SelectItem key={e} value={e}>
                {e === '_all' ? 'All entities' : e}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <Card>
        <CardContent className="p-0">
          <DataTable<AuditLog>
            columns={[
              { key: 'time', header: 'Time', render: (l) => <span className="text-sm">{formatDateTime(l.created_at)}</span> },
              { key: 'action', header: 'Action', render: (l) => <Badge variant="secondary">{l.action.replace(/_/g, ' ')}</Badge> },
              { key: 'entity', header: 'Entity', render: (l) => <span className="text-sm capitalize">{l.entity.replace(/_/g, ' ')}</span> },
              { key: 'entity_id', header: 'Entity ID', render: (l) => <span className="font-mono text-xs text-muted-foreground">{l.entity_id ?? '—'}</span>, hideOnMobile: true },
              { key: 'user', header: 'User ID', render: (l) => <span className="font-mono text-xs text-muted-foreground">{l.user_id ?? 'system'}</span>, hideOnMobile: true },
            ]}
            rows={query.data?.items ?? []}
            loading={query.isLoading}
            page={page}
            pageSize={20}
            total={query.data?.total}
            onPageChange={setPage}
            keyField={(l) => l.id}
            emptyTitle="No audit entries"
            emptyDescription="Administrative actions will be logged here."
          />
        </CardContent>
      </Card>
    </div>
  )
}
