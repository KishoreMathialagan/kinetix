# Permissions Specification
# Kinetix Home Care

**Version:** 1.0  
**Status:** Approved  
**Authorization Model:** Role-Based Access Control (RBAC)

---

# 1. Purpose

This document defines the authorization model for the Kinetix Home Care platform.

It specifies:

- User Roles
- Permission Groups
- Resource Access
- Module-Level Permissions
- Action-Level Permissions
- Ownership Rules
- Security Principles

The system follows **Role-Based Access Control (RBAC)** with **resource ownership** enforcement.

---

# 2. Roles

There are three primary roles:

1. Admin
2. Therapist
3. Patient

---

# 3. Permission Actions

Every permission follows the format:

```
module.action
```

Available actions:

| Action | Description |
|---------|-------------|
| create | Create new records |
| read | View records |
| update | Edit records |
| delete | Permanently remove records (rare) |
| archive | Soft delete/archive |
| restore | Restore archived records |
| assign | Assign resources |
| upload | Upload files |
| download | Download files |
| approve | Approve records |
| sign | Digitally sign documents |
| export | Export reports/data |
| manage | Full administrative control |

---

# 4. Permission Naming Convention

Examples:

```
patient.create
patient.read
patient.update
patient.archive

therapist.assign

appointment.create

assessment.update

report.export

document.upload

consent.sign

billing.manage
```

---

# 5. Ownership Rules

## Admin

Can access every record.

---

## Therapist

Can only access:

- Assigned patients
- Assigned appointments
- Own assessments
- Own treatment sessions
- Own uploaded documents

Cannot access records belonging to another therapist unless reassigned.

---

## Patient

Can only access:

- Own profile
- Own appointments
- Own documents
- Own reports
- Own exercises
- Own progress

Patients cannot modify clinical records.

---

# 6. Module Permissions Matrix

| Module | Admin | Therapist | Patient |
|----------|:----:|:---------:|:-------:|
| Dashboard | Full | Own | Own |
| Users | Full | ✗ | ✗ |
| Roles | Full | ✗ | ✗ |
| Permissions | Full | ✗ | ✗ |
| Patients | Full | Assigned | Own |
| Therapists | Full | Own Profile | Assigned Therapist (View) |
| Appointments | Full | Assigned | Own |
| Assessments | Full | Assigned | View |
| Treatment Sessions | Full | Assigned | View |
| Exercise Programs | Full | Assigned | Own |
| Documents | Full | Assigned | Own |
| Consent Forms | Full | View | Sign/View |
| Reports | Full | Assigned | Own |
| Feedback | View | View | Create |
| Billing | Full | View (Future) | View (Future) |
| Notifications | Full | Own | Own |
| Settings | Full | ✗ | ✗ |
| Audit Logs | Full | ✗ | ✗ |

---

# 7. Authentication Permissions

| Permission | Admin | Therapist | Patient |
|------------|:----:|:---------:|:-------:|
| Login | ✓ | ✓ | ✓ |
| Logout | ✓ | ✓ | ✓ |
| Change Password | ✓ | ✓ | ✓ |
| Forgot Password | ✓ | ✓ | ✓ |
| Update Profile | ✓ | ✓ | ✓ |

---

# 8. User Management

| Permission | Admin | Therapist | Patient |
|------------|:----:|:---------:|:-------:|
| Create User | ✓ | ✗ | ✗ |
| View Users | ✓ | ✗ | ✗ |
| Update User | ✓ | ✗ | ✗ |
| Archive User | ✓ | ✗ | ✗ |
| Restore User | ✓ | ✗ | ✗ |
| Delete User | ✓ | ✗ | ✗ |

---

# 9. Patient Management

| Permission | Admin | Therapist | Patient |
|------------|:----:|:---------:|:-------:|
| Register Patient | ✓ | ✗ | Optional Self-Registration |
| View Patient | ✓ | Assigned | Own |
| Update Patient Profile | ✓ | Limited | Own Personal Details |
| Archive Patient | ✓ | ✗ | ✗ |
| Restore Patient | ✓ | ✗ | ✗ |
| Assign Therapist | ✓ | ✗ | ✗ |

---

# 10. Therapist Management

| Permission | Admin | Therapist | Patient |
|------------|:----:|:---------:|:-------:|
| Create Therapist | ✓ | ✗ | ✗ |
| Update Therapist | ✓ | Own Profile | ✗ |
| View Therapist | ✓ | ✓ | Assigned Therapist |
| Manage Availability | ✓ | ✓ | ✗ |
| View Workload | ✓ | Own | ✗ |

---

# 11. Appointment Management

| Permission | Admin | Therapist | Patient |
|------------|:----:|:---------:|:-------:|
| Create Appointment | ✓ | ✗ | Request (Future) |
| View Appointment | ✓ | Assigned | Own |
| Update Appointment | ✓ | Assigned | ✗ |
| Cancel Appointment | ✓ | Assigned | Request Only (Future) |
| Complete Appointment | ✓ | Assigned | ✗ |

---

# 12. Assessment Permissions

| Permission | Admin | Therapist | Patient |
|------------|:----:|:---------:|:-------:|
| Create Assessment | ✓ | ✓ | ✗ |
| View Assessment | ✓ | Assigned | Read Only |
| Update Assessment | ✓ | ✓ | ✗ |
| Delete Assessment | ✓ | ✗ | ✗ |

---

# 13. Treatment Session Permissions

| Permission | Admin | Therapist | Patient |
|------------|:----:|:---------:|:-------:|
| Start Session | ✓ | ✓ | ✗ |
| End Session | ✓ | ✓ | ✗ |
| Update Notes | ✓ | ✓ | ✗ |
| View Sessions | ✓ | Assigned | Read Only |

