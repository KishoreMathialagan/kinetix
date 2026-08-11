const SESSION_COOKIE = 'kinetix-session'
const SESSION_MAX_AGE = 60 * 60 * 24 * 7

export function setSessionCookie(role: string): void {
  document.cookie = `${SESSION_COOKIE}=${encodeURIComponent(role)}; path=/; max-age=${SESSION_MAX_AGE}; samesite=lax`
}

export function clearSessionCookie(): void {
  document.cookie = `${SESSION_COOKIE}=; path=/; max-age=0; samesite=lax`
}
