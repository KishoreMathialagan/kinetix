# Kinetix Home Care — Master Specification

Version: 1.0
Status: Approved
Product Type: Mobile-First Progressive Web Application (PWA)

---

# 1. Product Overview

Kinetix Home Care is a mobile-first physiotherapy home care management platform that digitizes the complete patient journey from registration to discharge.

The platform enables administrators, physiotherapists, and patients to collaborate through a centralized, secure, and paperless workflow.

The application should be optimized primarily for smartphones while remaining fully responsive on tablets and desktops.

---

# 2. Objectives

The system shall:

- Digitize all physiotherapy home care workflows.
- Eliminate paper documentation.
- Improve therapist productivity.
- Improve patient experience.
- Provide centralized patient records.
- Enable real-time progress tracking.
- Standardize assessments and treatment documentation.
- Support clinic growth with scalable architecture.

---

# 3. User Roles

There are three user roles.

## 3.1 Admin

The clinic administrator manages all operational activities.

### Responsibilities

- Manage clinic information
- Register patients
- Manage therapists
- Assign therapists
- Schedule appointments
- Upload consent forms
- Manage documents
- View reports
- Manage billing
- Manage permissions
- Monitor therapist workload
- Monitor patient progress

### Permissions

Full system access.

Can create, update, delete:

- Patients
- Therapists
- Appointments
- Assessments
- Reports
- Billing
- Users
- Roles

---

## 3.2 Therapist

Responsible for clinical care.

### Responsibilities

- View assigned patients
- Review patient history
- Complete assessments
- Record treatment sessions
- Upload media
- Update progress
- Track outcomes
- Create discharge summary
- Recommend home exercises

### Permissions

Can access only assigned patients.

Cannot:

- View other therapists
- Modify administration
- Access billing
- Manage users

---

## 3.3 Patient

Receives physiotherapy treatment.

### Responsibilities

- Register profile
- Upload medical documents
- View appointments
- View therapist
- View progress
- Follow exercise plans
- Sign consent forms
- Download reports
- Submit feedback

### Permissions

Can access only own information.

Cannot modify clinical records.

---

# 4. Complete Patient Journey

Patient Registration

↓

Patient Verification

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

Weekly Assessment

↓

Progress Tracking

↓

Goal Review

↓

Discharge Assessment

↓

Discharge Summary

↓

Feedback

---

# 5. System Modules

## Authentication

Features

- Login
- Registration
- Forgot Password
- OTP Verification
- Role-based login
- Session management
- JWT authentication

---

## Dashboard

### Admin Dashboard

Displays

- Active patients
- Today's appointments
- Therapist availability
- Revenue
- Pending assessments
- Patient statistics
- Therapist statistics
- Recent activities

---

### Therapist Dashboard

Displays

- Today's schedule
- Assigned patients
- Pending assessments
- Upcoming visits
- Recent sessions

---

### Patient Dashboard

Displays

- Upcoming appointment
- Assigned therapist
- Treatment progress
- Exercise plan
- Reports
- Notifications

---

# 6. Patient Management

Patient profile includes:

## Personal Information

- Full Name
- Date of Birth
- Gender
- Phone Number
- Email
- Address
- Blood Group
- Occupation
- Emergency Contact

## Medical Information

- Diagnosis
- Medical History
- Surgical History
- Allergies
- Current Medications
- Chronic Diseases
- Lifestyle
- Physician Referral

## Documents

- MRI
- X-Ray
- Prescriptions
- Medical Reports
- Insurance
- Referral Letter

---

# 7. Therapist Management

Therapist profile includes

- Name
- Qualification
- Registration Number
- Specialization
- Experience
- Availability
- Assigned Patients
- Performance
- Attendance

---

# 8. Appointment Management

Appointment information

- Patient
- Therapist
- Date
- Time
- Duration
- Visit Type
- Status
- Address
- Notes

Appointment Status

- Scheduled
- Confirmed
- Started
- Completed
- Cancelled
- Missed

---

# 9. Assessment Module

## Initial Assessment

Includes

Pain Assessment

- NPRS
- VAS

Physical Assessment

- ROM
- Muscle Strength
- Flexibility
- Balance
- Coordination
- Gait

Functional Assessment

- ADL
- Functional Independence
- Mobility

Clinical Findings

Diagnosis

Goals

Treatment Plan

---

## Weekly Assessment

Includes

Pain

ROM

Strength

Compliance

Progress Notes

Outcome Measures

---

## Final Assessment

Includes

Goals Achieved

Remaining Problems

Recommendations

Home Exercise Program

Outcome Score

---

# 10. Treatment Session

Every treatment session stores