---

# 14. Exercise Program Permissions

| Permission | Admin | Therapist | Patient |
|------------|:----:|:---------:|:-------:|
| Create Program | ✓ | ✓ | ✗ |
| Update Program | ✓ | ✓ | ✗ |
| Delete Program | ✓ | ✗ | ✗ |
| View Program | ✓ | Assigned | Own |

---

# 15. Document Permissions

| Permission | Admin | Therapist | Patient |
|------------|:----:|:---------:|:-------:|
| Upload | ✓ | ✓ | ✓ |
| View | ✓ | Assigned | Own |
| Download | ✓ | Assigned | Own |
| Delete | ✓ | Uploader (if allowed) | Own Upload (if allowed) |

---

# 16. Consent Form Permissions

| Permission | Admin | Therapist | Patient |
|------------|:----:|:---------:|:-------:|
| Upload Template | ✓ | ✗ | ✗ |
| View Consent | ✓ | ✓ | ✓ |
| Sign Consent | ✗ | ✗ | ✓ |
| Download PDF | ✓ | ✓ | ✓ |

---

# 17. Report Permissions

| Permission | Admin | Therapist | Patient |
|------------|:----:|:---------:|:-------:|
| Generate Report | ✓ | ✓ (Assigned) | ✗ |
| View Report | ✓ | Assigned | Own |
| Export Report | ✓ | Assigned | Own |

---

# 18. Feedback Permissions

| Permission | Admin | Therapist | Patient |
|------------|:----:|:---------:|:-------:|
| Submit Feedback | ✗ | ✗ | ✓ |
| View Feedback | ✓ | Own Feedback | Own Submission |
| Delete Feedback | ✓ | ✗ | ✗ |

---

# 19. Billing Permissions (Phase 2)

| Permission | Admin | Therapist | Patient |
|------------|:----:|:---------:|:-------:|
| Create Invoice | ✓ | ✗ | ✗ |
| Update Invoice | ✓ | ✗ | ✗ |
| View Invoice | ✓ | Assigned (Read Only) | Own |
| Record Payment | ✓ | ✗ | ✗ |
| Download Invoice | ✓ | Assigned | Own |

---

# 20. Dashboard Permissions

## Admin Dashboard

Access:

- All KPIs
- Revenue
- Patient Statistics
- Therapist Statistics
- Clinic Analytics
- System Activity

---

## Therapist Dashboard

Access:

- Assigned Patients
- Today's Visits
- Pending Notes
- Weekly Progress
- Personal Performance

---

## Patient Dashboard

Access:

- Upcoming Appointments
- Assigned Therapist
- Progress
- Exercise Plan
- Reports

---

# 21. Administrative Permissions

Only Admin can:

- Manage Users
- Manage Roles
- Manage Permissions
- View Audit Logs
- Configure System Settings
- Archive Records
- Restore Records
- Delete Records
- View Global Analytics

---

# 22. Resource Ownership Rules

### Therapist

Can modify only:

- Own treatment sessions
- Own assessments
- Own uploaded documents
- Own availability

Cannot edit another therapist's work.

---

### Patient

Can modify only:

- Personal profile
- Contact information
- Uploaded documents (where permitted)

Cannot modify:

- Assessments
- Treatment notes
- Clinical observations
- Diagnoses
- Progress measurements

---

# 23. Sensitive Operations

The following actions require elevated permissions:

- Delete User
- Delete Patient
- Archive Patient
- Restore Patient
- Modify Roles
- Modify Permissions
- Export All Reports
- Access Audit Logs
- System Configuration

Only Admin may perform these actions.

---

# 24. Future Roles

Future versions may introduce:

- Receptionist
- Branch Manager
- Clinic Manager
- Super Admin
- Caregiver / Family Member
- Billing Executive
- Insurance Coordinator
- Telehealth Coordinator

---

# 25. Security Principles

1. Deny access by default.
2. Grant the minimum required permissions (Principle of Least Privilege).
3. Enforce ownership checks in addition to role checks.
4. Validate permissions on every protected API request.
5. Record sensitive operations in the audit log.
6. Never trust client-side authorization.
7. Prevent privilege escalation.
8. Use secure server-side permission evaluation.

---

# 26. Permission Seeds

The application should seed default permissions during initial deployment.

Example:

```
patient.create
patient.read
patient.update
patient.archive
patient.restore

therapist.create
therapist.read
therapist.update

appointment.create
appointment.read
appointment.update
appointment.cancel

assessment.create
assessment.read
assessment.update

treatment_session.create
treatment_session.read
treatment_session.update

exercise_program.create
exercise_program.read
exercise_program.update

document.upload
document.read
document.download

report.generate
report.read
report.export

feedback.create
feedback.read

billing.manage

settings.manage

users.manage

roles.manage

permissions.manage
```

---

# 27. Authorization Flow

```
User Request
      │
      ▼
Authenticate JWT
      │
      ▼
Load User Role
      │
      ▼
Load Assigned Permissions
      │
      ▼
Ownership Validation
      │
      ▼
Business Rule Validation
      │
      ▼
Allow / Deny Request
```

---

# 28. Permission Evaluation Order

1. Verify authentication.
2. Verify account is active.
3. Verify required role.
4. Verify required permission.
5. Verify resource ownership (if applicable).
6. Verify business rules.
7. Execute the requested action.
8. Record audit log for sensitive operations.

---

# 29. Definition of Done

A permission implementation is considered complete only when:

- Permission is defined and seeded.
- Role mappings are configured.
- Backend authorization is enforced.
- Resource ownership is validated.
- Frontend UI hides unauthorized actions.
- Unauthorized API requests return **403 Forbidden**.
- Sensitive actions are logged in the audit trail.
- Automated authorization tests are passing.