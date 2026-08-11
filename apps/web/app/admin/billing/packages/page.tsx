'use client'

import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Pencil, Plus } from 'lucide-react'
import { Badge, Button, Card, CardContent, Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@kinetix/ui'
import { PageHeader } from '@kinetix/ui'
import { DataTable } from '@/components/data-table'
import { PackageForm } from '@/components/forms/package-form'
import { listPackages } from '@/services/billing'
import { formatCurrency } from '@kinetix/utils'
import type { TreatmentPackage } from '@kinetix/shared-types'

export default function AdminPackagesPage() {
  const queryClient = useQueryClient()
  const [createOpen, setCreateOpen] = useState(false)
  const [editing, setEditing] = useState<TreatmentPackage | null>(null)

  const query = useQuery({ queryKey: ['packages'], queryFn: listPackages })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Treatment packages"
        description="Predefined packages used when invoicing"
        actions={
          <Button onClick={() => setCreateOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> New package
          </Button>
        }
      />
      <Card>
        <CardContent className="p-0">
          <DataTable<TreatmentPackage>
            columns={[
              { key: 'name', header: 'Package', render: (p) => <span className="text-sm font-medium">{p.name}</span> },
              { key: 'sessions', header: 'Sessions', render: (p) => <span className="text-sm">{p.sessions_count}</span> },
              { key: 'price', header: 'Price', render: (p) => <span className="text-sm font-medium">{formatCurrency(p.price)}</span> },
              { key: 'gst', header: 'GST', render: (p) => <span className="text-sm">{p.gst_rate}%</span>, hideOnMobile: true },
              {
                key: 'active',
                header: 'Status',
                render: (p) => <Badge variant={p.is_active ? 'default' : 'secondary'}>{p.is_active ? 'Active' : 'Inactive'}</Badge>,
              },
              {
                key: 'actions',
                header: '',
                render: (p) => (
                  <Button variant="ghost" size="icon" aria-label="Edit package" onClick={() => setEditing(p)}>
                    <Pencil className="h-4 w-4" />
                  </Button>
                ),
                className: 'text-right',
              },
            ]}
            rows={query.data ?? []}
            loading={query.isLoading}
            keyField={(p) => p.id}
            emptyTitle="No packages yet"
            emptyDescription="Create a treatment package to use while invoicing."
          />
        </CardContent>
      </Card>

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>New package</DialogTitle>
            <DialogDescription>Create a reusable treatment package.</DialogDescription>
          </DialogHeader>
          <PackageForm
            onSuccess={() => {
              setCreateOpen(false)
              queryClient.invalidateQueries({ queryKey: ['packages'] })
            }}
          />
        </DialogContent>
      </Dialog>

      <Dialog open={!!editing} onOpenChange={(open) => { if (!open) setEditing(null) }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit package</DialogTitle>
            <DialogDescription>Update the treatment package details.</DialogDescription>
          </DialogHeader>
          <PackageForm
            packageId={editing?.id}
            defaultValues={{
              name: editing?.name,
              description: editing?.description ?? '',
              sessions_count: editing?.sessions_count,
              price: editing?.price,
              gst_rate: editing?.gst_rate,
              is_active: editing?.is_active,
            }}
            onSuccess={() => {
              setEditing(null)
              queryClient.invalidateQueries({ queryKey: ['packages'] })
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
