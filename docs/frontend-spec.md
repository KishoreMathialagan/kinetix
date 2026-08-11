# Frontend Specification
# Kinetix Home Care

**Version:** 1.0  
**Status:** Approved  
**Framework:** Next.js 15+ (App Router)  
**Language:** TypeScript

---

# 1. Purpose

This document defines the frontend architecture, UI standards, component structure, routing strategy, state management, design principles, and implementation guidelines for the Kinetix Home Care platform.

The frontend is responsible for delivering a fast, accessible, mobile-first experience for Admins, Therapists, and Patients while integrating seamlessly with the backend APIs.

---

# 2. Design Goals

The frontend should be:

- Mobile-first
- Fast and responsive
- Accessible (WCAG 2.1 AA)
- Offline-capable (PWA)
- Maintainable
- Feature-driven
- Type-safe
- Component-based
- Secure
- Scalable

---

# 3. Technology Stack

| Layer | Technology |
|--------|------------|
| Framework | Next.js 15+ (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| UI Components | shadcn/ui |
| Icons | Lucide React |
| Animation | Framer Motion |
| Forms | React Hook Form |
| Validation | Zod |
| Server State | TanStack Query |
| Client State | Zustand |
| HTTP Client | Axios |
| Charts | Recharts |
| Tables | TanStack Table |
| Date Utilities | date-fns |
| PWA | next-pwa |

---

# 4. Frontend Architecture

The application follows a **Feature-Driven Architecture**.

```
Application

↓

Route

↓

Page

↓

Feature

↓

Component

↓

Hook

↓

Service

↓

API Client
```

Each feature owns its own:

- Components
- Hooks
- API calls
- Types
- Validation
- State

---

# 5. Folder Structure

```
apps/web/

├── app/
├── assets/
├── components/
├── features/
├── hooks/
├── lib/
├── providers/
├── services/
├── stores/
├── styles/
├── types/
├── public/
└── middleware.ts
```

---

# 6. App Router Structure

```
app/

(auth)
    login/
    forgot-password/

(admin)
    dashboard/
    patients/
    therapists/
    appointments/
    reports/
    billing/
    settings/

(therapist)
    dashboard/
    patients/
    appointments/
    assessments/
    treatments/
    profile/

(patient)
    dashboard/
    appointments/
    exercises/
    progress/
    reports/
    profile/

layout.tsx
page.tsx
loading.tsx
error.tsx
not-found.tsx
```

---

# 7. Feature Structure

Every feature follows:

```
patients/

components/

hooks/

api/

schemas/

types/

store/

utils/

constants/
```

Features must remain independent.

---

# 8. Shared Components

```
components/

buttons/

cards/

dialogs/

forms/

inputs/

tables/

charts/

layout/

navigation/

modals/

feedback/

loading/

empty-state/

common/
```

These components should never contain business logic.

---

# 9. Layout Architecture

The application uses role-based layouts.

### Admin Layout

- Sidebar Navigation
- Header
- Breadcrumb
- Main Content

---

### Therapist Layout

- Mobile Bottom Navigation
- Header
- Floating Action Button
- Main Content

---

### Patient Layout

- Mobile Bottom Navigation
- Header
- Main Content

---

# 10. Navigation

## Admin

- Dashboard
- Patients
- Therapists
- Appointments
- Reports
- Billing
- Settings

---

## Therapist

- Dashboard
- Patients
- Appointments
- Assessments
- Treatments
- Profile

---

## Patient

- Dashboard
- Appointments
- Exercises
- Progress
- Reports
- Profile

---

# 11. Responsive Design

Primary breakpoint targets:

| Device | Width |
|---------|------:|
| Mobile | 320–767 px |
| Tablet | 768–1023 px |
| Desktop | ≥1024 px |

Design mobile-first, then progressively enhance.

---

# 12. State Management

## Global State (Zustand)

- Auth session
- Current user
- Theme
- Notification count

---

## Server State (TanStack Query)

- Patients
- Therapists
- Appointments
- Reports
- Documents
- Assessments

Never duplicate server state in Zustand.

---

## Local State

Use React state for:

- Modal visibility
- Form progress
- Temporary UI interactions

---

# 13. API Layer

All HTTP requests go through a centralized API client.

```
Component

↓

Feature API

↓

Axios Client

↓

Backend API
```

Responsibilities:

- Attach access token
- Refresh expired token
- Standardize error handling
- Retry idempotent requests when appropriate

---

# 14. Forms

Use:

- React Hook Form
- Zod validation

All forms should support:

- Client-side validation
- Server-side error mapping
- Loading state
- Disabled submit during requests

---

# 15. Authentication Flow

```
Login

↓

JWT Stored Securely

↓

Protected Route

↓

Role Detection

↓

Dashboard
```

If token expires:

```
Refresh Token

↓

New Access Token

↓

Retry Request
```

---

# 16. Protected Routes

Protected layouts:

- Admin
- Therapist
- Patient

Checks:

- Authentication
- Role
- Account status

Unauthorized users are redirected to the login page.

---

# 17. Dashboard Design

## Admin

Widgets:

- Active Patients
- Active Therapists
- Today's Appointments
- Pending Assessments
- Recent Activity
- Quick Actions

---

## Therapist

Widgets:

- Today's Visits
- Assigned Patients
- Pending Notes
- Upcoming Appointments

---

## Patient

Widgets:

- Upcoming Appointment
- Assigned Therapist
- Progress Summary
- Exercise Plan
- Recent Reports

---

# 18. Offline Support

Therapists should be able to:

- View assigned patients
- Record treatment notes
- Complete assessments
- Queue uploads

Synchronization occurs automatically when connectivity is restored.

---

# 19. PWA Requirements

Features:

- Installable
- Offline caching
- Splash screen
- App icon
- Background sync
- Push notifications (Phase 2)

---

# 20. Accessibility

Requirements:

- WCAG 2.1 AA
- Keyboard navigation
- Focus indicators
- ARIA labels
- Color contrast compliance
- Screen reader compatibility

---

# 21. Error Handling

Error UI should include:

- Friendly message
- Retry action
- Error ID (optional)
- Contact support link (future)

Dedicated pages:

- 404
- 500
- Offline

---

# 22. Loading States

Use:

- Skeleton loaders
- Progress indicators
- Button loading spinners

Avoid blocking the UI unnecessarily.

---

# 23. Empty States

Every data-driven page should define meaningful empty states.

Examples:

- No Patients
- No Appointments
- No Reports
- No Notifications

Include a primary action where appropriate.

---

# 24. Tables

Use TanStack Table.

Capabilities:

- Sorting
- Filtering
- Pagination
- Column visibility
- Row selection
- CSV export (future)

---

# 25. Charts

Use Recharts.

Supported charts:

- Line
- Bar
- Area
- Pie
- Progress indicators

Applications:

- Pain trend
- ROM improvement
- Session history
- Therapist productivity

---

# 26. File Upload

Supported:

- Drag & drop
- Mobile file picker
- Camera capture (mobile)

Supported types:

- PDF
- JPG
- PNG
- DOCX (optional)

Display:

- Upload progress
- Preview
- Validation errors

---

# 27. Notifications

Display:

- Toast notifications
- In-app notification center
- Badge counters

Future:

- Push notifications

---

# 28. Performance Standards

Targets:

| Metric | Target |
|---------|--------|
| Initial Load | <2 s |
| Route Transition | <300 ms |
| API Response Display | <500 ms |
| Lighthouse Performance | ≥90 |
| Accessibility Score | ≥95 |

Techniques:

- Code splitting
- Lazy loading
- Dynamic imports
- Image optimization
- Route prefetching
- Query caching

---

# 29. Styling Standards

- Tailwind utility-first styling
- Centralized design tokens
- Consistent spacing scale
- Responsive typography
- Minimal custom CSS
- Dark mode ready (future)

---

# 30. Internationalization

Version 1:

- English

Future:

- Tamil
- Hindi
- Additional regional languages

Use an i18n-compatible architecture from the start.

---

# 31. Security

Frontend responsibilities:

- Never expose secrets
- Sanitize user-generated content
- Store tokens securely
- Prevent XSS where possible
- Validate uploads before sending
- Enforce HTTPS

---

# 32. Testing

Testing stack:

- Vitest
- React Testing Library
- Playwright (E2E)

Coverage goals:

- Components ≥80%
- Hooks ≥90%
- Critical user flows 100%

---

# 33. Coding Standards

- Strict TypeScript
- Functional components only
- Reusable components
- No duplicated UI logic
- Feature isolation
- Prefer composition over inheritance
- Consistent naming conventions
- Avoid deeply nested component trees

---

# 34. Future Enhancements

Version 2:

- Push notifications
- Offline media uploads
- Voice recording
- Advanced charts

Version 3:

- Tele-rehabilitation UI
- AI assistant
- Real-time collaboration
- Multi-clinic dashboard

---

# 35. Frontend Principles

1. Mobile-first design.
2. Feature-first organization.
3. Keep components small and reusable.
4. Separate UI from business logic.
5. Use server state management for API data.
6. Validate forms on both client and server.
7. Prioritize accessibility and performance.
8. Ensure graceful handling of offline scenarios.
9. Maintain visual consistency through a shared design system.
10. Build for scalability and future feature expansion.

---

# 36. Definition of Done

A frontend feature is complete only when:

- Route implemented
- Responsive layout verified
- UI components reusable
- Form validation complete
- API integration complete
- Loading and error states handled
- Empty state implemented
- Accessibility reviewed
- Unit tests passing
- E2E flow validated
- Documentation updated