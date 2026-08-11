# API Specification
# Kinetix Home Care

**Version:** 1.0  
**Status:** Approved  
**API Style:** RESTful API  
**Protocol:** HTTPS  
**Format:** JSON  
**Authentication:** JWT + Refresh Token  
**Base URL:** `/api/v1`

---

# 1. Overview

This document defines the REST API contract for the Kinetix Home Care platform.

The API is consumed by:

- Web Application (Next.js PWA)
- Future Mobile Applications
- Future Third-Party Integrations

---

# 2. API Principles

- RESTful resource design
- Versioned endpoints
- JSON request/response
- Stateless authentication
- UUID identifiers
- Standardized error responses
- Pagination for list endpoints
- Role-based access control (RBAC)

---

# 3. Authentication

All protected endpoints require:

```http
Authorization: Bearer <access_token>
```

Public endpoints:

- Login
- Forgot Password
- Reset Password
- Refresh Token

---

# 4. Standard Response Format

## Success

```json
{
  "success": true,
  "message": "Operation completed successfully.",
  "data": {}
}
```

## Error

```json
{
  "success": false,
  "code": "RESOURCE_NOT_FOUND",
  "message": "Requested resource not found.",
  "errors": []
}
```

---

# 5. Standard Status Codes

| Code | Description |
|------:|-------------|
| 200 | OK |
| 201 | Created |
| 204 | No Content |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 409 | Conflict |
| 422 | Validation Error |
| 429 | Too Many Requests |
| 500 | Internal Server Error |

---

# 6. Pagination

List endpoints support:

```http
?page=1
&page_size=20
&sort_by=created_at
&sort_order=desc
&search=
```

Response:

```json
{
  "success": true,
  "data": {
    "items": [],
    "page": 1,
    "page_size": 20,
    "total": 100,
    "total_pages": 5
  }
}
```

---

# 7. Authentication APIs

## Login

```http
POST /auth/login
```

Request

```json
{
  "email": "user@example.com",
  "password": "password"
}
```

Response

```json
{
  "access_token": "",
  "refresh_token": "",
  "expires_in": 3600,
  "user": {}
}
```

---

## Refresh Token

```http
POST /auth/refresh
```

---

## Logout

```http
POST /auth/logout
```

---

## Forgot Password

```http
POST /auth/forgot-password
```

---

## Reset Password

```http
POST /auth/reset-password
```

---

## Get Current User

```http
GET /auth/me
```

---

# 8. User APIs

## Get Users

```http
GET /users
```

---

## Get User

```http
GET /users/{id}
```

---

## Create User

```http
POST /users
```

---

## Update User

```http
PUT /users/{id}
```

---

## Delete User

```http
DELETE /users/{id}
```

---

# 9. Patient APIs

## Get Patients

```http
GET /patients
```

Supports

- Pagination
- Search
- Filters

---

## Get Patient

```http
GET /patients/{id}
```

---

## Create Patient

```http
POST /patients
```

---

## Update Patient

```http
PUT /patients/{id}
```

---

## Archive Patient

```http
PATCH /patients/{id}/archive
```

---

## Restore Patient

```http
PATCH /patients/{id}/restore
```

---

# 10. Therapist APIs

## Get Therapists

```http
GET /therapists
```

---

## Get Therapist

```http
GET /therapists/{id}
```

---

## Create Therapist

```http
POST /therapists
```

---

## Update Therapist

```http
PUT /therapists/{id}
```

---

## Assign Patient

```http
POST /therapists/{id}/assign-patient
```

---

## Availability

```http
GET /therapists/{id}/availability
```

```http
PUT /therapists/{id}/availability
```

---

# 11. Appointment APIs

## Get Appointments

```http
GET /appointments
```

---

## Get Appointment

```http
GET /appointments/{id}
```

---

## Schedule Appointment

```http
POST /appointments
```

---

## Update Appointment

```http
PUT /appointments/{id}
```

---

## Cancel Appointment

```http
PATCH /appointments/{id}/cancel
```

---

## Complete Appointment

```http
PATCH /appointments/{id}/complete
```

---

# 12. Assessment APIs

## Get Assessments

```http
GET /assessments
```

---

## Get Assessment

```http
GET /assessments/{id}
```

---

## Create Initial Assessment

```http
POST /assessments/initial
```

---

## Create Weekly Assessment

```http
POST /assessments/weekly
```

---

## Create Final Assessment

```http
POST /assessments/final
```

---

## Update Assessment

```http
PUT /assessments/{id}
```

---

# 13. Treatment Session APIs

## Get Sessions

```http
GET /treatment-sessions
```

---

## Get Session

```http
GET /treatment-sessions/{id}
```

---

## Start Session

```http
POST /treatment-sessions/start
```

---

## End Session

```http
PATCH /treatment-sessions/{id}/end
```

---

## Update Notes

```http
PUT /treatment-sessions/{id}
```

---

# 14. Exercise APIs

## Get Exercise Programs

```http
GET /exercise-programs
```

---

## Create Exercise Program

```http
POST /exercise-programs
```

---

## Update Exercise Program

```http
PUT /exercise-programs/{id}
```

---

## Delete Exercise Program

```http
DELETE /exercise-programs/{id}
```

---

## Exercise Library

```http
GET /exercise-library
```

---

# 15. Document APIs

## Upload Document

```http
POST /documents
```

Multipart Form Data

---

## Get Documents

```http
GET /documents
```

---

## Download Document

```http
GET /documents/{id}
```

---

## Delete Document

```http
DELETE /documents/{id}
```

---

# 16. Consent APIs

## Get Consent Forms

```http
GET /consents
```

---

## Upload Template

```http
POST /consents/templates
```

---

## Sign Consent

```http
POST /consents/{id}/sign
```

