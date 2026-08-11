import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.profiles import TherapistAssignment
from app.repositories.assignment_repository import assignment_repo
from app.repositories.therapist_repository import therapist_repo
from app.schemas.appointments.assignment import AssignmentRecommendation, AssignTherapistRequest
from app.services.auth.auth_service import auth_service
from app.services.therapists.capacity_service import capacity_service


class AssignmentService:
    async def manual_assign(self, db: AsyncSession, *, patient_id: uuid.UUID, request: AssignTherapistRequest, current_user_id: uuid.UUID) -> TherapistAssignment:
        existing = await assignment_repo.get_by_patient_and_therapist(db, patient_id=patient_id, therapist_id=request.therapist_id)
        if existing:
            raise ValueError("Therapist is already assigned to this patient.")
            
        assignment = TherapistAssignment(
            patient_id=patient_id,
            therapist_id=request.therapist_id,
            status="active"
        )
        saved = await assignment_repo.create(db, obj_in=assignment)
        await auth_service.log_audit_event(db, user_id=current_user_id, action="therapist_assigned", entity="therapist_assignment", entity_id=str(saved.id))
        return saved

class AssignmentRecommendationEngine:
    # Configurable weights
    WEIGHT_AVAILABILITY = 0.4
    WEIGHT_CAPACITY = 0.3
    WEIGHT_SPECIALIZATION = 0.2
    WEIGHT_EXPERIENCE = 0.1

    async def get_recommendations(
        self, 
        db: AsyncSession, 
        *, 
        patient_id: uuid.UUID,
        required_specialization: str | None = None
    ) -> list[AssignmentRecommendation]:
        
        # 1. Fetch all active therapists
        therapists = await therapist_repo.search(db, size=100) # Arbitrary limit for now
        
        recommendations = []
        for therapist in therapists.items:
            score = 0.0
            reasons = []
            
            # Specialization
            if required_specialization and therapist.specialization:
                if required_specialization.lower() in therapist.specialization.lower():
                    score += self.WEIGHT_SPECIALIZATION * 100
                    reasons.append("Specialization match")
                else:
                    # Penalty or zero
                    pass
            else:
                score += self.WEIGHT_SPECIALIZATION * 50 # Base score
                
            # Capacity
            capacity_data = await capacity_service.get_therapist_capacity(db, therapist_id=therapist.id)
            if capacity_data.remaining_capacity > 0:
                cap_ratio = capacity_data.remaining_capacity / max(1, capacity_data.max_capacity)
                score += self.WEIGHT_CAPACITY * (cap_ratio * 100)
                if cap_ratio > 0.5:
                    reasons.append("High availability capacity")
            else:
                # No capacity, don't recommend
                continue
                
            # Experience
            exp = therapist.years_experience or 0
            exp_score = min(exp * 10, 100) # Cap at 10 years for scoring
            score += self.WEIGHT_EXPERIENCE * exp_score
            if exp > 5:
                reasons.append(f"Highly experienced ({exp} years)")
                
            # Availability score placeholder
            avail_score = capacity_data.availability_score
            score += self.WEIGHT_AVAILABILITY * avail_score
            
            recommendations.append(
                AssignmentRecommendation(
                    therapist_id=therapist.id,
                    first_name=therapist.user.first_name if hasattr(therapist, "user") else "Unknown",
                    last_name=therapist.user.last_name if hasattr(therapist, "user") else "Unknown",
                    specialization=therapist.specialization,
                    score=round(score, 2),
                    reasons=reasons
                )
            )
            
        # Rank by score descending
        recommendations.sort(key=lambda x: x.score, reverse=True)
        return recommendations

assignment_service = AssignmentService()
recommendation_engine = AssignmentRecommendationEngine()
