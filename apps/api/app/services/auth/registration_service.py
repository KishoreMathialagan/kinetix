import secrets
import string
from datetime import datetime

from sqlalchemy.ext.asyncio import AsyncSession

from app.core.security import pwd_context
from app.models.core import User
from app.models.enums import UserRole
from app.models.profiles import Patient
from app.repositories.role_repository import role_repo
from app.repositories.user_repository import user_repo
from app.schemas.auth import RegisterRequest
from app.services.auth.auth_service import auth_service
from app.services.auth.otp_service import otp_service


class RegistrationService:
    def _generate_patient_code(self) -> str:
        rand_str = "".join(
            secrets.choice(string.ascii_uppercase + string.digits) for _ in range(4)
        )
        return f"P-{datetime.utcnow().year}-{rand_str}"

    async def register(self, db: AsyncSession, *, request: RegisterRequest) -> tuple[User, str]:
        if await user_repo.get_by_email(db, email=request.email):
            raise ValueError("Email already registered")
        if request.phone and await user_repo.get_by_phone(db, phone=request.phone):
            raise ValueError("Phone already registered")

        patient_role = await role_repo.get_by_name(db, name=UserRole.PATIENT)
        if not patient_role:
            raise ValueError("Patient role not found in system")

        try:
            user = User(
                first_name=request.first_name,
                last_name=request.last_name,
                email=request.email,
                phone=request.phone,
                password_hash=pwd_context.hash(request.password),
                role_id=patient_role.id,
                is_active=True,
                is_verified=False,
            )
            db.add(user)
            await db.flush()

            patient = Patient(
                user_id=user.id,
                patient_code=self._generate_patient_code(),
                dob=request.dob,
                gender=request.gender,
                blood_group=request.blood_group,
                address=request.address,
            )
            db.add(patient)

            # Registration OTP: code returned to the caller (delivery simulated).
            otp_code = await otp_service.create_otp(db, user_id=user.id, purpose="registration")

            await auth_service.log_audit_event(
                db, user_id=user.id, action="user_registered", entity="user", entity_id=str(user.id)
            )
            await db.commit()
            await db.refresh(user)
            return user, otp_code
        except Exception as exc:
            await db.rollback()
            raise ValueError(f"Registration failed: {exc!s}")


registration_service = RegistrationService()