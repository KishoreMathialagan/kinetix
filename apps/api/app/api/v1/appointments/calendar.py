import uuid
from datetime import date
from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.roles import require_role
from app.models.core import User
from app.schemas.appointments.calendar import CalendarResponse
from app.services.appointments.calendar_service import calendar_service

router = APIRouter()

@router.get("", response_model=CalendarResponse, summary="Get Calendar", description="Fetch aggregated calendar view (Daily, Weekly, Monthly) for a specific patient or therapist.")
async def get_calendar(
    start_date: date,
    end_date: date,
    patient_id: uuid.UUID | None = None,
    therapist_id: uuid.UUID | None = None,
    current_user: Annotated[User, Depends(require_role(["admin", "therapist", "patient"]))] = None,
    db: AsyncSession = Depends(get_db)
):
    if (end_date - start_date).days > 60:
        raise HTTPException(status_code=400, detail="Calendar range cannot exceed 60 days.")
        
    return await calendar_service.get_calendar(db, start_date=start_date, end_date=end_date, therapist_id=therapist_id, patient_id=patient_id)
