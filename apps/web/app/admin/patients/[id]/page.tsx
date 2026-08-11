'use client'

import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Archive, KeyRound, Pencil } from 'lucide-react'
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
import { ConfirmDialog } from '@/components/confirm-dialog'
import { PatientForm } from '@/components/forms/patient-form'
import { ResetPasswordDialog } from '@/components/reset-password-dialog'
import { archivePatient, getPatient } from '@/services/patients'
import { listUsers } from '@/services/users'
import { listAppointments } from '@/services/appointments'
import { listPatientDocuments } from '@/services/documents'
import { listPatientConsents } from '@/services/consents'
import { toApiError } from '@/lib/api-client'
import { formatDate, formatDateTime } from '@kinetix/utils'
import type { Appointment, PatientDocument, ConsentForm, User } from '@kinetix/shared-types'

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

export default function AdminPatientDetailPage() {
  const params = useParams<{ id: string }>()
  const router = useRouter()
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const [archiveOpen, setArchiveOpen] = useState(false)
  const [resetOpen, setResetOpen] = useState(false)

  const patientQuery = useQuery({
    queryKey: ['patients', params.id],
    queryFn: () => getPatient(params.id),
    enabled: !!params.id,
  })

  const appointmentsQuery = useQuery({
    queryKey: ['appointments', 'admin', params.id],
    queryFn: () => listAppointments({ patient_id: params.id, size: 10 }),
    enabled: !!params.id,
  })

  const documentsQuery = useQuery({
    queryKey: ['documents', params.id],
    queryFn: () => listPatientDocuments(params.id),
    enabled: !!params.id,
  })

  const consentsQuery = useQuery({
    queryKey: ['consents', params.id],
    queryFn: () => listPatientConsents(params.id),
    enabled: !!params.id,
  })

  const usersQuery = useQuery({
    queryKey: ['users', 'admin'],
    queryFn: () => listUsers({ limit: 1000 }),
  })

  const patient = patientQuery.data
  const user = usersQuery.data?.find((u) => u.id === patient?.user_id)

  async function handleArchive() {
    try {
      await archivePatient(params.id)
      toast.success('Patient archived')
      queryClient.invalidateQueries({ queryKey: ['patients'] })
    } catch (error) {
      toast.error(toApiError(error).message)
    }
  }

  return (
    <div className="space-y-6">
      {patientQuery.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <PageHeader
          title={`${user?.first_name ?? ''} ${user?.last_name ?? ''}`}
          description={user?.email ?? ''}
          actions={
            <>
              <Button variant="outline" onClick={() => setEditOpen(true)}>
                <Pencil className="mr-2 h-4 w-4" /> Edit
              </Button>
              <Button variant="destructive" onClick={() => setArchiveOpen(true)}>
                <Archive className="mr-2 h-4 w-4" /> Archive
              </Button>
            </>
          }
        />
      )}

      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="medical">Medical</TabsTrigger>
          <TabsTrigger value="appointments">Appointments</TabsTrigger>
          <TabsTrigger value="documents">Documents</TabsTrigger>
          <TabsTrigger value="consents">Consents</TabsTrigger>
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
                <Badge>{patient?.patient_code}</Badge>
              </div>
              <dl className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <Field label="Phone" value={user?.phone} />
                <Field label="Date of birth" value={patient?.dob ? formatDate(patient.dob) : undefined} />
                <Field label="Gender" value={patient?.gender?.replace(/_/g, ' ')} />
                <Field label="Blood group" value={patient?.blood_group} />
                <Field label="Occupation" value={patient?.occupation} />
                <Field label="Referred by" value={patient?.referred_by} />
                <Field label="Address" value={patient?.address} />
                <Field label="Emergency contact" value={patient?.emergency_contact} />
                <Field label="Emergency phone" value={patient?.emergency_phone} />
                <Field label="Registered" value={patient?.created_at ? formatDate(patient.created_at) : undefined} />
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

        <TabsContent value="medical" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Medical records</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4">
                <Field label="Diagnosis" value={patient?.diagnosis} />
                <Field label="Medical history" value={patient?.medical_history} />
                <Field label="Allergies" value={patient?.allergies} />
                <Field label="Medications" value={patient?.medications} />
              </dl>
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
            emptyDescription="Schedule an appointment for this patient to get started."
          />
        </TabsContent>

        <TabsContent value="documents">
          <DataTable<PatientDocument>
            columns={[
              { key: 'name', header: 'Document', render: (d) => <span className="text-sm font-medium">{d.file_name}</span> },
              { key: 'type', header: 'Type', render: (d) => <span className="text-sm">{d.document_type.replace(/_/g, ' ')}</span>, hideOnMobile: true },
              { key: 'uploaded', header: 'Uploaded', render: (d) => <span className="text-sm text-muted-foreground">{formatDateTime(d.created_at)}</span>, hideOnMobile: true },
            ]}
            rows={documentsQuery.data ?? []}
            loading={documentsQuery.isLoading}
            keyField={(d) => d.id}
            emptyTitle="No documents"
            emptyDescription="Documents uploaded by staff will appear here."
          />
        </TabsContent>

        <TabsContent value="consents">
          <DataTable<ConsentForm>
            columns={[
              { key: 'name', header: 'Consent form', render: (c) => <span className="text-sm font-medium">{c.template_name}</span> },
              { key: 'signed_by', header: 'Signed by', render: (c) => <span className="text-sm">{c.signed_by ?? '—'}</span> },
              { key: 'signed', header: 'Signed at', render: (c) => <span className="text-sm text-muted-foreground">{c.signed_at ? formatDateTime(c.signed_at) : 'Pending'}</span>, hideOnMobile: true },
            ]}
            rows={consentsQuery.data ?? []}
            loading={consentsQuery.isLoading}
            keyField={(c) => c.id}
            emptyTitle="No consents"
            emptyDescription="Consent forms signed by this patient will appear here."
          />
        </TabsContent>
      </Tabs>

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit patient</DialogTitle>
            <DialogDescription>Update the patient&apos;s profile details.</DialogDescription>
          </DialogHeader>
          <PatientForm
            mode="edit"
            patientId={params.id}
            defaultValues={{
              dob: patient?.dob ?? undefined,
              gender: patient?.gender ?? undefined,
              blood_group: patient?.blood_group ?? undefined,
              address: patient?.address ?? undefined,
              emergency_contact: patient?.emergency_contact ?? undefined,
              emergency_phone: patient?.emergency_phone ?? undefined,
              medical_history: patient?.medical_history ?? undefined,
              allergies: patient?.allergies ?? undefined,
              medications: patient?.medications ?? undefined,
              diagnosis: patient?.diagnosis ?? undefined,
              referred_by: patient?.referred_by ?? undefined,
              occupation: patient?.occupation ?? undefined,
            }}
            onSuccess={() => {
              setEditOpen(false)
              queryClient.invalidateQueries({ queryKey: ['patients', params.id] })
            }}
          />
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={archiveOpen}
        onOpenChange={setArchiveOpen}
        title="Archive patient?"
        description="The patient will be archived and hidden from the main patient list. Their records remain intact."
        confirmLabel="Archive"
        onConfirm={handleArchive}
      />

      <ResetPasswordDialog
        open={resetOpen}
        onOpenChange={setResetOpen}
        userId={user?.id}
        userLabel={`${user?.first_name ?? ''} ${user?.last_name ?? ''}`}
        onSuccess={() => queryClient.invalidateQueries({ queryKey: ['patients', params.id] })}
      />
    </div>
  )
}
