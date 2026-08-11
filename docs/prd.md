# Product Requirements Document (PRD)
# Kinetix Home Care

**Version:** 1.0  
**Status:** Approved  
**Document Owner:** Product Team  
**Project Type:** Mobile-First Progressive Web Application (PWA)

---

# 1. Executive Summary

## Product Name

**Kinetix Home Care**

## Product Vision

Kinetix Home Care is a mobile-first digital platform designed to digitize and streamline the complete physiotherapy home care lifecycle.

The platform enables clinic administrators, physiotherapists, and patients to manage every stage of treatment—from patient onboarding and therapist assignment to assessments, treatment sessions, progress tracking, and discharge—through a secure, centralized, and paperless system.

The application prioritizes simplicity, speed, accessibility, and mobile usability for therapists working in the field.

---

# 2. Problem Statement

Most physiotherapy home care providers still depend on fragmented and manual processes, including:

- Paper-based assessment forms
- Excel spreadsheets
- WhatsApp communication
- Manual scheduling
- Physical consent forms
- Unstructured patient documentation

These challenges lead to:

- Lost or incomplete patient records
- Scheduling conflicts
- Poor therapist workload management
- Limited treatment visibility
- Slow report generation
- Administrative overhead
- Inconsistent documentation
- Lack of operational insights

---

# 3. Product Goals

## Business Goals

- Digitize clinic operations
- Reduce paperwork by more than 80%
- Improve therapist productivity
- Increase operational efficiency
- Standardize clinical documentation
- Improve patient satisfaction
- Enable data-driven decision making
- Build a scalable platform for future multi-clinic expansion

---

## User Goals

### Admin

- Register patients quickly
- Assign therapists efficiently
- Monitor ongoing treatments
- Generate reports instantly
- Manage clinic operations from one dashboard

---

### Therapist

- Access patient information anywhere
- Record treatment digitally
- Track recovery progress
- Reduce documentation time
- View daily schedules on mobile

---

### Patient

- View appointments
- Access treatment progress
- Follow prescribed exercises
- Download reports
- Provide treatment feedback

---

# 4. Success Metrics

## Business

- 80% reduction in paperwork
- 50% faster patient onboarding
- 30% improvement in therapist utilization
- Reduced appointment conflicts
- Increased patient retention

---

## Product

- Dashboard loads under 2 seconds
- 99.9% uptime
- Less than 1% failed appointment records
- 95% digital treatment documentation

---

## User Experience

- High therapist adoption
- High patient satisfaction
- Reduced missed appointments
- Faster report generation

---

# 5. Target Users

## Primary Users

### Clinic Administrator

Responsible for operational management.

---

### Physiotherapist

Provides home physiotherapy treatment.

---

### Patient

Receives physiotherapy care.

---

# 6. User Roles

---

## Admin

### Responsibilities

- Manage clinic
- Register patients
- Manage therapists
- Assign therapists
- Schedule appointments
- Upload consent forms
- Manage documents
- Generate reports
- View analytics
- Manage users

### Permissions

- Full platform access
- CRUD all records
- View reports
- Manage settings

---

## Therapist

### Responsibilities

- View assigned patients
- Perform assessments
- Record treatment sessions
- Upload clinical media
- Update patient progress
- Prepare discharge summary

### Permissions

- Access assigned patients only
- Create and update treatment records
- Upload clinical documents

---

## Patient

### Responsibilities

- Maintain profile
- Upload medical records
- View appointments
- View progress
- Follow exercise plans
- Download reports
- Submit feedback

### Permissions

- Access own information only

---

# 7. Functional Scope

## Authentication

Features

- Login
- Registration
- Forgot Password
- Reset Password
- OTP Verification
- JWT Authentication
- Refresh Tokens
- Role-Based Access Control

---

## Patient Management

Admin can

- Register patients
- Edit profiles
- Archive patients
- Upload records
- View history

Patient profile includes

- Personal details
- Medical history
- Allergies
- Medications
- Emergency contacts
- Uploaded documents

---

## Therapist Management

Admin can

- Add therapists
- Manage availability
- Assign patients
- Track workload
- View attendance

---

## Appointment Management

Features

- Schedule appointments
- Assign therapists
- Calendar view
- Reschedule
- Cancel
- Visit status tracking
- Notifications

Appointment Status

- Scheduled
- Confirmed
- In Progress
- Completed
- Cancelled
- Missed

---

## Assessment Module

### Initial Assessment

Includes

- Chief complaint
- Pain score
- Range of motion
- Muscle strength
- Functional status
- Balance
- Gait
- Diagnosis
- Treatment goals

---

### Weekly Assessment

Includes

- Progress review
- Pain improvement
- Functional improvement
- Compliance
- Therapist observations

---

### Final Assessment

Includes

- Outcome measures
- Goal achievement
- Home exercise recommendations
- Discharge readiness

---

## Treatment Sessions

Each treatment session records

