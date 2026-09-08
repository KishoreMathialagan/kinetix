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
  Checkbox,
  Alert,
  AlertDescription,
} from '@kinetix/ui'
import { PageHeader } from '@kinetix/ui'
import { Skeleton } from '@kinetix/ui'
import { PencilLine, FileText, HeartPulse, Shield, UserCheck } from 'lucide-react'
import { formatDate } from '@kinetix/utils'
import { getMyPatientProfile, updateMyPatientProfile } from '@/services/patients'
import { useAuthStore } from '@/stores/auth-store'
import type { Gender, PatientUpdateRequest } from '@kinetix/shared-types'
import { StatusBadge } from '@/components/status-badge'

function Field({ label, value }: { label: string; value?: string | null }) {
  return (
    <div>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm">{value || '\u2014'}</p>
    </div>
  )
}

const PRIMARY_CONCERN_OPTIONS = [
  'Chronic Pain Management',
  'Sports Rehabilitation',
  'Neuro Rehabilitation',
]

const GENDER_OPTIONS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
]

const BLOOD_GROUP_OPTIONS = ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-', 'unknown']

const RELATIONSHIP_OPTIONS = [
  'Spouse',
  'Parent',
  'Sibling',
  'Child',
  'Friend',
  'Other',
]

export default function PatientProfilePage() {
  const queryClient = useQueryClient()
  const [editOpen, setEditOpen] = useState(false)
  const authUser = useAuthStore((s) => s.user)
  const setUser = useAuthStore((s) => s.setUser)

  const profile = useQuery({ queryKey: ['my-patient-profile'], queryFn: getMyPatientProfile })
  const user = profile.data?.user
  const p = profile.data?.profile

  const isComplete = profile.data?.profile_completed ?? authUser?.profile_completed ?? true
  const missingFields = profile.data?.missing_fields ?? authUser?.missing_fields ?? []

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

      {!isComplete && (
        <Alert variant="warning">
          <AlertDescription>
            <strong>Please complete your profile to access all sections.</strong>
            <p className="mt-1 text-sm">
              Missing: {missingFields.join(', ')}
            </p>
            <Button
              size="sm"
              className="mt-2"
              onClick={() => setEditOpen(true)}
            >
              Complete profile now
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {profile.isPending ? (
        <Skeleton className="h-64" />
      ) : profile.isError ? (
        <Alert variant="destructive">
          <AlertDescription>Failed to load profile. Please try again later.</AlertDescription>
        </Alert>
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
              <Field label="Phone" value={user?.phone ?? p?.phone_number} />
              <Field label="Date of birth" value={p?.dob} />
              <Field label="Gender" value={p?.gender} />
              <Field label="Blood group" value={p?.blood_group} />
              <Field label="Occupation" value={p?.occupation} />
            </div>
          </section>

          <section className="glass-panel p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <PencilLine className="h-4 w-4" /> Address
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Field label="Address" value={p?.address} />
              <Field label="City" value={p?.city} />
              <Field label="State" value={p?.state} />
              <Field label="ZIP Code" value={p?.zip_code} />
            </div>
          </section>

          <section className="glass-panel p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <HeartPulse className="h-4 w-4" /> Vitals
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
              <Field label="Height" value={p?.height} />
              <Field label="Weight" value={p?.weight} />
              <Field label="Blood Pressure" value={p?.blood_pressure} />
              <Field label="Temperature / SpO2" value={p?.temperature_spo2} />
            </div>
          </section>

          <section className="glass-panel p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <UserCheck className="h-4 w-4" /> Emergency Contact
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Field label="Full name" value={p?.emergency_contact} />
              <Field label="Relationship" value={p?.emergency_contact_relationship} />
              <Field label="Phone" value={p?.emergency_phone} />
              <Field label="Address" value={p?.emergency_contact_address} />
            </div>
          </section>

          <section className="glass-panel p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <HeartPulse className="h-4 w-4" /> Medical Information
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Field label="Primary concern" value={p?.primary_concern} />
              <Field label="Referring doctor" value={p?.referred_by} />
              <Field label="Diagnosis" value={p?.diagnosis} />
            </div>
            <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-3">
              <Field label="Current medications" value={p?.medications} />
              <Field label="Allergies" value={p?.allergies} />
              <Field label="Past medical conditions / Surgeries" value={p?.medical_history} />
            </div>
          </section>

          <section className="glass-panel p-5">
            <h2 className="mb-3 flex items-center gap-2 font-semibold">
              <Shield className="h-4 w-4" /> Insurance Information
            </h2>
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3">
              <Field label="Insurance provider" value={p?.insurance_provider} />
              <Field label="Policy number" value={p?.insurance_policy_number} />
            </div>
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
                const updatedProfile = await queryClient.fetchQuery({ queryKey: ['my-patient-profile'], queryFn: getMyPatientProfile })
                if (authUser && updatedProfile) {
                  setUser({
                    ...authUser,
                    profile_completed: updatedProfile.profile_completed,
                    missing_fields: updatedProfile.missing_fields,
                  })
                }
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
  const [occupation, setOccupation] = useState(initial.occupation ?? '')
  const [address, setAddress] = useState(initial.address ?? '')
  const [city, setCity] = useState(initial.city ?? '')
  const [state, setState] = useState(initial.state ?? '')
  const [zipCode, setZipCode] = useState(initial.zip_code ?? '')
  const [height, setHeight] = useState(initial.height ?? '')
  const [weight, setWeight] = useState(initial.weight ?? '')
  const [bloodPressure, setBloodPressure] = useState(initial.blood_pressure ?? '')
  const [temperatureSpo2, setTemperatureSpo2] = useState(initial.temperature_spo2 ?? '')
  const [emergencyContact, setEmergencyContact] = useState(initial.emergency_contact ?? '')
  const [emergencyContactRelationship, setEmergencyContactRelationship] = useState(initial.emergency_contact_relationship ?? '')
  const [emergencyPhone, setEmergencyPhone] = useState(initial.emergency_phone ?? '')
  const [emergencyContactAddress, setEmergencyContactAddress] = useState(initial.emergency_contact_address ?? '')
  const [primaryConcern, setPrimaryConcern] = useState<string[]>(() => {
    const val = initial.primary_concern
    if (!val) return []
    return val.split(',').map((s: string) => s.trim()).filter(Boolean)
  })
  const [primaryConcernOther, setPrimaryConcernOther] = useState(() => {
    const val = initial.primary_concern
    if (!val) return ''
    const items = val.split(',').map((s: string) => s.trim()).filter(Boolean)
    const known = items.filter((i: string) => PRIMARY_CONCERN_OPTIONS.includes(i))
    return items.length > known.length ? items.filter((i: string) => !PRIMARY_CONCERN_OPTIONS.includes(i)).join(', ') : ''
  })
  const [medicalHistory, setMedicalHistory] = useState(initial.medical_history ?? '')
  const [allergies, setAllergies] = useState(initial.allergies ?? '')
  const [medications, setMedications] = useState(initial.medications ?? '')
  const [diagnosis, setDiagnosis] = useState(initial.diagnosis ?? '')
  const [referredBy, setReferredBy] = useState(initial.referred_by ?? '')
  const [insuranceProvider, setInsuranceProvider] = useState(initial.insurance_provider ?? '')
  const [insurancePolicyNumber, setInsurancePolicyNumber] = useState(initial.insurance_policy_number ?? '')
  const [submitting, setSubmitting] = useState(false)

  function toggleConcern(option: string) {
    setPrimaryConcern((prev) =>
      prev.includes(option) ? prev.filter((c) => c !== option) : [...prev, option]
    )
  }

  const submit = async () => {
    setSubmitting(true)
    try {
      const allConcerns = [...primaryConcern]
      if (primaryConcernOther.trim()) {
        allConcerns.push(primaryConcernOther.trim())
      }
      await onSubmit({
        dob: dob || null,
        gender: gender || null,
        blood_group: (bloodGroup || null) as PatientUpdateRequest['blood_group'],
        occupation: occupation || null,
        address: address || null,
        city: city || null,
        state: state || null,
        zip_code: zipCode || null,
        height: height || null,
        weight: weight || null,
        blood_pressure: bloodPressure || null,
        temperature_spo2: temperatureSpo2 || null,
        emergency_contact: emergencyContact || null,
        emergency_contact_relationship: emergencyContactRelationship || null,
        emergency_phone: emergencyPhone || null,
        emergency_contact_address: emergencyContactAddress || null,
        primary_concern: allConcerns.length ? allConcerns.join(', ') : null,
        medical_history: medicalHistory || null,
        allergies: allergies || null,
        medications: medications || null,
        diagnosis: diagnosis || null,
        referred_by: referredBy || null,
        insurance_provider: insuranceProvider || null,
        insurance_policy_number: insurancePolicyNumber || null,
      })
    } catch {
      toast.error('Could not save profile')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-5">
      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Personal Information</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Date of birth</Label>
            <Input type="date" value={dob} onChange={(e) => setDob(e.target.value)} />
          </div>
          <div className="space-y-2">
            <Label>Gender</Label>
            <Select value={gender} onValueChange={(v) => setGender(v as Gender)}>
              <SelectTrigger><SelectValue placeholder="Select gender" /></SelectTrigger>
              <SelectContent>
                {GENDER_OPTIONS.map((g) => (
                  <SelectItem key={g.value} value={g.value}>{g.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Blood group</Label>
            <Select value={bloodGroup} onValueChange={setBloodGroup}>
              <SelectTrigger><SelectValue placeholder="Select blood group" /></SelectTrigger>
              <SelectContent>
                {BLOOD_GROUP_OPTIONS.map((bg) => (
                  <SelectItem key={bg} value={bg}>{bg}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Occupation</Label>
            <Input value={occupation} onChange={(e) => setOccupation(e.target.value)} placeholder="Your occupation" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Address</h3>
        <div className="space-y-3">
          <div className="space-y-2">
            <Label>Address</Label>
            <Input value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Street address" />
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label>City</Label>
              <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="City" />
            </div>
            <div className="space-y-2">
              <Label>State</Label>
              <Input value={state} onChange={(e) => setState(e.target.value)} placeholder="State" />
            </div>
            <div className="space-y-2">
              <Label>ZIP Code</Label>
              <Input value={zipCode} onChange={(e) => setZipCode(e.target.value)} placeholder="ZIP code" />
            </div>
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Vitals</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Height</Label>
            <Input value={height} onChange={(e) => setHeight(e.target.value)} placeholder="e.g. 5'10 or 178cm" />
          </div>
          <div className="space-y-2">
            <Label>Weight</Label>
            <Input value={weight} onChange={(e) => setWeight(e.target.value)} placeholder="e.g. 75kg" />
          </div>
          <div className="space-y-2">
            <Label>Blood Pressure</Label>
            <Input value={bloodPressure} onChange={(e) => setBloodPressure(e.target.value)} placeholder="e.g. 120/80" />
          </div>
          <div className="space-y-2">
            <Label>Temperature / SpO2</Label>
            <Input value={temperatureSpo2} onChange={(e) => setTemperatureSpo2(e.target.value)} placeholder="e.g. 98.6F / 98%" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Emergency Contact</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Full name</Label>
            <Input value={emergencyContact} onChange={(e) => setEmergencyContact(e.target.value)} placeholder="Contact person" />
          </div>
          <div className="space-y-2">
            <Label>Relationship</Label>
            <Select value={emergencyContactRelationship} onValueChange={setEmergencyContactRelationship}>
              <SelectTrigger><SelectValue placeholder="Select relationship" /></SelectTrigger>
              <SelectContent>
                {RELATIONSHIP_OPTIONS.map((r) => (
                  <SelectItem key={r} value={r}>{r}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Phone number</Label>
            <Input value={emergencyPhone} onChange={(e) => setEmergencyPhone(e.target.value)} placeholder="Phone number" />
          </div>
          <div className="space-y-2">
            <Label>Address</Label>
            <Input value={emergencyContactAddress} onChange={(e) => setEmergencyContactAddress(e.target.value)} placeholder="Contact address" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Medical Information</h3>
        <div className="space-y-3">
          <div>
            <Label className="mb-2 block">Primary Concern / Reason for Visit</Label>
            <div className="flex flex-wrap gap-4">
              {PRIMARY_CONCERN_OPTIONS.map((option) => (
                <label key={option} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={primaryConcern.includes(option)}
                    onCheckedChange={() => toggleConcern(option)}
                  />
                  {option}
                </label>
              ))}
            </div>
            <div className="mt-2 space-y-2">
              <Label>Other</Label>
              <Input value={primaryConcernOther} onChange={(e) => setPrimaryConcernOther(e.target.value)} placeholder="Specify other concerns" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Referring Doctor</Label>
              <Input value={referredBy} onChange={(e) => setReferredBy(e.target.value)} placeholder="Doctor name" />
            </div>
            <div className="space-y-2">
              <Label>Diagnosis</Label>
              <Input value={diagnosis} onChange={(e) => setDiagnosis(e.target.value)} placeholder="Primary diagnosis" />
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Current Medications</Label>
              <Textarea value={medications} onChange={(e) => setMedications(e.target.value)} placeholder="List current medications" />
            </div>
            <div className="space-y-2">
              <Label>Allergies</Label>
              <Textarea value={allergies} onChange={(e) => setAllergies(e.target.value)} placeholder="Known allergies" />
            </div>
          </div>
          <div className="space-y-2">
            <Label>Past Medical Conditions / Surgeries</Label>
            <Textarea value={medicalHistory} onChange={(e) => setMedicalHistory(e.target.value)} placeholder="Past medical conditions or surgeries" />
          </div>
        </div>
      </div>

      <div>
        <h3 className="mb-3 text-sm font-semibold text-muted-foreground uppercase tracking-wide">Insurance Information</h3>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <Label>Insurance Provider</Label>
            <Input value={insuranceProvider} onChange={(e) => setInsuranceProvider(e.target.value)} placeholder="Provider name" />
          </div>
          <div className="space-y-2">
            <Label>Policy Number</Label>
            <Input value={insurancePolicyNumber} onChange={(e) => setInsurancePolicyNumber(e.target.value)} placeholder="Policy number" />
          </div>
        </div>
      </div>

      <div className="flex justify-end pt-2">
        <Button disabled={submitting} onClick={submit}>
          {submitting ? 'Saving...' : 'Save changes'}
        </Button>
      </div>
    </div>
  )
}
