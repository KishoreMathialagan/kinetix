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
import { PencilLine, FileText } from 'lucide-react'
import { formatDate } from '@kinetix/utils'
import { getMyPatientProfile, updateMyPatientProfile } from '@/services/patients'
import type { Gender, PatientUpdateRequest } from '@kinetix/shared-types'
import { StatusBadge } from '@/components/status-badge'

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value || 'â€”'}</p>
    </div>
  )
}

export default function PatientProfilePage() {
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)

  const profile = useQuery({ queryKey: ['my-patient-profile'], queryFn: getMyPatientProfile })
  const user = profile.data?.user
  const p = profile.data?.profile

  return (
    <div className="space-y-6">
      <PageHeader
        title="Profile"
        description="Your personal and medical details"
        actions={
          p && (
            <Button onClick={() => setEditOpen(true)}>
              <PencilLine className="mr-2 h-4 w-4" /> Edit profile
            </Button>
          )
        }
      />

      {profile.isPending ? (
        <Skeleton className="h-64" />
      ) : (
        <>
          <section className="glass-panel p-5">
            <div className="mb-4 flex flex-wrap items-center gap-2">
              <h2 className="text-lg font-semibold">
                {user ? `${user.first_name} ${user.last_name}` : 'Patient'}
              </h2>
              {p?.patient_code ? <StatusBadge status={p.patient_code} className="capitalize" /> : null}
            </div>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Field label="Email" value={user?.email} />
              <Field label="Phone" value={user?.phone} />
              <Field label="Date of birth" value={p?.dob} />
              <Field label="Gender" value={p?.gender} />
              <Field label="Blood group" value={p?.blood_group} />
              <Field label="Occupation" value={p?.occupation} />
              <Field label="Address" value={p?.address} />
              <Field label="Emergency contact" value={p?.emergency_contact} />
              <Field label="Emergency phone" value={p?.emergency_phone} />
              <Field label="Referred by" value={p?.referred_by} />
              <Field label="Diagnosis" value={p?.diagnosis} />
            </div>
            {(p?.medical_history || p?.allergies || p?.medications) && (
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
                <Field label="Medical history" value={p?.medical_history} />
                <Field label="Allergies" value={p?.allergies} />
                <Field label="Medications" value={p?.medications} />
              </div>
            )}
          </section>

          <section className="glass-panel p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <FileText className="h-4 w-4" /> Consent &amp; documents
            </h2>
            <div className="flex flex-wrap gap-3">
              <Button asChild variant="outline">
                <a href="/patient/consents">View consents</a>
              </Button>
              <Button asChild variant="outline">
                <a href="/patient/documents">View documents</a>
              </Button>
            </div>
          </section>
        </>
      )}

      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit profile</DialogTitle>
            <DialogDescription>Update your personal and medical details.</DialogDescription>
          </DialogHeader>
          {p && (
            <PatientProfileForm
              initial={p}
              onSubmit={async (payload) => {
                await updateMyPatientProfile(payload)
                queryClient.invalidateQueries({ queryKey: ['my-patient-profile'] })
                setEditOpen(false)
                toast.success('Profile updated')
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function PatientProfileForm({ initial, onSubmit }: {
  initial: PatientUpdateRequest & { dob?: string | null; gender?: Gender | null; blood_group?: string | null }
  onSubmit: (payload: PatientUpdateRequest) => Promise<void>
}) {
  const [dob, setDob] = useState(initial.dob ?? '')
  const [gender, setGender] = useState<Gender | ''>(initial.gender ?? '')
  const [bloodGroup, setBloodGroup] = useState(initial.blood_group ?? '')
  const [address, setAddress] = useState(initial.address ?? '')
  const [emergencyContact, setEmergencyContact] = useState(initial.emergency_contact ?? '')
  const [emergencyPhone, setEmergencyPhone] = useState(initial.emergency_phone ?? '')
  const [occupation, setOccupation] = useState(initial.occupation ?? '')
  const [medicalHistory, setMedicalHistory] = useState(initial.medical_history ?? '')
  const [allergies, setAllergies] = useState(initial.allergies ?? '')
  const [medications, setMedications] = useState(initial.medications ?? '')
  const [diagnosis, setDiagnosis] = useState(initial.diagnosis ?? '')
  const [referredBy, setReferredBy] = useState(initial.referred_by ?? '')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    setSubmitting(true)
    try {
      await onSubmit({
        dob: dob || null,
        gender: gender || null,
        blood_group: (bloodGroup || null) as PatientUpdateRequest['blood_group'],
        address: address || null,
        emergency_contact: emergencyContact || null,
        emergency_phone: emergencyPhone || null,
        occupation: occupation || null,
        medical_history: medicalHistory || null,
        allergies: allergies || null,
        medications: medications || null,
        diagnosis: diagnosis || null,
        referred_by: referredBy || null,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Date of birth</Label>
          <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Gender</Label>
          <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
            <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="male">Male</SelectItem>
              <SelectItem value="female">Female</SelectItem>
              <SelectItem value="other">Other</SelectItem>
              <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      <div className="space-y-2">
        <Label>Blood group</Label>
        <Input value={bloodGroup} onChange={(e) => setBloodGroup(e.target.value)} placeholder="e.g. O+" />
      </div>
      <div className="space-y-2">
        <Label>Address</Label>
        <Input value={address} onChange={(e) => setAddress(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Emergency contact</Label>
          <Input value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Emergency phone</Label>
          <Input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Occupation</Label>
        <Input value={occupation} onChange={(e) => setOccupation(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Medical history</Label>
        <Textarea value={medicalHistory} onChange={(e) => setMedicalHistory(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label>Allergies</Label>
          <Textarea value={allergies} onChange={(e) => setAllergies(e.target.value)} />
        </div>
        <div className="space-y-2">
          <Label>Medications</Label>
          <Textarea value={medications} onChange={(e) => setMedications(e.target.value)} />
        </div>
      </div>
      <div className="space-y-2">
        <Label>Diagnosis</Label>
        <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} />
      </div>
      <div className="space-y-2">
        <Label>Referred by</Label>
        <Input value={referredBy} onChange={(e) => setReferredBy(e.target.value)} />
      </div>
      <div className="flex justify-end">
        <Button disabled={submitting} onClick={submit}>Save changes</Button>
      </div>
    </div>
  )
}
