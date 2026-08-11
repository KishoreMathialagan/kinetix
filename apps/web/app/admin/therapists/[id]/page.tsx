'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { KeyRound, Pencil } from 'lucide-react'
import {
  Avatar,
  AvatarFallback,
  Badge,
  Button,
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Skeleton,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  toast,
} from '@kinetix/ui'
import { PageHeader } from '@kinetix/ui'
import { DataTable } from '@/components/data-table'
import { TherapistUpdateForm } from '@/components/forms/therapist-update-form'
import { ResetPasswordDialog } from '@/components/reset-password-dialog'
import { getTherapist, updateTherapist } from '@/services/therapists'
import { getTherapistDashboardById } from '@/services/therapists'
import { listAvailability } from '@/services/availability'
import { listAppointments } from '@/services/appointments'
import { listUsers } from '@/services/users'
import { toApiError } from '@/lib/api-client'
import { formatDate, formatDateTime } from '@kinetix/utils'
import type { Appointment, TherapistAvailability, TherapistDashboard } from '@kinetix/shared-types'

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive'> = {
  active: 'default',
  on_leave: 'secondary',
  inactive: 'destructive',
}

const weekdays = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']

function initials(first?: string, last?: string) {
  return `${(first ?? '?')[0] ?? ''}${(last ?? '')?.[0] ?? ''}`.toUpperCase() || '?'
}

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value ?? '—'}</dd>
    </div>
  )
}

