import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import type { UserMe, UserRole } from '@kinetix/shared-types';

interface AuthState {
  accessToken: string | null;
  refreshToken: string | null;
  user: UserMe | null;
  permissions: string[];
  isAuthenticated: boolean;
  setTokens: (accessToken: string, refreshToken: string) => void;
  setUser: (user: UserMe) => void;
  setPermissions: (permissions: string[]) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      permissions: [],
      isAuthenticated: false,
      setTokens: (accessToken, refreshToken) => set({ accessToken, refreshToken, isAuthenticated: true }),
      setUser: (user) => set({ user }),
      setPermissions: (permissions) => set({ permissions }),
      clear: () =>
        set({
          accessToken: null,
          refreshToken: null,
          user: null,
          permissions: [],
          isAuthenticated: false,
        }),
    }),
    {
      name: 'kinetix-auth',
      partialize: (state) => ({
        accessToken: state.accessToken,
        refreshToken: state.refreshToken,
        user: state.user,
        permissions: state.permissions,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
);

export function userRole(): UserRole | null {
  return useAuthStore.getState().user?.role ?? null;
}

export function homePathForRole(role: UserRole | null | undefined): string {
  switch (role) {
    case 'admin':
      return '/admin/dashboard';
    case 'therapist':
      return '/therapist/dashboard';
    case 'patient':
      return '/patient/dashboard';
    default:
      return '/login';
  }
}
