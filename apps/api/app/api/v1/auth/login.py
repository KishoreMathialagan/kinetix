from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.models.core import User
from app.repositories.auth_repository import refresh_token_repo
from app.schemas.auth import LoginRequest, RefreshTokenRequest, TokenResponse
from app.services.auth.auth_service import auth_service
from app.services.auth.token_service import token_service

router = APIRouter()

@router.post("/login", response_model=TokenResponse)
async def login(request: LoginRequest, db: AsyncSession = Depends(get_db)):
    user = await auth_service.authenticate_user(db, email=request.email, password=request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )
    
    permissions = []
    if user.role:
        permissions = [f"{p.module}.{p.action}" for p in user.role.permissions]

    access_token = token_service.create_access_token(user, permissions)
    refresh_token = await token_service.create_refresh_token(db, user_id=user.id)
    
    from app.config.settings import settings
    return TokenResponse(
        access_token=access_token,
        refresh_token=refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )

@router.post("/refresh", response_model=TokenResponse)
async def refresh_token(request: RefreshTokenRequest, db: AsyncSession = Depends(get_db)):
    token_obj = await token_service.verify_refresh_token(db, raw_token=request.refresh_token)
    if not token_obj:
        raise HTTPException(status_code=401, detail="Invalid or expired refresh token")
        
    user = await db.get(User, token_obj.user_id)
    if not user or not user.is_active:
        raise HTTPException(status_code=401, detail="User inactive or deleted")
        
    permissions = []
    if user.role:
        permissions = [f"{p.module}.{p.action}" for p in user.role.permissions]
        
    access_token = token_service.create_access_token(user, permissions)
    new_refresh_token = await token_service.create_refresh_token(db, user_id=user.id)
    
    # Revoke old token
    await refresh_token_repo.update(db, db_obj=token_obj, obj_in={"revoked_at": datetime.utcnow()})
    
    from app.config.settings import settings
    return TokenResponse(
        access_token=access_token,
        refresh_token=new_refresh_token,
        expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60
    )
