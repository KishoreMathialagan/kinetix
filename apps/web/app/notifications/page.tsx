'use client'

import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge, Button, Card, CardContent, toast } from '@kinetix/ui'
import { PageHeader } from '@kinetix/ui'
import { DataTable } from '@/components/data-table'
import { listNotifications, markRead, markAllRead } from '@/services/notifications'
import { toApiError } from '@/lib/api-client'
import { formatDateTime } from '@kinetix/utils'
import type { Notification } from '@kinetix/shared-types'

export default function NotificationsPage() {
  const queryClient = useQueryClient()

  const query = useQuery({
    queryKey: ['notifications', 'all'],
    queryFn: () => listNotifications({ size: 20 }),
  })

  async function handleMarkRead(notificationId: string) {
    try {
      await markRead(notificationId)
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    } catch (error) {
      toast.error(toApiError(error).message)
    }
  }

  async function handleMarkAllRead() {
    try {
      await markAllRead()
      queryClient.invalidateQueries({ queryKey: ['notifications'] })
    } catch (error) {
      toast.error(toApiError(error).message)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="Notifications"
        description="All your notifications in one place"
        actions={
          <Button variant="outline" onClick={handleMarkAllRead}>
            Mark all as read
          </Button>
        }
      />
      <Card className="border-white/60 bg-white/60 shadow-[0_8px_32px_rgba(18,57,60,0.18),0_1px_0_rgba(255,255,255,0.6)_inset] backdrop-blur-xl supports-[backdrop-filter]:bg-white/40">
        <CardContent className="p-0">
          <DataTable<Notification>
            columns={[
              {
                key: 'title',
                header: 'Notification',
                render: (n) => (
                  <div>
                    <p className={`text-sm font-medium ${n.read_at ? '' : 'text-primary'}`}>{n.title}</p>
                    <p className="text-xs text-muted-foreground">{n.body}</p>
                  </div>
                ),
              },
              { key: 'type', header: 'Type', render: (n) => <Badge variant="secondary">{n.notification_type.replace(/_/g, ' ')}</Badge>, hideOnMobile: true },
              {
                key: 'read',
                header: 'Status',
                render: (n) =>
                  n.read_at ? <Badge variant="outline">Read</Badge> : <Badge>Unread</Badge>,
              },
              { key: 'time', header: 'Received', render: (n) => <span className="text-sm text-muted-foreground">{formatDateTime(n.created_at)}</span>, hideOnMobile: true },
              {
                key: 'actions',
                header: '',
                render: (n) =>
                  n.read_at ? null : (
                    <Button variant="ghost" size="sm" onClick={() => handleMarkRead(n.id)}>
                      Mark read
                    </Button>
                  ),
                className: 'text-right',
              },
            ]}
            rows={query.data?.items ?? []}
            loading={query.isLoading}
            total={query.data?.total}
            pageSize={20}
            keyField={(n) => n.id}
            emptyTitle="No notifications"
            emptyDescription="You're all caught up."
          />
        </CardContent>
      </Card>
    </div>
  )
}
