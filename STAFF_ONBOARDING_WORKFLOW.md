# Staff Onboarding & Signup Workflow

This document outlines the architecture, access control, multi-company tenant isolation, role-specific field mappings, and step-by-step onboarding workflows for the Dental HMS platform.

---

## 1. Overview & High-Level Architecture Flow

```
+-------------------------------------------------------------------+
|                           STAFF SIGNUP                            |
+-------------------------------------------------------------------+
                                  │
                                  ▼
+-------------------------------------------------------------------+
|                          ROLE SELECTION                           |
|      (Doctor | Dental Assistant | Pharmacist | Accountant | Admin) |
+-------------------------------------------------------------------+
                                  │
                                  ▼
+-------------------------------------------------------------------+
|                        COMPANY ASSIGNMENT                         |
|   • Super Admin: Can select any company or create global staff.   |
|   • Company Admin: Locked to their authenticated tenant company.  |
+-------------------------------------------------------------------+
                                  │
                                  ▼
+-------------------------------------------------------------------+
|                       PERSONAL INFORMATION                        |
| (Name, Gender, DOB, Mobile, Email, Photo, Address, Pincode, etc.)  |
+-------------------------------------------------------------------+
                                  │
                                  ▼
+-------------------------------------------------------------------+
|                    ROLE-SPECIFIC INFORMATION                      |
| • Doctor: Specialization, Council Reg #, Fees, Working Schedule    |
| • Dental Assistant: Assistant ID, Assigned Doctor, Department     |
| • Pharmacist: License #, Dispensing Operations, Schedule          |
| • Accountant: Finance Department, Financial Access Scope          |
| • Admin: Operational Department, Administrative Scope             |
+-------------------------------------------------------------------+
                                  │
                                  ▼
+-------------------------------------------------------------------+
|                         ACCOUNT CREATION                          |
|  • Username / Email & Secure Password Hashing (Django auth)       |
|  • Uniqueness checks on email, username & registration numbers    |
+-------------------------------------------------------------------+
                                  │
                                  ▼
+-------------------------------------------------------------------+
|                   ROLE & PERMISSION ASSIGNMENT                    |
|  • Scope-restricted permissions linked directly to Staff Role     |
|  • Audit Logging of staff onboarding event                        |
+-------------------------------------------------------------------+
                                  │
                                  ▼
+-------------------------------------------------------------------+
|                        ACTIVE STAFF ACCOUNT                       |
|  • Account status set to Active (or Inactive if disabled)         |
|  • Staff credentials generated and verified                       |
+-------------------------------------------------------------------+
                                  │
                                  ▼
+-------------------------------------------------------------------+
|                      ROLE-SPECIFIC DASHBOARD                      |
|  • Doctor ──► Clinical Consultations, Tooth Chart & Prescriptions |
|  • Assistant ──► Queue, Patient Prep & Clinical Support          |
|  • Pharmacist ──► Pharmacy Inventory, Medicine Dispensing          |
|  • Accountant ──► Invoices, Payments, Financial Reports           |
|  • Admin ──► Clinic Settings, Staff Roster, Operational Overview  |
+-------------------------------------------------------------------+
```

---

## 2. Access Control & Multi-Company Tenant Rules

### Super Admin
- **Company Access**: Can view and select any company in the system during onboarding.
- **Role Assignment**: Can create staff for any role, including Super Admin, Company Admin, Doctor, Assistant, Pharmacist, and Accountant.
- **Scope**: Cross-company visibility and global status toggling (activate/deactivate).

### Company Admin
- **Company Access**: Strictly bound to their authenticated company (`company_id` is automatically injected from session/JWT).
- **Security Constraint**: Frontend submission of `company_id` is ignored or rejected by backend authorization logic if it does not match the Company Admin's assigned tenant.
- **Role Limits**: Cannot create Super Admins or reassign existing staff to other companies.
- **Scope**: Isolated strictly to their own company's staff list, profiles, and operations.

### Normal Staff / Unauthenticated Users
- **Access**: Strictly prohibited from accessing `/staff/signup` or the API endpoint `POST /api/staff/onboard/`. Backend enforces `403 Forbidden` response.

---

## 3. Detailed Role-Specific Workflows

### 3.1 Doctor Workflow
1. **Role Selection**: Click **Doctor** role card.
2. **Company Assignment**: Auto-selected for Company Admin; select dropdown for Super Admin.
3. **Personal Info**: Enter Name, DOB, Mobile, Email, Address, Profile Photo.
4. **Doctor-Specific Details**:
   - **Employee ID**: e.g., `DOC-2026-001`
   - **Qualification**: MBBS, BDS, MDS.
   - **Specialization**: Select from General Dentistry, Orthodontics, Endodontics, Prosthodontics, Periodontics, Oral Surgery, Pediatric Dentistry, Oral Medicine, Implantology.
   - **Registration Number & Authority**: State Dental Council Registration ID.
   - **Experience & Schedule**: Years of experience, Joining Date, Working Days, Working Hours, Break Times, Average Consultation Duration (e.g. 30 mins).
   - **Fees**: Initial Consultation Fee & Follow-up Fee.