- Visit date
- Start time
- End time
- Session notes
- Techniques used
- Exercises performed
- Pain before
- Pain after
- Patient response
- Clinical media
- Therapist signature

---

## Exercise Module

Patients can

- View exercise plans
- Watch videos
- Read instructions
- Track completion

Exercise includes

- Name
- Description
- Sets
- Repetitions
- Duration
- Images
- Videos

---

## Progress Tracking

Displays

- Pain trend
- ROM improvement
- Strength improvement
- Session history
- Goal completion
- Progress timeline

---

## Document Management

Supports

- Medical reports
- MRI
- X-Ray
- Prescriptions
- Consent forms
- Referral letters
- Discharge summaries

---

## Consent Management

Features

- Upload templates
- Digital signatures
- Timestamp
- PDF generation
- Version history

---

## Reports

Admin

- Patient statistics
- Therapist performance
- Appointment reports
- Revenue
- Outcomes

Therapist

- Patient progress
- Session history
- Weekly workload

Patient

- Progress reports
- Exercise plans
- Discharge summary

---

## Feedback

Patient can rate

- Therapist
- Communication
- Treatment quality
- Overall experience

---

## Billing (Phase 2)

Features

- Packages
- Invoices
- Payments
- GST
- Receipts

---

# 8. Non-Functional Requirements

## Performance

- Dashboard < 2 seconds
- Optimized API responses
- Lazy loading
- Pagination
- Efficient caching

---

## Security

- JWT Authentication
- RBAC
- Password hashing
- HTTPS
- Audit logs
- Secure file storage
- Rate limiting

---

## Reliability

- 99.9% uptime
- Automatic backups
- Error monitoring
- Disaster recovery

---

## Scalability

- Multi-branch ready
- Multi-clinic ready
- Cloud-native architecture
- Horizontal backend scaling

---

## Accessibility

- WCAG 2.1 AA compliance
- Keyboard navigation
- Screen reader support
- High contrast compatibility

---

# 9. User Journey

```
Patient Registration

↓

Medical History

↓

Document Upload

↓

Consent Form

↓

Therapist Assignment

↓

Initial Assessment

↓

Treatment Plan

↓

Treatment Sessions

↓

Weekly Assessments

↓

Progress Tracking

↓

Final Assessment

↓

Discharge Summary

↓

Patient Feedback
```

---

# 10. MVP Scope

## Included

- Authentication
- Role management
- Patient management
- Therapist management
- Appointment scheduling
- Assessments
- Treatment sessions
- Progress tracking
- Exercise plans
- Document management
- Consent forms
- Feedback
- Reports
- PWA support

---

## Excluded

- Billing
- Online payments
- AI features
- Teleconsultation
- Wearable integrations
- Multi-clinic management

---

# 11. Future Enhancements

## Phase 2

- Billing & invoicing
- Push notifications
- Email reminders
- Inventory management
- Exercise compliance tracking

---

## Phase 3

- AI SOAP note generation
- Voice-to-text documentation
- AI treatment recommendations
- Recovery prediction
- Smart therapist scheduling
- Tele-rehabilitation
- Wearable integration

---

# 12. Risks

| Risk | Mitigation |
|-------|------------|
| Poor internet connectivity | Offline-first support with background sync |
| User resistance to digital workflows | Intuitive UI and onboarding |
| Sensitive medical data | Encryption, RBAC, audit logs |
| Scheduling conflicts | Real-time availability checks |
| Data loss | Automated backups and versioning |

---

# 13. Assumptions

- Therapists primarily use smartphones.
- Administrators use both desktop and mobile.
- Patients have basic smartphone literacy.
- Internet connectivity may be intermittent during home visits.
- Cloud infrastructure will be available for deployment.

---

# 14. Out of Scope

The following are intentionally excluded from Version 1.0:

- Hospital Information System (HIS) integration
- Insurance claim processing
- Pharmacy management
- Laboratory management
- Telemedicine consultations
- Wearable device integration
- AI-powered clinical decision support
- Multi-language support (planned for future releases)

---

# 15. Release Plan

## Version 1.0 (MVP)

- Core clinical workflow
- Patient management
- Therapist management
- Assessments
- Treatment sessions
- Progress tracking
- Reports

---

## Version 1.5

- Billing
- Notifications
- Inventory
- Advanced reporting

---

## Version 2.0

- AI features
- Voice documentation
- Predictive analytics
- Tele-rehabilitation

---

## Version 3.0

- Multi-clinic SaaS
- Multi-branch support
- Wearable integrations
- Healthcare interoperability (FHIR/HL7)

---

# 16. Product Summary

Kinetix Home Care aims to become a comprehensive digital platform for physiotherapy home care by replacing fragmented manual processes with a secure, mobile-first, paperless solution. The product focuses on improving operational efficiency, enhancing therapist productivity, and providing patients with greater visibility into their rehabilitation journey, while establishing a scalable foundation for future AI-powered and multi-clinic capabilities.