import asyncio
import logging

from sqlalchemy import select

from app.core.security import pwd_context
from app.database.session import async_session_maker
from app.models.core import Permission, Role, User
from app.models.enums import UserRole

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


PERMISSIONS_DATA = [
    {"module": "patient", "action": "create", "description": "Create patient profile"},
    {"module": "patient", "action": "read", "description": "Read patient profile"},
    {"module": "patient", "action": "update", "description": "Update patient profile"},
    {"module": "patient", "action": "archive", "description": "Archive patient profile"},
    {"module": "patient", "action": "restore", "description": "Restore archived patient profile"},
    {"module": "therapist", "action": "create", "description": "Create therapist profile"},
    {"module": "therapist", "action": "read", "description": "Read therapist profile"},
    {"module": "therapist", "action": "update", "description": "Update therapist profile"},
    {"module": "therapist", "action": "assign", "description": "Assign therapist to patient"},
    {"module": "appointment", "action": "create", "description": "Create appointment"},
    {"module": "appointment", "action": "read", "description": "Read appointment"},
    {"module": "appointment", "action": "update", "description": "Update appointment"},
    {"module": "appointment", "action": "cancel", "description": "Cancel appointment"},
    {"module": "assessment", "action": "create", "description": "Create assessment"},
    {"module": "assessment", "action": "read", "description": "Read assessment"},
    {"module": "assessment", "action": "update", "description": "Update assessment"},
    {"module": "treatment_session", "action": "create", "description": "Create treatment session"},
    {"module": "treatment_session", "action": "read", "description": "Read treatment session"},
    {"module": "treatment_session", "action": "update", "description": "Update treatment session"},
    {"module": "exercise_program", "action": "create", "description": "Create exercise program"},
    {"module": "exercise_program", "action": "read", "description": "Read exercise program"},
    {"module": "exercise_program", "action": "update", "description": "Update exercise program"},
    {"module": "document", "action": "upload", "description": "Upload document"},
    {"module": "document", "action": "read", "description": "Read document"},
    {"module": "document", "action": "download", "description": "Download document"},
    {"module": "consent", "action": "sign", "description": "Sign consent form"},
    {"module": "report", "action": "generate", "description": "Generate report"},
    {"module": "report", "action": "read", "description": "Read report"},
    {"module": "report", "action": "export", "description": "Export report"},
    {"module": "feedback", "action": "create", "description": "Submit feedback"},
    {"module": "feedback", "action": "read", "description": "View feedback"},
    {"module": "billing", "action": "manage", "description": "Manage billing and invoices"},
    {"module": "settings", "action": "manage", "description": "Manage system settings"},
    {"module": "users", "action": "manage", "description": "Manage users"},
    {"module": "roles", "action": "manage", "description": "Manage roles"},
    {"module": "permissions", "action": "manage", "description": "Manage permissions"},
]

# (module, action) keys assigned to each role.
ROLE_PERMISSIONS = {
    UserRole.ADMIN: None,  # None means all permissions
    UserRole.THERAPIST: [
        ("patient", "read"),
        ("therapist", "read"),
        ("therapist", "update"),
        ("appointment", "create"),
        ("appointment", "read"),
        ("appointment", "update"),
        ("appointment", "cancel"),
        ("assessment", "create"),
        ("assessment", "read"),
        ("assessment", "update"),
        ("treatment_session", "create"),
        ("treatment_session", "read"),
        ("treatment_session", "update"),
        ("exercise_program", "create"),
        ("exercise_program", "read"),
        ("exercise_program", "update"),
        ("document", "upload"),
        ("document", "read"),
        ("document", "download"),
        ("report", "generate"),
        ("report", "read"),
        ("report", "export"),
        ("feedback", "read"),
    ],
    UserRole.PATIENT: [
        ("patient", "read"),
        ("patient", "update"),
        ("appointment", "read"),
        ("appointment", "create"),
        ("appointment", "cancel"),
        ("exercise_program", "read"),
        ("document", "upload"),
        ("document", "read"),
        ("document", "download"),
        ("consent", "sign"),
        ("report", "read"),
        ("report", "export"),
        ("feedback", "create"),
    ],
}


async def seed_roles_and_permissions() -> None:
    async with async_session_maker() as session:
        # Upsert permissions
        created_permissions = {}
        for perm in PERMISSIONS_DATA:
            stmt = select(Permission).where(
                Permission.module == perm["module"], Permission.action == perm["action"]
            )
            result = await session.execute(stmt)
            existing = result.scalar_one_or_none()

            key = (perm["module"], perm["action"])
            if not existing:
                new_perm = Permission(**perm)
                session.add(new_perm)
                await session.flush()
                created_permissions[key] = new_perm
                logger.info("Created permission: %s.%s", perm["module"], perm["action"])
            else:
                created_permissions[key] = existing

        await session.commit()

        # Upsert roles and assign permissions
        for role_enum, assigned in ROLE_PERMISSIONS.items():
            stmt = select(Role).where(Role.name == role_enum.value)
            result = await session.execute(stmt)
            existing_role = result.scalar_one_or_none()

            if not existing_role:
                new_role = Role(name=role_enum.value, description=f"{role_enum.value} role")
                if assigned is None:
                    new_role.permissions = list(created_permissions.values())
                else:
                    new_role.permissions = [
                        created_permissions[key] for key in assigned if key in created_permissions
                    ]
                session.add(new_role)
                logger.info("Created role: %s", role_enum.value)
            else:
                logger.info("Role already exists: %s", role_enum.value)

        await session.commit()

        # Create default admin user if missing
        stmt = select(User).where(User.email == "admin@kinetix.com")
        result = await session.execute(stmt)
        existing_admin = result.scalar_one_or_none()

        if not existing_admin:
            stmt = select(Role).where(Role.name == UserRole.ADMIN.value)
            result = await session.execute(stmt)
            admin_role = result.scalar_one_or_none()

            if admin_role:
                admin_user = User(
                    first_name="Super",
                    last_name="Admin",
                    email="admin@kinetix.com",
                    password_hash=pwd_context.hash("Admin@123"),
                    role_id=admin_role.id,
                    is_active=True,
                    is_verified=True,
                )
                session.add(admin_user)
                await session.commit()
                logger.info("Created default Admin user: admin@kinetix.com")
            else:
                logger.error("Admin role not found, cannot create admin user.")
        else:
            logger.info("Default Admin user already exists.")

        logger.info("Seeding completed successfully.")


if __name__ == "__main__":
    asyncio.run(seed_roles_and_permissions())