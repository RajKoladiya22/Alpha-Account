# Hostinger Shared Node.js Server — MySQL Setup & Deployment Guide

This application has been fully configured and optimized for **MySQL** on Hostinger Shared Hosting (cPanel / hPanel).

---

## 1. Create MySQL Database in Hostinger hPanel

1. Log into your **Hostinger control panel (hPanel)**.
2. Navigate to **Databases** → **MySQL Databases**.
3. Create a new database:
   - **Database Name**: e.g., `u123456789_alphasteel`
   - **Database Username**: e.g., `u123456789_admin`
   - **Password**: Enter a strong password (e.g., `YourSecurePass2026!`)
4. Click **Create**. Note down your full database name, username, and password.

---

## 2. Configure Environment Variables (`.env`)

In your project root directory on the Hostinger server, edit or create `.env`:

```env
# Hostinger MySQL Connection String
DATABASE_URL="mysql://u123456789_admin:YourSecurePass2026!@localhost:3306/u123456789_alphasteel"

# JWT Authentication Secret (32+ characters)
JWT_SECRET="fintech_super_secure_jwt_signing_key_32bytes_long!"

# App URL and Port
NEXT_PUBLIC_APP_URL="https://yourdomain.com"
PORT=3000
```

> **Note**: On Hostinger shared hosting, the database host is almost always `localhost` on default port `3306`.

---

## 3. Database Schema Import

You can create all tables, indexes, and foreign keys in your MySQL database using either of the following methods:

### Method A: One-Click Import via phpMyAdmin (Recommended)
1. In Hostinger hPanel, go to **Databases** → **phpMyAdmin** and click **Enter phpMyAdmin** next to your database.
2. Click the **Import** tab at the top.
3. Choose the generated SQL file: [`prisma/mysql_schema.sql`](file:///Users/raj/Project/Xero/prisma/mysql_schema.sql).
4. Click **Go** (or **Import**). All tables, UTF-8 collation (`utf8mb4`), indexes, and constraints will be created immediately.

### Method B: Via Hostinger SSH / Terminal
If you have SSH access enabled in Hostinger:
```bash
# Push schema to MySQL database
npx prisma db push

# Generate client
npx prisma generate
```

---

## 4. Seed the Database

Populate default administrative user, Alpha Steel Frames organization, chart of accounts, and steel framing catalog:

```bash
npm run seed
```

### Default Credentials Created:
- **Email**: `admin@alphasteelframes.com.au`
- **Password**: `AlphaAdmin2026!`
- **Role**: `ADMIN`
- **Organization**: `Alpha Steel Frames` (ABN `45 678 901 234`)

---

## 5. Hostinger Node.js Web App Deployment

1. Go to **Advanced** → **Node.js** in hPanel.
2. Set:
   - **Node.js version**: `18.x` or `20.x` (LTS recommended).
   - **Application root**: Path to your project folder (e.g. `public_html` or subfolder).
   - **Application startup file**: `server.js` or Next.js production runner.
3. Build the Next.js production assets:
   ```bash
   npm run build
   ```
4. Restart the Node.js application from hPanel.