export default function AdminTherapistDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  const therapistQuery = useQuery({
    queryKey: ['therapists', params.id],
    queryFn: () => getTherapist(params.id),
    enabled: !!params.id,
  })

  const dashboardQuery = useQuery({
    queryKey: ['therapists', params.id, 'dashboard'],
    queryFn: () => getTherapistDashboardById(params.id),
    enabled: !!params.id,
  })

  const availabilityQuery = useQuery({
    queryKey: ['availability', params.id],
    queryFn: () => listAvailability(params.id),
    enabled: !!params.id,
  })

  const appointmentsQuery = useQuery({
    queryKey: ['appointments', 'admin', 'therapist', params.id],
    queryFn: () => listAppointments({ therapist_id: params.id, size: 10 }),
    enabled: !!params.id,
  })

  const usersQuery = useQuery({
    queryKey: ['users', 'admin'],
    queryFn: () => listUsers({ limit: 1000 }),
  })

  const therapist = therapistQuery.data
  const dashboard = dashboardQuery.data
  const user = usersQuery.data?.find((u) => u.id === therapist?.user_id)

  async function handleUpdate(payload: Parameters<typeof updateTherapist>[1]) {
    try {
      await updateTherapist(params.id, payload)
      toast.success('Therapist updated')
      setEditOpen(false)
      queryClient.invalidateQueries({ queryKey: ['therapists', params.id] })
    } catch (error) {
      toast.error(toApiError(error).message)
    }
  }

  return (
    <div className="space-y-6">
      {therapistQuery.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <PageHeader
          title={`${user?.first_name ?? ''} ${user?.last_name ?? ''}`}
          description={user?.email ?? ''}
          actions={
            <Button variant="outline" onClick={() => setEditOpen(true)}>
              <Pencil className="mr-2 h-4 w-4" /> Edit
            </Button>
          }
        />
      )}

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Today&apos;s appointments</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{dashboard?.todays_appointments_count ?? '—'}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Active patients</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{dashboard?.active_patients_count ?? '—'}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Availability</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold capitalize">{dashboard?.availability_status?.replace(/_/g, ' ') ?? '—'}</CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Profile completion</CardTitle></CardHeader>
          <CardContent className="text-2xl font-bold">{dashboard?.profile_completion_percentage != null ? `${dashboard.profile_completion_percentage}%` : '—'}</CardContent>
        </Card>
      </div>

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="availability">Availability</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Profile</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex items-center gap-4">
                <Avatar className="h-14 w-14">
                  <AvatarFallback>{initials(user?.first_name, user?.last_name)}</AvatarFallback>
                </Avatar>
                <Badge variant={statusVariant[therapist?.status ?? 'active']}>{therapist?.status?.replace(/_/g, ' ')}</Badge>
              </div>
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="License number" value={therapist?.license_number} />
                <Field label="Registration number" value={therapist?.registration_number} />
                <Field label="Specialization" value={therapist?.specialization} />
                <Field label="Department" value={therapist?.department} />
                <Field label="Qualification" value={therapist?.qualification} />
                <Field label="Languages" value={therapist?.languages} />
                <Field label="Years of experience" value={therapist?.years_experience != null ? String(therapist.years_experience) : undefined} />
                <Field label="Date of birth" value={therapist?.dob ? formatDate(therapist.dob) : undefined} />
                <Field label="Gender" value={therapist?.gender?.replace(/_/g, ' ')} />
                <Field label="Joining date" value={therapist?.joining_date ? formatDate(therapist.joining_date) : undefined} />
                <Field label="Daily capacity" value={therapist?.capacity != null ? String(therapist.capacity) : undefined} />
                <Field label="Address" value={therapist?.address} />
                <Field label="Emergency contact" value={therapist?.emergency_contact} />
              </dl>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Account security</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="mb-4 text-sm text-muted-foreground">
                Reset the password for {user?.first_name} {user?.last_name}&apos;s account. They will need to use the new
                password the next time they sign in.
              </p>
              <Button variant="outline" onClick={() => setResetOpen(true)}>
                <KeyRound className="mr-2 h-4 w-4" /> Reset password
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="availability">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Weekly availability</CardTitle>
            </CardHeader>
            <CardContent>
              <DataTable<TherapistAvailability>
                columns={[
                  {
                    key: 'day',
                    header: 'Day',
                    render: (a) => (
                      <span className="text-sm font-medium">
                        {a.weekday != null ? weekdays[a.weekday] : a.specific_date ? formatDate(a.specific_date) : '—'}
                      </span>
                    ),
                  },
                  { key: 'hours', header: 'Hours', render: (a) => <span className="text-sm">{a.start_time} – {a.end_time}</span> },
                  {
                    key: 'status',
                    header: 'Status',
                    render: (a) => (
                      <Badge variant={a.is_available ? 'default' : 'secondary'}>{a.is_available ? 'Available' : 'Unavailable'}</Badge>
                    ),
                  },
                  { key: 'reason', header: 'Reason', render: (a) => <span className="text-sm">{a.reason ?? '—'}</span>, hideOnMobile: true },
                ]}
                rows={availabilityQuery.data ?? []}
                loading={availabilityQuery.isLoading}
                keyField={(a) => a.id}
                emptyTitle="No availability set"
                emptyDescription="This therapist has not set their weekly availability yet."
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appointments">
          <DataTable<Appointment>
            columns={[
              { key: 'date', header: 'Date', render: (a) => <span className="text-sm">{formatDate(a.scheduled_date)}</span> },
              { key: 'time', header: 'Time', render: (a) => <span className="text-sm">{a.start_time} – {a.end_time}</span>, hideOnMobile: true },
              { key: 'type', header: 'Type', render: (a) => <span className="text-sm">{a.appointment_type ?? '—'}</span>, hideOnMobile: true },
              { key: 'status', header: 'Status', render: (a) => <Badge variant="secondary">{a.status.replace(/_/g, ' ')}</Badge> },
            ]}
            rows={appointmentsQuery.data?.items ?? []}
            loading={appointmentsQuery.isLoading}
            total={appointmentsQuery.data?.total}
            pageSize={10}
            onRowClick={(a) => router.push(`/admin/appointments/${a.id}`)}
            keyField={(a) => a.id}
            emptyTitle="No appointments"
            emptyDescription="No appointments assigned to this therapist."
          />
        </TabsContent>
      </Tabs>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit therapist</DialogTitle>
            <DialogDescription>Update the therapist&apos;s professional details.</DialogDescription>
          </DialogHeader>
          <TherapistUpdateForm
            defaultValues={{
              department: therapist?.department ?? undefined,
              qualification: therapist?.qualification ?? undefined,
              specialization: therapist?.specialization ?? undefined,
              languages: therapist?.languages ?? undefined,
              years_experience: therapist?.years_experience ?? undefined,
              address: therapist?.address ?? undefined,
              emergency_contact: therapist?.emergency_contact ?? undefined,
              status: therapist?.status ?? undefined,
              capacity: therapist?.capacity ?? undefined,
            }}
            onSubmit={handleUpdate}
          />
        </DialogContent>
      </Dialog>

      <ResetPasswordDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        userId={user?.id}
        userLabel={`${user?.first_name ?? ''} ${user?.last_name ?? ''}`}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['therapists', params.id] })}
      />
    </div>
  )
}