- Date
- Start Time
- End Time
- Therapist
- Session Notes
- Modalities
- Exercises
- Manual Therapy
- Pain Before
- Pain After
- Progress Notes
- Media
- Signature

---

# 11. Exercise Module

Exercise

- Name
- Category
- Description
- Frequency
- Duration
- Sets
- Repetitions
- Images
- Videos

Patients can mark exercises completed.

---

# 12. Progress Tracking

Track

Pain Trend

ROM Improvement

Strength Improvement

Session Count

Goal Achievement

Outcome Measures

Recovery Timeline

Progress Images

Weekly Reports

---

# 13. Document Management

Supported documents

- Medical Reports
- Consent Forms
- MRI
- X-Ray
- Lab Reports
- Prescriptions
- Assessment PDFs
- Discharge Summary

---

# 14. Consent Forms

Features

- Upload template
- Digital signature
- Timestamp
- Version history
- PDF download

---

# 15. Notifications

System notifications

Appointment Reminder

Treatment Reminder

Exercise Reminder

Assessment Due

Payment Due

New Report

Discharge Complete

---

# 16. Billing (Optional MVP)

Features

Treatment Packages

Invoices

Payments

Receipts

Outstanding Balance

Payment History

GST Invoice

---

# 17. Reports

## Admin Reports

Patient Statistics

Therapist Productivity

Appointments

Revenue

Treatment Outcomes

Feedback

Clinic Performance

---

## Therapist Reports

Patients

Sessions

Progress

Outcomes

Attendance

---

## Patient Reports

Progress

Sessions

Exercises

Outcome Measures

Discharge Summary

---

# 18. Feedback Module

Patient can rate

- Therapist
- Communication
- Treatment Quality
- Overall Experience

Optional written review.

---

# 19. User Workflows

## Admin Workflow

Login

↓

Dashboard

↓

Register Patient

↓

Upload Documents

↓

Assign Therapist

↓

Schedule Appointment

↓

Monitor Progress

↓

Generate Reports

---

## Therapist Workflow

Login

↓

Today's Schedule

↓

Open Patient

↓

Assessment

↓

Treatment Session

↓

Upload Notes

↓

Update Progress

↓

Complete Visit

---

## Patient Workflow

Login

↓

Dashboard

↓

Appointments

↓

Exercise Plan

↓

Progress

↓

Reports

↓

Feedback

---

# 20. Security

- JWT Authentication
- Refresh Tokens
- RBAC
- Audit Logs
- Secure File Storage
- HTTPS
- Password Hashing
- Session Timeout

---

# 21. Performance Requirements

Dashboard < 2 seconds

API < 500 ms average

Offline-first therapist support

Automatic synchronization

Responsive on

- Mobile
- Tablet
- Desktop

---

# 22. Future AI Features

Phase 2

- AI SOAP Notes
- Voice Dictation
- AI Treatment Suggestions
- Exercise Recommendation
- Recovery Prediction
- AI Patient Assistant

Phase 3

- Wearable Integration
- Teleconsultation
- Smart Scheduling
- Predictive Analytics
- AI Risk Detection
- Multi-clinic Management

---

# 23. MVP Scope

Included

- Authentication
- Role Management
- Patient Management
- Therapist Management
- Appointment Scheduling
- Assessments
- Treatment Sessions
- Progress Tracking
- Exercise Plans
- Consent Forms
- Document Management
- Feedback
- Reports

Excluded

- Billing
- AI Features
- Teleconsultation
- Wearables
- Online Payments

---

# 24. Recommended Tech Stack

Frontend

- Next.js
- TypeScript
- Tailwind CSS
- shadcn/ui
- Framer Motion
- React Query
- PWA

Backend

- FastAPI
- SQLAlchemy
- PostgreSQL
- Redis
- Celery

Storage

- Supabase Storage / AWS S3

Authentication

- JWT
- Refresh Token

Deployment

- Frontend: Vercel
- Backend: Railway/Render
- Database: PostgreSQL

---

# 25. Success Metrics

Business

- 80% reduction in paperwork
- 90% digital documentation
- Reduced scheduling conflicts
- Improved therapist utilization

Clinical

- Complete assessment compliance
- Improved treatment tracking
- Faster discharge process

Technical

- 99.9% uptime
- <2 second dashboard load
- Zero data loss
- Secure audit trail

---

# 26. Future Roadmap

Version 1.0
- Core Physiotherapy Home Care Platform

Version 1.5
- Billing
- Inventory
- Push Notifications

Version 2.0
- AI Clinical Assistant
- Voice Documentation
- Predictive Recovery Analytics

Version 3.0
- Multi-Branch Support
- Multi-Clinic SaaS
- Tele-Rehabilitation
- Wearable Device Integration