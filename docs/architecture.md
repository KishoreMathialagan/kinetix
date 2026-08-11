# Architecture Specification
## Kinetix Home Care

**Document Version:** 1.0  
**Status:** Approved  
**Last Updated:** July 2026

---

# 1. Purpose

This document defines the overall software architecture of the **Kinetix Home Care** platform.

It serves as the technical blueprint for developers, architects, QA engineers, and DevOps teams by describing the system structure, module interactions, technology stack, architectural patterns, and deployment strategy.

This document should be read alongside:

- master-spec.md
- database-schema.md
- backend-spec.md
- frontend-spec.md
- api-spec.md

---

# 2. Architecture Goals

The architecture is designed to achieve the following goals:

- Mobile-first user experience
- High performance
- Modular architecture
- Easy maintenance
- Scalability
- Security
- Reliability
- Cloud-native deployment
- Offline support for therapists
- Future AI integration

---

# 3. Architecture Overview

Kinetix Home Care follows a modern layered architecture.

```
                        Users

     Admin     Therapist     Patient
             │
             ▼
      Next.js Progressive Web App
             │
             ▼
      REST API (FastAPI Backend)
             │
 ┌───────────┼────────────┐
 │           │            │
 ▼           ▼            ▼
Redis     PostgreSQL    Object Storage
(Cache)     Database      (S3/Supabase)

             │
             ▼
      Background Workers
          (Celery)

             │
             ▼
 Notification Services
 Email / Push / SMS
```

---

# 4. Architectural Style

The platform follows:

- Layered Architecture
- Feature-first Organization
- Domain Driven Design (DDD)
- Repository Pattern
- Service Layer Pattern
- REST API Architecture
- Event-driven background processing
- Mobile-first UI Architecture

---

# 5. High-Level Components

## Frontend

Technology

- Next.js (App Router)
- TypeScript
- React
- Tailwind CSS
- shadcn/ui
- React Query
- Zustand
- Framer Motion

Responsibilities

- User Interface
- Routing
- Client Validation
- API Communication
- Offline Support
- PWA Installation
- Push Notifications

---

## Backend

Technology

- FastAPI
- SQLAlchemy
- Alembic
- PostgreSQL
- Redis
- Celery

Responsibilities

- Business Logic
- Authentication
- Authorization
- Validation
- File Management
- Notifications
- Reporting

---

## Database

Technology

PostgreSQL

Responsibilities

- User Data
- Clinical Records
- Appointments
- Assessments
- Documents
- Reports
- Billing

---

## Cache Layer

Redis

Used for

- Sessions
- OTP
- Rate Limiting
- Background Tasks
- Frequently Accessed Data

---

## Object Storage

Stores

- Patient Documents
- Exercise Videos
- Progress Photos
- Reports
- Consent Forms

Recommended

- AWS S3
or
- Supabase Storage

---

# 6. Project Structure

```
kinetix-home-care/

apps/
    web/
    api/

packages/
    ui/
    shared-types/
    config/
    utils/

docs/

docker/

scripts/

infrastructure/
```

---

# 7. Frontend Architecture

The frontend follows Feature Driven Design.

```
Features

Authentication

Patients

Therapists

Appointments

Assessments

Treatments

Exercises

Reports

Dashboard

Notifications
```

Each feature owns

- Components
- Hooks
- API
- Types
- Store
- Validation
- Pages

No feature should directly depend on another feature.

Communication happens through services.

---

# 8. Backend Architecture

The backend follows Domain Driven Design.

Each module contains

```
Module

Router

Service

Repository

Schema

Model

Permissions

Validators

Exceptions
```

Business logic never exists inside routers.

Routers call Services.

Services call Repositories.

Repositories communicate with the database.

---

# 9. Layered Architecture

```
Presentation Layer

↓

API Layer

↓

Service Layer

↓

Repository Layer

↓

Database
```

### Presentation Layer

Handles UI.

### API Layer

Handles HTTP.

### Service Layer

Business rules.

### Repository Layer

Database communication.

### Database

Persistent storage.

---

# 10. Authentication Flow

```
User Login

↓

JWT Access Token

↓

Refresh Token

↓

Protected API

↓

Role Validation

↓

Response
```

Authentication uses

- JWT
- Refresh Tokens
- HTTP-only Cookies (optional)
- RBAC

---

# 11. Authorization

Role Based Access Control

Roles

- Admin
- Therapist
- Patient

Every endpoint validates

- Authentication
- Role
- Ownership
- Permissions

---

# 12. API Architecture

REST API

```
/api/v1/

auth

patients

therapists

appointments

assessments

treatments

documents

reports

dashboard
```

Versioning

```
/api/v1/
/api/v2/
```

Future versions remain backward compatible.

---

# 13. State Management

Global State

- Authentication
- User
- Theme
- Notifications

Feature State

React Query

Local State

React Hooks

Avoid unnecessary global state.

---

# 14. Data Flow

```
User

↓

UI

↓

API Client

↓

REST API

↓

Service

↓

Repository

↓

Database

↓

Response

↓

UI Update
```

