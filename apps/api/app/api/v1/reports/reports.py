import uuid

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import JSONResponse
from sqlalchemy.ext.asyncio import AsyncSession

from app.database.session import get_db
from app.dependencies.ownership import require_ownership
from app.dependencies.roles import require_role
from app.models.core import User
from app.models.profiles import Patient, Therapist
from app.repositories.report_repository import report_repo
from app.schemas.reports import ReportGenerateRequest
from app.services.reports.report_service import report_service

router = APIRouter()


@router.post("/reports/generate", summary="Generate a report", description="Generate and store a JSON aggregate report.")
async def generate_report(
    request: ReportGenerateRequest,
    current_user: User = Depends(require_role(["admin", "therapist"])),
    db: AsyncSession = Depends(get_db),
):
    try:
        saved, payload = await report_service.generate(
            db,
            report_type=request.report_type,
            patient_id=request.patient_id,
            therapist_id=request.therapist_id,
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    return {"report_id": str(saved.id), **payload}


@router.get("/reports/patient/{patient_id}", summary="Patient report", description="Aggregate report for a patient.")
async def patient_report(
    patient_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    owner: User = Depends(require_ownership(Patient, "patient_id")),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await report_service.patient_report(db, patient_id=patient_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/reports/therapist/{therapist_id}", summary="Therapist report", description="Aggregate report for a therapist.")
async def therapist_report(
    therapist_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "therapist"])),
    owner: User = Depends(require_ownership(Therapist, "therapist_id")),
    db: AsyncSession = Depends(get_db),
):
    try:
        return await report_service.therapist_report(db, therapist_id=therapist_id)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))


@router.get("/reports/clinic", summary="Clinic report", description="Aggregate report for the whole clinic (admin only).")
async def clinic_report(
    current_user: User = Depends(require_role(["admin"])),
    db: AsyncSession = Depends(get_db),
):
    return await report_service.clinic_report(db)


@router.get("/reports/{report_id}/download", summary="Download a report", description="Download a previously generated report as JSON.")
async def download_report(
    report_id: uuid.UUID,
    current_user: User = Depends(require_role(["admin", "therapist", "patient"])),
    db: AsyncSession = Depends(get_db),
):
    report = await report_repo.get(db, id=report_id)
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    if report.report_type == "patient" and report.patient_id:
        payload = await report_service.patient_report(db, patient_id=report.patient_id)
    elif report.report_type == "therapist" and report.therapist_id:
        payload = await report_service.therapist_report(db, therapist_id=report.therapist_id)
    elif report.report_type == "clinic":
        payload = await report_service.clinic_report(db)
    else:
        raise HTTPException(status_code=404, detail="Report payload unavailable")
    return JSONResponse(
        content=payload,
        headers={"Content-Disposition": f'attachment; filename="{report.report_type}_report.json"'},
    )
