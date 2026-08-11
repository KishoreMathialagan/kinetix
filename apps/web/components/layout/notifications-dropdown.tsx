'use client'

import { useCallback, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery } from '@tanstack/react-query'
import { Bell, CheckCheck } from 'lucide-react'
import { Button, Popover, PopoverContent, PopoverTrigger, ScrollArea, Skeleton } from '@kinetix/ui'
import { formatDateTime } from '@kinetix/utils'
import { cn } from '@kinetix/utils'
import { listNotifications, getUnreadCount, markRead, markAllRead } from '@/services/notifications'

export function NotificationsDropdown() {
  const router = useRouter()
  const [open, setOpen] = useState(false)

  const unread = useQuery({
    queryKey: ['notifications', 'unread-count'],
    queryFn: () => getUnreadCount(),
    refetchInterval: 60_000,
    enabled: open,
  })

  const notifications = useQuery({
    queryKey: ['notifications', 'list'],
    queryFn: () => listNotifications({ size: 15 }),
    enabled: open,
  })

  useEffect(() => {
    if (open) {
      notifications.refetch()
      unread.refetch()
    }
  }, [open]) // eslint-disable-line react-hooks/exhaustive-deps

  const unreadCount = unread.data?.unread_count ?? 0

  const handleRead = useCallback(
    async (id: string) => {
      await markRead(id)
      notifications.refetch()
      unread.refetch()
    },
    [notifications, unread]
  )

  const handleAllRead = useCallback(async () => {
    await markAllRead()
    notifications.refetch()
    unread.refetch()
  }, [notifications, unread])

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notifications">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-bold text-destructive-foreground">
              {unreadCount > 99 ? '99+' : unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-80 p-0">
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <p className="text-sm font-semibold">Notifications</p>
          {unreadCount > 0 && (
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs" onClick={handleAllRead}>
              <CheckCheck className="h-3.5 w-3.5" /> Mark all read
            </Button>
          )}
        </div>
        <ScrollArea className="h-80">
          {notifications.isPending ? (
            <div className="space-y-3 p-4">
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </div>
          ) : notifications.data && notifications.data.items.length > 0 ? (
            <ul className="divide-y divide-border">
              {notifications.data.items.map((notification) => (
                <li
                  key={notification.id}
                  className={cn(
                    'cursor-pointer px-4 py-3 transition-colors hover:bg-accent/50',
                    !notification.read_at && 'bg-primary/5'
                  )}
                  onClick={() => handleRead(notification.id)}
                >
                  <div className="flex items-start gap-2">
                    <span
                      className={cn('mt-1.5 h-2 w-2 shrink-0 rounded-full', notification.read_at ? 'bg-transparent' : 'bg-primary')}
                    />
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium">{notification.title}</p>
                      <p className="line-clamp-2 text-xs text-muted-foreground">{notification.body}</p>
                      <p className="mt-1 text-[10px] text-muted-foreground/70">{formatDateTime(notification.created_at)}</p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <div className="flex h-full items-center justify-center p-6 text-sm text-muted-foreground">
              No notifications yet
            </div>
          )}
        </ScrollArea>
        <div className="border-t border-border p-2">
          <Button
            variant="ghost"
            size="sm"
            className="w-full"
            onClick={() => {
              setOpen(false)
              router.push('/notifications')
            }}
          >
            View all
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}
