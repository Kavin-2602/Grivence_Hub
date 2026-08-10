![CMS College of Engineering](./assets/cms-logo.jpg)

# CMSCE AI-Powered Complaint Management System

An AI-driven complaint management platform for CMS College of Engineering. Students report campus issues across six departments in plain language; an AI engine classifies, prioritizes, and routes each complaint automatically; department heads resolve and prove resolution; and admins oversee the whole workflow — with full SLA tracking from submission to close.

---

## 🎯 Problem Statement

Students currently have no centralized, transparent way to report campus-service issues. Complaints are handled informally — word of mouth, ad-hoc emails — with no visibility into status, no consistent prioritization, and no accountability trail. Issues get lost, delayed, or repeated.

**Goal:** Give students a transparent, centralized, intelligent system to report campus-service issues and track their resolution, while giving admins and department heads a structured way to prioritize, assign, resolve, and prove resolution.

---

## ✨ Core Features

### Student Portal
- Register/login with college email, registration number, and password
- Forgot password flow with email-based verification code
- Submit a complaint as free text — AI extracts category, urgency, and department in real time
- Review or override the AI-suggested department before final submission
- Attach photo evidence; optional anonymous/confidential reporting
- Track a complaint by ticket ID (public lookup, no login required)
- 5-stage lifecycle timeline: **Submitted → AI Categorized → Assigned → In Progress → Resolved**
- Live SLA countdown on open complaints
- Post-resolution feedback (5-star rating + quick tags) and reopen-if-unresolved option
- In-app notifications for status updates and SLA warnings

### Admin Dashboard
- Overview metrics: total open complaints, critical escalations, SLA breaches, average resolution time
- Filterable, searchable complaint table by department and priority
- Complaint detail drawer with full AI reasoning and manual override (priority, department, escalation)
- Add department heads manually (name, role, department, email) with auto-generated credentials
- Review and archive proof of resolution submitted by department heads
- Broadcast announcements (general updates or emergency alerts) to students and/or department heads
- Notification panel for escalations, SLA breaches, and routing updates

### Department Head Portal
- Login with admin-issued credentials
- Dashboard scoped to their own department only
- Update complaint status (Assigned → In Progress → Resolved)
- Submit proof of resolution (photo + notes) for admin review
- Receive notifications for new complaints routed to their department

### AI Priority & Routing Engine
- Hybrid rule + scoring engine — not a black box: every decision includes a plain-language reason
- Composite score built from five weighted factors:

  ```
  Composite Score =
      Severity      × 30%
    + Urgency       × 20%
    + Impact        × 20%
    + Safety Risk   × 20%
    + Recurrence    × 10%
  ```

- Priority mapping:

  | Composite Score | Priority |
  |---|---|
  | ≥ 85 | Critical |
  | 65 – 84 | High |
  | 40 – 64 | Medium |
  | < 40 | Low |

- Safety-critical keywords trigger an automatic override to **Critical**, regardless of score
- Optional semantic embeddings via `sentence-transformers` (`all-MiniLM-L6-v2`), with safe fallback to rule-based routing if unavailable
- Human override always available — low-confidence predictions are flagged for manual review

