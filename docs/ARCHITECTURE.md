# OSO E-Book Platform - System Architecture

## Overview

A multi-role e-book platform with four distinct user tiers:

```
┌─────────────────────────────────────────────────────────┐
│                         OSO                             │
│                    (System Owner)                       │
│                   You - Full Control                     │
└─────────────────────────────────────────────────────────┘
                          │
          ┌───────────────┼───────────────┐
          ▼               ▼               ▼
    ┌──────────┐    ┌──────────┐    ┌──────────┐
    │ Partner  │    │ Partner  │    │ Partner  │
    │  (ATH)   │    │  (ATH)   │    │  (ATH)   │
    └────┬─────┘    └────┬─────┘    └────┬─────┘
         │               │               │
    ┌────┴────┐     ┌────┴────┐     ┌────┴────┐
    │ Authors │     │ Authors │     │ Authors │
    │    ▼    │     │    ▼    │     │    ▼    │
    │  Books  │     │  Books  │     │  Books  │
    └─────────┘     └─────────┘     └─────────┘
                          │
                          ▼
                   ┌──────────────┐
                   │   Readers    │
                   │   (Users)    │
                   └──────────────┘
```

## User Roles

### 1. OSO Admin (You)
- Full system access
- Manage partners
- Manage all content
- View analytics
- System configuration

### 2. Partners (ATH)
- Sign up under OSO
- Manage their authors
- Commission/business model
- Can have contract terms

### 3. Authors
- Can be independent (under OSO directly)
- Or under a Partner
- Create and publish books
- Manage chapters
- View stats

### 4. Readers
- Browse and read books
- Bookmark progress
- Follow authors
- Reviews and ratings

## Database Tables

### Core Users
- `users` - Base account table
- `partners` - Partner profile extensions
- `authors` - Author profile extensions  
- `readers` - Reader profile extensions

### Content
- `genres` - Book categories
- `books` - Book metadata
- `chapters` - Book content

### Engagement
- `reading_progress` - Where readers left off
- `bookmarks` - Saved books
- `follows` - Author followers
- `reviews` - Book ratings & reviews

### System
- `oso_config` - Platform settings
- `audit_logs` - Activity tracking

## Key Design Decisions

### Why Separate Tables for Roles?
- Each role has different fields
- An author can also be a reader
- Users can upgrade roles (reader → author)

### Why Soft Delete?
- Books/content can be recovered
- Audit trail preserved
- Readers don't lose bookmarks

### Why UUID + ID?
- UUID: Public-facing (URLs, APIs)
- ID: Internal joins (faster, smaller)

### Content Rating System
- Allows filtering by age group
- Required for app store compliance

## Future Features (Planned)

- [ ] Payments/Unlock chapters
- [ ] Subscriptions tiers
- [ ] Ads integration
- [ ] Audio books
- [ ] Offline reading
- [ ] Mobile apps
- [ ] Author earnings dashboard
- [ ] AI translation

## Tech Stack Recommendations

**Database:** PostgreSQL (schema designed for PG)
**Backend:** Node.js/Express or Fastify
**Frontend:** React/Vue + React Native for mobile
**Storage:** AWS S3 or Cloudflare R2 for covers/PDFs
**Search:** Meilisearch or Algolia
