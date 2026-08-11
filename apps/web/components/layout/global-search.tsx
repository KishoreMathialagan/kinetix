'use client'

import { useEffect, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search, UserRound, Stethoscope, CalendarClock, FileText } from 'lucide-react'
import { Button, Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, Input } from '@kinetix/ui'
import { globalSearch } from '@/services/search'

interface SearchRow {
  id: string
  label: string
  sublabel?: string
}

function toRows(items: unknown[], key: string): SearchRow[] {
  return (items ?? []).map((item) => {
    const record = (item ?? {}) as Record<string, unknown>
    const joined = [record.first_name, record.last_name].filter((v) => typeof v === 'string').join(' ')
    const label = joined || (typeof record.title === 'string' ? record.title : key)
    return {
      id: String(record.id ?? ''),
      label: String(label),
      sublabel: typeof record.code === 'string' ? record.code : '',
    }
  })
}

export function GlobalSearch() {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<{ patients: SearchRow[]; therapists: SearchRow[]; appointments: SearchRow[]; reports: SearchRow[] }>({
    patients: [],
    therapists: [],
    appointments: [],
    reports: [],
  })
  const [loading, setLoading] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (timer.current) clearTimeout(timer.current)
    const q = query.trim()
    if (!q) {
      setResults({ patients: [], therapists: [], appointments: [], reports: [] })
      setLoading(false)
      return
    }
    setLoading(true)
    timer.current = setTimeout(async () => {
      try {
        const data = await globalSearch(q)
        setResults({
          patients: toRows(data.patients, 'patient'),
          therapists: toRows(data.therapists, 'therapist'),
          appointments: toRows(data.appointments, 'appointment'),
          reports: toRows(data.reports, 'report'),
        })
      } catch {
        setResults({ patients: [], therapists: [], appointments: [], reports: [] })
      } finally {
        setLoading(false)
      }
    }, 300)
    return () => {
      if (timer.current) clearTimeout(timer.current)
    }
  }, [query])

  const total = results.patients.length + results.therapists.length + results.appointments.length + results.reports.length

  function navigate(path: string) {
    setOpen(false)
    setQuery('')
    router.push(path)
  }

  const groups: { title: string; icon: React.ComponentType<{ className?: string }>; rows: SearchRow[]; path: string }[] = [
    { title: 'Patients', icon: UserRound, rows: results.patients, path: '/admin/patients' },
    { title: 'Therapists', icon: Stethoscope, rows: results.therapists, path: '/admin/therapists' },
    { title: 'Appointments', icon: CalendarClock, rows: results.appointments, path: '/admin/appointments' },
    { title: 'Reports', icon: FileText, rows: results.reports, path: '/admin/reports' },
  ]

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="icon" aria-label="Search">
          <Search className="h-5 w-5" />
        </Button>
      </DialogTrigger>
      <DialogContent className="top-[12%] translate-y-0 sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="sr-only">Global search</DialogTitle>
        </DialogHeader>
        <div className="relative">
          <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search patients, therapists, appointments…"
            className="pl-9"
          />
        </div>
        <div className="max-h-96 space-y-4 overflow-y-auto">
          {loading ? (
            <p className="p-3 text-sm text-muted-foreground">Searching…</p>
          ) : query.trim() && total === 0 ? (
            <p className="p-3 text-sm text-muted-foreground">No results for “{query}”</p>
          ) : (
            groups.map(
              (group) =>
                group.rows.length > 0 && (
                  <div key={group.title}>
                    <p className="mb-1.5 flex items-center gap-1.5 px-1 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                      <group.icon className="h-3.5 w-3.5" /> {group.title}
                    </p>
                    <ul className="space-y-1">
                      {group.rows.map((row) => (
                        <li key={row.id}>
                          <button
                            type="button"
                            onClick={() => navigate(`${group.path}/${row.id}`)}
                            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-left text-sm hover:bg-accent"
                          >
                            <span className="font-medium">{row.label}</span>
                            {row.sublabel && <span className="text-xs text-muted-foreground">{row.sublabel}</span>}
                          </button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )
            )
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
