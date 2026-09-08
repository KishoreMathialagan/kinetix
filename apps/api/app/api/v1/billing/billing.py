from typing import Any
import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.ownership import require_ownership
from app.dependencies.roles import require_role
from app.models.billing import Invoice
from app.models.core import User
from app.models.enums import InvoiceStatus
from app.repositories.billing_repository import billing_repo, payment_repo
from app.repositories.patient_repository import patient_repo
from app.repositories.therapist_repository import therapist_repo
from app.schemas.billing import (
    InvoiceCreate,
    InvoiceResponse,
    InvoiceUpdate,
    PaymentCreate,
    PaymentResponse,
    ReceiptResponse,
)
from app.services.billing.billing_service import billing_service
from app.utils.pagination import PaginatedResponse, paginate

router = APIRouter()


@router.get("/billing", summary="List invoices", description="List invoices with optional filters. Patients and therapists only see their own scope.")
async def list_invoices(
    status_filter: InvoiceStatus | None = None,
    patient_id: uuid.UUID | None = None,
    page: int = 1,
    size: int = 20,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role and current_user.role.name == "patient":
        actor_patient = await patient_repo.get_by_user_id(db, user_id=current_user.id)
        if not actor_patient:
            raise HTTPException(status_code=404, detail="Patient profile not found")
        return await billing_repo.list_invoices(
            db, patient_id=actor_patient.id, status=status_filter, page=page, size=size
        )
    if current_user.role and current_user.role.name == "therapist":
        actor_therapist = await therapist_repo.get_by_user_id(db, user_id=current_user.id)
        if not actor_therapist:
            raise HTTPException(status_code=404, detail="Therapist profile not found")
        return await billing_repo.list_invoices(
            db, therapist_id=actor_therapist.id, status=status_filter, page=page, size=size
        )
    return await billing_repo.list_invoices(
        db, patient_id=patient_id, status=status_filter, page=page, size=size
    )


@router.post("/billing", response_model=InvoiceResponse, status_code=status.HTTP_201_CREATED, summary="Create an invoice", description="Create an invoice with line items and automatic GST calculation.")
async def create_invoice(
    request: InvoiceCreate,
    current_user: User = Depends(require_role(["admin", "therapist"])),
    db: AsyncSession = Depends(get_db),
):
    if current_user.role and current_user.role.name == "therapist":
        actor_therapist = await therapist_repo.get_by_user_id(db, user_id=current_user.id)
        if not actor_therapist:
            raise HTTPException(status_code=404, detail="Therapist profile not found")
        if request.therapist_id and request.therapist_id != actor_therapist.id:
            raise HTTPException(status_code=403, detail="Therapists can only bill for themselves")
        request = request.model_copy(update={"therapist_id": actor_therapist.id})
    try:
        return await billing_service.create_invoice(db, request=request, current_user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/billing/{invoice_id}", response_model=InvoiceResponse, summary="Get an invoice", description="Fetch a single invoice with its items and payments.")
async def get_invoice(
    invoice_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    owner: User = Depends(require_ownership(Invoice, "invoice_id")),
    db: AsyncSession = Depends(get_db),
):
    invoice = await billing_repo.get(db, id=invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    return invoice


@router.patch("/billing/{invoice_id}", response_model=InvoiceResponse, summary="Update an invoice", description="Update invoice status, due date or notes (admin only).")
async def update_invoice(
    invoice_id: uuid.UUID,
    request: InvoiceUpdate,
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await billing_service.update_invoice(
            db, invoice_id=invoice_id, request=request, current_user_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/billing/{invoice_id}/receipt", response_model=ReceiptResponse, summary="Get an invoice receipt", description="Receipt payload with payment summary and balance due.")
async def get_receipt(
    invoice_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    owner: User = Depends(require_ownership(Invoice, "invoice_id")),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await billing_service.receipt(db, invoice_id=invoice_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.post("/payments", response_model=PaymentResponse, status_code=status.HTTP_201_CREATED, summary="Record a payment", description="Record a payment against an invoice. The invoice status advances to partially paid or paid automatically.")
async def record_payment(
    request: PaymentCreate,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    db: AsyncSession = Depends(get_db),
):
    invoice = await billing_repo.get(db, id=request.invoice_id)
    if not invoice:
        raise HTTPException(status_code=404, detail="Invoice not found")
    if current_user.role and current_user.role.name == "patient":
        actor_patient = await patient_repo.get_by_user_id(db, user_id=current_user.id)
        if not actor_patient or actor_patient.id != invoice.patient_id:
            raise HTTPException(status_code=403, detail="You do not have access to this invoice")
    if current_user.role and current_user.role.name == "therapist":
        actor_therapist = await therapist_repo.get_by_user_id(db, user_id=current_user.id)
        if not actor_therapist or actor_therapist.id != invoice.therapist_id:
            raise HTTPException(status_code=403, detail="You do not have access to this invoice")
    try:
        return await billing_service.record_payment(db, request=request, current_user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/payments", summary="List payments", description="List payments. Admins see all; scope to an invoice with ?invoice_id=.")
async def list_payments(
    invoice_id: uuid.UUID | None = None,
    page: int = 1,
    size: int = 20,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    db: AsyncSession = Depends(get_db),
):
    if invoice_id:
        invoice = await billing_repo.get(db, id=invoice_id)
        if not invoice:
            raise HTTPException(status_code=404, detail="Invoice not found")
        if current_user.role and current_user.role.name == "patient":
            actor_patient = await patient_repo.get_by_user_id(db, user_id=current_user.id)
            if not actor_patient or actor_patient.id != invoice.patient_id:
                raise HTTPException(status_code=403, detail="You do not have access to this invoice")
        if current_user.role and current_user.role.name == "therapist":
            actor_therapist = await therapist_repo.get_by_user_id(db, user_id=current_user.id)
            if not actor_therapist or actor_therapist.id != invoice.therapist_id:
                raise HTTPException(status_code=403, detail="You do not have access to this invoice")
        items = await payment_repo.list_for_invoice(db, invoice_id=invoice_id)
        return paginate(items, len(items), 1, size)
    if current_user.role and current_user.role.name != "admin":
        raise HTTPException(status_code=403, detail="Only admins can list all payments")
    items = await payment_repo.get_multi(db, skip=(page - 1) * size, limit=size)
    return paginate(items, len(items), page, size)
