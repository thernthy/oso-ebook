# OSO Ebook — Backend Setup Guide

## Prerequisites
- Node.js 18+
- MySQL 8.0+
- npm or yarn

---

## 1. Install dependencies

```bash
cd frontend   # or wherever this folder lives in your repo
npm install
```

---

## 2. Set up environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:
```
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=oso_ebook

NEXTAUTH_SECRET=run_this_to_generate: openssl rand -base64 32
NEXTAUTH_URL=http://localhost:3000
```

---

## 3. Set up the database

```bash
mysql -u root -p < database/001_users_roles.sql
mysql -u root -p oso_ebook < database/002_books.sql
mysql -u root -p oso_ebook < database/003_partners.sql
mysql -u root -p oso_ebook < database/004_author_features.sql
```

This creates the `oso_ebook` database, the `users` table, and seeds a default OSO admin account.

**Default credentials:**
- Email: `admin@oso-ebook.com`
- Password: `Admin@123`
- ⚠️ Change this password immediately after first login!

---

## 4. Run the dev server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) — you will be redirected to `/auth/login`.

---

## How Auth Works

1. User submits email + password on `/auth/login`
2. NextAuth `CredentialsProvider` queries MySQL for the user
3. `bcrypt.compare()` checks the password hash
4. On success, NextAuth creates a **JWT token** containing `id`, `role`, `status`, `partner_id`
5. The JWT is stored in a secure HTTP-only cookie
6. `middleware.ts` reads the JWT on every request and redirects to the correct dashboard based on role:
   - `oso` → `/oso`
   - `partner` → `/partner`
   - `author` → `/author`
   - `reader` → `/reader`

---

## File Structure

```
├── app/
│   ├── api/auth/[...nextauth]/route.ts   ← NextAuth handler
│   ├── auth/login/page.tsx               ← Login UI
│   ├── layout.tsx                        ← Root layout + SessionProvider
│   ├── providers.tsx                     ← Client-side providers
│   └── page.tsx                          ← Root redirect
├── lib/
│   ├── db.ts                             ← MySQL2 connection pool
│   └── permissions.ts                    ← Role permission map + can()
├── types/
│   └── next-auth.d.ts                    ← Extended session types
├── middleware.ts                          ← Route protection
├── database/
│   └── 001_users_roles.sql               ← Schema + seed
└── .env.example                          ← Environment template
```

---

## Next Steps (v0.2)
- [ ] API routes: `/api/users`, `/api/books`, `/api/partners`
- [ ] Server components for each dashboard reading real DB data
- [ ] Register/invite flow for Partners and Authors
- [ ] Password reset flow
