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
import { CalendarClock, Clock, PencilLine, Plane, AlertCircle } from 'lucide-react'
import { formatDate } from '@kinetix/utils'
import {
  getMyTherapistProfile,
  updateMyTherapistProfile,
} from '@/services/therapists'
import {
  addAvailability,
  listAvailability,
  updateAvailability,
  requestLeave,
} from '@/services/availability'
import type { TherapistStatus, TherapistUpdate } from '@kinetix/shared-types'
import { StatusBadge } from '@/components/status-badge'

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value || 'â€”'}</p>
    </div>
  )
}

export default function TherapistProfilePage() {
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [availabilityOpen, setAvailabilityOpen] = useState(false)
  const [leaveOpen, setLeaveOpen] = useState(false)

  const profile = useQuery({ queryKey: ['my-therapist-profile'], queryFn: getMyTherapistProfile })
  const therapistId = profile.data?.profile.id

  const availability = useQuery({
    queryKey: ['availability', therapistId],
    queryFn: () => listAvailability(therapistId as string),
    enabled: !!therapistId,
  })

  const refreshAvailability = () => queryClient.invalidateQueries({ queryKey: ['availability'] })

  const user = profile.data?.user
  const t = profile.data?.profile

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your details, availability and leave"
        actions={
          t && (
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setAvailabilityOpen(true)}>
                <Clock className="mr-2 h-4 w-4" /> Availability
              </Button>
              <Button variant="outline" onClick={() => setLeaveOpen(true)}>
                <Plane className="mr-2 h-4 w-4" /> Request leave
              </Button>
              <Button onClick={() => setEditOpen(true)}>
                <PencilLine className="mr-2 h-4 w-4" /> Edit profile
              </Button>
            </div>
          )
        }
      />

      {profile.isPending ? (
        <Skeleton className="h-64" />
      ) : profile.error ? (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Failed to load profile. Please try again later.</AlertDescription>
        </Alert>
      ) : (
        <>
          <section className="glass-panel p-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">
                {user ? `${user.first_name} ${user.last_name}` : 'Therapist'}
              </h2>
              {t ? <StatusBadge status={t.status} /> : null}
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Field label="Email" value={user?.email} />
              <Field label="Phone" value={user?.phone} />
              <Field label="Specialization" value={t?.specialization} />
              <Field label="Department" value={t?.department} />
              <Field label="Qualification" value={t?.qualification} />
              <Field label="Languages" value={t?.languages} />
              <Field label="Experience" value={t?.years_experience != null ? `${t.years_experience} years` : null} />
              <Field label="License number" value={t?.license_number} />
              <Field label="Registration number" value={t?.registration_number} />
              <Field label="Capacity" value={t ? String(t.capacity) : null} />
              <Field label="Address" value={t?.address} />
              <Field label="Emergency contact" value={t?.emergency_contact} />
            </div>
          </section>

          <section className="glass-panel p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <CalendarClock className="h-4 w-4" /> Current availability
            </h2>
            {availability.isPending ? (
              <Skeleton className="h-24" />
            ) : !availability.data || availability.data.length === 0 ? (
              <EmptyState icon={Clock} title="No availability set" description="Add availability slots so patients can book you." />
            ) : (
              <ul className="divide-y divide-border">
                {availability.data.map((a) => (
                  <li key={a.id} className="flex items-center justify-between py-2">
                    <div>
                      <p className="text-sm font-medium">
                        {a.weekday != null ? weekdays[a.weekday] : formatDate(a.specific_date ?? '')}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {a.start_time} â€“ {a.end_time}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={a.is_available ? 'available' : 'unavailable'} />
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={async () => {
                          if (!therapistId) return
                          try {
                            await updateAvailability(therapistId, a.id, {
                              weekday: a.weekday,
                              specific_date: a.specific_date,
                              start_time: a.start_time,
                              end_time: a.end_time,
                              is_available: !a.is_available,
                            })
                            refreshAvailability()
                          } catch {
                            toast.error('Could not update availability')
                          }
                        }}
                      >
                        Toggle
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </section>
        </>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>Update your professional details.</DialogDescription>
          </DialogHeader>
          {t && (
            <ProfileForm
              initial={{
                department: t.department,
                qualification: t.qualification,
                specialization: t.specialization,
                languages: t.languages,
                years_experience: t.years_experience,
                address: t.address,
                emergency_contact: t.emergency_contact,
                capacity: t.capacity,
              }}
              onSubmit={async (payload) => {
                await updateMyTherapistProfile(payload)
                queryClient.invalidateQueries({ queryKey: ['my-therapist-profile'] })
                setEditOpen(false)
                toast.success('Profile updated')
              }}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={availabilityOpen} onOpenChange={setAvailabilityOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add availability</DialogTitle>
            <DialogDescription>Recurring weekly slot or a specific date.</DialogDescription>
          </DialogHeader>
          {therapistId && (
            <AvailabilityForm
              onSuccess={() => {
                setAvailabilityOpen(false)
                refreshAvailability()
                toast.success('Availability added')
              }}
              onSubmit={(payload) => addAvailability(therapistId, payload)}
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={leaveOpen} onOpenChange={setLeaveOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Request leave</DialogTitle>
            <DialogDescription>Submit time off for admin approval.</DialogDescription>
          </DialogHeader>
          {therapistId && (
            <LeaveForm
              onSuccess={() => {
                setLeaveOpen(false)
                toast.success('Leave requested')
              }}
              onSubmit={(payload) => requestLeave(therapistId, payload)}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function ProfileForm({ initial, onSubmit }: {
  initial: Omit<TherapistUpdate, 'status'>
  onSubmit: (payload: TherapistUpdate) => Promise<void>
}) {
  const [department, setDepartment] = useState(initial.department ?? '')
  const [qualification, setQualification] = useState(initial.qualification ?? '')
  const [specialization, setSpecialization] = useState(initial.specialization ?? '')
  const [languages, setLanguages] = useState(initial.languages ?? '')
  const [years, setYears] = useState(initial.years_experience != null ? String(initial.years_experience) : '')
  const [address, setAddress] = useState(initial.address ?? '')
  const [emergency, setEmergency] = useState(initial.emergency_contact ?? '')
  const [capacity, setCapacity] = useState(String(initial.capacity ?? ''))
  const [status, setStatus] = useState<TherapistStatus>('active')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    setSubmitting(true)
    try {
      await onSubmit({
        department: department || null,
        qualification: qualification || null,
        specialization: specialization || null,
        languages: languages || null,
        years_experience: years ? Number(years) : null,
        address: address || null,
        emergency_contact: emergency || null,
        capacity: capacity ? Number(capacity) : null,
        status,
      })
    } catch {
      toast.error('Could not update profile')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Department</Label>
          <Input value={department} onChange={(e) => setDepartment(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Specialization</Label>
          <Input value={specialization} onChange={(e) => setSpecialization(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Qualification</Label>
        <Input value={qualification} onChange={(e) => setQualification(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Languages</Label>
          <Input value={languages} onChange={(e) => setLanguages(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Years of experience</Label>
          <Input type="number" min={0} value={years} onChange={(e) => setYears(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Address</Label>
        <Input value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Emergency contact</Label>
          <Input value={emergency} onChange={(e) => setEmergency(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Capacity</Label>
          <Input type="number" min={1} value={capacity} onChange={(e) => setCapacity(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Status</Label>
        <Select value={status} onValueChange={(v) => setStatus(v as TherapistStatus)}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
            <SelectItem value="on_leave">On leave</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="flex justify-end">
        <Button disabled={submitting} onClick={submit}>Save changes</Button>
      </div>
    </div>
  )
}

function AvailabilityForm({ onSubmit, onSuccess }: {
  onSubmit: (payload: { weekday?: number | null; specific_date?: string | null; start_time: string; end_time: string; is_available?: boolean }) => Promise<unknown>
  onSuccess: () => void
}) {
  const [mode, setMode] = useState<'weekly' | 'date'>('weekly')
  const [weekday, setWeekday] = useState('1')
  const [specificDate, setSpecificDate] = useState('')
  const [start, setStart] = useState('09:00')
  const [end, setEnd] = useState('17:00')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    setSubmitting(true)
    try {
      await onSubmit({
        weekday: mode === 'weekly' ? Number(weekday) : null,
        specific_date: mode === 'date' ? specificDate || null : null,
        start_time: start,
        end_time: end,
        is_available: true,
      })
      onSuccess()
    } catch {
      toast.error('Could not add availability')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Type</Label>
        <Select value={mode} onValueChange={(v) => setMode(v as 'weekly' | 'date')}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="weekly">Recurring weekly</SelectItem>
            <SelectItem value="date">Specific date</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {mode === 'weekly' ? (
        <div className="space-y-2">
          <Label>Weekday</Label>
          <Select value={weekday} onValueChange={setWeekday}>
            <SelectTrigger><SelectValue /></SelectTrigger>
            <SelectContent>
              {weekdays.map((d, i) => (
                <SelectItem key={i} value={String(i)}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      ) : (
        <div className="space-y-2">
          <Label>Date</Label>
          <Input type="date" value={specificDate} onChange={(e) => setSpecificDate(e.target.value)} />
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start</Label>
          <Input type="time" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>End</Label>
          <Input type="time" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>
      <div className="flex justify-end">
        <Button
          disabled={submitting || (mode === 'date' && !specificDate) || !start || !end}
          onClick={submit}
        >
          Add slot
        </Button>
      </div>
    </div>
  )
}

function LeaveForm({ onSubmit, onSuccess }: {
  onSubmit: (payload: { leave_type: string; reason?: string | null; start_date: string; end_date: string }) => Promise<unknown>
  onSuccess: () => void
}) {
  const [type, setType] = useState('sick')
  const [reason, setReason] = useState('')
  const [start, setStart] = useState('')
  const [end, setEnd] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    setSubmitting(true)
    try {
      await onSubmit({ leave_type: type, reason: reason || null, start_date: start, end_date: end })
      onSuccess()
    } catch {
      toast.error('Could not request leave')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label>Leave type</Label>
        <Select value={type} onValueChange={setType}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="sick">Sick leave</SelectItem>
            <SelectItem value="casual">Casual leave</SelectItem>
            <SelectItem value="vacation">Vacation</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Start date</Label>
          <Input type="date" value={start} onChange={(e) => setStart(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>End date</Label>
          <Input type="date" value={end} onChange={(e) => setEnd(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Reason</Label>
        <Textarea value={reason} onChange={(e) => setReason(e.target.value)} />
      </div>
      <div className="flex justify-end">
        <Button disabled={submitting || !start || !end} onClick={submit}>Submit request</Button>
      </div>
    </div>
  )
}