---

# 15. Offline Architecture

Therapists may work without internet.

Offline features

- View assigned patients
- Record treatment notes
- Save assessments
- Upload later
- Queue API requests

Synchronization

```
Offline

↓

Local Storage

↓

Reconnect

↓

Background Sync

↓

Server

↓

Conflict Resolution
```

---

# 16. Background Processing

Tasks executed asynchronously

- Email
- Push Notifications
- PDF Generation
- Image Compression
- Report Generation
- Scheduled Reminders

Technology

Celery + Redis

---

# 17. File Storage

Uploads

Documents

Images

Videos

Reports

Storage Flow

```
User

↓

Upload

↓

Backend Validation

↓

Object Storage

↓

Database Reference

↓

Download URL
```

---

# 18. Security Architecture

Authentication

JWT

Authorization

RBAC

Passwords

Argon2/Bcrypt

Transport

HTTPS

Headers

Security Headers

Validation

Pydantic

Rate Limiting

Redis

Audit Logs

Every important action

Encryption

Sensitive data encrypted

---

# 19. Logging

Application Logs

API Logs

Authentication Logs

Error Logs

Audit Logs

Recommended

Structured JSON logging.

---

# 20. Error Handling

Global exception handler

Consistent response

Example

```
{
    "success": false,
    "message": "Patient not found",
    "code": "PATIENT_NOT_FOUND"
}
```

---

# 21. Notifications

Supported

Email

Push Notifications

In-App Notifications

Future

SMS

WhatsApp

---

# 22. Performance Strategy

Caching

Redis

Lazy Loading

Frontend

Image Optimization

Next.js Image

Pagination

Large datasets

Compression

Gzip/Brotli

Code Splitting

Dynamic imports

Database Indexing

Optimized queries

---

# 23. Scalability Strategy

Stateless Backend

Horizontal Scaling

Load Balancer

Database Indexes

Background Workers

Separate Storage

API Versioning

Feature Modules

Future Multi-clinic Support

---

# 24. Deployment Architecture

```
Users

↓

Cloudflare (Optional)

↓

Vercel

↓

FastAPI Backend

↓

PostgreSQL

↓

Redis

↓

Object Storage
```

Deployment

Frontend

Vercel

Backend

Railway / Render / Azure

Database

Supabase PostgreSQL

Storage

AWS S3

Monitoring

Sentry

Uptime Robot

---

# 25. Monitoring

Monitor

API Health

Database

Background Workers

Errors

Performance

Storage

Recommended

- Sentry
- Prometheus
- Grafana
- Uptime Robot

---

# 26. Disaster Recovery

Automatic Backups

Daily Database Backup

Storage Replication

Audit Logs

Recovery Procedures

Rollback Strategy

---

# 27. Future Architecture

Version 2

- AI SOAP Notes
- Voice Documentation
- AI Recovery Prediction
- AI Exercise Recommendation

Version 3

- Teleconsultation
- Wearables
- Multi-Branch Support
- Multi-Tenant SaaS
- Healthcare Integrations (FHIR/HL7)

---

# 28. Architecture Principles

The Kinetix Home Care platform shall adhere to the following principles:

1. Mobile-first design.
2. Feature-first code organization.
3. Separation of concerns.
4. Domain-driven module boundaries.
5. Stateless backend services.
6. Secure-by-default implementation.
7. Reusable UI components.
8. API-first development.
9. Documentation-first workflow.
10. Cloud-native deployment.
11. Scalable and maintainable codebase.
12. High test coverage and continuous integration.
13. Accessibility (WCAG 2.1 AA) compliance.
14. Performance optimization at every layer.
15. Extensibility for future AI and multi-clinic capabilities.

---

# 29. Architecture Decision Records (ADRs)

| Decision | Choice | Reason |
|----------|--------|--------|
| Frontend | Next.js (App Router) | SEO, PWA support, excellent developer experience |
| Backend | FastAPI | High performance, automatic OpenAPI generation, Python ecosystem |
| Database | PostgreSQL | ACID compliance, reliability, scalability |
| ORM | SQLAlchemy | Mature ORM with strong ecosystem |
| State Management | React Query + Zustand | Clear separation of server and client state |
| Authentication | JWT + Refresh Tokens | Stateless, scalable authentication |
| Cache | Redis | Fast caching, sessions, queues |
| Background Jobs | Celery | Reliable asynchronous task processing |
| File Storage | AWS S3 / Supabase Storage | Durable, scalable object storage |
| UI Framework | Tailwind CSS + shadcn/ui | Consistent, accessible component system |
| Deployment | Vercel + Railway/Render | Modern cloud-native deployment pipeline |

---

# 30. Conclusion

This architecture provides a modular, secure, and scalable foundation for Kinetix Home Care. It supports current requirements—patient management, therapist workflows, assessments, treatment tracking, and reporting—while remaining extensible for future capabilities such as AI-assisted documentation, tele-rehabilitation, wearable integration, and multi-clinic SaaS deployment.