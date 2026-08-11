'use client'

import { useRouter } from 'next/navigation'
import { LogOut, UserRound } from 'lucide-react'
import { Avatar, AvatarFallback, DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@kinetix/ui'
import { initials, fullName } from '@kinetix/utils'
import { logout as logoutRequest } from '@/services/auth'
import { useAuthStore, homePathForRole } from '@/stores/auth-store'
import { clearSessionCookie } from '@/lib/session'
import { NotificationsDropdown } from './notifications-dropdown'
import { GlobalSearch } from './global-search'

export function Header({ title }: { title: string }) {
  const router = useRouter()
  const user = useAuthStore((s) => s.user)
  const refreshToken = useAuthStore((s) => s.refreshToken)

  async function handleLogout() {
    if (refreshToken) {
      try {
        await logoutRequest(refreshToken)
      } catch {
        // best effort — revoke on the server if possible
      }
    }
    useAuthStore.getState().clear()
    clearSessionCookie()
    router.replace('/login')
  }

  return (
    <header className="sticky top-0 z-20 border-b border-white/50 bg-white/55 backdrop-blur-xl supports-[backdrop-filter]:bg-white/40">
      <div className="mx-auto flex h-16 max-w-6xl items-center justify-between gap-3 px-4 sm:px-6">
        <h1 className="text-lg font-semibold tracking-tight text-primary sm:text-xl">{title}</h1>
        <div className="flex items-center gap-1">
          <GlobalSearch />
          <NotificationsDropdown />
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="ml-1 rounded-full outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Account menu"
              >
                <Avatar className="h-9 w-9 border-2 border-secondary/60 bg-primary text-primary-foreground">
                  <AvatarFallback>{initials(user?.first_name, user?.last_name)}</AvatarFallback>
                </Avatar>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-56">
              <DropdownMenuLabel>
                <p className="truncate text-sm font-semibold">{fullName(user?.first_name, user?.last_name)}</p>
                <p className="truncate text-xs font-normal text-muted-foreground">{user?.email}</p>
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => router.push(`${homePathForRole(user?.role ?? null)}/profile`)}>
                <UserRound className="mr-2 h-4 w-4" /> Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                <LogOut className="mr-2 h-4 w-4" /> Sign out
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  )
}