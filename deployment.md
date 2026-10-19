# Alpha Steel Frames — Hostinger Production Deployment Guide

This guide details the complete production deployment procedure for the **Alpha Steel Frames** quotation and accounting management software on **Hostinger Node.js Shared Hosting**.

---

## 1. Production Architecture & Environment

| Component | Specification |
| :--- | :--- |
| **Production Domain** | `https://go.alphasteelframes.com.au/` |
| **Hosting Platform** | Hostinger Node.js Shared Hosting / Cloud Startup |
| **Node.js Version** | Node.js `20.x` LTS (or `18.x` LTS) |
| **Database** | Hostinger Managed MySQL (v8.0 / MariaDB 10.11) |
| **Application Framework** | Next.js 14 App Router |
| **Server Entry Point** | `server.js` (HTTP request dispatcher with zero external daemons) |
| **Production Start Command**| `npm run start` (`node server.js`) |
| **Authentication** | Cryptographic JWT sessions (`HttpOnly`, `Secure`, `SameSite=Lax` cookies) |
| **Password Security** | Scrypt KDF with cryptographically random 32-byte salt |
| **PWA Support** | Service worker with static-only caching (strict financial data exclusion) |

---

## 2. Pre-Deployment Checklist

Before deploying, ensure you have:
1. Access to **Hostinger hPanel** (`https://hpanel.hostinger.com`).
2. The domain/subdomain **`go.alphasteelframes.com.au`** pointed to your Hostinger hosting account.
3. An active SSL certificate installed on `go.alphasteelframes.com.au` (free Let's Encrypt in hPanel).
4. SSH or Terminal access enabled in Hostinger (**Advanced** $\rightarrow$ **SSH Access**).

---

## 3. Step-by-Step Deployment Instructions

### Step 1: Create the Production MySQL Database

1. In Hostinger hPanel, navigate to **Databases** $\rightarrow$ **MySQL Databases**.
2. Create a new MySQL database:
   * **Database Name**: e.g., `u123456789_asf_db`
   * **Username**: e.g., `u123456789_asf_user`
   * **Password**: Generate a strong password (at least 20 characters with symbols).
3. Note the connection details:
   * **Host**: `localhost` (Hostinger shared hosting runs MySQL locally on `localhost:3306`)
   * **Database**: `u123456789_asf_db`
   * **User**: `u123456789_asf_user`
   * **Password**: `[YOUR_STRONG_PASSWORD]`

---

### Step 2: Import the Database Schema

1. In hPanel, next to your newly created database, click **Enter phpMyAdmin**.
2. Select your database from the left sidebar.
3. Click the **Import** tab at the top.
4. Choose the file: `prisma/mysql_schema.sql` from this repository.
5. Click **Import** (or **Go**) at the bottom.
6. Verify that the 25 tables are created, including `Tenant`, `User`, `UserTenant`, `Quote`, `QuoteLine`, `Contact`, `Item`, `Account`, and `SystemSetting`.

> [!NOTE]
> Alternatively, if you have SSH terminal access, you can run:
> ```bash
> mysql -u u123456789_asf_user -p u123456789_asf_db < prisma/mysql_schema.sql
> ```

---

### Step 3: Configure the Hostinger Node.js Application

1. In Hostinger hPanel, search for **Node.js** in the search bar or go to **Advanced** $\rightarrow$ **Node.js**.
2. Click **Create Application** (or manage existing):
   * **Node.js Version**: Select `20.x` (or `18.x`).
   * **Application Mode**: `Production`
   * **Application Root**: e.g., `/home/u123456789/domains/go.alphasteelframes.com.au/public_html`
   * **Application Startup File**: `server.js`
3. Click **Save Changes**.

---

### Step 4: Configure Production Environment Variables

In the Node.js management section in hPanel (or by creating a secure `.env` file in the Application Root):

```ini
# Node Environment
NODE_ENV="production"

# Port (Hostinger sets this automatically; fallback 3000)
PORT=3000

# Canonical Application URLs
NEXT_PUBLIC_APP_URL="https://go.alphasteelframes.com.au"
APP_URL="https://go.alphasteelframes.com.au"
NEXT_PUBLIC_SHELL_DOMAIN="go.alphasteelframes.com.au"
NEXT_PUBLIC_MARKETING_DOMAIN="alphasteelframes.com.au"
NEXT_PUBLIC_AUTH_DOMAIN="go.alphasteelframes.com.au"

# Hostinger MySQL Database Connection
DATABASE_URL="mysql://u123456789_asf_user:YOUR_STRONG_PASSWORD@localhost:3306/u123456789_asf_db"

# JWT Cryptographic Signing Secret (Generate using openssl rand -hex 32)
JWT_SECRET="64_CHARACTER_RANDOM_HEX_SECRET_STRING_HERE"
```

> [!IMPORTANT]
> Never commit `.env` to Git. File permissions for `.env` should be `600` on the server.

---

### Step 5: Upload Project Files & Build Production Assets

1. Connect to your Hostinger account via Git, SSH, or SFTP.
2. Upload the project files to your Application Root directory. Ensure `.git`, `.next`, and `node_modules` are excluded from the upload.
3. Open Hostinger **SSH Terminal** and navigate to your application root:
   ```bash
   cd ~/domains/go.alphasteelframes.com.au/public_html
   ```
4. Install dependencies:
   ```bash
   npm install --omit=dev
   ```
5. Generate the Prisma MySQL client:
   ```bash
   npx prisma generate
   ```
6. Build the Next.js production bundle:
   ```bash
   npm run build
   ```

---

### Step 6: Start the Production Server

In the Hostinger hPanel Node.js management panel:
1. Click **Restart Application** (or **Start Application**).
2. Hostinger Phusion Passenger will launch `server.js` with production environment flags.
3. To verify process health, visit:
   ```
   https://go.alphasteelframes.com.au/healthz
   ```
   Expected response: `{"status":"healthy","timestamp":"..."}`.

---

## 4. First-Launch Setup Wizard Experience

When you first open `https://go.alphasteelframes.com.au/` on a freshly provisioned database:

```mermaid
flowchart TD
    A["Visit https://go.alphasteelframes.com.au/"] --> B{"Is System Initialized?"}
    B -- "No (Fresh DB)" --> C["Initial Setup Wizard (/setup)"]
    B -- "Yes (Configured)" --> D["Login Page (/login)"]
    
    C --> E["Step 1: Create First Administrator<br/>(Name, Email, Strong Password)"]
    E --> F["Step 2: Organization Profile<br/>(Alpha Steel Frames Pty Ltd, ABN, AUD)"]
    F --> G["Step 3: Review & Confirm Initialization"]
    G --> H["Transactional DB Initialization<br/>(Admin, Tenant, Chart of Accounts, Items)"]
    H --> I["Setup Sealed & Locked<br/>(POST /api/setup returns 403 permanently)"]
    I --> D
```

### Setup Steps:
1. **Navigate to the site**: Open `https://go.alphasteelframes.com.au/`. The system detects that no administrator or organization exists and automatically displays the **Initial Setup Wizard**.
2. **Step 1 — Administrator Account**:
   * Enter the **Administrator Full Name**.
   * Enter the **Administrator Email Address**.
   * Choose a strong **Password** (min 8 characters, with uppercase, lowercase, and numeric digits).
   * Confirm the password.
3. **Step 2 — Organization Profile**:
   * **Legal Name**: `Alpha Steel Frames Pty Ltd`
   * **Trading Name**: `Alpha Steel Frames`
   * **ABN**: `51 824 753 556` (or current business identifier)
   * **Address**: `12 Titanium Circuit, Yatala, QLD 4207`
   * **Phone & Email**: Business contact details
   * **Currency**: `AUD` (Australian Dollars)
   * **Timezone**: `Australia/Brisbane`
   * **Quote Prefix**: `QU-`
4. **Step 3 — Review & Confirm**:
   * Verify all details in the summary screen.
   * Click **Initialize Alpha Steel Frames**.
   * The server executes an atomic transaction that:
     1. Creates the `Tenant` record.
     2. Hashes the administrator password with `scrypt` and creates the `User` with `role: OWNER`.
     3. Seeds the standard Chart of Accounts (200 Sales, 610 Accounts Receivable, 820 GST, 090 Bank Account, 300 COGS).
     4. Seeds product presets (Wall Frames, Trusses, C-Studs, Hardware Kits).
     5. Records `INITIAL_SETUP_COMPLETED` marker.
5. **Sealing Setup**:
   * The `/api/setup` endpoint is permanently locked down (`403 Forbidden`).
   * Direct visits to `/setup` are immediately redirected to `/login`.
   * Public registration `/register` is disabled; only the administrator can add staff users from Settings.

---

## 5. Secure Administrator Password Recovery Procedure

Because public registration and public password-reset forms are intentionally disabled to protect private financial data, use this secure server-side recovery procedure if an administrator forgets their credentials.

### Procedure (via Hostinger SSH / phpMyAdmin):

1. **Option A: Via Local Hash Generation Script**
   Open Hostinger SSH Terminal:
   ```bash
   cd ~/domains/go.alphasteelframes.com.au/public_html
   node -e '
     const crypto = require("crypto");
     const salt = crypto.randomBytes(32).toString("hex");
     const pass = "NewTemporaryPassword2026!";
     crypto.scrypt(pass, salt, 64, (err, derivedKey) => {
       console.log("PasswordHash: " + salt + ":" + derivedKey.toString("hex"));
     });
   '
   ```
2. **Option B: Update the Administrator in phpMyAdmin**
   * Open phpMyAdmin in Hostinger.
   * Run the SQL query:
     ```sql
     UPDATE `User` 
     SET `passwordHash` = 'PASTE_OUTPUT_HASH_HERE', `updatedAt` = NOW() 
     WHERE `email` = 'admin@alphasteelframes.com.au';

     -- Clear any account lockouts
     DELETE FROM `AccountLockout` WHERE `userId` IN (
       SELECT `id` FROM `User` WHERE `email` = 'admin@alphasteelframes.com.au'
     );
     ```
3. Log in with `NewTemporaryPassword2026!` at `https://go.alphasteelframes.com.au/login` and immediately change your password.

---

## 6. Hostinger Shared Hosting Optimization & Safeguards

1. **Memory & CPU Limits**: Next.js is configured without development bloat or hot-reloading. `next.config.mjs` disables webpack in-memory cache to maintain low RAM usage (< 150MB).
2. **No Persistent Background Daemons**: All business logic runs in request-response cycles. No WebSockets or PM2 daemons are required.
3. **Database Connections**: Prisma connection pool is managed efficiently to prevent exceeding Hostinger's `max_user_connections` limit.
4. **PWA Security**: Static assets (`/logo.png`, `/manifest.json`) are cached by `sw.js`, but all financial endpoints (`/quotes`, `/contacts`, `/api/*`) are strictly excluded from browser storage.
5. **Brute-Force Protection**: 5 failed login attempts trigger an automatic 15-minute sliding-window lockout enforced in the database.
