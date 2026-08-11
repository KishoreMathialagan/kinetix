import secrets
import string
import uuid

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import pwd_context
from app.models.core import User
from app.models.enums import UserRole
from app.models.profiles import Patient
from app.repositories.patient_repository import patient_repo
from app.repositories.role_repository import role_repo
from app.repositories.user_repository import user_repo
from app.schemas.patients.patient import PatientRegistrationRequest, PatientSearchRequest
from app.services.auth.auth_service import auth_service
from app.utils.pagination import PaginatedResponse


class PatientManagementService:
    def _generate_patient_code(self) -> str:
        # P-YYYY-XXXX format placeholder
        from datetime import datetime
        rand_str = ''.join(secrets.choice(string.ascii_uppercase + string.digits) for _ in range(4))
        return f"P-{datetime.utcnow().year}-{rand_str}"

    async def register_patient(self, db: AsyncSession, *, request: PatientRegistrationRequest, current_user_id: uuid.UUID) -> Patient:
        # Check uniqueness
        if await user_repo.get_by_email(db, email=request.email):
            raise ValueError("Email already registered")
        if await user_repo.get_by_phone(db, phone=request.phone):
            raise ValueError("Phone already registered")
            
        # Get patient role
        patient_role = await role_repo.get_by_name(db, name=UserRole.PATIENT)
        if not patient_role:
            raise ValueError("Patient role not found in system")

        try:
            # 1. Create User
            user = User(
                first_name=request.first_name,
                last_name=request.last_name,
                email=request.email,
                phone=request.phone,
                password_hash=pwd_context.hash(request.password),
                role_id=patient_role.id,
                is_active=True
            )
            db.add(user)
            await db.flush() # flush to get user.id

            # 2. Create Patient Profile
            patient_code = self._generate_patient_code()
            patient = Patient(
                user_id=user.id,
                patient_code=patient_code,
                dob=request.dob,
                gender=request.gender,
                blood_group=request.blood_group,
                address=request.address,
                emergency_contact=request.emergency_contact,
                emergency_phone=request.emergency_phone,
                medical_history=request.medical_history,
                allergies=request.allergies,
                medications=request.medications
            )
            db.add(patient)
            
            # 3. Audit Log
            await auth_service.log_audit_event(
                db, user_id=current_user_id, action="patient_registered", entity="patient", entity_id=str(user.id)
            )
            
            await db.commit()
            await db.refresh(patient)
            return patient
            
        except Exception as e:
            await db.rollback()
            raise ValueError(f"Registration failed: {e!s}")

    async def search_patients(self, db: AsyncSession, *, search_params: PatientSearchRequest, page: int, size: int) -> PaginatedResponse[Patient]:
        return await patient_repo.search(db, search_params=search_params, page=page, size=size)

patient_management_service = PatientManagementService()
