# Backend Specification
# Kinetix Home Care

**Version:** 1.0  
**Status:** Approved  
**Framework:** FastAPI  
**Language:** Python 3.12+

---

# 1. Purpose

This document defines the backend architecture, coding standards, module organization, API design principles, business logic structure, security model, and implementation guidelines for the Kinetix Home Care platform.

The backend is responsible for:

- Authentication & Authorization
- Business Logic
- Clinical Workflow Management
- Data Validation
- File Management
- Notifications
- Reporting
- Background Jobs
- API Delivery

---

# 2. Technology Stack

| Layer | Technology |
|---------|------------|
| Framework | FastAPI |
| Language | Python 3.12+ |
| ORM | SQLAlchemy 2.x |
| Validation | Pydantic v2 |
| Authentication | JWT |
| Database | PostgreSQL |
| Migration | Alembic |
| Cache | Redis |
| Background Jobs | Celery |
| Storage | AWS S3 / Supabase Storage |
| Testing | Pytest |
| Documentation | OpenAPI / Swagger |

---

# 3. Architecture

The backend follows **Domain-Driven Design (DDD)** combined with **Clean Architecture** and a **Layered Architecture**.

```
Presentation Layer
(API Routers)

↓

Application Layer
(Services)

↓

Domain Layer
(Business Rules)

↓

Infrastructure Layer
(Repositories)

↓

Database
(PostgreSQL)
```

---

# 4. Folder Structure

```
apps/api/

├── app/
│
├── api/
│   └── v1/
│
├── config/
│
├── core/
│
├── middleware/
│
├── models/
│
├── repositories/
│
├── schemas/
│
├── services/
│
├── modules/
│
├── workers/
│
├── tasks/
│
├── storage/
│
├── events/
│
├── utils/
│
├── tests/
│
└── main.py
```

---

# 5. Module Structure

Each business module follows the same structure.

```
patients/

router.py

service.py

repository.py

models.py

schemas.py

permissions.py

validators.py

exceptions.py

constants.py
```

---

# 6. Core Modules

Authentication

Users

Roles

Patients

Therapists

Appointments

Assessments

Treatment Sessions

Exercise Programs

Documents

Consent Forms

Notifications

Reports

Feedback

Billing

Dashboard

Analytics

---

# 7. Request Lifecycle

```
HTTP Request

↓

Authentication

↓

Authorization

↓

Validation

↓

Router

↓

Service

↓

Repository

↓

Database

↓

Response Serializer

↓

JSON Response
```

---

# 8. API Layer

Responsibilities

- Receive requests
- Validate input
- Authenticate user
- Authorize access
- Call service layer
- Return standardized responses

Routers must **never** contain business logic.

---

# 9. Service Layer

Responsibilities

- Business rules
- Workflow orchestration
- Validation beyond schema rules
- Transaction management
- Event publishing

Example responsibilities

PatientService

- Register patient
- Update profile
- Archive patient

AppointmentService

- Schedule appointment
- Check conflicts
- Assign therapist

---

# 10. Repository Layer

Responsibilities

- Database interaction
- Query optimization
- Pagination
- Filtering
- Transactions

Repositories must never contain business logic.

---

# 11. Database Layer

Uses

- SQLAlchemy ORM
- PostgreSQL
- Alembic migrations

Rules

- UUID primary keys
- Soft deletes
- Audit fields
- Foreign keys
- Indexed lookups

---

# 12. Authentication

Authentication method

JWT Access Token

JWT Refresh Token

Password Hashing

Argon2 (preferred)

or

bcrypt

---

Authentication Flow

```
Login

↓

Validate User

↓

Generate Access Token

↓

Generate Refresh Token

↓

Return Tokens
```

---

# 13. Authorization

RBAC

Roles

Admin

Therapist

Patient

Authorization checks

- Authentication
- Role
- Ownership
- Resource permissions

---

# 14. Validation

Pydantic v2

Validation occurs

- Request body
- Query parameters
- Path parameters
- Response serialization

Business validation remains in services.

---

# 15. API Response Format

Success

```json
{
  "success": true,
  "message": "Patient created successfully.",
  "data": {}
}
```

Error

```json
{
  "success": false,
  "code": "PATIENT_NOT_FOUND",
  "message": "Patient does not exist.",
  "errors": []
}
```

---

# 16. Error Handling

Global exception handler

Custom exceptions

Examples

AuthenticationError

AuthorizationError

ValidationError

BusinessRuleError

ConflictError

NotFoundError

---

# 17. Logging

