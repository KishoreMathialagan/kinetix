# Database Schema Specification
## Kinetix Home Care

**Document Version:** 1.0  
**Status:** Approved  
**Database:** PostgreSQL 16+  
**ORM:** SQLAlchemy 2.x  
**Migration Tool:** Alembic

---

# 1. Purpose

This document defines the complete relational database schema for the Kinetix Home Care platform.

The database is designed to:

- Support complete physiotherapy home-care workflows.
- Maintain data integrity.
- Provide high performance.
- Be scalable for future multi-branch and multi-clinic deployments.
- Maintain complete auditability.

---

# 2. Database Principles

The database follows these principles:

- PostgreSQL as the primary database
- UUID primary keys
- Soft deletes
- Audit fields on every business table
- Foreign key constraints
- Cascading updates where appropriate
- Indexed foreign keys
- ACID-compliant transactions
- Normalized (3NF)

---

# 3. Naming Conventions

## Tables

Plural snake_case

Examples

```
users
patients
appointments
treatment_sessions
exercise_programs
```

---

## Columns

snake_case

```
created_at
updated_at
phone_number
patient_id
```

---

## Primary Key

```
id UUID PRIMARY KEY
```

---

## Foreign Keys

```
patient_id
therapist_id
appointment_id
```

---

## Boolean Fields

```
is_active
is_deleted
is_verified
```

---

# 4. Standard Audit Fields

Every business table contains:

| Column | Type |
|----------|------|
| id | UUID |
| created_at | TIMESTAMP |
| updated_at | TIMESTAMP |
| deleted_at | TIMESTAMP NULL |
| created_by | UUID |
| updated_by | UUID |
| is_deleted | BOOLEAN |

---

# 5. Entity Relationship Diagram (Logical)

```
Role
 │
 │
 ▼
User
 │
 ├──────────────┐
 ▼              ▼
Patient     Therapist
 │              │
 │              │
 ├──────┐       │
 ▼      ▼       ▼
Appointment
 │
 ▼
Assessment
 │
 ▼
Treatment Session
 │
 ▼
Exercise Program
 │
 ▼
Exercise Item

Patient
 │
 ├───────────────┐
 ▼               ▼
Documents     Consent Forms

Patient
 │
 ▼
Feedback

Patient
 │
 ▼
Reports

Billing
 │
 ▼
Payments
```

---

# 6. Core Tables

---

# roles

Stores user roles.

| Column | Type |
|----------|------|
| id | UUID |
| name | VARCHAR(50) |
| description | TEXT |

Seed Data

- Admin
- Therapist
- Patient

---

# permissions

Stores application permissions.

| Column | Type |
|----------|------|
| id | UUID |
| module | VARCHAR |
| action | VARCHAR |
| description | TEXT |

Examples

```
patient.create
patient.update
patient.delete
patient.view
```

---

# role_permissions

Many-to-many mapping.

| Column |
|----------|
| id |
| role_id |
| permission_id |

---

# users

Authentication table.

| Column | Type |
|----------|------|
| id | UUID |
| role_id | UUID |
| first_name | VARCHAR |
| last_name | VARCHAR |
| email | VARCHAR UNIQUE |
| phone | VARCHAR UNIQUE |
| password_hash | TEXT |
| avatar_url | TEXT |
| is_verified | BOOLEAN |
| is_active | BOOLEAN |
| last_login | TIMESTAMP |

---

# patients

Patient profile.

| Column |
|----------|
| id |
| user_id |
| patient_code |
| dob |
| gender |
| blood_group |
| occupation |
| address |
| emergency_contact |
| emergency_phone |
| medical_history |
| allergies |
| medications |
| diagnosis |
| referred_by |

---

# therapists

Therapist profile.

| Column |
|----------|
| id |
| user_id |
| registration_number |
| qualification |
| specialization |
| years_experience |
| availability |
| joining_date |
| status |

---

# therapist_availability

Stores working schedule.

| Column |
|----------|
| id |
| therapist_id |
| weekday |
| start_time |
| end_time |
| is_available |

---

# appointments

Patient visits.

| Column |
|----------|
| id |
| patient_id |
| therapist_id |
| scheduled_date |
| start_time |
| end_time |
| visit_type |
| address |
| notes |
| status |

Status

- Scheduled
- Confirmed
- In Progress
- Completed
- Cancelled
- Missed

---

# assessments

Assessment records.

| Column |
|----------|
| id |
| patient_id |
| therapist_id |
| appointment_id |
| assessment_type |
| pain_score |
| diagnosis |
| findings |
| goals |
| recommendations |

Assessment Types

- Initial
- Weekly
- Final

---

# treatment_sessions

Clinical treatment notes.

| Column |
|----------|
| id |
| patient_id |
| therapist_id |
| appointment_id |
| assessment_id |
| session_number |
| pain_before |
| pain_after |
| treatment_notes |
| exercises |
| modalities |
| response |
| start_time |
| end_time |

---

# exercise_programs

Patient-specific exercise plans.

| Column |
|----------|
| id |
| patient_id |
| therapist_id |
| title |
| instructions |
| frequency |
| duration |