---

## Download Consent

```http
GET /consents/{id}/pdf
```

---

# 17. Progress APIs

## Get Patient Progress

```http
GET /patients/{id}/progress
```

Returns:

- Pain Trend
- ROM Trend
- Strength Trend
- Goals
- Session Timeline

---

# 18. Reports APIs

## Generate Report

```http
POST /reports/generate
```

---

## Patient Report

```http
GET /reports/patient/{id}
```

---

## Therapist Report

```http
GET /reports/therapist/{id}
```

---

## Clinic Report

```http
GET /reports/clinic
```

---

## Download Report

```http
GET /reports/{id}/download
```

---

# 19. Dashboard APIs

## Admin Dashboard

```http
GET /dashboard/admin
```

---

## Therapist Dashboard

```http
GET /dashboard/therapist
```

---

## Patient Dashboard

```http
GET /dashboard/patient
```

---

# 20. Feedback APIs

## Submit Feedback

```http
POST /feedback
```

---

## Get Feedback

```http
GET /feedback
```

---

## Therapist Feedback

```http
GET /feedback/therapist/{id}
```

---

# 21. Notification APIs

## Get Notifications

```http
GET /notifications
```

---

## Mark As Read

```http
PATCH /notifications/{id}/read
```

---

## Mark All Read

```http
PATCH /notifications/read-all
```

---

# 22. Billing APIs (Phase 2)

## Create Invoice

```http
POST /billing
```

---

## Get Invoices

```http
GET /billing
```

---

## Get Invoice

```http
GET /billing/{id}
```

---

## Record Payment

```http
POST /payments
```

---

# 23. Admin APIs

## System Statistics

```http
GET /admin/statistics
```

---

## Audit Logs

```http
GET /admin/audit-logs
```

---

## System Settings

```http
GET /admin/settings
```

```http
PUT /admin/settings
```

---

# 24. Search APIs

## Global Search

```http
GET /search
```

Query

```http
?q=
```

Returns:

- Patients
- Therapists
- Appointments
- Reports

---

# 25. Health APIs

## Health Check

```http
GET /health
```

---

## Readiness Probe

```http
GET /health/ready
```

---

## Liveness Probe

```http
GET /health/live
```

---

# 26. File Upload Specification

Accepted Types

- PDF
- PNG
- JPG
- JPEG
- DOCX (optional)

Maximum Size

- 20 MB per file

Storage

- Object Storage (S3 / Supabase Storage)

---

# 27. Error Codes

| Code | Description |
|--------|-------------|
| AUTH_INVALID_CREDENTIALS | Invalid login |
| AUTH_TOKEN_EXPIRED | Access token expired |
| AUTH_FORBIDDEN | Access denied |
| USER_NOT_FOUND | User not found |
| PATIENT_NOT_FOUND | Patient not found |
| THERAPIST_NOT_FOUND | Therapist not found |
| APPOINTMENT_CONFLICT | Appointment overlaps existing booking |
| ASSESSMENT_NOT_FOUND | Assessment not found |
| DOCUMENT_UPLOAD_FAILED | Upload failed |
| VALIDATION_ERROR | Request validation failed |
| INTERNAL_SERVER_ERROR | Unexpected server error |

---

# 28. Rate Limits

| Endpoint | Limit |
|-----------|------:|
| Login | 5 requests/minute |
| Forgot Password | 3 requests/10 minutes |
| Upload Document | 20 requests/hour |
| General API | 100 requests/minute/user |

---

# 29. API Security

- HTTPS only
- JWT authentication
- Refresh token rotation
- RBAC authorization
- Request validation
- Rate limiting
- Audit logging
- Input sanitization

---

# 30. Versioning Strategy

Current

```
/api/v1
```

Future

```
/api/v2
/api/v3
```

Breaking changes must be introduced in a new API version.

---

# 31. Future APIs

Version 2

- Billing
- SMS
- Push Notifications
- Inventory
- Exercise Compliance

Version 3

- AI SOAP Notes
- AI Treatment Recommendations
- Voice Transcription
- Tele-Rehabilitation
- Wearable Device Integration
- FHIR/HL7 APIs

---

# 32. API Design Guidelines

1. Use plural resource names (`/patients`, `/appointments`).
2. Use HTTP verbs appropriately (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`).
3. Return consistent JSON structures.
4. Use UUIDs for resource identifiers.
5. Keep endpoints focused on a single responsibility.
6. Validate all inputs on the server.
7. Return meaningful HTTP status codes.
8. Protect sensitive endpoints with authentication and authorization.
9. Ensure all list endpoints support pagination, filtering, and sorting.
10. Maintain backward compatibility within the same API version.

---

# 33. API Endpoint Summary

| Module | Base Endpoint |
|---------|---------------|
| Authentication | `/auth` |
| Users | `/users` |
| Patients | `/patients` |
| Therapists | `/therapists` |
| Appointments | `/appointments` |
| Assessments | `/assessments` |
| Treatment Sessions | `/treatment-sessions` |
| Exercise Programs | `/exercise-programs` |
| Documents | `/documents` |
| Consent Forms | `/consents` |
| Reports | `/reports` |
| Dashboard | `/dashboard` |
| Notifications | `/notifications` |
| Feedback | `/feedback` |
| Billing (Phase 2) | `/billing` |
| Payments (Phase 2) | `/payments` |
| Search | `/search` |
| Admin | `/admin` |
| Health | `/health` |

---

# 34. Definition of Done

An API endpoint is considered complete only when:

- Route implemented
- Request validation added
- Business logic implemented
- Authorization enforced
- Audit logging included
- Error handling implemented
- OpenAPI documentation generated
- Unit tests passing
- Integration tests passing
- Performance requirements met
- Security review completed