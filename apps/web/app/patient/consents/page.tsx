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
import { FileCheck2, PenLine } from 'lucide-react'
import { formatDate } from '@kinetix/utils'
import { getMyPatientProfile } from '@/services/patients'
import { listPatientConsents, signPatientConsent } from '@/services/consents'
import type { ConsentForm } from '@kinetix/shared-types'

export default function PatientConsentsPage() {
  const queryClient = useQueryClient()
  const [signing, setSigning] = useState<ConsentForm | null>(null)

  const profile = useQuery({ queryKey: ['my-patient-profile'], queryFn: getMyPatientProfile })
  const patientId = profile.data?.profile.id
  const user = profile.data?.user

  const consents = useQuery({
    queryKey: ['consents', patientId],
    queryFn: () => listPatientConsents(patientId as string),
    enabled: !!patientId,
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['consents', patientId] })

  return (
    <div className="space-y-6">
      <PageHeader title="Consents" description="Review and sign consent forms" />

      {consents.isPending ? (
        <Skeleton className="h-40" />
      ) : consents.isError ? (
        <Alert variant="destructive">
          <AlertDescription>Failed to load consent forms. Please try again later.</AlertDescription>
        </Alert>
      ) : !consents.data || consents.data.length === 0 ? (
        <EmptyState icon={FileCheck2} title="No consent forms" description="Consent forms from your care team will appear here." />
      ) : (
        <section className="glass-panel p-5">
          <ul className="divide-y divide-border">
            {consents.data.map((c) => (
              <li key={c.id} className="flex items-center justify-between py-3">
                <div>
                  <p className="text-sm font-medium">{c.template_name}</p>
                  <p className="text-xs text-muted-foreground">
                    {c.signed_at ? `Signed ${formatDate(c.signed_at)}` : `Created ${formatDate(c.created_at)}`}
                  </p>
                </div>
                {c.signed_at ? (
                  <span className="inline-flex items-center gap-1 text-sm text-emerald-600">
                    <FileCheck2 className="h-4 w-4" /> Signed
                  </span>
                ) : (
                  <Button size="sm" onClick={() => setSigning(c)}>
                    <PenLine className="mr-1 h-3 w-3" /> Sign now
                  </Button>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      <Dialog open={!!signing} onOpenChange={(o) => !o && setSigning(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Sign consent form</DialogTitle>
            <DialogDescription>
              {signing ? `Sign "${signing.template_name}" by typing your full name below.` : ''}
            </DialogDescription>
          </DialogHeader>
          {signing && patientId && (
            <SignForm
              patientId={patientId}
              formId={signing.id}
              defaultName={user ? `${user.first_name} ${user.last_name}`.trim() : ''}
              onSuccess={() => {
                setSigning(null)
                toast.success('Consent signed')
                refresh()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function SignForm({ patientId, formId, defaultName, onSuccess }: {
  patientId: string
  formId: string
  defaultName: string
  onSuccess: () => void
}) {
  const [signerName, setSignerName] = useState(defaultName)
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    setSubmitting(true)
    try {
      await signPatientConsent(patientId, {
        consent_form_id: formId,
        signer_name: signerName.trim(),
        signer_role: 'patient',
        signature_url: 'patient-self-signed',
      })
      onSuccess()
    } catch {
      toast.error('Could not sign consent')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        By typing your full name, you confirm you have read and agreed to this consent form.
      </p>
      <div className="space-y-2">
        <Label htmlFor="signer-name">Full name</Label>
        <Input id="signer-name" value={signerName} onChange={(e) => setSignerName(e.target.value)} />
      </div>
      <div className="flex justify-end">
        <Button disabled={submitting || !signerName.trim()} onClick={submit}>Sign consent</Button>
      </div>
    </div>
  )
}
