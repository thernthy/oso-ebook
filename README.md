# OSO E-book Platform

A comprehensive digital publishing and e-book platform built with **Next.js (App Router)**, **TypeScript**, and **MySQL**. It supports a multi-role structure including Readers, Authors, Partners, and OSO (Operator) admins.

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+
- MySQL Server

### 2. Installation
```bash
npm install
```

### 3. Environment Setup
Create a `.env` file in the root directory (or use the one already generated):
```env
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=oso_ebook

OPENAI_API_KEY=sk-your-openai-key-here
NEXTAUTH_SECRET=oso-backend-v7-secret-key-12345
NEXTAUTH_URL=http://localhost:3000
```

### 4. Database Migration
Run the migration script to create the database and tables:
```bash
npm run db:migrate
```

### 5. Run the Development Server
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

---

## 🔐 Authentication & Testing

Since the project uses **NextAuth.js**, you can log in as different roles once users are created in the `users` table.

### Default Test Accounts:
The following accounts are available after running `npm run db:seed`.
**All accounts use the password:** `Password@123`

| Role    | Email                | Redirect Dashboard |
|---------|----------------------|--------------------|
| **OSO** | `admin@oso.com`      | `/oso`             |
| **Partner** | `partner@partner.com` | `/partner`         |
| **Author**  | `author@author.com`   | `/author`          |
| **Reader**  | `reader@reader.com`   | `/reader`          |

### How to Test:
- **Login Route:** `/auth/login`
- **Dashboards:**
  - Reader: `/reader`
  - Author: `/author`
  - Partner: `/partner`
  - OSO Admin: `/oso`

> **Note:** To test the login, ensure you have records in the `users` table with hashed passwords (BCrypt).

---

## 🛠️ Tech Stack
- **Framework:** Next.js 14
- **Language:** TypeScript
- **Database:** MySQL (mysql2)
- **Auth:** NextAuth.js
- **AI:** OpenAI API (for chapter processing)
- **Processing:** Sharp (Images), PDF-Parse, Mammoth (DOCX), EPUB2
