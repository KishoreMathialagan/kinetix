from typing import Annotated

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.auth import get_current_user
from app.models.core import User
from app.repositories.auth_repository import refresh_token_repo
from app.schemas.auth import RefreshTokenRequest
from app.services.auth.token_service import token_service

router = APIRouter()

@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
async def logout(
    request: RefreshTokenRequest,
    current_user: Annotated[User, Depends(get_current_user)],
    db: AsyncSession = Depends(get_db)
):
    token_obj = await token_service.verify_refresh_token(db, raw_token=request.refresh_token)
    if not token_obj:
        raise HTTPException(status_code=400, detail="Invalid token")
        
    if token_obj.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to revoke this token")
        
    await refresh_token_repo.revoke_all_for_user(db, user_id=current_user.id)
