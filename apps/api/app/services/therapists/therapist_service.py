import uuid
from datetime import time

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import pwd_context
from app.models.core import User
from app.models.enums import TherapistStatus, UserRole
from app.models.profiles import Therapist, TherapistAvailability
from app.repositories.role_repository import role_repo
from app.repositories.therapist_repository import therapist_repo
from app.repositories.user_repository import user_repo
from app.schemas.therapists.therapist import TherapistCreate
from app.services.auth.auth_service import auth_service


class TherapistService:
    async def register_therapist(self, db: AsyncSession, *, request: TherapistCreate, current_user_id: uuid.UUID) -> Therapist:
        # Check uniqueness
        if await user_repo.get_by_email(db, email=request.email):
            raise ValueError("Email already registered")
        if await user_repo.get_by_phone(db, phone=request.phone):
            raise ValueError("Phone already registered")
        if await therapist_repo.get_by_license_number(db, license_number=request.license_number):
            raise ValueError("License number already registered")
        if await therapist_repo.get_by_registration_number(db, registration_number=request.registration_number):
            raise ValueError("Registration number already registered")
            
        # Get therapist role
        role = await role_repo.get_by_name(db, name=UserRole.THERAPIST)
        if not role:
            raise ValueError("Therapist role not found in system")

        try:
            # 1. Create User
            user = User(
                first_name=request.first_name,
                last_name=request.last_name,
                email=request.email,
                phone=request.phone,
                password_hash=pwd_context.hash(request.password),
                role_id=role.id,
                is_active=True
            )
            db.add(user)
            await db.flush()

            # 2. Create Therapist Profile
            therapist = Therapist(
                user_id=user.id,
                license_number=request.license_number,
                registration_number=request.registration_number,
                department=request.department,
                qualification=request.qualification,
                specialization=request.specialization,
                languages=request.languages,
                years_experience=request.years_experience,
                gender=request.gender,
                dob=request.dob,
                address=request.address,
                emergency_contact=request.emergency_contact,
                joining_date=request.joining_date,
                status=TherapistStatus.ACTIVE,
                capacity=request.capacity or 10
            )
            db.add(therapist)
            await db.flush()
            
            # 3. Initialize default availability (Mon-Fri 9-5)
            for i in range(5):
                avail = TherapistAvailability(
                    therapist_id=therapist.id,
                    weekday=i,
                    start_time=time(9, 0),
                    end_time=time(17, 0),
                    is_available=True
                )
                db.add(avail)
            
            # 4. Audit Log
            await auth_service.log_audit_event(
                db, user_id=current_user_id, action="therapist_registered", entity="therapist", entity_id=str(user.id)
            )
            
            await db.commit()
            await db.refresh(therapist)
            return therapist
            
        except Exception as e:
            await db.rollback()
            raise ValueError(f"Registration failed: {e!s}")

therapist_service = TherapistService()
