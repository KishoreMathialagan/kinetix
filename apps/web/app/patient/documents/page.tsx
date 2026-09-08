'use client'

import { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { PageHeader, EmptyState } from '@kinetix/ui'
import { Skeleton } from '@kinetix/ui'
import { Alert, AlertDescription } from '@kinetix/ui'
import { Button } from '@kinetix/ui'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Label,
  toast,
} from '@kinetix/ui'
import { FileText, Download, Upload } from 'lucide-react'
import { formatDate } from '@kinetix/utils'
import { getMyPatientProfile } from '@/services/patients'
import { listPatientDocuments, downloadDocument, uploadDocument } from '@/services/documents'
import { DocumentTypes, type DocumentType } from '@kinetix/shared-types'

export default function PatientDocumentsPage() {
  const queryClient = useQueryClient()
  const [uploadOpen, setUploadOpen] = useState(false)
  const profile = useQuery({ queryKey: ['my-patient-profile'], queryFn: getMyPatientProfile })
  const patientId = profile.data?.profile.id

  const documents = useQuery({
    queryKey: ['documents', patientId],
    queryFn: () => listPatientDocuments(patientId as string),
    enabled: !!patientId,
  })

  const refresh = () => queryClient.invalidateQueries({ queryKey: ['documents', patientId] })

  const download = async (documentId: string, fileName: string) => {
    try {
      const blob = await downloadDocument(documentId)
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = fileName
      a.click()
      setTimeout(() => URL.revokeObjectURL(url), 5000)
    } catch {
      toast.error('Could not download document')
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader
        title="My documents"
        description="Medical records shared with you"
        actions={
          patientId ? (
            <Button onClick={() => setUploadOpen(true)}>
              <Upload className="mr-2 h-4 w-4" /> Upload
            </Button>
          ) : undefined
        }
      />

      {documents.isPending ? (
        <Skeleton className="h-40" />
      ) : documents.isError ? (
        <Alert variant="destructive">
          <AlertDescription>Failed to load documents. Please try again later.</AlertDescription>
        </Alert>
      ) : !documents.data || documents.data.length === 0 ? (
        <EmptyState icon={FileText} title="No documents" description="Documents shared by your care team will appear here." />
      ) : (
        <section className="glass-panel p-5">
          <ul className="divide-y divide-border">
            {documents.data.map((d) => (
              <li key={d.id} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted">
                    <FileText className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{d.file_name}</p>
                    <p className="text-xs text-muted-foreground">
                      {d.document_type.replace(/_/g, ' ')} Â· {formatDate(d.created_at)} Â· {(d.file_size ?? 0) / 1024 > 0 ? `${((d.file_size ?? 0) / 1024).toFixed(0)} KB` : ''}
                    </p>
                  </div>
                </div>
                <Button size="sm" variant="outline" onClick={() => download(d.id, d.file_name)}>
                  <Download className="mr-1 h-3 w-3" /> Download
                </Button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <Dialog open={uploadOpen} onOpenChange={setUploadOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Upload a document</DialogTitle>
            <DialogDescription>Share a medical record with your care team.</DialogDescription>
          </DialogHeader>
          {patientId && (
            <UploadForm
              patientId={patientId}
              onSuccess={() => {
                setUploadOpen(false)
                toast.success('Document uploaded')
                refresh()
              }}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}

function UploadForm({ patientId, onSuccess }: { patientId: string; onSuccess: () => void }) {
  const fileInput = useRef<HTMLInputElement>(null)
  const [file, setFile] = useState<File | null>(null)
  const [docType, setDocType] = useState<DocumentType | ''>('')
  const [submitting, setSubmitting] = useState(false)

  const submit = async () => {
    if (!file || !docType) return
    setSubmitting(true)
    const formData = new FormData()
    formData.append('file', file)
    formData.append('doc_type', docType)
    try {
      await uploadDocument(patientId, formData)
      onSuccess()
    } catch {
      toast.error('Could not upload document')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="doc-file">File</Label>
        <input
          id="doc-file"
          ref={fileInput}
          type="file"
          className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-lg file:border-0 file:bg-primary/10 file:px-3 file:py-2 file:text-sm file:font-medium file:text-primary"
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="doc-type">Document type</Label>
        <select
          id="doc-type"
          value={docType}
          onChange={(e) => setDocType(e.target.value as DocumentType)}
          className="flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm shadow-sm"
        >
          <option value="">Select a typeâ€¦</option>
          {DocumentTypes.map((t) => (
            <option key={t} value={t}>
              {t.replace(/_/g, ' ')}
            </option>
          ))}
        </select>
      </div>
      <div className="flex justify-end">
        <Button disabled={submitting || !file || !docType} onClick={submit}>
          {submitting ? 'Uploadingâ€¦' : 'Upload'}
        </Button>
      </div>
    </div>
  )
}