5. **Account Creation & Permissions**:
   - Django Auth User created; password hashed using Argon2 / PBKDF2.
   - Granted access to: Consultation, Clinical Notes, Diagnosis, Tooth Chart, Treatment Planning, Procedures, Prescriptions, and Follow-ups.
6. **Dashboard Target**: `/doctor/dashboard` (Clinical Workflows).

---

### 3.2 Dental Assistant Workflow
1. **Role Selection**: Click **Dental Assistant** role card.
2. **Company Assignment**: Tenant company auto-assigned.
3. **Personal Info**: Full personal details and emergency contact details.
4. **Assistant-Specific Details**:
   - **Employee ID**: e.g., `AST-2026-042`
   - **Department**: Clinical Support / Operatory.
   - **Assigned Doctor(s)**: Optional linking to primary practicing dentist.
   - **Qualifications & Experience**: Dental Assisting Certification / Diploma.
   - **Working Schedule**: Shift days and hours.
5. **Account Creation & Permissions**:
   - Granted access to: Patient Queue, Clinical Support, Appointment Roster, Patient Prep.
   - Restricted from: Modifying clinical diagnosis, signing prescriptions, or accessing financial ledger.
6. **Dashboard Target**: `/reception/queue` or `/assistant/dashboard`.

---

### 3.3 Pharmacist Workflow
1. **Role Selection**: Click **Pharmacist** role card.
2. **Company Assignment**: Tenant company auto-assigned.
3. **Personal Info**: Personal contact details and emergency contact number.
4. **Pharmacist-Specific Details**:
   - **Employee ID**: e.g., `PHM-2026-108`
   - **Pharmacy Registration Number**: State Pharmacy Board License Number.
   - **Qualification**: B.Pharm, D.Pharm, M.Pharm.
   - **Working Days & Hours**: Pharmacy shift hours.
5. **Account Creation & Permissions**:
   - Granted access to: Pharmacy Management, Medicine Inventory, Medicine Dispensing, Drug Stock Alerts, Pharmacy Billing.
   - Restricted from: Doctor consultation notes, patient treatment planning, or administrative user management.
6. **Dashboard Target**: `/pharmacy/dashboard`.

---

### 3.4 Accountant Workflow
1. **Role Selection**: Click **Accountant** role card.
2. **Company Assignment**: Tenant company auto-assigned.
3. **Personal Info**: Full personal and contact information.
4. **Accountant-Specific Details**:
   - **Employee ID**: e.g., `ACC-2026-007`
   - **Department**: Finance & Billing.
   - **Qualification**: B.Com, M.Com, CA, CPA.
   - **Experience**: Financial bookkeeping and clinic billing experience.
5. **Account Creation & Permissions**:
   - Granted access to: Billing, Payment Collections, Dues & Outstanding Ledgers, Financial Reports, Expense Tracking, Payroll/Financial Modules.
   - Restricted from: Clinical record editing, tooth charting, or pharmacy prescription fulfillment.
6. **Dashboard Target**: `/billing/dashboard` or `/finance/dashboard`.

---

### 3.5 Admin Workflow
1. **Role Selection**: Click **Admin** role card.
2. **Company Assignment**: Tenant company auto-assigned. Cannot create Super Admin.
3. **Personal Info**: Full name, contact info, photo, address.
4. **Admin-Specific Details**:
   - **Employee ID**: e.g., `ADM-2026-003`
   - **Department**: Clinic Administration & Operations.
   - **Working Days & Hours**: Office administrative hours.
5. **Account Creation & Permissions**:
   - Granted access to: Patient Records, Appointment Scheduling, Staff Directory & Roster, Operational Settings, Clinic Analytics.
   - Restricted from: Super Admin cross-company management.
6. **Dashboard Target**: `/admin/dashboard`.

---

## 4. Security & Audit Trail Verification

Every staff onboarding action triggers an entry in the multi-tenant `AuditLog` table:

```json
{
  "user_id": 15,
  "action": "STAFF_CREATED",
  "company_id": 2,
  "target_staff_id": 48,
  "details": "Onboarded Doctor Dr. Sarah Jenkins (DOC-2026-001) for Company #2",
  "timestamp": "2026-09-28T10:45:00Z"
}
```

The system guarantees **Company Isolation**, preventing Company Admins from listing, viewing, updating, or deactivating staff outside their assigned tenant.
