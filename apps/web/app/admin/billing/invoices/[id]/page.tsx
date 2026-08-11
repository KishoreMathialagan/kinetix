'use client'

import { useState } from 'react'
import { useParams } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { CreditCard } from 'lucide-react'
import {
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
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  toast,
} from '@kinetix/ui'
import { PageHeader } from '@kinetix/ui'
import { getInvoice, getReceipt, recordPayment } from '@/services/billing'
import { useNameLookup } from '@/lib/names'
import { toApiError } from '@/lib/api-client'
import { formatCurrency, formatDateTime } from '@kinetix/utils'
import type { PaymentMethod } from '@kinetix/shared-types'

const statusVariant: Record<string, 'default' | 'secondary' | 'destructive' | 'outline'> = {
  draft: 'secondary',
  issued: 'default',
  partially_paid: 'default',
  paid: 'outline',
  overdue: 'destructive',
  cancelled: 'destructive',
}

const methods: PaymentMethod[] = ['cash', 'card', 'upi', 'bank_transfer']

function Field({ label, value }: { label: string; value?: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</dt>
      <dd className="mt-1 text-sm">{value ?? '—'}</dd>
    </div>
  )
}

export default function AdminInvoiceDetailPage() {
  const params = useParams<{ id: string }>()
  const queryClient = useQueryClient()
  const { patientName, patientEmail } = useNameLookup()
  const [payOpen, setPayOpen] = useState(false)
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState<PaymentMethod>('cash')
  const [reference, setReference] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const invoiceQuery = useQuery({
    queryKey: ['invoices', params.id],
    queryFn: () => getInvoice(params.id),
    enabled: !!params.id,
  })

  const receiptQuery = useQuery({
    queryKey: ['invoices', params.id, 'receipt'],
    queryFn: () => getReceipt(params.id),
    enabled: !!params.id,
  })

  const invoice = invoiceQuery.data
  const receipt = receiptQuery.data

  async function handlePayment() {
    setSubmitting(true)
    try {
      await recordPayment({
        invoice_id: params.id,
        amount: Number(amount),
        payment_method: method,
        transaction_reference: reference || null,
      })
      toast.success('Payment recorded')
      setPayOpen(false)
      setAmount('')
      setReference('')
      queryClient.invalidateQueries({ queryKey: ['invoices'] })
      queryClient.invalidateQueries({ queryKey: ['payments'] })
    } catch (error) {
      toast.error(toApiError(error).message)
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="space-y-6">
      {invoiceQuery.isLoading ? (
        <Skeleton className="h-24 w-full" />
      ) : (
        <PageHeader
          title={invoice?.invoice_number ?? 'Invoice'}
          description={`Issued ${invoice?.issued_at ? formatDateTime(invoice.issued_at) : '—'}`}
          actions={
            <>
              {invoice && !['paid', 'cancelled'].includes(invoice.status) && (
                <Button onClick={() => setPayOpen(true)}>
                  <CreditCard className="mr-2 h-4 w-4" /> Record payment
                </Button>
              )}
            </>
          }
        />
      )}

      <div className="grid gap-6 lg:grid-cols-3">
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Line items</CardTitle>
          </CardHeader>
          <CardContent className="p-0">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Description</TableHead>
                  <TableHead className="text-right">Qty</TableHead>
                  <TableHead className="text-right">Unit price</TableHead>
                  <TableHead className="text-right">Amount</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoice?.items.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell className="text-sm">{item.description}</TableCell>
                    <TableCell className="text-right text-sm">{item.quantity}</TableCell>
                    <TableCell className="text-right text-sm">{formatCurrency(item.unit_price)}</TableCell>
                    <TableCell className="text-right text-sm font-medium">{formatCurrency(item.amount)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardContent className="space-y-1 pt-4 text-sm">
            <div className="flex justify-between"><span className="text-muted-foreground">Subtotal</span><span>{formatCurrency(invoice?.subtotal ?? 0)}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">GST ({invoice?.gst_rate}%)</span><span>{formatCurrency(invoice?.tax ?? 0)}</span></div>
            <div className="flex justify-between border-t border-border pt-1 text-base font-bold"><span>Total</span><span>{formatCurrency(invoice?.total ?? 0)}</span></div>
          </CardContent>
        </Card>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Details</CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-4">
                <Field label="Status" value={invoice ? <Badge variant={statusVariant[invoice.status]}>{invoice.status.replace(/_/g, ' ')}</Badge> : undefined} />
                <Field label="Patient" value={invoice ? patientName(invoice.patient_id) : undefined} />
                <Field label="Patient email" value={invoice ? patientEmail(invoice.patient_id) : undefined} />
                <Field label="Due date" value={invoice?.due_date ?? undefined} />
                <Field label="Notes" value={invoice?.notes} />
              </dl>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Payments</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Paid</span>
                <span className="font-medium text-primary">{formatCurrency(receipt?.paid_total ?? 0)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Balance due</span>
                <span className="font-medium">{formatCurrency(receipt?.balance_due ?? 0)}</span>
              </div>
              <div className="space-y-2 border-t border-border pt-3">
                {receipt?.payments.length === 0 && <p className="text-sm text-muted-foreground">No payments recorded yet.</p>}
                {receipt?.payments.map((payment) => (
                  <div key={payment.id} className="flex items-center justify-between rounded-lg bg-muted p-2 text-sm">
                    <div>
                      <p className="font-medium">{formatCurrency(payment.amount)}</p>
                      <p className="text-xs capitalize text-muted-foreground">{payment.payment_method.replace(/_/g, ' ')} · {payment.transaction_reference ?? '—'}</p>
                    </div>
                    <span className="text-xs text-muted-foreground">{payment.paid_at ? formatDateTime(payment.paid_at) : '—'}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <Dialog open={payOpen} onOpenChange={setPayOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Record payment</DialogTitle>
            <DialogDescription>Record a payment against this invoice.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="pay-amount">Amount (₹)</Label>
              <Input id="pay-amount" type="number" min={0} step="0.01" placeholder={String(receipt?.balance_due ?? 0)} value={amount} onChange={(e) => setAmount(e.target.value)} />
            </div>
            <div className="space-y-2">
              <Label>Payment method</Label>
              <Select value={method} onValueChange={(v) => setMethod(v as PaymentMethod)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {methods.map((m) => (
                    <SelectItem key={m} value={m}>
                      {m.replace(/_/g, ' ')}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="pay-ref">Transaction reference</Label>
              <Input id="pay-ref" placeholder="Optional reference" value={reference} onChange={(e) => setReference(e.target.value)} />
            </div>
            <Button className="w-full" disabled={!amount || Number(amount) <= 0 || submitting} onClick={handlePayment}>
              Record payment
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