**Canonical example (Ticket #1042)** — used consistently across the AI engine, backend seed data, and frontend demo:

```json
{
  "ticket_id": "CMP-2026-1042",
  "description": "Piece of metal found in Block C lunch today",
  "category": "Food / Safety Hazard",
  "assigned_dept_code": "CANTEEN",
  "priority": "Critical",
  "confidence": 0.97,
  "reason": "Food contamination triggers an automatic safety override"
}
```

---

## 🏗️ System Architecture

Three-tier architecture:

1. **Presentation layer** — Student mobile/web portal + Admin & Department Head desktop dashboards
2. **Application layer** — Django REST Framework APIs for auth, complaint CRUD, routing, notifications, announcements
3. **Data & AI layer** — PostgreSQL (Supabase) + the AI Priority & Routing Engine

```
Student submits complaint
        ↓
AI classifies category, priority, and department (with confidence score)
        ↓
Complaint routed to the correct Department Head; SLA timer starts
        ↓
Escalation triggers automatically if SLA is breached
        ↓
Department Head updates status and submits proof of resolution
        ↓
Admin reviews and approves proof; archives for future reference
        ↓
Student is notified and can rate the resolution or reopen the complaint
```

---

## 🧑‍🤝‍🧑 Team & Roles

| Member | Role | Main Responsibility |
|---|---|---|
| Jeevitha | Frontend Developer 1 | Student Portal |
| Harini | Frontend Developer 2 | Admin Dashboard |
| Dhanush | Backend Developer | Backend APIs + Database |
| Chinasami | Backend & API Developer | API integration, authentication, backend services |
| Jayasri | UI/UX Designer | Figma, user flow, design system |
| Janani | AI/ML Developer | AI classification, priority, routing |
| Kavin | Product/Research + Integration + QA | Research, workflow, integration, testing |

---

## 🎨 Design System

- **Header / Primary:** Dark Forest Green `#084325`
- **Accent:** Gold `#EAB308`
- **Priority tags** (always paired with text + icon, never color alone):
  - 🔴 Critical — `#FEE2E2` / `#991B1B`
  - 🟠 High — `#FFEDD5` / `#C2410C`
  - 🟡 Medium — `#FEF3C7` / `#B45309`
  - 🟢 Low — `#DCFCE7` / `#15803D`
- **Typography:** Inter — Display 32/40 Bold, Headings 24/32 Bold, Card titles 18/24 SemiBold, Body 14/20 Regular, Meta 12/16 Medium
- Minimum 4.5:1 contrast ratio across all UI
- CMS Lotus Logo (dark green outer petals, gold inner accents) appears top-left on every header, modal, and drawer

---

## 📱 Screens

**Student:**
Register · Login · Forgot Password · Complaint Desk (AI quick-submission) · AI Routing Review Modal · Ticket Tracker (SLA + timeline) · Resolution Feedback · My Complaints · Notifications

**Admin (Desktop):**
Login · Dashboard (metrics, filters, complaints table) · Complaint Detail Panel (AI reasoning + override) · Add Department Heads · Proof of Resolution Review & Archive · Broadcast/Announcements · Notifications

**Department Head (Desktop):**
Login (shared pattern with Admin/Student) · Dashboard scoped to own department · Status update + Submit Proof of Resolution

---

## 🔐 Authentication

- Email + password login for Students, Department Heads, and Admin — single login pattern, role resolved server-side
- Student self-registration with college email, registration number, and password
- Department Heads added manually by Admin; receive email invites with temporary credentials
- Forgot password: email → verification code → new password
- Complaint tracking by ticket ID is available without login (read-only, complaint-specific)

---

## 🛠️ Tech Stack

| Module | Stack |
|---|---|
| Student Portal | React 18, Babel standalone, Tailwind CSS, Lucide React icons |
| Admin Dashboard | Vite + React, Tailwind CSS v4 |
| Backend API | Django + Django REST Framework, Simple-JWT |
| Database | PostgreSQL via Supabase — `pgcrypto`, `uuid-ossp`, Row Level Security |
| AI Engine | Python — rule-based scoring, optional `sentence-transformers` embeddings |

---

## 📂 Core Data Model

`departments` · `profiles` (references `auth.users`) · `complaints` · `complaint_history` · `feedback` · `announcements`

- UUID primary keys throughout
- `created_at` / `updated_at` timestamps with generic update trigger
- Trigger logs every status change into `complaint_history` for a full audit trail
- `admin_dashboard_metrics` view powers the dashboard stat cards
- Row Level Security scopes access per role: Student, Admin, Department Head

**Canonical enums** (must stay identical across every module):

- **Department codes:** `CANTEEN`, `TRANSPORT`, `HOSTEL`, `SPORTS`, `ACADEMIC`, `HOSPITALITY`
- **Priority levels:** `Critical`, `High`, `Medium`, `Low`
- **Status values:** `Submitted`, `AI Analysed`, `Assigned`, `In Progress`, `Resolution Pending Verification`, `Resolved`, `Reopened`, `Closed`

---

## 🔌 Sample API Endpoints

```
POST   /auth/login
POST   /auth/register
POST   /complaints
GET    /complaints
GET    /complaints/:id
PATCH  /complaints/:id/status
PATCH  /complaints/:id/assign
POST   /complaints/:id/feedback
POST   /ai/analyse-complaint
GET    /analytics/summary
```

---

## 🚀 Getting Started

```bash
# Clone the repository
git clone <repo-url>
cd cmsce-complaint-management-system

# Frontend (Student Portal / Admin Dashboard)
npm install
npm run dev

# Backend (Django)
pip install -r requirements.txt
python manage.py migrate
python manage.py runserver

# AI Engine tests
pytest test_ai_bridge.py -v
```

> Update commands above to match the final repo structure once modules are merged.

---

## 📌 Project Status

🚧 In development — design, implementation planning, and module-level specs (Student Portal, Admin Dashboard, Backend, AI Engine, Database) are complete. Integration and testing in progress.
