'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  toast,
} from '@kinetix/ui'
import { PageHeader, EmptyState } from '@kinetix/ui'
import { Skeleton } from '@kinetix/ui'
import { Alert, AlertDescription } from '@kinetix/ui'
import { Dumbbell, CheckCircle2 } from 'lucide-react'
import { listPrograms, checkIn, getProgramCompliance } from '@/services/exercises'
import type { ExerciseProgram } from '@kinetix/shared-types'

export default function PatientExercisesPage() {
  const queryClient = useQueryClient()
  const [target, setTarget] = useState<{ program: ExerciseProgram; itemId: string } | null>(null)

  const programs = useQuery({
    queryKey: ['programs', 'me'],
    queryFn: () => listPrograms({ size: 50 }),
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['programs', 'me'] })

  return (
    <div className="space-y-6">
      <PageHeader title="My exercises" description="Follow your therapist's home exercise program" />

      {programs.isPending ? (
        <div className="space-y-4">
          <Skeleton className="h-40" />
          <Skeleton className="h-40" />
        </div>
      ) : programs.isError ? (
        <Alert variant="destructive">
          <AlertDescription>Failed to load exercise programs. Please try again later.</AlertDescription>
        </Alert>
      ) : !programs.data || programs.data.items.length === 0 ? (
        <EmptyState icon={Dumbbell} title="No programs yet" description="Your therapist will assign an exercise program soon." />
      ) : (
        <div className="space-y-6">
          {programs.data.items.map((p) => (
            <ProgramCard key={p.id} program={p} onCheckIn={(itemId) => setTarget({ program: p, itemId })} onCheckedIn={refresh} />
          ))}
        </div>
      )}

      <Dialog open={!!target} onOpenChange={(o) => !o && setTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Exercise check-in</DialogTitle>
            <DialogDescription>
              {target ? `Mark "${target.program.exercise_items.find((i) => i.id === target.itemId)?.exercise_name ?? 'exercise'}" as done.` : ''}
            </DialogDescription>
          </DialogHeader>
          {target && (
            <CheckInForm
              programId={target.program.id}
              itemId={target.itemId}
              onSuccess={() => {
                setTarget(null)
                toast.success('Checked in! Keep it up.')
                refresh()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ProgramCard({ program, onCheckIn, onCheckedIn }: {
  program: ExerciseProgram
  onCheckIn: (itemId: string) => void
  onCheckedIn: () => void
}) {
  const compliance = useQuery({
    queryKey: ['compliance', program.id],
    queryFn: () => getProgramCompliance(program.id),
  })
  const completedIds = new Set(compliance.data?.completions.map((c) => c.exercise_item_id).filter(Boolean))

  return (
    <section className="glass-panel p-5">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <h2 className="panel-heading">{program.title}</h2>
          <p className="text-xs text-muted-foreground">{program.frequency ?? 'â€”'} Â· {program.duration ?? 'â€”'}</p>
        </div>
        {compliance.data ? (
          <div className="rounded-lg bg-muted px-3 py-1.5 text-sm">
            <span className="font-semibold">{Math.round(compliance.data.score)}%</span>{' '}
            <span className="text-muted-foreground">compliance</span>
          </div>
        ) : null}
      </div>
      {program.instructions ? <p className="mt-2 text-sm text-muted-foreground">{program.instructions}</p> : null}
      <ul className="mt-4 space-y-2">
        {program.exercise_items.map((item) => {
          const done = completedIds.has(item.id)
          return (
            <li key={item.id} className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5">
              <div>
                <p className="text-sm font-medium">{item.exercise_name}</p>
                <p className="text-xs text-muted-foreground">
                  {item.repetitions != null ? `${item.repetitions} reps` : ''}
                  {item.sets != null ? ` Â· ${item.sets} sets` : ''}
                  {item.duration ? ` Â· ${item.duration}` : ''}
                </p>
              </div>
              {done ? (
                <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
                  <CheckCircle2 className="h-4 w-4" /> Done
                </span>
              ) : (
                <Button size="sm" variant="outline" onClick={() => onCheckIn(item.id)}>
                  Check in
                </Button>
              )}
            </li>
          )
        })}
      </ul>
    </section>
  )
}

function CheckInForm({ programId, itemId, onSuccess }: {
  programId: string
  itemId: string
  onSuccess: () => void
}) {
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    setSubmitting(true)
    try {
      await checkIn(programId, { exercise_item_id: itemId, notes: notes || null })
      onSuccess()
    } catch {
      toast.error('Could not check in')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Notes (optional)</Label>
        <Input value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="How did it feel?" />
      </div>
      <div className="flex justify-end">
        <Button disabled={submitting} onClick={submit}>Confirm check-in</Button>
      </div>
    </div>
  )
}
