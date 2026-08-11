'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Download, FileBarChart, Loader2 } from 'lucide-react'
import { Button, Card, CardContent, CardHeader, CardTitle, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue, toast } from '@kinetix/ui'
import { PageHeader } from '@kinetix/ui'
import { getClinicReport, getPatientReport, getTherapistReport, generateReport, downloadReport } from '@/services/reports'
import { listPatients } from '@/services/patients'
import { listTherapists } from '@/services/therapists'
import { toApiError } from '@/lib/api-client'
import { useNameLookup } from '@/lib/names'

const schema = z.object({
  report_type: z.enum(['patient', 'therapist', 'clinic']),
  patient_id: z.string().optional(),
  therapist_id: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function AdminReportsPage() {
  const queryClient = useQueryClient()
  const [data, setData] = useState<Record<string, unknown> | null>(null)
  const [generatedId, setGeneratedId] = useState<string | null>(null)
  const [downloading, setDownloading] = useState(false)
  const { patientName, therapistName } = useNameLookup()
  const { register, handleSubmit, setValue, watch, formState: { isSubmitting } } = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { report_type: 'clinic' },
  })

  const reportType = watch('report_type')
  const patientId = watch('patient_id')
  const therapistId = watch('therapist_id')

  const patientsQuery = useQuery({ queryKey: ['patients', 'select'], queryFn: () => listPatients({ size: 200 }) })
  const therapistsQuery = useQuery({ queryKey: ['therapists', 'select'], queryFn: () => listTherapists({ size: 200 }) })

  async function onSubmit(values: FormValues) {
    setGeneratedId(null)
    try {
      if (values.report_type === 'clinic') {
        const result = await getClinicReport()
        setData(result)
        return
      }
      const result = values.report_type === 'patient' && values.patient_id
        ? await getPatientReport(values.patient_id)
        : values.therapist_id
          ? await getTherapistReport(values.therapist_id)
          : null
      if (!result) {
        toast.error('Select the required record to generate the report')
        return
      }
      setData(result)
    } catch (error) {
      toast.error(toApiError(error).message)
    }
  }

  async function handleGenerateAndDownload() {
    const type = reportType
    if (type === 'patient' && !patientId) return toast.error('Select a patient')
    if (type === 'therapist' && !therapistId) return toast.error('Select a therapist')
    setDownloading(true)
    try {
      const report = await generateReport({
        report_type: type,
        patient_id: type === 'patient' ? patientId : null,
        therapist_id: type === 'therapist' ? therapistId : null,
      })
      const id = (report as { id?: string }).id
      if (id) {
        setGeneratedId(id)
        toast.success('Report generated')
      }
      queryClient.invalidateQueries({ queryKey: ['reports'] })
    } catch (error) {
      toast.error(toApiError(error).message)
    } finally {
      setDownloading(false)
    }
  }

  async function handleDownload() {
    if (!generatedId) return
    try {
      const blob = await downloadReport(generatedId)
      const url = URL.createObjectURL(blob)
      const anchor = document.createElement('a')
      anchor.href = url
      anchor.download = `report-${generatedId}.json`
      anchor.click()
      URL.revokeObjectURL(url)
    } catch (error) {
      toast.error(toApiError(error).message)
    }
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Reports" description="Generate and download clinic reports" />
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Generate report</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-4">
              <div className="space-y-2">
                <Label>Report type</Label>
                <Select value={reportType} onValueChange={(v) => setValue('report_type', v as FormValues['report_type'])}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="clinic">Clinic report</SelectItem>
                    <SelectItem value="patient">Patient report</SelectItem>
                    <SelectItem value="therapist">Therapist report</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {reportType === 'patient' && (
                <div className="space-y-2">
                  <Label>Patient</Label>
                  <Select value={patientId ?? ''} onValueChange={(v) => setValue('patient_id', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select patient" />
                    </SelectTrigger>
                    <SelectContent>
                      {patientsQuery.data?.items.map((p) => (
                        <SelectItem key={p.id} value={p.id}>
                          {patientName(p.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              {reportType === 'therapist' && (
                <div className="space-y-2">
                  <Label>Therapist</Label>
                  <Select value={therapistId ?? ''} onValueChange={(v) => setValue('therapist_id', v)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select therapist" />
                    </SelectTrigger>
                    <SelectContent>
                      {therapistsQuery.data?.items.map((t) => (
                        <SelectItem key={t.id} value={t.id}>
                          {therapistName(t.id)}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
              <div className="flex flex-wrap gap-2">
                <Button type="submit" disabled={isSubmitting}>
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <FileBarChart className="mr-2 h-4 w-4" /> View report
                </Button>
                <Button type="button" variant="outline" onClick={handleGenerateAndDownload} disabled={downloading}>
                  {downloading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  <Download className="mr-2 h-4 w-4" /> Generate &amp; download JSON
                </Button>
                {generatedId && (
                  <Button type="button" variant="ghost" onClick={handleDownload}>
                    <Download className="mr-2 h-4 w-4" /> Download again
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Report data</CardTitle>
          </CardHeader>
          <CardContent>
            {!data && <p className="text-sm text-muted-foreground">Generate a report to preview its data here.</p>}
            {data && (
              <pre className="max-h-[28rem] overflow-auto rounded-lg bg-muted p-4 text-xs">
                {JSON.stringify(data, null, 2)}
              </pre>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
