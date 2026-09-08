'use client'

import { Suspense, useMemo, useState } from 'react'
import { useSearchParams } from 'next/navigation'
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Textarea,
  toast,
} from '@kinetix/ui'
import { PageHeader, EmptyState } from '@kinetix/ui'
import { Skeleton } from '@kinetix/ui'
import { Alert, AlertDescription } from '@kinetix/ui'
import { Plus, FileHeart, ClipboardCheck, Dumbbell, TrendingUp, Trash2, AlertCircle } from 'lucide-react'
import { formatDate } from '@kinetix/utils'
import { listAppointments } from '@/services/appointments'
import { listAssessments, createInitialAssessment, createWeeklyAssessment, createFinalAssessment } from '@/services/assessments'
import { listPatientPlans, createPlan } from '@/services/treatmentPlans'
import { listPrograms, createProgram, deleteProgram } from '@/services/exercises'
import { getPatientProgress, listMeasurements, createMeasurement } from '@/services/progress'
import { getMyTherapistProfile } from '@/services/therapists'
import type {
  AssessmentCreate,
  AssessmentType,
  ExerciseItemCreate,
  StrengthScale,
} from '@kinetix/shared-types'
import { ConfirmDialog } from '@/components/confirm-dialog'

type Tab = 'plans' | 'assessments' | 'programs' | 'progress'

const tabs: { id: Tab; label: string }[] = [
  { id: 'plans', label: 'Plans' },
  { id: 'assessments', label: 'Assessments' },
  { id: 'programs', label: 'Exercise programs' },
  { id: 'progress', label: 'Progress' },
]

export default function TherapistTreatmentsPage() {
  return (
    <Suspense fallback={<div className="space-y-6"><Skeleton className="h-64" /></div>}>
      <TherapistTreatmentsContent />
    </Suspense>
  )
}

