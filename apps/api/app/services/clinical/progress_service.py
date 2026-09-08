import enum
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.clinical import ProgressMeasurement
from app.repositories.clinical_repository import (
    assessment_repo,
    progress_measurement_repo,
    treatment_session_repo,
)
from app.schemas.clinical import (
    ProgressOverview,
    TreatmentSessionResponse,
    TrendPoint,
)


def _coerce(value) -> float | None:
    if value is None:
        return None
    if isinstance(value, enum.Enum):
        value = value.value
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _trend(measurements: list[ProgressMeasurement], attr: str) -> list[TrendPoint]:
    points: list[TrendPoint] = []
    for measurement in measurements:
        value = _coerce(getattr(measurement, attr, None))
        if value is None:
            continue
        points.append(TrendPoint(date=measurement.measured_at.date(), value=value))
    return points


class ProgressService:
    async def get_overview(
        self, db: AsyncSession, *, patient_id: uuid.UUID
    ) -> ProgressOverview:
        measurements = await progress_measurement_repo.list_by_patient(
            db, patient_id=patient_id
        )
        sessions = await treatment_session_repo.list_by_patient(
            db, patient_id=patient_id, page=1, size=500
        )
        assessments = await assessment_repo.list_by_patient(
            db, patient_id=patient_id, page=1, size=1
        )
        goals = None
        if assessments["items"]:
            latest = assessments["items"][0]
            goals = latest.goals

        return ProgressOverview(
            patient_id=patient_id,
            pain_trend=_trend(measurements, "pain_score"),
            rom_trend=_trend(measurements, "rom_degrees"),
            strength_trend=_trend(measurements, "strength_scale"),
            goals=goals,
            session_timeline=[TreatmentSessionResponse.model_validate(s) for s in sessions["items"]],
        )


progress_service = ProgressService()