'use client'

import { useFieldArray, useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2, Plus, Trash2 } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import {
  Button,
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
import type { InvoiceCreate, InvoiceStatus } from '@kinetix/shared-types'
import { toApiError } from '@/lib/api-client'
import { createInvoice } from '@/services/billing'
import { useNameLookup } from '@/lib/names'
import { listPackages } from '@/services/billing'

const statuses: InvoiceStatus[] = ['draft', 'issued']

const itemSchema = z.object({
  description: z.string().min(1, 'Description is required'),
  quantity: z.coerce.number().min(1),
  unit_price: z.coerce.number().min(0),
})

const schema = z.object({
  patient_id: z.string().min(1, 'Select a patient'),
  items: z.array(itemSchema).min(1, 'Add at least one line item'),
  gst_rate: z.coerce.number().min(0).max(100),
  due_date: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(statuses),
})

type FormValues = z.infer<typeof schema>

interface InvoiceFormProps {
  defaultPatientId?: string
  onSuccess?: () => void
}

export function InvoiceForm({ defaultPatientId, onSuccess }: InvoiceFormProps) {
  const { patientItems, patientName, patientsLoading } = useNameLookup()
  const packagesQuery = useQuery({
    queryKey: ['packages'],
    queryFn: () => listPackages(),
  })

  const {
    register,
    handleSubmit,
    control,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: {
      patient_id: defaultPatientId ?? '',
      items: [{ description: '', quantity: 1, unit_price: 0 }],
      gst_rate: 18,
      status: 'issued',
    },
  })

  const { fields, append, remove } = useFieldArray({ control, name: 'items' })
  const patientId = watch('patient_id')
  const items = watch('items')
  const gstRate = watch('gst_rate')
  const status = watch('status')

  const subtotal = items.reduce((sum, item) => sum + (Number(item.quantity) || 0) * (Number(item.unit_price) || 0), 0)
  const tax = (subtotal * gstRate) / 100

  async function onSubmit(values: FormValues) {
    const payload: InvoiceCreate = {
      patient_id: values.patient_id,
      items: values.items.map((item) => ({
        description: item.description,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
      })),
      gst_rate: Number(values.gst_rate),
      due_date: values.due_date || null,
      notes: values.notes || null,
      status: values.status,
    }
    try {
      await createInvoice(payload)
      toast.success('Invoice created')
      onSuccess?.()
    } catch (error) {
      toast.error(toApiError(error).message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label>Patient</Label>
          <Select value={patientId} onValueChange={(v) => setValue('patient_id', v)}>
            <SelectTrigger aria-invalid={!!errors.patient_id}>
              <SelectValue placeholder={patientsLoading ? 'Loading patients…' : 'Select patient'} />
            </SelectTrigger>
            <SelectContent>
              {patientItems.map((p) => (
                <SelectItem key={p.id} value={p.id}>
                  {patientName(p.id)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {errors.patient_id && <p className="text-sm text-destructive">{errors.patient_id.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="gst_rate">GST rate (%)</Label>
          <Input id="gst_rate" type="number" min={0} max={100} {...register('gst_rate')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="due_date">Due date</Label>
          <Input id="due_date" type="date" {...register('due_date')} />
        </div>
        <div className="space-y-2">
          <Label>Status</Label>
          <Select value={status} onValueChange={(v) => setValue('status', v as InvoiceStatus)}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {statuses.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.replace(/_/g, ' ')}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Line items</Label>
          {packagesQuery.data && packagesQuery.data.length > 0 && (
            <Select
              value=""
              onValueChange={(v) => {
                const pkg = packagesQuery.data?.find((p) => p.id === v)
                if (pkg) {
                  append({ description: pkg.name, quantity: 1, unit_price: pkg.price })
                }
              }}
            >
              <SelectTrigger className="w-auto">
                <SelectValue placeholder="Add from package" />
              </SelectTrigger>
              <SelectContent>
                {packagesQuery.data.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} — ₹{p.price}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>
        <div className="space-y-2">
          {fields.map((field, index) => (
            <div key={field.id} className="flex items-start gap-2">
              <Input placeholder="Description" className="flex-1" aria-invalid={!!errors.items?.[index]?.description} {...register(`items.${index}.description`)} />
              <Input type="number" min={1} placeholder="Qty" className="w-20" {...register(`items.${index}.quantity`)} />
              <Input type="number" min={0} step="0.01" placeholder="₹" className="w-28" {...register(`items.${index}.unit_price`)} />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => remove(index)}
                disabled={fields.length === 1}
                aria-label="Remove item"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          ))}
          {errors.items?.root && <p className="text-sm text-destructive">{errors.items.root.message}</p>}
          {typeof errors.items?.message === 'string' && <p className="text-sm text-destructive">{errors.items.message}</p>}
        </div>
        <Button type="button" variant="outline" size="sm" onClick={() => append({ description: '', quantity: 1, unit_price: 0 })}>
          <Plus className="mr-2 h-4 w-4" /> Add item
        </Button>
      </div>

      <div className="rounded-lg bg-muted p-4 text-sm">
        <div className="flex justify-between"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
        <div className="flex justify-between"><span>GST ({gstRate}%)</span><span>₹{tax.toFixed(2)}</span></div>
        <div className="mt-1 flex justify-between border-t border-border pt-1 font-semibold"><span>Total</span><span>₹{(subtotal + tax).toFixed(2)}</span></div>
      </div>

      <div className="space-y-2">
        <Label htmlFor="notes">Notes</Label>
        <Textarea id="notes" placeholder="Invoice notes (optional)" {...register('notes')} />
      </div>

      <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        Create invoice
      </Button>
    </form>
  )
}