Log

- Requests
- Responses
- Errors
- Authentication
- Audit events
- Background jobs

Use structured JSON logging.

---

# 18. Background Jobs

Technology

Celery + Redis

Tasks

- Email
- Notifications
- PDF generation
- Report generation
- Image optimization
- Scheduled reminders

---

# 19. Storage

Stores

- Medical reports
- Images
- Videos
- Consent forms
- PDFs

Backend stores only metadata.

Files stored in

AWS S3

or

Supabase Storage

---

# 20. Notifications

Supported

- Email
- Push
- In-App

Future

- SMS
- WhatsApp

Notifications generated from domain events.

---

# 21. Events

Examples

PatientRegistered

AppointmentScheduled

AssessmentCompleted

TreatmentCompleted

ConsentSigned

DischargeCompleted

Events may trigger

- Notifications
- Reports
- Analytics
- Audit logs

---

# 22. Caching

Redis caches

- User sessions
- OTP
- Frequently accessed data
- Dashboard summaries
- Rate limiting

---

# 23. File Upload Flow

```
Upload Request

↓

Validate

↓

Virus Scan (optional)

↓

Upload Storage

↓

Store Metadata

↓

Return URL
```

---

# 24. Pagination

Every list endpoint supports

```
?page=1

&page_size=20

&sort_by=name

&sort_order=asc

&search=

&filters=
```

---

# 25. Filtering

Example

```
GET /patients

status

gender

therapist

date

search
```

---

# 26. Search

Support

- Full Name
- Patient ID
- Phone
- Email

Future

PostgreSQL Full Text Search

---

# 27. Audit Logs

Audit

- Login
- Logout
- Create
- Update
- Delete
- Assignment
- Billing
- Report generation

Stored permanently.

---

# 28. Security

Implement

JWT

RBAC

HTTPS

Rate limiting

Password hashing

Input validation

CORS

CSRF protection (if cookie auth)

Secure headers

Audit logs

---

# 29. Rate Limiting

Redis-based

Examples

Login

5 requests/minute

OTP

3 requests/10 minutes

API

100 requests/minute/user

---

# 30. Configuration

Use

Pydantic Settings

Environment variables

Configuration categories

- Database
- Redis
- JWT
- Storage
- Email
- Notifications
- Logging

No hardcoded secrets.

---

# 31. Dependency Injection

Use FastAPI dependency injection for

- Database sessions
- Current user
- Permissions
- Settings
- Repositories
- Services

---

# 32. Middleware

Global middleware

- Authentication
- Request ID
- Logging
- CORS
- Compression
- Exception handling
- Rate limiting

---

# 33. API Versioning

```
/api/v1/

/api/v2/
```

Maintain backward compatibility whenever possible.

---

# 34. Documentation

Automatic OpenAPI

Swagger UI

Redoc

Every endpoint must include

- Summary
- Description
- Request schema
- Response schema
- Error responses

---

# 35. Testing

Unit tests

Integration tests

API tests

Repository tests

Permission tests

Target Coverage

90%+

---

# 36. Performance

Target

API

<500ms average

Dashboard

<2 seconds

Large queries

Pagination required

Use eager loading where appropriate to avoid N+1 queries.

---

# 37. Coding Standards

- Python 3.12+
- Ruff for linting
- Black for formatting
- Type hints required
- Google-style docstrings
- No business logic in routers
- Keep functions focused and testable

---

# 38. Future Backend Enhancements

Version 2

- AI SOAP note generation
- Voice transcription
- Predictive analytics
- Smart scheduling

Version 3

- Multi-tenant architecture
- FHIR/HL7 integration
- Tele-rehabilitation APIs
- Wearable device ingestion
- GraphQL gateway (optional)

---

# 39. Backend Principles

1. Thin routers, rich services.
2. Repositories handle persistence only.
3. Validate at every boundary.
4. Prefer composition over inheritance.
5. Keep modules independent.
6. Use asynchronous endpoints where beneficial.
7. Ensure every critical action is auditable.
8. Design APIs to be versioned and backward compatible.
9. Follow REST conventions consistently.
10. Prioritize security, observability, and maintainability over premature optimization.

---

# 40. Definition of Done

A backend feature is considered complete only when:

- Database migration created
- Models implemented
- Schemas implemented
- Repository implemented
- Service implemented
- API endpoints implemented
- Permissions enforced
- Validation completed
- Unit tests written
- Integration tests passing
- API documentation updated
- Audit logging added
- Error handling implemented
- Code reviewed