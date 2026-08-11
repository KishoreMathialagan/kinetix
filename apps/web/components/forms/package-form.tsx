'use client'

import { useForm, type Resolver } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Loader2 } from 'lucide-react'
import { Button, Input, Label, Switch, Textarea, toast } from '@kinetix/ui'
import type { TreatmentPackageCreate, TreatmentPackageUpdate } from '@kinetix/shared-types'
import { toApiError } from '@/lib/api-client'
import { createPackage, updatePackage } from '@/services/billing'

const schema = z.object({
  name: z.string().min(1, 'Package name is required'),
  description: z.string().optional(),
  sessions_count: z.coerce.number().min(1, 'At least 1 session'),
  price: z.coerce.number().min(0, 'Price cannot be negative'),
  gst_rate: z.coerce.number().min(0).max(100),
  is_active: z.boolean(),
})

type FormValues = z.infer<typeof schema>

interface PackageFormProps {
  packageId?: string
  defaultValues?: Partial<TreatmentPackageUpdate>
  onSuccess?: () => void
}

export function PackageForm({ packageId, defaultValues, onSuccess }: PackageFormProps) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(schema) as unknown as Resolver<FormValues>,
    defaultValues: {
      name: defaultValues?.name ?? '',
      description: defaultValues?.description ?? '',
      sessions_count: defaultValues?.sessions_count ?? 1,
      price: defaultValues?.price ?? 0,
      gst_rate: defaultValues?.gst_rate ?? 18,
      is_active: defaultValues?.is_active ?? true,
    },
  })

  const isActive = watch('is_active')

  async function onSubmit(values: FormValues) {
    const payload: TreatmentPackageCreate = {
      name: values.name,
      description: values.description || null,
      sessions_count: Number(values.sessions_count),
      price: Number(values.price),
      gst_rate: Number(values.gst_rate),
      is_active: values.is_active,
    }
    try {
      if (packageId) {
        await updatePackage(packageId, payload)
        toast.success('Package updated')
      } else {
        await createPackage(payload)
        toast.success('Package created')
      }
      onSuccess?.()
    } catch (error) {
      toast.error(toApiError(error).message)
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="name">Package name</Label>
          <Input id="name" placeholder="e.g. Post-surgical rehab (10 sessions)" aria-invalid={!!errors.name} {...register('name')} />
          {errors.name && <p className="text-sm text-destructive">{errors.name.message}</p>}
        </div>
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="description">Description</Label>
          <Textarea id="description" placeholder="What does this package include?" {...register('description')} />
        </div>
        <div className="space-y-2">
          <Label htmlFor="sessions_count">Sessions</Label>
          <Input id="sessions_count" type="number" min={1} aria-invalid={!!errors.sessions_count} {...register('sessions_count')} />
          {errors.sessions_count && <p className="text-sm text-destructive">{errors.sessions_count.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="price">Price (₹)</Label>
          <Input id="price" type="number" min={0} step="0.01" aria-invalid={!!errors.price} {...register('price')} />
          {errors.price && <p className="text-sm text-destructive">{errors.price.message}</p>}
        </div>
        <div className="space-y-2">
          <Label htmlFor="gst_rate">GST rate (%)</Label>
          <Input id="gst_rate" type="number" min={0} max={100} {...register('gst_rate')} />
        </div>
        <div className="flex items-center gap-2 pt-6">
          <Switch id="is_active" checked={isActive} onCheckedChange={(v) => setValue('is_active', v)} />
          <Label htmlFor="is_active">Active</Label>
        </div>
      </div>
      <Button type="submit" className="w-full sm:w-auto" disabled={isSubmitting}>
        {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
        {packageId ? 'Save changes' : 'Create package'}
      </Button>
    </form>
  )
}
