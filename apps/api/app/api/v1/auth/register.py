from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.schemas.auth import RegisterRequest
from app.services.auth.registration_service import registration_service

router = APIRouter()


@router.post("/register", status_code=status.HTTP_201_CREATED, summary="Register a new patient account", description="Public self-service registration. Creates a patient user and returns a registration OTP (delivery simulated in development).")
async def register(request: RegisterRequest, db: AsyncSession = Depends(get_db)):
    try:
        user, otp_code = await registration_service.register(db, request=request)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {
        "user_id": str(user.id),
        "email": user.email,
        "message": "Registration pending OTP verification.",
        "otp": otp_code,
    }