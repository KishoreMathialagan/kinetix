import uuid

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.roles import require_role
from app.models.core import User
from app.repositories.billing_repository import treatment_package_repo
from app.schemas.billing import (
    TreatmentPackageCreate,
    TreatmentPackageResponse,
    TreatmentPackageUpdate,
)
from app.services.billing.billing_service import billing_service

router = APIRouter()


@router.post("/billing/packages", response_model=TreatmentPackageResponse, status_code=status.HTTP_201_CREATED, summary="Create a treatment package", description="Create a sellable treatment package (admin only).")
async def create_package(
    request: TreatmentPackageCreate,
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    return await billing_service.create_package(db, request=request, current_user_id=current_user.id)


@router.get("/billing/packages", response_model=list[TreatmentPackageResponse], summary="List treatment packages", description="List active treatment packages.")
async def list_packages(
    include_inactive: bool = False,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    db: AsyncSession = Depends(get_db),
):
    return await treatment_package_repo.list_active(db, include_inactive=include_inactive)


@router.get("/billing/packages/{package_id}", response_model=TreatmentPackageResponse, summary="Get a treatment package")
async def get_package(
    package_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    db: AsyncSession = Depends(get_db),
):
    package = await treatment_package_repo.get(db, id=package_id)
    if not package:
        raise HTTPException(status_code=404, detail="Treatment package not found")
    return package


@router.put("/billing/packages/{package_id}", response_model=TreatmentPackageResponse, summary="Update a treatment package", description="Update a treatment package (admin only).")
async def update_package(
    package_id: uuid.UUID,
    request: TreatmentPackageUpdate,
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await billing_service.update_package(
            db, package_id=package_id, request=request, current_user_id=current_user.id
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.delete("/billing/packages/{package_id}", status_code=status.HTTP_204_NO_CONTENT, summary="Delete a treatment package", description="Soft delete a treatment package (admin only).")
async def delete_package(
    package_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    try:
        await billing_service.delete_package(db, package_id=package_id, current_user_id=current_user.id)
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
