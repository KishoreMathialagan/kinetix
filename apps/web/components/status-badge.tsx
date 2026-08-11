import type { ComponentProps } from 'react'
import { Badge } from '@kinetix/ui'

const statusVariant: Record<string, ComponentProps<typeof Badge>['variant']> = {
  scheduled: 'secondary',
  confirmed: 'default',
  in_progress: 'default',
  completed: 'default',
  cancelled: 'destructive',
  missed: 'destructive',
  planned: 'secondary',
  pending: 'secondary',
  issued: 'default',
  partially_paid: 'secondary',
  paid: 'default',
  overdue: 'destructive',
  draft: 'outline',
  signed: 'default',
  revoked: 'destructive',
  read: 'secondary',
  unread: 'default',
  active: 'default',
  inactive: 'secondary',
  on_leave: 'secondary',
  approved: 'default',
  rejected: 'destructive',
  available: 'default',
}

export function StatusBadge({ status, className }: { status: string; className?: string }) {
  return (
    <Badge variant={statusVariant[status] ?? 'secondary'} className={className}>
      {status.replace(/_/g, ' ')}
    </Badge>
  )
}
