import uuid
from datetime import date, datetime

from pydantic import BaseModel, Field

from app.models.enums import InvoiceStatus, PaymentMethod


class InvoiceItemCreate(BaseModel):
    description: str = Field(min_length=1, max_length=255)
    quantity: int = Field(default=1, ge=1)
    unit_price: float = Field(ge=0)


class InvoiceItemResponse(BaseModel):
    id: uuid.UUID
    invoice_id: uuid.UUID
    description: str
    quantity: int
    unit_price: float
    amount: float

    class Config:
        from_attributes = True


class InvoiceCreate(BaseModel):
    patient_id: uuid.UUID
    therapist_id: uuid.UUID | None = None
    appointment_id: uuid.UUID | None = None
    package_id: uuid.UUID | None = None
    items: list[InvoiceItemCreate] = []
    gst_rate: float = Field(default=18.0, ge=0, le=100)
    due_date: date | None = None
    notes: str | None = None
    status: InvoiceStatus = InvoiceStatus.ISSUED


class InvoiceUpdate(BaseModel):
    due_date: date | None = None
    notes: str | None = None
    status: InvoiceStatus | None = None


class InvoiceResponse(BaseModel):
    id: uuid.UUID
    patient_id: uuid.UUID
    therapist_id: uuid.UUID | None = None
    appointment_id: uuid.UUID | None = None
    package_id: uuid.UUID | None = None
    invoice_number: str
    package: str | None = None
    subtotal: float
    gst_rate: float
    tax: float
    total: float
    due_date: date | None = None
    issued_at: datetime | None = None
    status: str
    notes: str | None = None
    items: list[InvoiceItemResponse] = []
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class PaymentCreate(BaseModel):
    invoice_id: uuid.UUID
    amount: float = Field(gt=0)
    payment_method: PaymentMethod
    transaction_reference: str | None = Field(default=None, max_length=100)
    paid_at: datetime | None = None


class PaymentResponse(BaseModel):
    id: uuid.UUID
    billing_id: uuid.UUID
    payment_method: str
    transaction_reference: str | None = None
    amount: float
    paid_at: datetime | None = None
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class ReceiptResponse(BaseModel):
    invoice: InvoiceResponse
    payments: list[PaymentResponse]
    paid_total: float
    balance_due: float

    class Config:
        from_attributes = True


class TreatmentPackageCreate(BaseModel):
    name: str = Field(min_length=1, max_length=255)
    description: str | None = None
    sessions_count: int = Field(default=1, ge=1)
    price: float = Field(ge=0)
    gst_rate: float = Field(default=18.0, ge=0, le=100)
    is_active: bool = True


class TreatmentPackageUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=255)
    description: str | None = None
    sessions_count: int | None = Field(default=None, ge=1)
    price: float | None = Field(default=None, ge=0)
    gst_rate: float | None = Field(default=None, ge=0, le=100)
    is_active: bool | None = None


class TreatmentPackageResponse(BaseModel):
    id: uuid.UUID
    name: str
    description: str | None = None
    sessions_count: int
    price: float
    gst_rate: float
    is_active: bool
    created_at: datetime

    class Config:
        from_attributes = True
