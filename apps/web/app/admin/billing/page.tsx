'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronRight, FilePlus2, Package } from 'lucide-react'
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@kinetix/ui'
import { PageHeader } from '@kinetix/ui'
import { DataTable, type DataTableColumn } from '@/components/data-table'
import { InvoiceForm } from '@/components/forms/invoice-form'
import { listInvoices } from '@/services/billing'
import { useNameLookup } from '@/lib/names'
import { formatCurrency, formatDate } from '@kinetix/utils'
import type { Invoice, InvoiceStatus } from '@kinetix/shared-types'
import Link from 'next/link'

const statuses: (InvoiceStatus | '')[] = ['', 'draft', 'issued', 'partially_paid', 'paid', 'overdue', 'cancelled']

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  issued: 'default',
  partially_paid: 'default',
  paid: 'outline',
  overdue: 'destructive',
  cancelled: 'destructive',
}

export default function AdminBillingPage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const [status, setStatus] = useState<InvoiceStatus | ''>('')
  const [page, setPage] = useState(1)
  const [createOpen, setCreateOpen] = useState(false)
  const { patientName } = useNameLookup()

  const query = useQuery({
    queryKey: ['invoices', 'admin', status, page],
    queryFn: () =>
      listInvoices({
        status: status || undefined,
        page,
        size: 10,
      }),
  })

  const columns: DataTableColumn<Invoice>[] = [
    {
      key: 'number',
      header: 'Invoice',
      render: (i) => <span className="font-mono text-xs font-medium">{i.invoice_number}</span>,
    },
    {
      key: 'patient',
      header: 'Patient',
      render: (i) => <span className="text-sm">{patientName(i.patient_id)}</span>,
    },
    {
      key: 'total',
      header: 'Amount',
      render: (i) => <span className="text-sm font-medium">{formatCurrency(i.total)}</span>,
    },
    {
      key: 'due',
      header: 'Due date',
      render: (i) => <span className="text-sm text-muted-foreground">{i.due_date ? formatDate(i.due_date) : '—'}</span>,
      hideOnMobile: true,
    },
    {
      key: 'status',
      header: 'Status',
      render: (i) => <Badge variant={statusVariant[i.status] ?? 'secondary'}>{i.status.replace(/_/g, ' ')}</Badge>,
    },
    {
      key: 'actions',
      header: '',
      render: () => <ChevronRight className="h-4 w-4 text-muted-foreground" />,
      className: 'text-right',
    },
  ]

  return (
    <div className="space-y-6">
      <PageHeader
        title="Billing"
        description="Invoices, payments and treatment packages"
        actions={
          <>
            <Button variant="outline" asChild>
              <Link href="/admin/billing/packages">
                <Package className="mr-2 h-4 w-4" /> Packages
              </Link>
            </Button>
            <Button onClick={() => setCreateOpen(true)}>
              <FilePlus2 className="mr-2 h-4 w-4" /> New invoice
            </Button>
          </>
        }
      />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <Select value={status} onValueChange={(v) => { setStatus(v as InvoiceStatus | ''); setPage(1) }}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
          <SelectContent>
            {statuses.map((s) => (
              <SelectItem key={s} value={s}>
                {s === '' ? 'All statuses' : s.replace(/_/g, ' ')}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <DataTable<Invoice>
        columns={columns}
        rows={query.data?.items ?? []}
        loading={query.isLoading}
        page={page}
        pageSize={10}
        total={query.data?.total}
        onPageChange={setPage}
        onRowClick={(i) => router.push(`/admin/billing/invoices/${i.id}`)}
        keyField={(i) => i.id}
        emptyTitle="No invoices found"
        emptyDescription="Create an invoice to get started."
      />
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>New invoice</DialogTitle>
            <DialogDescription>Create an invoice for a patient.</DialogDescription>
          </DialogHeader>
          <InvoiceForm
            onSuccess={() => {
              setCreateOpen(false)
              queryClient.invalidateQueries({ queryKey: ['invoices'] })
            }}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
