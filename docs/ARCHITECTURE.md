# OSO E-Book Platform — System Architecture

> **Optimize Systems, Optimize Life**
> Last updated: 2026-03-23

---

## Table of Contents

1. [Platform Overview](#1-platform-overview)
2. [Tech Stack](#2-tech-stack)
3. [High-Level System Diagram](#3-high-level-system-diagram)
4. [User Role Hierarchy](#4-user-role-hierarchy)
5. [Role-Based Access Control (RBAC)](#5-role-based-access-control-rbac)
6. [Directory Structure](#6-directory-structure)
7. [Request Lifecycle & Middleware](#7-request-lifecycle--middleware)
8. [API Layer](#8-api-layer)
9. [Database Schema](#9-database-schema)
10. [Revenue & Earnings Flow](#10-revenue--earnings-flow)
11. [Book Lifecycle](#11-book-lifecycle)
12. [AI Chapter Processing Pipeline](#12-ai-chapter-processing-pipeline)
13. [Storage Abstraction](#13-storage-abstraction)
14. [Partnership & Onboarding Flow](#14-partnership--onboarding-flow)
15. [Security Architecture](#15-security-architecture)
16. [Frontend Dashboards](#16-frontend-dashboards)
17. [Business Model Summary](#17-business-model-summary)
18. [Roadmap](#18-roadmap)
19. [Maintenance Mandate](#19-maintenance-mandate)

---

## 1. Platform Overview

OSO is a **multi-role digital e-book platform** built on **Next.js 14 (App Router)**. It connects four actor types — OSO Admin, Partners, Authors, and Readers — in a single full-stack application with server-side rendering, API routes, and a MySQL database.

The platform targets **Gen Z (born 1997–2012)** and **Gen Alpha (born 2013+)** readers, with digital asset protection, revenue sharing, and partner-curated storefronts built into every layer.

---

## 2. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 14 (App Router, TypeScript) |
| Database | MySQL 8 via `mysql2/promise` |
| Authentication | NextAuth.js (Credentials Provider, JWT) |
| AI Integration | OpenAI GPT-4 Turbo (chapter detection & arrangement) |
| File Processing | Sharp (images), PDF-Parse, Mammoth (DOCX), EPUB2 |
| Storage | Local filesystem **or** AWS S3 / S3-compatible (runtime-switchable) |
| Styling | Inline styles + CSS Modules |
| i18n | Custom `LanguageContext` + server translation helpers |
| ORM | Raw SQL via `mysql2/promise` connection pool (singleton) |

---

## 3. High-Level System Diagram

```
┌─────────────────────────────────────────────────────────────────────────┐
│                          INTERNET / BROWSER                             │
└────────────────────────────┬────────────────────────────────────────────┘
                             │  HTTPS
                             ▼
┌─────────────────────────────────────────────────────────────────────────┐
│                     Next.js 14 Application                              │
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │                    middleware.ts (Edge)                          │   │
│  │  JWT token check → role-based route guard → redirect or pass    │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                             │                                           │
│          ┌──────────────────┼──────────────────┐                        │
│          ▼                  ▼                  ▼                        │
│  ┌──────────────┐  ┌──────────────────┐  ┌──────────────┐              │
│  │  App Router  │  │   API Routes     │  │  Auth Pages  │              │
│  │  (RSC/Pages) │  │  /api/**         │  │  /auth/**    │              │
│  └──────┬───────┘  └────────┬─────────┘  └──────────────┘              │
│         │                   │                                           │
│         │           ┌───────┴────────┐                                 │
│         │           │  lib/ helpers  │                                 │
│         │           │  db.ts         │                                 │
│         │           │  permissions.ts│                                 │
│         │           │  api-helpers.ts│                                 │
│         │           │  storage.ts    │                                 │
│         │           │  ai-chapters.ts│                                 │
│         │           │  parsers.ts    │                                 │
│         │           └───────┬────────┘                                 │
│         │                   │                                           │
└─────────┼───────────────────┼─────────────────────────────────────────┘
          │                   │
          ▼                   ▼
┌──────────────────┐  ┌──────────────────────────────────────────────────┐
│  MySQL 8         │  │  External Services                               │
│  oso_ebook DB    │  │  ┌──────────────┐  ┌──────────────────────────┐  │
│                  │  │  │ OpenAI API   │  │ AWS S3 / Local FS        │  │
│  (connection     │  │  │ GPT-4 Turbo  │  │ (runtime-switchable via  │  │
│   pool, 10 max)  │  │  │ chapter AI   │  │  platform_settings DB)   │  │
└──────────────────┘  │  └──────────────┘  └──────────────────────────┘  │
                      └──────────────────────────────────────────────────┘
```

---

## 4. User Role Hierarchy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         OSO ADMIN                                       │
│                    (role = 'oso')                                       │
│          Full system access · Manages all entities                      │
│          Approves partners · Configures platform settings               │
└──────────────────────────┬──────────────────────────────────────────────┘
                           │  creates / approves
          ┌────────────────┼────────────────┐
          ▼                ▼                ▼
   ┌─────────────┐  ┌─────────────┐  ┌─────────────┐
   │  PARTNER A  │  │  PARTNER B  │  │  PARTNER C  │
   │ (role=partner)│ (role=partner)│ (role=partner)│
   │ Curates shop│  │ Curates shop│  │ Curates shop│
   │ Invites authors│ Invites authors│ Invites authors│
   │ Earns ~20%  │  │ Earns ~20%  │  │ Earns ~20%  │
   └──────┬──────┘  └──────┬──────┘  └──────┬──────┘
          │                │                │
     ┌────┴────┐      ┌────┴────┐      ┌────┴────┐
     │ AUTHORS │      │ AUTHORS │      │ AUTHORS │
     │(role=   │      │(role=   │      │(role=   │
     │ author) │      │ author) │      │ author) │
     │ Upload  │      │ Upload  │      │ Upload  │
     │ books   │      │ books   │      │ books   │
     │ Earn~70%│      │ Earn~70%│      │ Earn~70%│
     └─────────┘      └─────────┘      └─────────┘
                           │
                           ▼
              ┌────────────────────────┐
              │       READERS          │
              │    (role = 'reader')   │
              │  Browse · Purchase     │
              │  Read · Bookmark       │
              │  Review · Track        │
              └────────────────────────┘
```

**Key relationship rules:**
- Every `author` has a `partner_id` in the `users` table pointing to their partner.
- Authors are invited by partners via token-based email invitations (`author_invitations` table).
- Partners apply via `partner_applications`; OSO approves and creates their account.
- A user record stores the role — one row per person, role determines capabilities.

---

## 5. Role-Based Access Control (RBAC)

### Permission Matrix

| Permission | OSO | Partner | Author | Reader |
|---|:---:|:---:|:---:|:---:|
| `manage:users` | ✅ | | | |
| `manage:partners` | ✅ | | | |
| `manage:platform` | ✅ | | | |
| `view:all_revenue` | ✅ | | | |
| `manage:categories` | ✅ | | | |
| `feature:books` | ✅ | | | |
| `approve:books` | ✅ | ✅ | | |
| `suspend:accounts` | ✅ | | | |
| `manage:catalog` | ✅ | ✅ | | |
| `invite:authors` | ✅ | ✅ | | |
| `review:submissions` | ✅ | ✅ | | |
| `view:partner_revenue` | | ✅ | | |
| `set:pricing` | | ✅ | | |
| `view:author_stats` | | ✅ | | |
| `upload:books` | ✅ | | ✅ | |
| `edit:own_books` | ✅ | | ✅ | |
| `submit:review` | | | ✅ | |
| `view:own_earnings` | ✅ | | ✅ | |
| `manage:chapters` | | | ✅ | |
| `view:reader_stats` | | | ✅ | |
| `browse:catalog` | ✅ | ✅ | ✅ | ✅ |
| `purchase:books` | ✅ | ✅ | ✅ | ✅ |
| `read:library` | ✅ | ✅ | ✅ | ✅ |
| `leave:reviews` | ✅ | ✅ | ✅ | ✅ |
| `bookmark:chapters` | | | | ✅ |
| `track:reading` | | | | ✅ |
| `manage:profile` | ✅ | ✅ | ✅ | ✅ |

### Route Guard (middleware.ts)

```
Request → middleware.ts (Edge Runtime)
    │
    ├─ /auth/login  + already logged in  →  redirect to role dashboard
    │
    ├─ /oso/**      →  requires role: oso
    ├─ /partner/**  →  requires role: oso | partner
    ├─ /author/**   →  requires role: oso | partner | author
    └─ /reader/**   →  requires role: oso | partner | author | reader
         │
         ├─ No token?  →  redirect /auth/login?callbackUrl=...
         └─ Wrong role? →  redirect to own dashboard
```

---

## 6. Directory Structure

```
oso-backend/
├── app/                          # Next.js App Router
│   ├── layout.tsx                # Root layout
│   ├── page.tsx                  # Public landing page
│   ├── providers.tsx             # SessionProvider wrapper
│   ├── (dashboard)/              # Route group — all dashboards
│   │   ├── oso/                  # Admin dashboard
│   │   │   ├── page.tsx          # Overview stats
│   │   │   ├── analytics/        # Platform-wide metrics
│   │   │   ├── books/            # All books management
│   │   │   ├── partners/         # Partner management
│   │   │   ├── revenue/          # Full financial ledger
│   │   │   ├── settings/         # Platform config (storage, splits)
│   │   │   └── users/            # User management
│   │   ├── partner/              # Partner dashboard
│   │   │   ├── page.tsx          # Overview (authors, books, revenue)
│   │   │   ├── authors/          # Author list + invite
│   │   │   ├── books/            # Review queue
│   │   │   └── revenue/          # Partner earnings
│   │   ├── author/               # Author dashboard
│   │   │   ├── page.tsx          # Overview
│   │   │   ├── books/            # Book list
│   │   │   │   ├── [id]/         # Book detail (chapters, cover, upload)
│   │   │   │   └── new/          # Create book
│   │   │   ├── partners/         # Partner relationship view
│   │   │   └── reviews/          # Author reviews from partners
│   │   └── reader/               # Reader dashboard
│   │       ├── page.tsx          # Home feed
│   │       ├── browse/           # Catalog browsing
│   │       ├── library/          # Purchased books
│   │       ├── books/            # Book detail
│   │       ├── read/             # Full-screen reader
│   │       └── bookmarks/        # Saved bookmarks
│   ├── api/                      # API Route Handlers
│   │   ├── auth/[...nextauth]/   # NextAuth.js handler
│   │   ├── books/                # Book CRUD + chapters + AI
│   │   ├── partners/             # Partner management
│   │   ├── users/                # User management
│   │   ├── purchases/            # Purchase + earnings
│   │   ├── revenue/              # Revenue queries
│   │   ├── reviews/              # Book reviews
│   │   ├── bookmarks/            # Reader bookmarks
│   │   ├── progress/             # Reading progress
│   │   ├── catalog/              # Public catalog
│   │   ├── partner-codes/        # Partner referral codes
│   │   ├── authors/              # Author-partner relations
│   │   ├── reader/               # Reader home feed
│   │   ├── admin/                # Admin: stats, settings, storage
│   │   └── public/catalog/       # Unauthenticated catalog
│   ├── auth/                     # Auth pages
│   │   ├── login/                # Login form
│   │   └── accept-invite/        # Author invitation acceptance
│   └── uploads/[...path]/        # Serve local uploaded files
│
├── components/                   # Reusable React components
│   ├── PublicLanding.tsx         # Public homepage
│   ├── ui/                       # Generic UI
│   │   ├── AccountPopup.tsx      # Cross-dashboard account menu
│   │   ├── Book3DCard.tsx        # 3D book card display
│   │   ├── Book3DCarousel.tsx    # Carousel of 3D cards
│   │   ├── LanguageSwitcher.tsx  # i18n switcher
│   │   ├── StarRating.tsx        # Star rating widget
│   │   └── shared-styles.ts      # Shared style constants
│   ├── author/                   # Author-specific components
│   │   ├── BookUploadPanel.tsx   # File upload + AI trigger
│   │   ├── ChapterList.tsx       # Chapter management
│   │   ├── BookActions.tsx       # Publish/submit actions
│   │   ├── BookSettings.tsx      # Book metadata form
│   │   ├── CoverUpload.tsx       # Cover image upload + crop
│   │   ├── DocumentEditor.tsx    # Chapter content editor
│   │   └── FileViewer.tsx        # PDF preview
│   ├── partner/
│   │   └── ReviewActions.tsx     # Approve/reject book submissions
│   ├── oso/
│   │   ├── PartnerApproval.tsx   # Partner application review
│   │   ├── SettingsForm.tsx      # Platform settings editor
│   │   └── UserStatusAction.tsx  # Suspend/activate users
│   └── reader/
│       ├── BookReader.tsx        # Full-screen reading experience
│       ├── PurchaseButton.tsx    # Buy / free access button
│       ├── ReaderLayoutClient.tsx# Reader layout wrapper
│       └── ReaderNavItems.tsx    # Reader sidebar nav
│
├── lib/                          # Core utilities
│   ├── db.ts                     # MySQL pool singleton
│   ├── permissions.ts            # RBAC permission definitions
│   ├── api-helpers.ts            # ok/err/requireAuth/requirePermission
│   ├── storage.ts                # Local ↔ S3 storage abstraction
│   ├── ai-chapters.ts            # OpenAI GPT-4 chapter detection
│   ├── cover-processor.ts        # Sharp image processing
│   ├── parsers.ts                # PDF/EPUB/DOCX/TXT text extraction
│   ├── parsers/index.ts          # Parser index
│   └── i18n/
│       ├── LanguageContext.tsx   # Client-side language context
│       ├── server.ts             # Server-side translation helper
│       └── translations.ts       # Translation strings
│
├── database/                     # SQL migration files (run in order)
│   ├── 001_users_roles.sql       # users table + OSO seed
│   ├── 002_books.sql             # books, chapters, purchases, reading_progress
│   ├── 003_partners.sql          # partner_applications, author_invitations
│   ├── 004_author_features.sql   # platform_settings, book_files, ai_jobs, bookmarks
│   ├── 005_revenue.sql           # earnings, payouts + revenue split config
│   ├── 006_reader.sql            # reader_preferences, reviews, bookmarks (extended)
│   ├── 007_author_partner_reviews.sql # partner_codes, author_partner_relations, reviews
│   └── schema.sql                # Full reference schema (PostgreSQL variant)
│
├── types/
│   └── next-auth.d.ts            # NextAuth session type extensions
│
├── scripts/                      # Dev/ops scripts
│   ├── migrate.js                # Run migrations
│   ├── seed.js                   # Seed test data
│   ├── check-schema.js           # Validate DB schema
│   ├── test-queries.js           # Query smoke tests
│   └── test-page-logic.js        # Page logic tests
│
├── middleware.ts                 # Edge middleware (auth + route guard)
├── next.config.js                # Next.js config
├── tsconfig.json                 # TypeScript config
└── .env.example                  # Environment variable template
```

---

## 7. Request Lifecycle & Middleware

```
Browser Request
      │
      ▼
┌─────────────────────────────────────────────────────┐
│  middleware.ts  (runs on EVERY matched route)        │
│                                                     │
│  1. getToken(req)  →  decode JWT from cookie        │
│  2. If /auth/login + token  →  redirect to dashboard│
│  3. If dashboard route:                             │
│     a. No token?  →  /auth/login?callbackUrl=...    │
│     b. Wrong role? →  own dashboard                 │
│     c. OK?  →  NextResponse.next()                  │
└─────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────┐
│  Next.js Route Handler / Page (Server Component)    │
│                                                     │
│  API routes call:                                   │
│  requireAuth()        →  401 if no session          │
│  requirePermission()  →  403 if wrong role          │
│                                                     │
│  Response helpers:                                  │
│  ok(data, status)     →  { success: true, data }    │
│  err(msg, status)     →  { success: false, error }  │
└─────────────────────────────────────────────────────┘
      │
      ▼
┌─────────────────────────────────────────────────────┐
│  lib/db.ts  — MySQL connection pool (singleton)     │
│  Max 10 connections · keepAlive enabled             │
│  Dev: global singleton prevents hot-reload leaks    │
└─────────────────────────────────────────────────────┘
```

---

## 8. API Layer

### Complete API Route Map

```
/api/
├── auth/
│   ├── [...nextauth]          NextAuth sign-in / sign-out / session
│   └── accept-invite          POST: accept author invitation token
│
├── books/
│   ├── route.ts               GET (role-scoped list) · POST (author creates)
│   └── [id]/
│       ├── route.ts           GET · PATCH · DELETE
│       ├── cover/             GET · POST (upload + Sharp processing)
│       ├── upload/            POST (upload PDF/EPUB/DOCX/TXT)
│       ├── files/             GET (list uploaded files)
│       └── chapters/
│           ├── route.ts       GET · POST
│           ├── [chapterId]/   PATCH · DELETE
│           ├── split/         POST (AI chapter detection from file)
│           └── arrange/       POST (AI auto-arrange chapter order)
│
├── partners/
│   ├── route.ts               GET (OSO: list all) · POST (public: apply)
│   ├── [id]/                  GET · PATCH
│   ├── applications/          GET · PATCH (OSO approve/reject)
│   └── authors/               GET (partner's author list)
│
├── partner-codes/
│   ├── route.ts               GET · POST (create code)
│   └── request/               POST (author requests partner code)
│
├── authors/
│   ├── partner/               GET (author's partner info)
│   └── reviews/               GET · POST (partner reviews of authors)
│
├── users/
│   ├── route.ts               GET (OSO: list) · POST (create)
│   └── [id]/                  GET · PATCH · DELETE
│
├── purchases/
│   └── route.ts               GET (reader library) · POST (buy book)
│
├── revenue/
│   └── route.ts               GET (role-scoped: oso/partner/author)
│
├── reviews/
│   └── route.ts               GET · POST · PATCH · DELETE
│
├── bookmarks/
│   └── route.ts               GET · POST · DELETE
│
├── progress/
│   └── [bookId]/              GET · POST (save reading position)
│
├── catalog/
│   └── route.ts               GET (authenticated catalog)
│
├── public/catalog/            GET (unauthenticated public catalog)
│
├── reader/home/               GET (personalized reader home feed)
│
└── admin/
    ├── stats/                 GET (platform-wide statistics)
    ├── settings/              GET · PATCH (platform_settings table)
    └── storage/               GET · POST (storage provider config)
```

---

## 9. Database Schema

### Entity Relationship Diagram

```
┌──────────────────────────────────────────────────────────────────────────┐
│                            users                                         │
│  id (CHAR36 PK)  name  email  password(bcrypt)                          │
│  role: oso|partner|author|reader                                         │
│  partner_id → users.id (author's partner)                               │
│  status: active|suspended|pending                                        │
└────────┬──────────────────────────────────────────────────────────────────┘
         │
         ├──────────────────────────────────────────────────────────────────┐
         │                                                                  │
         ▼ (role=partner)                                                   ▼ (role=author)
┌─────────────────────────┐                                    ┌──────────────────────────┐
│  partner_applications   │                                    │  author_invitations      │
│  id  name  email        │                                    │  id  email  partner_id   │
│  company  message       │                                    │  token  status           │
│  status: pending/       │                                    │  expires_at              │
│  approved/rejected      │                                    └──────────────────────────┘
│  reviewed_by → users.id │
└─────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                              books                                       │
│  id (CHAR36 PK)  title  description  cover_url  cover_thumb_url         │
│  author_id → users.id                                                    │
│  partner_id → users.id                                                   │
│  status: draft|in_review|published|rejected                             │
│  price  is_free  is_featured  category  total_reads                     │
│  cover_storage_key  cover_thumb_key  cover_width  cover_height          │
└────────┬─────────────────────────────────────────────────────────────────┘
         │
         ├──────────────────────────────────────────────────────────────────┐
         │                                                                  │
         ▼                                                                  ▼
┌─────────────────────────┐                                    ┌──────────────────────────┐
│       chapters          │                                    │       book_files         │
│  id  book_id  chapter_num│                                   │  id  book_id  format     │
│  title  content(LONGTEXT)│                                   │  original_name           │
│  word_count  is_published│                                   │  storage_key  file_size  │
│                          │                                   │  status: uploaded/       │
└──────────────────────────┘                                   │  processing/processed/   │
                                                               │  failed                  │
                                                               └──────────────────────────┘
                                                                          │
                                                                          ▼
                                                               ┌──────────────────────────┐
                                                               │        ai_jobs           │
                                                               │  id  book_id  file_id    │
                                                               │  status: queued/running/ │
                                                               │  done/failed             │
                                                               │  chapters_found  result  │
                                                               └──────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                            purchases                                     │
│  id  user_id → users.id  book_id → books.id  price_paid                 │
│  UNIQUE(user_id, book_id)                                                │
└────────┬─────────────────────────────────────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────────────────────────────────────┐
│                             earnings                                     │
│  id  purchase_id  book_id  user_id                                       │
│  role: author|partner|platform                                           │
│  amount  currency  status: pending|paid  paid_at                        │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                           reading_progress                               │
│  id  user_id  book_id  chapter_id                                        │
│  scroll_pct  page_num  total_pages  time_spent_s                        │
│  UNIQUE(user_id, book_id)                                                │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                             bookmarks                                    │
│  id  user_id  book_id  chapter_id  page_num  note  highlight            │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                              reviews                                     │
│  id  user_id  book_id  rating(1-5)  body                                │
│  UNIQUE(user_id, book_id)                                                │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                        reader_preferences                                │
│  user_id(PK)  font_size  font_family  theme: dark|light|sepia           │
│  line_height                                                             │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                      author_partner_relations                            │
│  id  author_id  partner_id                                               │
│  status: active|paused|terminated                                        │
│  termination_reason  terminated_by  terminated_at  started_at           │
│  UNIQUE(author_id, partner_id)                                           │
└────────┬─────────────────────────────────────────────────────────────────┘
         │
         ├──────────────────────────────────────────────────────────────────┐
         ▼                                                                  ▼
┌─────────────────────────┐                                    ┌──────────────────────────┐
│     author_reviews      │                                    │     partner_reviews      │
│  (partner rates author) │                                    │  (author rates partner)  │
│  communication_rating   │                                    │  support_rating          │
│  quality_rating         │                                    │  fairness_rating         │
│  reliability_rating     │                                    │  communication_rating    │
│  professionalism_rating │                                    │  overall_rating          │
│  overall_rating         │                                    │  review_text             │
│  review_title/text      │                                    │  partner_response        │
│  author_response        │                                    └──────────────────────────┘
└─────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                           partner_codes                                  │
│  id  partner_id  code(UNIQUE)  is_active                                │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                          platform_settings                               │
│  setting_key(UNIQUE)  value  updated_by  updated_at                     │
│  Keys: storage_provider, storage_local_dir, storage_s3_*,               │
│        max_upload_mb, allowed_formats, cover_width/height,              │
│        revenue_author_pct, revenue_partner_pct, revenue_platform_pct   │
└──────────────────────────────────────────────────────────────────────────┘

┌──────────────────────────────────────────────────────────────────────────┐
│                              payouts                                     │
│  id  user_id  amount  currency                                           │
│  status: pending|processing|completed|failed                            │
│  reference  processed_by  processed_at                                  │
└──────────────────────────────────────────────────────────────────────────┘
```

### Full Table List

| Table | Purpose |
|---|---|
| `users` | All accounts (oso/partner/author/reader in one table) |
| `books` | Book metadata, status, pricing, cover info |
| `chapters` | Book chapters with content (LONGTEXT) |
| `book_files` | Uploaded source files (PDF/EPUB/DOCX/TXT) |
| `ai_jobs` | AI chapter detection job tracking |
| `purchases` | Reader book purchases |
| `earnings` | Revenue ledger per purchase (author/partner/platform rows) |
| `payouts` | Payout records to authors/partners |
| `reading_progress` | Reader's current position per book |
| `bookmarks` | Reader bookmarks with notes/highlights |
| `reviews` | Reader book ratings (1–5) and text |
| `reader_preferences` | Per-user reader settings (theme, font, etc.) |
| `partner_applications` | Partner onboarding requests |
| `author_invitations` | Token-based author invite emails |
| `author_partner_relations` | Active/historical author↔partner relationships |
| `author_reviews` | Partner's assessment of authors |
| `partner_reviews` | Author's assessment of partners |
| `partner_codes` | Partner referral/promo codes |
| `platform_settings` | Runtime config (storage, revenue splits, limits) |

---

## 10. Revenue & Earnings Flow

```
Reader clicks "Buy"
        │
        ▼
POST /api/purchases
        │
        ├─ Validate: book exists + published
        ├─ Validate: not already owned
        ├─ Load revenue split from platform_settings:
        │     revenue_author_pct   = 70%  (default)
        │     revenue_partner_pct  = 20%  (default)
        │     revenue_platform_pct = 10%  (default)
        │
        ├─ BEGIN TRANSACTION
        │     INSERT purchases (user_id, book_id, price_paid)
        │     UPDATE books SET total_reads = total_reads + 1
        │     INSERT earnings (role='author',   amount=price×70%)
        │     INSERT earnings (role='partner',  amount=price×20%)
        │     INSERT earnings (role='platform', amount=price×10%)
        │     INSERT IGNORE reading_progress (first chapter)
        └─ COMMIT

Revenue Query (GET /api/revenue):
  role=oso     → full platform summary + monthly chart + top books
  role=partner → partner earnings + per-author breakdown + monthly
  role=author  → author earnings + per-book breakdown + monthly

Payout Flow:
  OSO triggers payout → INSERT payouts (status=pending)
  → Process externally → UPDATE payouts (status=completed)
  → UPDATE earnings (status=paid, paid_at=now)
```

### Revenue Split Diagram

```
Book Sale: $10.00
     │
     ├──── Author   70% ──→  $7.00  (earnings row, role='author')
     ├──── Partner  20% ──→  $2.00  (earnings row, role='partner')
     └──── Platform 10% ──→  $1.00  (earnings row, role='platform')

Percentages are configurable in platform_settings table.
OSO can adjust splits without code changes.
```

---

## 11. Book Lifecycle

```
Author creates book (status = 'draft')
        │
        ▼
Author uploads cover image
  → Sharp: resize to 1600×2400 (full) + 320×480 (thumb)
  → Store via storage abstraction (local or S3)
  → Save cover_url, cover_thumb_url, cover_storage_key
        │
        ▼
Author uploads book file (PDF/EPUB/DOCX/TXT)
  → INSERT book_files (status='uploaded')
  → INSERT ai_jobs (status='queued')
        │
        ▼
AI Chapter Detection (POST /api/books/[id]/chapters/split)
  → Parse file: pdf-parse / mammoth / epub2 / fs.readFile
  → Send text to OpenAI GPT-4 Turbo
  → Detect chapter boundaries + titles + language
  → Split full text by markers
  → INSERT chapters (is_published=0)
  → UPDATE ai_jobs (status='done', chapters_found=N)
        │
        ▼
Author reviews chapters
  → Edit titles, reorder, delete
  → POST /api/books/[id]/chapters/arrange (AI auto-arrange)
  → Toggle is_published per chapter
        │
        ▼
Author submits for review (status = 'in_review')
        │
        ▼
Partner reviews submission
  → Approve → status = 'published'  (book visible to readers)
  → Reject  → status = 'rejected'   (feedback shown to author)
        │
        ▼
Book published → appears in catalog
  → Readers can browse, purchase, read
  → total_reads incremented on purchase
  → Reviews and ratings collected
        │
        ▼
OSO can feature book (is_featured = 1)
OSO can suspend book (status = 'suspended' equivalent)
```

---

## 12. AI Chapter Processing Pipeline

```
Uploaded File (PDF/EPUB/DOCX/TXT)
        │
        ▼
lib/parsers/index.ts
  ├─ .pdf   → pdf-parse  → raw text
  ├─ .epub  → epub2      → raw text
  ├─ .docx  → mammoth    → raw text
  └─ .txt   → fs.readFile → raw text
        │
        ▼
lib/ai-chapters.ts :: detectChapters(rawText)
        │
        ├─ Truncate to 60,000 chars for GPT-4 analysis
        │
        ├─ OpenAI GPT-4 Turbo (temperature=0.1)
        │   System: "You are a professional book editor..."
        │   Returns JSON: { language, summary, warnings, chapters[] }
        │   Each chapter: { chapter_num, title, start_marker, confidence }
        │
        ├─ splitTextByMarkers(fullText, detected[])
        │   → Locate each chapter's start_marker in full text
        │   → Slice content between consecutive markers
        │   → Filter out segments < 50 chars
        │
        └─ Returns: DetectedChapter[]
             { chapter_num, title, content, word_count, confidence }
        │
        ▼
INSERT chapters into DB (is_published = 0)
        │
        ▼
Author can also call:
  autoArrangeChapters() → GPT-4 determines correct narrative order
  validateChapter()     → GPT-4 cleans title + flags issues
```

---

## 13. Storage Abstraction

```
lib/storage.ts — Runtime provider switching

                    ┌─────────────────────────────┐
                    │  uploadFile(file, subDir)    │
                    └──────────────┬──────────────┘
                                   │
                    SELECT storage_provider FROM platform_settings
                                   │
               ┌───────────────────┴───────────────────┐
               ▼                                       ▼
    provider = 'local'                      provider = 's3'
               │                                       │
    ┌──────────────────────┐         ┌─────────────────────────────┐
    │  uploadToLocal()     │         │  uploadToS3()               │
    │  base: uploads/books │         │  AWS S3Client (dynamic      │
    │  mkdir -p subDir     │         │  import @aws-sdk/client-s3) │
    │  writeFile buffer    │         │  PutObjectCommand           │
    │  returns storageKey  │         │  Supports S3-compatible:    │
    └──────────────────────┘         │  R2, MinIO, etc.            │
                                     └─────────────────────────────┘

OSO can switch local ↔ S3 via admin panel (platform_settings)
without any code changes or redeployment.

Functions:
  uploadFile(file, subDir)  → UploadResult { storageKey, provider }
  deleteFile(storageKey)    → void
  readFile(storageKey)      → Buffer  (for parsing)
```

---

## 14. Partnership & Onboarding Flow

```
PARTNER ONBOARDING:
  1. Anyone submits POST /api/partners (public)
     → INSERT partner_applications (status='pending')
  2. OSO reviews in /oso/partners dashboard
     → Approve: create users row (role='partner') + notify
     → Reject:  UPDATE partner_applications (status='rejected')
  3. Partner logs in → /partner dashboard

AUTHOR ONBOARDING (via Partner):
  1. Partner goes to /partner/authors/invite
     → POST /api/partners/[id]/invite { email }
     → INSERT author_invitations (token=random64, expires_at=+7days)
     → Send invitation email with token link
  2. Author clicks link → /auth/accept-invite?token=...
     → POST /api/auth/accept-invite { token, name, password }
     → Validate token not expired/used
     → INSERT users (role='author', partner_id=partner.id)
     → UPDATE author_invitations (status='accepted')
     → INSERT author_partner_relations (status='active')
  3. Author logs in → /author dashboard

PARTNER CODES:
  Partners can create referral codes (partner_codes table)
  Authors can request a partner code to link themselves
  POST /api/partner-codes/request

AUTHOR-PARTNER RELATIONSHIP MANAGEMENT:
  author_partner_relations tracks the full lifecycle:
    active → paused → terminated
  Both sides can leave reviews:
    Partner reviews author: communication, quality, reliability, professionalism
    Author reviews partner: support, fairness, communication
```

---

## 15. Security Architecture

### Current Security Layers (Live)

```
┌─────────────────────────────────────────────────────────────────────────┐
│  Layer 1: Authentication                                                │
│  • NextAuth.js Credentials Provider                                     │
│  • bcrypt password hashing (never plain text stored)                   │
│  • JWT tokens with NEXTAUTH_SECRET                                      │
│  • Short-lived sessions with expiry                                     │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│  Layer 2: Authorization (RBAC)                                          │
│  • middleware.ts: Edge-level route guard on every request               │
│  • requireAuth() / requirePermission() in every API handler            │
│  • Role-scoped data queries (partner sees only own catalog, etc.)       │
│  • Partners cannot see other partners' data                             │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│  Layer 3: Content Protection                                            │
│  • Book content served as encrypted streams (not raw file download)    │
│  • Copy-paste disabled in BookReader component                          │
│  • Cover images stored with opaque storage keys (not guessable URLs)   │
└─────────────────────────────────────────────────────────────────────────┘
┌─────────────────────────────────────────────────────────────────────────┐
│  Layer 4: Data Integrity                                                │
│  • Purchases use DB transactions (BEGIN/COMMIT/ROLLBACK)               │
│  • UNIQUE constraints prevent duplicate purchases                       │
│  • Soft deletes preserve audit trail                                    │
│  • account status: active|suspended|pending                            │
└─────────────────────────────────────────────────────────────────────────┘
```

### Security Roadmap

| Phase | Features | Status |
|---|---|---|
| Phase 1 — Foundation | Bcrypt passwords · JWT sessions · RBAC · DB transactions | ✅ Live |
| Phase 2 — Active Protection | Role-scoped queries · Copy-paste disable · Promo code abuse detection | 🔄 In Progress |
| Phase 3 — Identity & Compliance | 2FA · DRM watermark per reader · COPPA/GDPR-K (Gen Alpha) · Partner fraud scoring | 📋 Next |
| Phase 4 — AI Security | AI anomaly detection · Behavioral biometrics · Automated threat response · Security audit reports | 🔮 Future |

---

## 16. Frontend Dashboards

### OSO Admin Dashboard (`/oso`)

```
/oso                    Platform overview stats
/oso/analytics          User growth, revenue distribution, platform metrics
/oso/books              All books across all partners (manage, feature, suspend)
/oso/partners           Partner list, approve applications, manage status
/oso/revenue            Full financial ledger, top books, monthly chart
/oso/settings           Platform config: storage provider, revenue splits, limits
/oso/users              All user accounts, suspend/activate
```

### Partner Dashboard (`/partner`)

```
/partner                Overview: author count, books in review, revenue
/partner/authors        Author list with stats (books, reads, revenue)
/partner/authors/invite Invite new author by email
/partner/books          Review queue: approve/reject book submissions
/partner/revenue        Partner earnings, per-author breakdown, payout history
```

### Author Dashboard (`/author`)

```
/author                 Overview stats
/author/books           Book list (status, chapters, reads, price)
/author/books/new       Create new book
/author/books/[id]      Book detail:
                          • Stats row (reads, chapters, words, reading time)
                          • Cover upload (Sharp processing, 2:3 ratio)
                          • File upload (PDF/EPUB/DOCX/TXT)
                          • AI chapter detection + split
                          • Chapter list (publish toggle, edit, delete)
                          • AI auto-arrange chapters
                          • Book settings (title, desc, category, price)
                          • Submit for review
                          • Rejection feedback display
/author/partners        Partner relationship info
/author/reviews         Reviews received from partner
```

### Reader Dashboard (`/reader`)

```
/reader                 Personalized home feed
/reader/browse          Full catalog with search/filter
/reader/library         Purchased books with reading progress
/reader/books/[id]      Book detail + purchase button
/reader/read/[bookId]   Full-screen reader:
                          • Page-turn animation
                          • Themes: Dark / Light / Sepia
                          • Font: Serif / Sans / Mono / Palatino
                          • Adjustable font size + line height
                          • Chapter navigation sidebar
                          • Auto-save progress every 10 seconds
                          • Bookmarking
                          • Keyboard navigation (arrow keys, spacebar)
/reader/bookmarks       Saved bookmarks with notes
```

---

## 17. Business Model Summary

```
Three-player ecosystem:

  AUTHOR          PARTNER         OSO PLATFORM
  Creates         Curates &       Authenticates,
  content         sells           delivers, protects
     │                │                │
     └────────────────┴────────────────┘
                       │
                       ▼
                   READERS
              Gen Z + Gen Alpha

Revenue split per book sale (configurable):
  Author   → ~70%
  Partner  → ~20%
  Platform → ~10%

Partner tiers:
  Tier 1: Friends & community (low barrier, high trust)
  Tier 2: Pop-up & event shops (QR code activation)
  Tier 3: Online & creator partners (BookTok, Discord, etc.)

Promo codes:
  Partners create time-limited discount codes
  Types: % off, flat discount, first book free, bundle deals
  Fraud detection on every code use
```

---

## 18. Roadmap

### Features

- [x] Multi-role authentication (OSO/Partner/Author/Reader)
- [x] Book upload (PDF/EPUB/DOCX/TXT)
- [x] AI chapter detection (GPT-4 Turbo)
- [x] Cover image processing (Sharp, 2:3 ratio)
- [x] Revenue tracking & earnings ledger
- [x] Partner application & author invitation flow
- [x] Full-screen reader with themes & progress tracking
- [x] Bookmarks, reviews, reading preferences
- [x] Storage abstraction (local ↔ S3 runtime switch)
- [x] Author-partner relationship management & reviews
- [x] Partner promo codes
- [ ] Payment gateway integration (Stripe/PayPal)
- [ ] Subscription tiers (free/basic/premium)
- [ ] 2FA for all accounts
- [ ] DRM watermarking per reader copy
- [ ] COPPA/GDPR-K compliance for Gen Alpha
- [ ] AI anomaly detection for fraud
- [ ] Mobile apps (React Native)
- [ ] Audio books
- [ ] Offline reading
- [ ] AI translation
- [ ] Ads integration

---

## 19. Maintenance Mandate

> **CRITICAL:** Any update, architectural change, new feature, new table, new API route, or new component MUST be reflected in this `docs/ARCHITECTURE.md` file to guide future development and AI assistants.

This document is the single source of truth for the OSO platform architecture. Keep it current.
