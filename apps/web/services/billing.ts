import type {
  Invoice,
  InvoiceCreate,
  InvoiceUpdate,
  Paginated,
  Payment,
  PaymentCreate,
  Receipt,
  TreatmentPackage,
  TreatmentPackageCreate,
  TreatmentPackageUpdate,
} from '@kinetix/shared-types'
import { buildQueryString } from '@kinetix/utils'
import { apiDelete, apiGet, apiPatch, apiPost, apiPut } from '@/lib/api-client'

export interface InvoiceListParams {
  patient_id?: string
  status?: string
  page?: number
  size?: number
}

export interface PaymentListParams {
  invoice_id?: string
  page?: number
  size?: number
}

export function listInvoices(params: InvoiceListParams = {}) {
  return apiGet<Paginated<Invoice>>(`/billing${buildQueryString(params)}`)
}

export function createInvoice(payload: InvoiceCreate) {
  return apiPost<Invoice>('/billing', payload)
}

export function getInvoice(invoiceId: string) {
  return apiGet<Invoice>(`/billing/${invoiceId}`)
}

export function updateInvoice(invoiceId: string, payload: InvoiceUpdate) {
  return apiPatch<Invoice>(`/billing/${invoiceId}`, payload)
}

export function getReceipt(invoiceId: string) {
  return apiGet<Receipt>(`/billing/${invoiceId}/receipt`)
}

export function recordPayment(payload: PaymentCreate) {
  return apiPost<Payment>('/payments', payload)
}

export function listPayments(params: PaymentListParams = {}) {
  return apiGet<Paginated<Payment>>(`/payments${buildQueryString(params)}`)
}

export function listPackages() {
  return apiGet<TreatmentPackage[]>('/billing/packages')
}

export function getPackage(packageId: string) {
  return apiGet<TreatmentPackage>(`/billing/packages/${packageId}`)
}

export function createPackage(payload: TreatmentPackageCreate) {
  return apiPost<TreatmentPackage>('/billing/packages', payload)
}

export function updatePackage(packageId: string, payload: TreatmentPackageUpdate) {
  return apiPut<TreatmentPackage>(`/billing/packages/${packageId}`, payload)
}

export function deletePackage(packageId: string) {
  return apiDelete<void>(`/billing/packages/${packageId}`)
}
