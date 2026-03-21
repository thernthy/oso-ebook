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
      - `analytics/`: Platform-wide performance metrics, user growth, and revenue distribution.
      - `revenue/`: Detailed financial ledger, payout tracking, and sales trends.
    - `partner/`: Partner management dashboard.
      - `books/`: Review queue for books submitted by authors.
      - `authors/`: List of authors under the partner with stats.
      - `authors/invite/`: Form to invite new authors by email.
      - `revenue/`: Partner revenue overview, transactions, and payout history.
    - `author/`: Author content management.
      - `books/`: List of author's books.
      - `books/[id]/`: Book detail page with chapters, cover upload, file upload, settings.
      - `books/new/`: Create new book.
      - `revenue/`: Author earnings overview.
    - `reader/`: User reading and browsing interface.
  - `api/`: Backend API routes.
  - `auth/`: Authentication pages.
- `components/`: Reusable UI components.
  - `ui/`: Generic UI elements (AccountPopup, etc.).
  - `[role]/`: Role-specific components.
    - `author/`: BookUploadPanel, ChapterList, BookActions, CoverUpload, BookSettings, FileViewer.
    - `partner/`: ReviewActions.
    - `reader/`: BookReader.
- `lib/`: Utility libraries.
  - `db.ts`: Database connection pool. Implements a **singleton pattern** for development to prevent "Too many connections" errors during hot-reloads.
  - `permissions.ts`: Role-based access control logic.
  - `api-helpers.ts`: Helper functions for API responses (ok, err, requireAuth, requirePermission).
  - `parsers.ts`: File format detection and parsing (PDF, EPUB, DOCX, TXT).
  - `ai-chapters.ts`: OpenAI GPT-4 integration for chapter detection and arrangement.
  - `cover-processor.ts`: Cover image analysis and cropping.
  - `storage.ts`: Local/S3 file storage abstraction.
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
- **Styling Pattern:** Inline styles using CSS-like properties (camelCase). Color scheme varies per role (Partner: dark theme with green accent, Author: dark theme with purple accent).

## 6. Pages & Features

### Partner Dashboard (`/partner`)
- Overview stats: authors count, books in review, network reads, revenue.
- Review queue for pending book submissions.
- Network earnings chart.

### Partner Authors (`/partner/authors`)
- Lists all authors under the partner with stats (books, published, in review, reads, revenue).
- Status badges (active, suspended, pending).

### Partner Invite Author (`/partner/authors/invite`)
- Form to invite new authors by email.
- Uses `/api/partners/:id/invite` API endpoint.

### Partner Revenue (`/partner/revenue`)
- Earnings summary: total, this month, pending, paid out.
- Monthly revenue bar chart.
- Earnings breakdown by author.
- Recent transactions table.
- Payout history.

### Author Books List (`/author/books`)
- Table view of all author's books with status, chapters, reads, price.
- AI processing status indicators.
- Quick actions to manage books.

### Author Book Detail (`/author/books/[id]`)
- Book stats row: total reads, chapters, words, reading time, price.
- Breadcrumb navigation.
- Cover upload with cropping and preview.
- Book file upload with AI chapter detection.
- **FileViewer**: PDF preview with zoom controls and download.
- **Chapter list**: publish toggle, edit title, delete chapters.
- **Split Chapters**: AI-powered chapter detection from uploaded file.
- Book settings panel (title, description, category, price, free toggle).
- Submit for review action.
- Review feedback display for rejected books.

## 7. API Endpoints

### Books
- `GET/POST /api/books` - List/create books
- `GET/PATCH/DELETE /api/books/:id` - Book CRUD
- `GET/POST /api/books/:id/cover` - Get/upload cover image
- `POST /api/books/:id/upload` - Upload book file
- `GET /api/books/:id/files` - Get uploaded files
- `GET/POST /api/books/:id/chapters` - List/create chapters
- `PATCH/DELETE /api/books/:id/chapters/:chapterId` - Update/delete chapter
- `GET/POST /api/books/:id/chapters/split` - AI-powered chapter splitting from file
- `POST /api/books/:id/chapters/arrange` - AI auto-arrange chapters

### Partners
- `GET /api/partners` - List partners (OSO only)
- `GET/PATCH /api/partners/:id` - Partner details
- `POST/GET /api/partners/:id/invite` - Invite author

### Revenue
- Earnings tracked via `earnings` table (author, partner, platform splits).
- Payouts tracked via `payouts` table.

## 8. Database Tables
- `users` - User accounts with roles (oso, partner, author, reader)
- `books` - Book metadata, status, pricing
- `chapters` - Book chapters with content
- `book_files` - Uploaded source files (PDF, EPUB, DOCX)
- `ai_jobs` - AI processing jobs for chapter detection
- `author_invitations` - Partner invitations to authors
- `earnings` - Revenue ledger (author/partner/platform)
- `payouts` - Payout records
- `purchases` - Reader purchases
- `reading_progress` - Reader reading progress
- `bookmarks` - Reader bookmarks

## 10. Reader Features

### Reader Reading Experience (`/reader/read/[bookId]`)
- Full-screen book reader with page-turn animation.
- Themes: Dark, Light, Sepia.
- Font customization: Serif, Sans, Mono, Palatino with adjustable size.
- Line height adjustment.
- Chapter navigation sidebar.
- Progress tracking (auto-saves every 10 seconds).
- Bookmarking.
- Keyboard navigation (arrow keys, spacebar).

## 9. Maintenance Mandate
> **CRITICAL:** Any update, architectural change, or new feature implementation MUST be reflected in this `ARCHITECTURE.md` file to guide future development and AI assistants.
