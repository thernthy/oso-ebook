# OSO Ebook — API Reference

Base URL: `http://localhost:3000/api`

All endpoints require a valid session cookie (login via `/auth/login` first).
Permission errors return `403`. Auth errors return `401`.

---

## Users

| Method | Route              | Permission      | Description                        |
|--------|--------------------|-----------------|------------------------------------|
| GET    | `/users`           | `manage:users`  | List all users (OSO only)          |
| POST   | `/users`           | `manage:users`  | Create a user (OSO only)           |
| GET    | `/users/:id`       | self or OSO     | Get a single user                  |
| PATCH  | `/users/:id`       | self or OSO     | Update user (role/status: OSO only)|
| DELETE | `/users/:id`       | `manage:users`  | Delete user (OSO only)             |

**GET /users query params:**
- `role` — filter by role (oso, partner, author, reader)
- `status` — filter by status (active, suspended, pending)
- `search` — search name or email
- `page`, `limit` — pagination

---

## Books

| Method | Route                        | Permission       | Description                          |
|--------|------------------------------|------------------|--------------------------------------|
| GET    | `/books`                     | any role         | List books (scoped by role)          |
| POST   | `/books`                     | `upload:books`   | Create book (author only)            |
| GET    | `/books/:id`                 | any role         | Get book + chapters                  |
| PATCH  | `/books/:id`                 | role-scoped      | Edit/approve/reject/feature book     |
| DELETE | `/books/:id`                 | author or OSO    | Delete book                          |
| GET    | `/books/:id/chapters`        | any role         | List chapters                        |
| POST   | `/books/:id/chapters`        | `manage:chapters`| Add chapter (author only)            |

**GET /books query params:**
- `status` — draft, in_review, published, rejected
- `category` — filter by category
- `featured` — `1` for featured only
- `search` — search title/description
- `page`, `limit` — pagination

**Book status flow:**
```
draft → in_review → published
                 → rejected → draft (author edits) → in_review
```

---

## Partners

| Method | Route                           | Permission          | Description                        |
|--------|---------------------------------|---------------------|------------------------------------|
| GET    | `/partners`                     | `manage:partners`   | List all partner accounts (OSO)    |
| POST   | `/partners`                     | public              | Apply to become a partner          |
| GET    | `/partners/:id`                 | self or OSO         | Get partner + authors              |
| PATCH  | `/partners/:id`                 | `manage:partners`   | Update partner status (OSO)        |
| GET    | `/partners/applications`        | `manage:partners`   | List partner applications (OSO)    |
| PATCH  | `/partners/applications`        | `manage:partners`   | Approve or reject application      |
| GET    | `/partners/:id/invite`          | `invite:authors`    | List author invitations            |
| POST   | `/partners/:id/invite`          | `invite:authors`    | Invite an author by email          |

---

## Response Format

All responses follow this structure:

```json
// Success
{ "success": true, "data": { ... } }

// Error
{ "success": false, "error": "Message here" }
```

---

## Auth

| Method | Route              | Permission | Description                    |
|--------|--------------------|------------|--------------------------------|
| POST   | `/auth/signup`     | public     | Register new reader account    |
| GET    | `/auth/accept-invite` | public  | Verify invite token           |
| POST   | `/auth/accept-invite` | public  | Complete author onboarding     |

**POST /auth/signup body:**
```json
{ "name": "string", "email": "string", "password": "string" }
```

**Responses:** `201` success, `400` validation error, `409` email exists

---

## Platform Config

| Method | Route                  | Permission | Description                       |
|--------|------------------------|------------|-----------------------------------|
| GET    | `/platform/config`     | public     | Get public platform settings      |

**GET /platform/config?key=phone_prefix**

Returns `{ success: true, settings: { phone_prefix: "+855" } }`

---

## Coming in v0.3
- `GET/POST /api/purchases` — reader book purchases
- `GET/PATCH /api/progress/:bookId` — reading progress tracking
- `GET/POST /api/reviews` — book reviews
- `GET /api/revenue` — earnings per author/partner (OSO + partner)
- `POST /auth/accept-invite` — complete author onboarding from invite token
