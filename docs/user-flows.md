# User Flows
# Kinetix Home Care

**Version:** 1.0  
**Status:** Approved

---

# 1. Purpose

This document defines every major user journey within Kinetix Home Care.

It describes how Admins, Therapists, and Patients interact with the platform throughout the physiotherapy home care lifecycle.

These workflows serve as the reference for:

- UI/UX Design
- Frontend Development
- Backend Development
- API Design
- QA Testing

---

# 2. Primary Users

There are three primary user roles.

- Admin
- Therapist
- Patient

---

# 3. Complete Patient Journey

```
Patient Registration
        │
        ▼
Medical History Collection
        │
        ▼
Document Upload
        │
        ▼
Consent Form Signing
        │
        ▼
Therapist Assignment
        │
        ▼
Appointment Scheduling
        │
        ▼
Initial Assessment
        │
        ▼
Treatment Plan
        │
        ▼
Treatment Sessions
        │
        ▼
Weekly Assessments
        │
        ▼
Progress Tracking
        │
        ▼
Goal Achievement Review
        │
        ▼
Final Assessment
        │
        ▼
Discharge Summary
        │
        ▼
Patient Feedback
```

---

# 4. Authentication Flow

```
Open Application
        │
        ▼
Login Screen
        │
        ▼
Enter Credentials
        │
        ▼
Authentication
        │
        ▼
JWT Generated
        │
        ▼
Role Detection
        │
        ▼
Redirect Dashboard
```

If authentication fails:

```
Login

↓

Invalid Credentials

↓

Error Message

↓

Retry Login
```

---

# 5. Admin Workflow

## Dashboard

```
Login

↓

Admin Dashboard

↓

View Today's Summary

↓

Select Module
```

Dashboard widgets include:

- Active Patients
- Active Therapists
- Today's Visits
- Pending Assessments
- Notifications
- Revenue (Future)
- Recent Activities

---

# 6. Patient Registration Flow

```
Dashboard

↓

Patients

↓

Add Patient

↓

Enter Personal Details

↓

Medical History

↓

Emergency Contact

↓

Upload Documents

↓

Save Patient

↓

Generate Patient ID

↓

Success
```

---

# 7. Therapist Registration Flow

```
Dashboard

↓

Therapists

↓

Add Therapist

↓

Personal Information

↓

Qualification

↓

Specialization

↓

Availability

↓

Save

↓

Therapist Created
```

---

# 8. Therapist Assignment Flow

```
Open Patient

↓

Assign Therapist

↓

View Available Therapists

↓

Select Therapist

↓

Confirm Assignment

↓

Notification Sent

↓

Appointment Scheduling
```

Validation

- Therapist availability
- Workload
- Service location
- Active status

---

# 9. Appointment Scheduling Flow

```
Patient Profile

↓

Schedule Appointment

↓

Select Date

↓

Select Time

↓

Select Therapist

↓

Confirm

↓

Appointment Created

↓

Notifications Sent
```

Possible outcomes

- Scheduled
- Rescheduled
- Cancelled
- Missed

---

# 10. Therapist Daily Workflow

```
Login

↓

Therapist Dashboard

↓

Today's Appointments

↓

Navigate To Patient

↓

Start Visit

↓

Treatment Session

↓

Complete Session

↓

Sync Data

↓

Next Patient
```

---

# 11. Patient Visit Workflow

```
Open Patient

↓

Review History

↓

Review Previous Notes

↓

Start Assessment

↓

Create Treatment Plan

↓

Begin Treatment

↓

Complete Notes

↓

Save Session
```

---

# 12. Initial Assessment Flow

```
Appointment

↓

Initial Assessment

↓

Chief Complaint

↓

Pain Assessment

↓

ROM Assessment

↓

Muscle Strength

↓

Functional Assessment

↓

Clinical Findings

↓

Diagnosis

↓

Goals

↓

Treatment Plan

↓

Save Assessment
```

---

# 13. Treatment Session Flow

```
Open Today's Visit

↓

Start Timer

↓

Pain Before

↓

Treatment Techniques

↓

Exercises

↓

Modalities

↓

Patient Response

↓

Pain After

↓

Clinical Notes

↓

Upload Images

↓

Digital Signature

↓

Complete Session
```

---

# 14. Weekly Assessment Flow

```
Patient Timeline

↓

Weekly Assessment

↓

Compare Previous Scores

↓

Update Progress

↓

Update Goals

↓

Recommendations

↓

Save
```

---

# 15. Progress Tracking Flow

```
Patient Profile

↓

Progress

↓

Pain Trend

↓

ROM Trend

↓

Strength Trend

↓

Session Timeline

↓

Goal Completion
```

---

# 16. Exercise Plan Workflow

```
Treatment Plan

↓

Assign Exercises

↓

Select Exercise Library

↓

Frequency

↓

Duration

↓

Instructions

↓

Publish

↓

Patient Notification
```

---

# 17. Patient Exercise Flow

```
Patient Dashboard

↓

Exercise Plan

↓

Watch Exercise Video

↓

Perform Exercise

↓

Mark Complete

↓

Progress Updated
```

