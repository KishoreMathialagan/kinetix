from typing import Any
import uuid
from datetime import date

from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app.models.billing import Invoice, Payment, TreatmentPackage
from app.models.enums import InvoiceStatus
from app.repositories.base import BaseRepository
from app.utils.pagination import PaginatedResponse, paginate


class TreatmentPackageRepository(BaseRepository[TreatmentPackage]):
    def __init__(self):
        super().__init__(TreatmentPackage)

    async def list_active(
        self, db: AsyncSession, *, include_inactive: bool = False
    ) -> list[TreatmentPackage]:
        stmt = select(TreatmentPackage).where(TreatmentPackage.is_deleted == False)
        if not include_inactive:
            stmt = stmt.where(TreatmentPackage.is_active == True)
        stmt = stmt.order_by(TreatmentPackage.created_at.desc())
        result = await db.execute(stmt)
        return list(result.scalars().all())


class BillingRepository(BaseRepository[Invoice]):
    def __init__(self):
        super().__init__(Invoice)

    async def get(self, db: AsyncSession, id: uuid.UUID, load_options: list | None = None) -> Invoice | None:
        options = [selectinload(Invoice.items), selectinload(Invoice.payments)]
        if load_options:
            options.extend(load_options)
        return await super().get(db, id=id, load_options=options)

    async def list_invoices(
        self,
        db: AsyncSession,
        *,
        patient_id: uuid.UUID | None = None,
        therapist_id: uuid.UUID | None = None,
        status: InvoiceStatus | None = None,
        page: int = 1,
        size: int = 20,
    ) -> PaginatedResponse[Any]:
        stmt = select(Invoice).options(
            selectinload(Invoice.items), selectinload(Invoice.payments)
        ).where(Invoice.is_deleted == False)
        if patient_id:
            stmt = stmt.where(Invoice.patient_id == patient_id)
        if therapist_id:
            stmt = stmt.where(Invoice.therapist_id == therapist_id)
        if status:
            stmt = stmt.where(Invoice.status == status.value)

        count_stmt = select(func.count()).select_from(stmt.subquery())
        total = (await db.execute(count_stmt)).scalar() or 0
        stmt = stmt.order_by(Invoice.created_at.desc()).offset((page - 1) * size).limit(size)
        items = list((await db.execute(stmt)).scalars().all())
        return paginate(items, total, page, size)

    async def next_invoice_number(self, db: AsyncSession) -> str:
        count_stmt = select(func.count()).select_from(Invoice)
        total = (await db.execute(count_stmt)).scalar() or 0
        year = date.today().year
        return f"INV-{year}-{total + 1:05d}"

    async def paid_total(self, db: AsyncSession, *, invoice_id: uuid.UUID) -> float:
        stmt = select(func.coalesce(func.sum(Payment.amount), 0)).where(
            Payment.billing_id == invoice_id,
            Payment.is_deleted == False,
            Payment.status == "completed",
        )
        return float((await db.execute(stmt)).scalar() or 0)


class PaymentRepository(BaseRepository[Payment]):
    def __init__(self):
        super().__init__(Payment)

    async def list_for_invoice(
        self, db: AsyncSession, *, invoice_id: uuid.UUID
    ) -> list[Payment]:
        stmt = (
            select(Payment)
            .where(Payment.billing_id == invoice_id, Payment.is_deleted == False)
            .order_by(Payment.paid_at.desc(), Payment.created_at.desc())
        )
        result = await db.execute(stmt)
        return list(result.scalars().all())


billing_repo = BillingRepository()
payment_repo = PaymentRepository()
treatment_package_repo = TreatmentPackageRepository()