function TherapistTreatmentsContent() {
  const searchParams = useSearchParams()
  const presetPatient = searchParams.get('patient')
  const [patientId, setPatientId] = useState<string>(presetPatient ?? '')
  const [tab, setTab] = useState<Tab>('plans')
  const [createOpen, setCreateOpen] = useState(false)
  const [createKind, setCreateKind] = useState<'plan' | 'assessment' | 'program' | 'measurement' | null>(null)
  const [deleteProgramId, setDeleteProgramId] = useState<string | null>(null)
  const queryClient = useQueryClient()

  const profile = useQuery({ queryKey: ['my-therapist-profile'], queryFn: getMyTherapistProfile })
  const therapistId = profile.data?.profile.id

  const appointments = useQuery({
    queryKey: ['appointments', 'therapist', therapistId, 'all'],
    queryFn: () => listAppointments({ therapist_id: therapistId, size: 100 }),
    enabled: !!therapistId,
  })
  const myPatients = useMemo(
    () =>
      appointments.data
        ? Array.from(new Map(appointments.data.items.map((a) => [a.patient_id, a])).values())
        : [],
    [appointments.data]
  )

  const patientAppointments = useQuery({
    queryKey: ['appointments', 'patient', patientId],
    queryFn: () => listAppointments({ patient_id: patientId, size: 50 }),
    enabled: !!patientId,
  })
  const assessments = useQuery({
    queryKey: ['assessments', 'patient', patientId],
    queryFn: () => listAssessments({ patient_id: patientId, size: 50 }),
    enabled: !!patientId,
  })
  const plans = useQuery({
    queryKey: ['plans', patientId],
    queryFn: () => listPatientPlans(patientId),
    enabled: !!patientId,
  })
  const programs = useQuery({
    queryKey: ['programs', 'patient', patientId],
    queryFn: () => listPrograms({ patient_id: patientId, size: 50 }),
    enabled: !!patientId,
  })
  const progress = useQuery({
    queryKey: ['progress', patientId],
    queryFn: () => getPatientProgress(patientId),
    enabled: !!patientId,
  })
  const measurements = useQuery({
    queryKey: ['measurements', patientId],
    queryFn: () => listMeasurements(patientId),
    enabled: !!patientId,
  })

  const refresh = (key: string) => queryClient.invalidateQueries({ queryKey: [key, 'patient', patientId] })

  const openCreate = (kind: 'plan' | 'assessment' | 'program' | 'measurement') => {
    setCreateKind(kind)
    setCreateOpen(true)
  }

  const error = profile.error || appointments.error

  return (
    <div className="space-y-6">
      <PageHeader
        title="Care"
        description="Treatment plans, assessments, exercise programs and progress"
        actions={
          patientId && (
            <Button onClick={() => openCreate('plan')}>
              <Plus className="mr-2 h-4 w-4" /> New plan
            </Button>
          )
        }
      />
      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load care data. Please try again later.</AlertDescription>
        </Alert>
      )}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={patientId || '_none'} onValueChange={(v) => { setPatientId(v === '_none' ? '' : v); setTab('plans') }}>
          <SelectTrigger className="w-full sm:w-72">
            <SelectValue placeholder="Select a patientâ€¦" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="_none">Select a patientâ€¦</SelectItem>
            {myPatients.map((a) => (
              <SelectItem key={a.patient_id} value={a.patient_id}>
                Patient #{a.patient_id.slice(0, 8)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {tabs.map((t) => (
            <button
              key={t.id}
              onClick={() => setTab(t.id)}
              className={`rounded-md px-3 py-1.5 text-sm font-medium ${tab === t.id ? 'bg-background shadow-sm' : 'text-muted-foreground'}`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {!patientId ? (
        <EmptyState icon={FileHeart} title="Select a patient" description="Choose a patient to view their care record." />
      ) : (
        <div className="space-y-6">
          {tab === 'plans' && (
            <section className="space-y-3">
              {plans.isPending ? (
                <Skeleton className="h-32" />
              ) : !plans.data || plans.data.length === 0 ? (
                <EmptyState icon={FileHeart} title="No treatment plans" description="Create a plan to begin treatment." />
              ) : (
                plans.data.map((p) => (
                  <div key={p.id} className="glass-panel p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{p.title}</p>
                        <p className="text-xs text-muted-foreground">
                          {formatDate(p.start_date)} â€“ {p.end_date ? formatDate(p.end_date) : 'ongoing'}
                        </p>
                      </div>
                      <Pill status={p.status} />
                    </div>
                    {p.description ? <p className="mt-2 text-sm text-muted-foreground">{p.description}</p> : null}
                  </div>
                ))
              )}
            </section>
          )}

          {tab === 'assessments' && (
            <section className="space-y-3">
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => openCreate('assessment')}>
                  <Plus className="mr-2 h-4 w-4" /> New assessment
                </Button>
              </div>
              {assessments.isPending ? (
                <Skeleton className="h-32" />
              ) : !assessments.data || assessments.data.items.length === 0 ? (
                <EmptyState icon={ClipboardCheck} title="No assessments" description="Record an initial assessment to start." />
              ) : (
                assessments.data.items.map((a) => (
                  <div key={a.id} className="glass-panel p-5">
                    <div className="flex items-center justify-between">
                      <p className="font-medium capitalize">{a.assessment_type} assessment</p>
                      <p className="text-xs text-muted-foreground">{formatDate(a.created_at)}</p>
                    </div>
                    <div className="mt-2 grid gap-2 text-sm md:grid-cols-2">
                      <p><span className="text-muted-foreground">Diagnosis:</span> {a.diagnosis ?? 'â€”'}</p>
                      <p><span className="text-muted-foreground">Pain:</span> {a.pain_score != null ? `${a.pain_score}/10` : 'â€”'}</p>
                      {a.findings ? <p><span className="text-muted-foreground">Findings:</span> {a.findings}</p> : null}
                      {a.goals ? <p><span className="text-muted-foreground">Goals:</span> {a.goals}</p> : null}
                      {a.recommendations ? <p><span className="text-muted-foreground">Recommendations:</span> {a.recommendations}</p> : null}
                    </div>
                  </div>
                ))
              )}
            </section>
          )}

          {tab === 'programs' && (
            <section className="space-y-3">
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => openCreate('program')}>
                  <Plus className="mr-2 h-4 w-4" /> New program
                </Button>
              </div>
              {programs.isPending ? (
                <Skeleton className="h-32" />
              ) : !programs.data || programs.data.items.length === 0 ? (
                <EmptyState icon={Dumbbell} title="No exercise programs" description="Create a home exercise program for this patient." />
              ) : (
                programs.data.items.map((p) => (
                  <div key={p.id} className="glass-panel p-5">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{p.title}</p>
                        <p className="text-xs text-muted-foreground">{p.frequency ?? 'â€”'} Â· {p.duration ?? 'â€”'}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Pill status="active">{p.exercise_items.length} items</Pill>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setDeleteProgramId(p.id)}
                          aria-label="Delete program"
                        >
                          <Trash2 className="h-4 w-4 text-destructive" />
                        </Button>
                      </div>
                    </div>
                    {p.instructions ? <p className="mt-2 text-sm text-muted-foreground">{p.instructions}</p> : null}
                    {p.exercise_items.length > 0 ? (
                      <ul className="mt-3 space-y-1">
                        {p.exercise_items.map((item) => (
                          <li key={item.id} className="flex items-center justify-between rounded-lg bg-muted px-3 py-2 text-sm">
                            <span>{item.exercise_name}</span>
                            <span className="text-xs text-muted-foreground">
                              {item.repetitions != null ? `${item.repetitions} reps` : ''}
                              {item.sets != null ? ` Â· ${item.sets} sets` : ''}
                              {item.duration ? ` Â· ${item.duration}` : ''}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                  </div>
                ))
              )}
            </section>
          )}

          {tab === 'progress' && (
            <section className="space-y-3">
              <div className="flex justify-end">
                <Button variant="outline" onClick={() => openCreate('measurement')}>
                  <Plus className="mr-2 h-4 w-4" /> Add measurement
                </Button>
              </div>
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                <StatBox label="Latest pain" value={progress.data ? String(progress.data.pain_trend[progress.data.pain_trend.length - 1]?.value ?? 'â€”') : 'â€”'} />
                <StatBox label="Latest ROM" value={progress.data ? String(progress.data.rom_trend[progress.data.rom_trend.length - 1]?.value ?? 'â€”') : 'â€”'} />
                <StatBox label="Sessions" value={progress.data ? String(progress.data.session_timeline.length) : 'â€”'} />
                <StatBox label="Goals" value={progress.data?.goals ? 'Set' : 'â€”'} />
              </div>
              <div className="glass-panel p-5">
                <h3 className="mb-3 flex items-center gap-2 font-semibold">
                  <TrendingUp className="h-4 w-4" /> Measurements
                </h3>
                {measurements.isPending ? (
                  <Skeleton className="h-24" />
                ) : !measurements.data || measurements.data.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No measurements recorded yet.</p>
                ) : (
                  <ul className="divide-y divide-border">
                    {measurements.data.map((m) => (
                      <li key={m.id} className="flex items-center justify-between py-2 text-sm">
                        <span className="capitalize">{m.assessment_type ?? 'measurement'} Â· {formatDate(m.measured_at)}</span>
                        <span className="text-xs text-muted-foreground">
                          Pain {m.pain_score ?? 'â€”'} Â· ROM {m.rom_degrees ?? 'â€”'} Â· Strength {m.strength_scale ?? 'â€”'}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          )}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {createKind === 'plan' && 'New treatment plan'}
              {createKind === 'assessment' && 'New assessment'}
              {createKind === 'program' && 'New exercise program'}
              {createKind === 'measurement' && 'Add measurement'}
            </DialogTitle>
            <DialogDescription>Fill in the details below.</DialogDescription>
          </DialogHeader>
          {createKind === 'plan' && (
            <PlanForm
              patientId={patientId}
              assessments={assessments.data?.items ?? []}
              onSuccess={() => { setCreateOpen(false); queryClient.invalidateQueries({ queryKey: ['plans'] }) }}
            />
          )}
          {createKind === 'assessment' && (
            <AssessmentForm
              patientId={patientId}
              therapistId={therapistId}
              appointments={patientAppointments.data?.items ?? []}
              onSuccess={() => { setCreateOpen(false); refresh('assessments') }}
            />
          )}
          {createKind === 'program' && (
            <ProgramForm
              patientId={patientId}
              therapistId={therapistId}
              onSuccess={() => { setCreateOpen(false); refresh('programs') }}
            />
          )}
          {createKind === 'measurement' && (
            <MeasurementForm
              patientId={patientId}
              therapistId={therapistId}
              onSuccess={() => { setCreateOpen(false); refresh('measurements'); refresh('progress') }}
            />
          )}
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteProgramId}
        onOpenChange={(o) => !o && setDeleteProgramId(null)}
        title="Delete exercise program?"
        description="This will remove the program from the patient. This action cannot be undone."
        confirmLabel="Delete"
        onConfirm={async () => {
          if (!deleteProgramId) return
          try {
            await deleteProgram(deleteProgramId)
            setDeleteProgramId(null)
            queryClient.invalidateQueries({ queryKey: ['programs'] })
            toast.success('Program deleted')
          } catch {
            toast.error('Could not delete program')
          }
        }}
      />
    </div>
  )
}

function StatBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg bg-muted p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  )
}

function Pill({ status, children }: { status: string; children?: React.ReactNode }) {
  return (
    <span className="inline-flex items-center rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
      {children ?? status.replace(/_/g, ' ')}
    </span>
  )
}

function PlanForm({ patientId, assessments, onSuccess }: {
  patientId: string
  assessments: { id: string; assessment_type: string }[]
  onSuccess: () => void
}) {
  const [assessmentId, setAssessmentId] = useState('')
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [startDate, setStartDate] = useState(new Date().toISOString().slice(0, 10))
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    setSubmitting(true)
    try {
      await createPlan({
        assessment_id: assessmentId,
        title: title.trim(),
        description: description || null,
        start_date: startDate,
        status: 'planned',
      })
      toast.success('Plan created')
      onSuccess()
    } catch {
      toast.error('Could not create plan')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Assessment</Label>
        <Select value={assessmentId || '_none'} onValueChange={(v) => setAssessmentId(v === '_none' ? '' : v)}>
          <SelectTrigger><SelectValue placeholder="Select assessment" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_none">Select assessment</SelectItem>
            {assessments.map((a) => (
              <SelectItem key={a.id} value={a.id}>{a.assessment_type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. 6-week knee rehab" />
      </div>
      <div className="space-y-2">
        <Label>Description</Label>
        <Textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Start date</Label>
        <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
      </div>
      <div className="flex justify-end">
        <Button disabled={submitting || !title.trim() || !assessmentId || !startDate} onClick={submit}>Create plan</Button>
      </div>
    </div>
  )
}

function AssessmentForm({ patientId, therapistId, appointments, onSuccess }: {
  patientId: string
  therapistId?: string
  appointments: { id: string; scheduled_date: string }[]
  onSuccess: () => void
}) {
  const [appointmentId, setAppointmentId] = useState('')
  const [type, setType] = useState<AssessmentType>('initial')
  const [painScore, setPainScore] = useState('')
  const [diagnosis, setDiagnosis] = useState('')
  const [findings, setFindings] = useState('')
  const [goals, setGoals] = useState('')
  const [recommendations, setRecommendations] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!therapistId) return
    setSubmitting(true)
    const payload: AssessmentCreate = {
      patient_id: patientId,
      therapist_id: therapistId,
      appointment_id: appointmentId,
      assessment_type: type,
      pain_score: painScore !== '' ? Number(painScore) : null,
      diagnosis: diagnosis || null,
      findings: findings || null,
      goals: goals || null,
      recommendations: recommendations || null,
    }
    try {
      if (type === 'initial') await createInitialAssessment(payload)
      else if (type === 'weekly') await createWeeklyAssessment(payload)
      else await createFinalAssessment(payload)
      toast.success('Assessment saved')
      onSuccess()
    } catch {
      toast.error('Could not save assessment')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Type</Label>
        <Select value={type} onValueChange={(v) => setType(v as AssessmentType)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="initial">Initial</SelectItem>
            <SelectItem value="weekly">Weekly</SelectItem>
            <SelectItem value="final">Final</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Appointment</Label>
        <Select value={appointmentId || '_none'} onValueChange={(v) => setAppointmentId(v === '_none' ? '' : v)}>
          <SelectTrigger><SelectValue placeholder="Select appointment" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_none">Select appointment</SelectItem>
            {appointments.map((a) => (
              <SelectItem key={a.id} value={a.id}>{formatDate(a.scheduled_date)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Pain score (0â€“10)</Label>
        <Input type="number" min={0} max={10} value={painScore} onChange={(e) => setPainScore(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Diagnosis</Label>
        <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Findings</Label>
        <Textarea value={findings} onChange={(e) => setFindings(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Goals</Label>
        <Textarea value={goals} onChange={(e) => setGoals(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Recommendations</Label>
        <Textarea value={recommendations} onChange={(e) => setRecommendations(e.target.value)} />
      </div>
      <div className="flex justify-end">
        <Button disabled={submitting || !appointmentId} onClick={submit}>Save assessment</Button>
      </div>
    </div>
  )
}

function ProgramForm({ patientId, therapistId, onSuccess }: {
  patientId: string
  therapistId?: string
  onSuccess: () => void
}) {
  const [title, setTitle] = useState('')
  const [instructions, setInstructions] = useState('')
  const [frequency, setFrequency] = useState('')
  const [duration, setDuration] = useState('')
  const [items, setItems] = useState<ExerciseItemCreate[]>([])
  const [submitting, setSubmitting] = useState(false)

  const addItem = () => setItems((prev) => [...prev, { exercise_name: '', repetitions: null, sets: null, duration: null }])
  const updateItem = (index: number, patch: Partial<ExerciseItemCreate>) =>
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)))
  const removeItem = (index: number) => setItems((prev) => prev.filter((_, i) => i !== index))

  const submit = async () => {
    if (!therapistId) return
    setSubmitting(true)
    try {
      await createProgram({
        patient_id: patientId,
        therapist_id: therapistId,
        title: title.trim(),
        instructions: instructions || null,
        frequency: frequency || null,
        duration: duration || null,
        items: items.filter((it) => it.exercise_name.trim()),
      })
      toast.success('Program created')
      onSuccess()
    } catch {
      toast.error('Could not create program')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Title</Label>
        <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Home mobility routine" />
      </div>
      <div className="space-y-2">
        <Label>Instructions</Label>
        <Textarea value={instructions} onChange={(e) => setInstructions(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Frequency</Label>
          <Input value={frequency} onChange={(e) => setFrequency(e.target.value)} placeholder="e.g. 3x per week" />
        </div>
        <div className="space-y-2">
          <Label>Duration</Label>
          <Input value={duration} onChange={(e) => setDuration(e.target.value)} placeholder="e.g. 4 weeks" />
        </div>
      </div>
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Exercises</Label>
          <Button type="button" variant="outline" size="sm" onClick={addItem}>
            <Plus className="mr-1 h-3 w-3" /> Add exercise
          </Button>
        </div>
        {items.map((item, index) => (
          <div key={index} className="space-y-2 rounded-lg border border-border p-3">
            <div className="flex items-center justify-between gap-2">
              <Input
                value={item.exercise_name}
                onChange={(e) => updateItem(index, { exercise_name: e.target.value })}
                placeholder="Exercise name"
              />
              <Button type="button" variant="ghost" size="sm" onClick={() => removeItem(index)}>
                <Trash2 className="h-4 w-4 text-destructive" />
              </Button>
            </div>
            <div className="grid grid-cols-3 gap-2">
              <Input type="number" placeholder="Reps" value={item.repetitions ?? ''} onChange={(e) => updateItem(index, { repetitions: e.target.value ? Number(e.target.value) : null })} />
              <Input type="number" placeholder="Sets" value={item.sets ?? ''} onChange={(e) => updateItem(index, { sets: e.target.value ? Number(e.target.value) : null })} />
              <Input placeholder="Duration" value={item.duration ?? ''} onChange={(e) => updateItem(index, { duration: e.target.value })} />
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end">
        <Button disabled={submitting || !title.trim()} onClick={submit}>Create program</Button>
      </div>
    </div>
  )
}

function MeasurementForm({ patientId, therapistId, onSuccess }: {
  patientId: string
  therapistId?: string
  onSuccess: () => void
}) {
  const [painScore, setPainScore] = useState('')
  const [romDegrees, setRomDegrees] = useState('')
  const [strength, setStrength] = useState<StrengthScale | ''>('')
  const [notes, setNotes] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    setSubmitting(true)
    try {
      await createMeasurement({
        patient_id: patientId,
        therapist_id: therapistId,
        pain_score: painScore !== '' ? Number(painScore) : null,
        rom_degrees: romDegrees !== '' ? Number(romDegrees) : null,
        strength_scale: strength || null,
        notes: notes || null,
      })
      toast.success('Measurement recorded')
      onSuccess()
    } catch {
      toast.error('Could not record measurement')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Pain score (0â€“10)</Label>
          <Input type="number" min={0} max={10} value={painScore} onChange={(e) => setPainScore(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>ROM (degrees)</Label>
          <Input type="number" value={romDegrees} onChange={(e) => setRomDegrees(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Strength (0â€“5)</Label>
        <Select value={strength || '_none'} onValueChange={(v) => setStrength(v === '_none' ? '' : v as StrengthScale)}>
          <SelectTrigger><SelectValue placeholder="Select strength" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="_none">Select strength</SelectItem>
            {['0', '1', '2', '3', '4', '5'].map((s) => (
              <SelectItem key={s} value={s}>{s}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-2">
        <Label>Notes</Label>
        <Textarea value={notes} onChange={(e) => setNotes(e.target.value)} />
      </div>
      <div className="flex justify-end">
        <Button disabled={submitting || (painScore === '' && romDegrees === '' && !strength)} onClick={submit}>
          Save measurement
        </Button>
      </div>
    </div>
  )
}