---

# 18. Document Upload Flow

```
Patient Profile

↓

Documents

↓

Upload

↓

Validation

↓

Virus Scan

↓

Cloud Storage

↓

Database Entry

↓

Available For Viewing
```

Supported documents

- MRI
- X-Ray
- Prescription
- Lab Reports
- Referral
- Consent Forms

---

# 19. Consent Form Flow

```
Patient Profile

↓

Consent Form

↓

Read Document

↓

Digital Signature

↓

Timestamp

↓

Store PDF

↓

Completed
```

---

# 20. Discharge Workflow

```
Treatment Complete

↓

Final Assessment

↓

Outcome Measures

↓

Home Exercise Plan

↓

Recommendations

↓

Generate Discharge Summary

↓

Patient Review

↓

Discharge
```

---

# 21. Patient Dashboard Workflow

```
Login

↓

Dashboard

↓

Upcoming Appointment

↓

Progress

↓

Exercise Plan

↓

Reports

↓

Feedback
```

Patient can

- View therapist
- View appointments
- Download reports
- View exercises
- Track progress

---

# 22. Report Generation Flow

```
Select Report

↓

Collect Data

↓

Generate PDF

↓

Store Report

↓

Download

↓

Share
```

Reports

- Patient Progress
- Therapist Performance
- Clinic Statistics
- Discharge Summary

---

# 23. Feedback Workflow

```
Treatment Completed

↓

Feedback Request

↓

Rating

↓

Comments

↓

Submit

↓

Stored

↓

Admin Dashboard
```

Ratings

- Therapist
- Communication
- Treatment
- Overall Experience

---

# 24. Notification Flow

```
System Event

↓

Notification Service

↓

Determine Channel

↓

Email

OR

Push Notification

OR

In-App Notification

↓

User Receives Notification
```

Examples

- Appointment Reminder
- Therapist Assigned
- Assessment Due
- Treatment Completed
- New Exercise Plan
- Report Available

---

# 25. Password Reset Flow

```
Forgot Password

↓

Enter Email / Phone

↓

OTP Sent

↓

Verify OTP

↓

Create New Password

↓

Success

↓

Login
```

---

# 26. Logout Flow

```
User

↓

Logout

↓

Invalidate Refresh Token

↓

Clear Session

↓

Redirect To Login
```

---

# 27. Error Flows

## Invalid Login

```
Login

↓

Wrong Credentials

↓

Error

↓

Retry
```

---

## Session Expired

```
API Request

↓

Token Expired

↓

Refresh Token

↓

Success

↓

Continue

OR

Login Again
```

---

## Appointment Conflict

```
Schedule Appointment

↓

Conflict Found

↓

Suggest Alternative Slots

↓

User Selects New Slot

↓

Appointment Created
```

---

## Offline Therapist Flow

```
Internet Lost

↓

Continue Recording Session

↓

Store Locally

↓

Internet Restored

↓

Automatic Synchronization

↓

Server Updated
```

---

# 28. End-to-End Operational Flow

```
Admin Registers Patient
            │
            ▼
Medical History Added
            │
            ▼
Consent Signed
            │
            ▼
Therapist Assigned
            │
            ▼
Appointment Scheduled
            │
            ▼
Therapist Visit
            │
            ▼
Initial Assessment
            │
            ▼
Treatment Sessions
            │
            ▼
Weekly Reviews
            │
            ▼
Progress Monitoring
            │
            ▼
Final Assessment
            │
            ▼
Discharge Report
            │
            ▼
Patient Feedback
```

---

# 29. Role Interaction Matrix

| Workflow | Admin | Therapist | Patient |
|----------|:-----:|:---------:|:-------:|
| Register Patient | ✓ | ✗ | Self-registration (optional) |
| Manage Therapists | ✓ | ✗ | ✗ |
| Schedule Appointment | ✓ | View | View |
| Initial Assessment | View | ✓ | View |
| Treatment Session | View | ✓ | View |
| Progress Tracking | ✓ | ✓ | ✓ |
| Upload Documents | ✓ | ✓ | ✓ (own records) |
| Consent Forms | Manage | View | Sign |
| Reports | ✓ | Assigned Patients | Own Reports |
| Feedback | View | View | Submit |

---

# 30. Workflow Principles

All workflows in Kinetix Home Care must follow these principles:

1. Mobile-first interactions.
2. Minimize clicks and data entry.
3. Support offline work for therapists.
4. Maintain complete audit trails.
5. Validate data before submission.
6. Enforce role-based access control.
7. Provide immediate user feedback.
8. Preserve patient data integrity.
9. Automatically synchronize offline changes.
10. Ensure a consistent user experience across all modules.

---

# 31. Future Workflows

Future releases may introduce additional workflows, including:

- AI-assisted assessment completion
- Voice-to-text treatment documentation
- Tele-rehabilitation consultations
- Wearable device synchronization
- Family caregiver access
- Multi-clinic patient transfer
- Referral management
- Insurance claim processing
- AI-powered appointment scheduling
- Predictive recovery monitoring