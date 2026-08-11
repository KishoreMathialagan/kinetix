import uuid
from decimal import Decimal

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.billing import Invoice, InvoiceItem, Payment, TreatmentPackage
from app.models.enums import InvoiceStatus, NotificationType, PaymentStatus
from app.models.profiles import TherapistAssignment
from app.repositories.billing_repository import billing_repo, payment_repo, treatment_package_repo
from app.repositories.patient_repository import patient_repo
from app.repositories.therapist_repository import therapist_repo
from app.schemas.billing import (
    InvoiceCreate,
    InvoiceItemCreate,
    InvoiceUpdate,
    PaymentCreate,
    TreatmentPackageCreate,
    TreatmentPackageUpdate,
)
from app.services.auth.auth_service import auth_service
from app.services.communication.notification_service import notification_service
from app.utils.datetime import utc_now


def _money(value: Decimal | float) -> Decimal:
    return Decimal(str(value)).quantize(Decimal("0.01"))


class BillingService:
    async def create_invoice(
        self, db: AsyncSession, *, request: InvoiceCreate, current_user_id: uuid.UUID
    ) -> Invoice:
        patient = await patient_repo.get(db, id=request.patient_id)
        if not patient:
            raise ValueError("Patient not found.")

        therapist_id = request.therapist_id
        if not therapist_id:
            actor_therapist = await self._user_therapist_id(db, current_user_id)
            if actor_therapist:
                therapist_id = actor_therapist
            else:
                assignment = (
                    await db.execute(
                        TherapistAssignment.__table__.select()
                        .where(
                            TherapistAssignment.patient_id == request.patient_id,
                            TherapistAssignment.status == "active",
                        )
                        .limit(1)
                    )
                ).first()
                therapist_id = uuid.UUID(str(assignment.therapist_id)) if assignment else None
        if therapist_id and not await therapist_repo.get(db, id=therapist_id):
            raise ValueError("Therapist not found.")

        items: list[InvoiceItemCreate] = []
        gst_rate = _money(request.gst_rate)
        package: TreatmentPackage | None = None
        if request.package_id:
            package = await treatment_package_repo.get(db, id=request.package_id)
            if not package or not package.is_active:
                raise ValueError("Treatment package not found or inactive.")
            gst_rate = _money(package.gst_rate)
            if not request.items:
                items = [InvoiceItemCreate(description=package.name, quantity=1, unit_price=package.price)]

        if request.items:
            items = request.items
        if not items:
            raise ValueError("At least one invoice item or a package is required.")

        subtotal = _money(sum(_money(i.quantity) * _money(i.unit_price) for i in items))
        tax = _money(subtotal * gst_rate / Decimal(100))
        total = subtotal + tax
        invoice_number = await billing_repo.next_invoice_number(db)

        try:
            invoice = Invoice(
                patient_id=request.patient_id,
                therapist_id=therapist_id,
                appointment_id=request.appointment_id,
                package_id=request.package_id,
                invoice_number=invoice_number,
                package=package.name if package else None,
                subtotal=subtotal,
                gst_rate=gst_rate,
                tax=tax,
                total=total,
                due_date=request.due_date,
                notes=request.notes,
                status=request.status,
                issued_at=utc_now() if request.status != InvoiceStatus.DRAFT else None,
                created_by=current_user_id,
            )
            db.add(invoice)
            await db.flush()
            for item_in in items:
                db.add(
                    InvoiceItem(
                        invoice_id=invoice.id,
                        description=item_in.description,
                        quantity=item_in.quantity,
                        unit_price=_money(item_in.unit_price),
                        amount=_money(_money(item_in.quantity) * _money(item_in.unit_price)),
                    )
                )
            await auth_service.log_audit_event(
                db, user_id=current_user_id, action="invoice_created",
                entity="invoice", entity_id=str(invoice.id), new_value=str(invoice.total),
            )
            await db.commit()
            invoice = await billing_repo.get(db, id=invoice.id)
        except Exception as exc:
            await db.rollback()
            raise ValueError(f"Failed to create invoice: {exc!s}")

        await self._notify_patient(
            db,
            patient_id=request.patient_id,
            title=f"Invoice {invoice.invoice_number} issued",
            body=f"A new invoice of Rs. {invoice.total} has been issued.",
        )
        return invoice

    async def update_invoice(
        self, db: AsyncSession, *, invoice_id: uuid.UUID,
        request: InvoiceUpdate, current_user_id: uuid.UUID
    ) -> Invoice:
        invoice = await billing_repo.get(db, id=invoice_id)
        if not invoice:
            raise ValueError("Invoice not found.")
        updates = request.model_dump(exclude_unset=True)
        status_changed = "status" in updates and updates["status"] != invoice.status
        try:
            updated = await billing_repo.update(db, db_obj=invoice, obj_in=updates)
            action = "invoice_cancelled" if updates.get("status") == InvoiceStatus.CANCELLED.value else "invoice_updated"
            await auth_service.log_audit_event(
                db, user_id=current_user_id, action=action,
                entity="invoice", entity_id=str(invoice_id),
                new_value=str(updated.status) if status_changed else None,
            )
            return updated
        except Exception as exc:
            await db.rollback()
            raise ValueError(f"Failed to update invoice: {exc!s}")

    async def record_payment(
        self, db: AsyncSession, *, request: PaymentCreate, current_user_id: uuid.UUID
    ) -> Payment:
        invoice = await billing_repo.get(db, id=request.invoice_id)
        if not invoice:
            raise ValueError("Invoice not found.")
        if invoice.status == InvoiceStatus.CANCELLED.value:
            raise ValueError("Cannot record a payment on a cancelled invoice.")

        paid_at = request.paid_at or utc_now()
        payment = Payment(
            billing_id=invoice.id,
            payment_method=request.payment_method.value,
            transaction_reference=request.transaction_reference,
            amount=_money(request.amount),
            paid_at=paid_at,
            status=PaymentStatus.COMPLETED,
            created_by=current_user_id,
        )
        try:
            db.add(payment)
            await db.flush()
            paid_total = await billing_repo.paid_total(db, invoice_id=invoice.id)
            if paid_total >= invoice.total:
                invoice.status = InvoiceStatus.PAID.value
            elif paid_total > 0:
                invoice.status = InvoiceStatus.PARTIALLY_PAID.value
            await auth_service.log_audit_event(
                db, user_id=current_user_id, action="payment_recorded",
                entity="payment", entity_id=str(payment.id),
                new_value=str(payment.amount),
            )
            await db.commit()
            await db.refresh(payment)
        except Exception as exc:
            await db.rollback()
            raise ValueError(f"Failed to record payment: {exc!s}")

        await self._notify_patient(
            db,
            patient_id=invoice.patient_id,
            title="Payment received",
            body=f"Payment of Rs. {payment.amount} received against invoice {invoice.invoice_number}.",
        )
        return payment

    async def receipt(self, db: AsyncSession, *, invoice_id: uuid.UUID) -> dict:
        invoice = await billing_repo.get(db, id=invoice_id)
        if not invoice:
            raise ValueError("Invoice not found.")
        payments = await payment_repo.list_for_invoice(db, invoice_id=invoice_id)
        paid_total = await billing_repo.paid_total(db, invoice_id=invoice_id)
        return {
            "invoice": invoice,
            "payments": payments,
            "paid_total": float(paid_total),
            "balance_due": round(float(invoice.total) - float(paid_total), 2),
        }

    async def create_package(
        self, db: AsyncSession, *, request: TreatmentPackageCreate, current_user_id: uuid.UUID
    ) -> TreatmentPackage:
        package = TreatmentPackage(**request.model_dump(), created_by=current_user_id)
        saved = await treatment_package_repo.create(db, obj_in=package)
        await auth_service.log_audit_event(
            db, user_id=current_user_id, action="package_created",
            entity="treatment_package", entity_id=str(saved.id),
        )
        return saved

    async def update_package(
        self, db: AsyncSession, *, package_id: uuid.UUID,
        request: TreatmentPackageUpdate, current_user_id: uuid.UUID
    ) -> TreatmentPackage:
        package = await treatment_package_repo.get(db, id=package_id)
        if not package:
            raise ValueError("Treatment package not found.")
        updated = await treatment_package_repo.update(
            db, db_obj=package, obj_in=request.model_dump(exclude_unset=True)
        )
        await auth_service.log_audit_event(
            db, user_id=current_user_id, action="package_updated",
            entity="treatment_package", entity_id=str(package_id),
        )
        return updated

    async def delete_package(
        self, db: AsyncSession, *, package_id: uuid.UUID, current_user_id: uuid.UUID
    ) -> None:
        package = await treatment_package_repo.delete(db, id=package_id)
        if not package:
            raise ValueError("Treatment package not found.")
        await auth_service.log_audit_event(
            db, user_id=current_user_id, action="package_deleted",
            entity="treatment_package", entity_id=str(package_id),
        )

    @staticmethod
    async def _user_therapist_id(db: AsyncSession, user_id: uuid.UUID) -> uuid.UUID | None:
        therapist = await therapist_repo.get_by_user_id(db, user_id=user_id)
        return therapist.id if therapist else None

    async def _notify_patient(
        self, db: AsyncSession, *, patient_id: uuid.UUID, title: str, body: str
    ) -> None:
        patient = await patient_repo.get(db, id=patient_id)
        if not patient:
            return
        await notification_service.notify(
            db, user_id=patient.user_id, title=title, body=body,
            notification_type=NotificationType.IN_APP,
        )


billing_service = BillingService()
