from fastapi import APIRouter

from app.api.v1.auth.login import router as auth_login_router
from app.api.v1.auth.logout import router as auth_logout_router
from app.api.v1.auth.me import router as auth_me_router
from app.api.v1.auth.otp import router as auth_otp_router
from app.api.v1.auth.password import router as auth_password_router
from app.api.v1.auth.register import router as auth_register_router
from app.api.v1.health import router as health_router
from app.api.v1.patients.consents import router as patient_consents_router
from app.api.v1.patients.documents import router as patient_documents_router
from app.api.v1.patients.patients import router as patients_crud_router
from app.api.v1.therapists.availability import router as therapists_availability_router
from app.api.v1.therapists.therapists import router as therapists_crud_router
from app.api.v1.users.patients import router as user_patients_router
from app.api.v1.users.therapists import router as therapists_router
from app.api.v1.users.users import router as users_router

api_router = APIRouter()

api_router.include_router(health_router, prefix="/system", tags=["System"])
api_router.include_router(auth_login_router, prefix="/auth", tags=["Auth"])
api_router.include_router(auth_logout_router, prefix="/auth", tags=["Auth"])
api_router.include_router(auth_password_router, prefix="/auth", tags=["Auth"])
api_router.include_router(auth_otp_router, prefix="/auth/otp", tags=["Auth"])
api_router.include_router(auth_register_router, prefix="/auth", tags=["Auth"])
api_router.include_router(auth_me_router, prefix="/auth", tags=["Auth"])

api_router.include_router(users_router, prefix="/users", tags=["Users"])
api_router.include_router(user_patients_router, prefix="/patients/me", tags=["Patient Profiles"])
api_router.include_router(therapists_router, prefix="/therapists/me", tags=["Therapist Profiles"])

# Phase 5: Patient Management Routes
api_router.include_router(patients_crud_router, prefix="/patients", tags=["Patient Management"])
api_router.include_router(patient_documents_router, prefix="/patients", tags=["Patient Documents"])
api_router.include_router(patient_consents_router, prefix="/patients", tags=["Patient Consents"])

# Phase 6: Therapist Management Routes
api_router.include_router(therapists_crud_router, prefix="/therapists", tags=["Therapist Management"])
api_router.include_router(therapists_availability_router, prefix="/therapists", tags=["Therapist Availability"])

# Phase 7: Appointments Routes
from app.api.v1.appointments.appointments import router as appointments_router
from app.api.v1.appointments.assignment import router as assignments_router
from app.api.v1.appointments.calendar import router as calendar_router

api_router.include_router(appointments_router, prefix="/appointments", tags=["Appointment Scheduling"])
api_router.include_router(assignments_router, prefix="/assignments", tags=["Therapist Assignment Engine"])
api_router.include_router(calendar_router, prefix="/calendar", tags=["Calendar APIs"])

# Clinical Routes
from app.api.v1.clinical.assessments import router as assessments_router
from app.api.v1.clinical.progress import router as progress_router
from app.api.v1.clinical.treatment_plans import router as treatment_plans_router
from app.api.v1.clinical.treatment_sessions import router as treatment_sessions_router

api_router.include_router(assessments_router, prefix="/assessments", tags=["Assessments"])
api_router.include_router(treatment_sessions_router, prefix="/treatment-sessions", tags=["Treatment Sessions"])
api_router.include_router(treatment_plans_router, prefix="/treatment-plans", tags=["Treatment Plans"])
api_router.include_router(progress_router, tags=["Progress Tracking"])

# Exercise Routes
from app.api.v1.exercises.exercises import router as exercises_router

api_router.include_router(exercises_router, tags=["Exercise Programs"])

# Consent + Document Routes
from app.api.v1.consents.consents import router as consents_router
from app.api.v1.documents.documents import router as documents_router

api_router.include_router(consents_router, tags=["Consents"])
api_router.include_router(documents_router, tags=["Documents"])

# Communication Routes
from app.api.v1.feedback.feedback import router as feedback_router
from app.api.v1.notifications.notifications import router as notifications_router
from app.api.v1.search.search import router as search_router

api_router.include_router(feedback_router, tags=["Feedback"])
api_router.include_router(notifications_router, tags=["Notifications"])
api_router.include_router(search_router, tags=["Search"])

# Reports Routes
from app.api.v1.reports.reports import router as reports_router

api_router.include_router(reports_router, tags=["Reports"])

# Dashboard Routes
from app.api.v1.dashboards.dashboards import router as dashboards_router

api_router.include_router(dashboards_router, tags=["Dashboards"])

# Billing Routes (Phase 2)
from app.api.v1.billing.billing import router as billing_router
from app.api.v1.billing.packages import router as billing_packages_router

api_router.include_router(billing_packages_router, tags=["Billing"])
api_router.include_router(billing_router, tags=["Billing"])

# Admin Routes
from app.api.v1.admin.admin import router as admin_router

api_router.include_router(admin_router, tags=["Admin"])
