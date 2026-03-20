# OSO E-Book Platform Architecture

## 1. Overview
The OSO E-Book Platform is a multi-role digital publishing system built with **Next.js (App Router)**. It facilitates the entire lifecycle of digital books, from author creation and partner management to reader consumption.

## 2. Core Technologies
- **Frontend/Backend:** Next.js 14 (App Router), React, TypeScript.
- **Database:** MySQL (accessed via `mysql2/promise`).
- **Authentication:** NextAuth.js (Credentials Provider).
- **Styling:** Inline styles (primary) & CSS Modules (where applicable).
- **AI Integration:** OpenAI API for chapter processing.
- **File Processing:** Sharp (Images), PDF-Parse, Mammoth, EPUB2.

## 3. Directory Structure
- `app/`: Next.js App Router structure.
  - `(dashboard)/`: Route groups for different user roles.
    - `oso/`: Admin dashboard.
    - `partner/`: Partner management dashboard.
    - `author/`: Author content management.
    - `reader/`: User reading and browsing interface.
  - `api/`: Backend API routes.
  - `auth/`: Authentication pages.
- `components/`: Reusable UI components.
  - `ui/`: Generic UI elements.
  - `[role]/`: Role-specific components.
- `lib/`: Utility libraries.
  - `db.ts`: Database connection pool. Implements a **singleton pattern** for development to prevent "Too many connections" errors during hot-reloads.
  - `permissions.ts`: Role-based access control logic.
- `database/`: SQL migration files.

## 4. Role-Based Access Control (RBAC)
The system defines four primary roles:
1. **OSO (Admin):** Full system access.
2. **Partner:** Manages authors and tracks revenue.
3. **Author:** Uploads books and manages content.
4. **Reader:** Browses and reads books.

Access control is enforced via `middleware.ts` and per-route checks in API handlers.

## 5. UI/UX Guidelines
- **Navigation:** Sidebar-based navigation for dashboards.
- **Account Management:** A consistent "Account Popup" component is used across all dashboards to provide access to settings, profile info, and logout functionality.

## 6. Maintenance Mandate
> **CRITICAL:** Any update, architectural change, or new feature implementation MUST be reflected in this `ARCHITECTURE.md` file to guide future development and AI assistants.