---

# exercise_items

Exercises within a program.

| Column |
|----------|
| id |
| exercise_program_id |
| exercise_name |
| category |
| repetitions |
| sets |
| duration |
| image_url |
| video_url |

---

# patient_documents

Uploaded files.

| Column |
|----------|
| id |
| patient_id |
| uploaded_by |
| document_type |
| file_name |
| file_url |
| mime_type |
| file_size |

Document Types

- MRI
- X-Ray
- Prescription
- Lab Report
- Insurance
- Referral

---

# consent_forms

Consent records.

| Column |
|----------|
| id |
| patient_id |
| template_name |
| signed_by |
| signed_at |
| signature_url |
| pdf_url |

---

# progress_media

Clinical media.

| Column |
|----------|
| id |
| patient_id |
| treatment_session_id |
| media_type |
| media_url |
| description |

Types

- Image
- Video

---

# reports

Generated reports.

| Column |
|----------|
| id |
| patient_id |
| therapist_id |
| report_type |
| report_url |
| generated_at |

---

# feedback

Patient feedback.

| Column |
|----------|
| id |
| patient_id |
| therapist_id |
| rating |
| communication |
| professionalism |
| treatment_quality |
| comments |

---

# notifications

Notification history.

| Column |
|----------|
| id |
| user_id |
| title |
| body |
| notification_type |
| read_at |

Types

- Email
- Push
- In-App

---

# billing

Invoice information.

| Column |
|----------|
| id |
| patient_id |
| invoice_number |
| package |
| subtotal |
| tax |
| total |
| due_date |
| status |

---

# payments

Payment records.

| Column |
|----------|
| id |
| billing_id |
| payment_method |
| transaction_reference |
| amount |
| paid_at |
| status |

---

# audit_logs

Tracks system activity.

| Column |
|----------|
| id |
| user_id |
| action |
| entity |
| entity_id |
| old_value |
| new_value |
| ip_address |
| user_agent |
| created_at |

---

# refresh_tokens

Authentication refresh tokens.

| Column |
|----------|
| id |
| user_id |
| token_hash |
| expires_at |
| revoked_at |

---

# otp_requests

OTP verification.

| Column |
|----------|
| id |
| user_id |
| otp_code |
| purpose |
| expires_at |
| verified_at |

Purposes

- Login
- Registration
- Password Reset

---

# 7. Relationships

```
Role
1 ──────── * Users

Users
1 ──────── 1 Patient

Users
1 ──────── 1 Therapist

Patient
1 ──────── * Appointments

Therapist
1 ──────── * Appointments

Appointment
1 ──────── 1 Assessment

Appointment
1 ──────── * Treatment Sessions

Patient
1 ──────── * Documents

Patient
1 ──────── * Reports

Patient
1 ──────── * Exercise Programs

Exercise Program
1 ──────── * Exercise Items

Billing
1 ──────── * Payments
```

---

# 8. Indexes

Create indexes on:

```
email

phone

patient_code

registration_number

scheduled_date

therapist_id

patient_id

appointment_id

assessment_type

status

created_at
```

Composite indexes

```
(patient_id, scheduled_date)

(therapist_id, scheduled_date)

(patient_id, therapist_id)

(status, scheduled_date)
```

---

# 9. Constraints

Unique

```
email

phone

patient_code

registration_number

invoice_number
```

Check Constraints

```
rating BETWEEN 1 AND 5

pain_before BETWEEN 0 AND 10

pain_after BETWEEN 0 AND 10
```

---

# 10. Soft Delete Strategy

Business tables use:

```
is_deleted BOOLEAN

deleted_at TIMESTAMP
```

Records are never physically deleted except for:

- OTP requests
- Expired refresh tokens
- Temporary cache tables

---

# 11. File Storage Strategy

Database stores only metadata.

Actual files reside in object storage.

```
Database

↓

File URL

↓

S3 / Supabase Storage
```

---

# 12. UUID Strategy

Every table uses

```
UUID PRIMARY KEY
```

Generated server-side.

---

# 13. Future Tables

Phase 2

```
teleconsultations

voice_notes

ai_recommendations

exercise_completion

patient_goals

device_tokens
```

Phase 3

```
branches

clinics

tenants

wearable_devices

iot_measurements

ehr_integrations
```

---

# 14. Migration Strategy

- Alembic version-controlled migrations
- Forward-only migrations in production
- Seed reference tables (roles, permissions) after initial migration
- Use transactional migrations where supported
- Test migrations in staging before production deployment

---

# 15. Database Standards

- UTF-8 encoding
- UTC timestamps
- Foreign key enforcement
- Parameterized queries only
- No business logic inside the database
- ORM-managed schema changes
- Readiness for horizontal scaling via read replicas
- Regular backups and point-in-time recovery

---

# 16. Summary

The Kinetix Home Care database schema is designed to support the complete physiotherapy home-care lifecycle while maintaining:

- Strong relational integrity
- High performance
- Security and auditability
- Scalability for future growth
- Compatibility with FastAPI, SQLAlchemy, and PostgreSQL best practices