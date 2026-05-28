# Festival & Event Management System (Society Level)

A full-stack, production-ready Festival & Event Management System built on **Node.js, Express, MySQL, Sequelize, JWT, and Bootstrap 5**.

---

## 🏗 Directory Structure

```
festival-event-system/
├── config/
│   └── database.js          # Sequelize connection config
├── controllers/
│   ├── authController.js    # Signups, logins, and profiles
│   ├── auditController.js   # Audit logs & CSV exports
│   ├── festivalController.js# Festivals CRUD
│   ├── eventController.js   # Events CRUD & date checks
│   ├── contributorController.js # Donations lists & uploads
│   ├── allocationController.js # Allocating funds with limits
│   ├── expenseController.js # Expense billing and approval checks
│   ├── volunteerController.js # Shifts schedule conflict checks
│   └── vendorController.js  # Vendor evaluations & documents
├── middleware/
│   ├── auth.js              # JWT validation middleware
│   ├── roleCheck.js         # Authorization middleware
│   ├── upload.js            # Multer type/size file upload limits
│   └── validators.js        # input sanitization pipeline
├── models/                  # Sequelize schemas mapping tables
├── public/
│   ├── css/
│   │   └── style.css        # Premium custom theme css
│   └── uploads/             # Invoice, compliance, and cert uploads
├── routes/                  # API endpoints definition
├── views/                   # EJS browser templates
├── app.js                   # Main application entry point
├── database.sql             # SQL creation, index, and seed scripts
├── package.json             # NPM dependencies registry
└── README.md
```

---

## 🛠 Prerequisites

1. **Node.js:** Ensure Node.js (v16+) is installed. [Download Node.js](https://nodejs.org/).
2. **MySQL Database Server:** Ensure MySQL Server is running locally (configured during installation).

---

## 🚀 Getting Started

### 1. Set Up the Database

1. Open **MySQL Workbench** or your preferred database client.
2. Connect to your local database server (using your local credentials, e.g., `root`).
3. Click the **SQL** query tab and paste the contents of `database.sql`.
4. Click the **Execute** button (lightning bolt icon) to run the script. This creates:
   * The database `festival_db`
   * All 13 tables (with foreign keys, cascades, indexes)
   * The core seed users (Admin, Finance, Organizer, Volunteer, Contributor, Vendor)

### 2. Configure Environment Variables

Edit the `.env` file in the root of the project to match your credentials:
```env
DB_HOST=localhost
DB_PORT=3306
DB_NAME=festival_db
DB_USER=your_database_user
DB_PASSWORD=your_database_password

PORT=3000
JWT_SECRET=super_secret_festival_key_12345
JWT_REFRESH_SECRET=super_secret_refresh_festival_key_67890
```

### 3. Install Dependencies

Open a command prompt in this workspace directory and run:
```bash
npm install
```

### 4. Run the Server

To run the application in development mode with automatic reload:
```bash
npm run dev
```
Or start the server normally:
```bash
npm start
```
The server will bind to: `http://localhost:3000`.

---

## 🔑 Seed Accounts for Testing

All test accounts share the password: **`password123`**

| Role | Email |
| :--- | :--- |
| **Admin** | `admin@fest.com` |
| **Finance** | `finance@fest.com` |
| **Organizer** | `organizer@fest.com` |
| **Volunteer** | `volunteer@fest.com` |
| **Contributor** | `contributor@fest.com` |
| **Vendor** | `vendor@fest.com` |

---

## 📁 File Upload Policies (Multer)

| Category | Allowed Types | Maximum Size | Destination Folder |
| :--- | :--- | :--- | :--- |
| **Expense Invoices** | `.pdf`, `.jpg`, `.jpeg`, `.png` | 10 MB | `/public/uploads/invoices/` |
| **Vendor Compliance** | `.pdf`, `.jpg`, `.jpeg`, `.png` | 5 MB | `/public/uploads/vendor_docs/` |
| **Volunteer Credentials** | `.pdf`, `.jpg`, `.jpeg`, `.png` | 2 MB | `/public/uploads/volunteer_id/` |
| **Donation Receipts** | `.pdf`, `.jpg`, `.jpeg`, `.png` | 5 MB | `/public/uploads/invoices/` |

---

## 🌐 Core API Endpoints

### Auth Module (`/api/auth`)
* `POST /login` - Sign in and fetch JWT session.
* `POST /register` - Register a Contributor, Volunteer, Vendor, or Organizer.
* `GET /profile` - Retrieve user profile attributes.
* `GET /logout` - Invalidate session cookie.

### Festivals & Events (`/api/festivals`, `/api/events`)
* `GET /` - List all records.
* `POST /` - Insert record (restricted roles).
* `PUT /:id` - Edit specific record.
* `DELETE /:id` - Destroy record.

### Expenses (`/api/expenses`)
* `GET /` - Fetch transaction list.
* `POST /` - File expense request (attaches file).
* `PUT /:id` - Update payment flags or recommendation/approval states.

### Volunteers (`/api/volunteers`)
* `GET /` - Directory checklist.
* `POST /assignments` - Dispatch shift (verifies background checks & overlap).
* `POST /profile/certifications` - Upload verification documents.
* `PUT /:id/background` - Modify background check results (Admin only).

---

## ✨ Advanced DBMS Semester Standout Features

To make this project stand out in grading, four advanced database-centric modules are implemented:

### 1. 🔍 Audit Log State Diff Viewer
* **Overview:** Tracks every single CRUD operation performed in the application.
* **Under the Hood:** Leverages raw database triggers (for expenses) and Sequelize application-level hooks (`logAudit`) to log snapshots of the database row **before** (`old_value`) and **after** (`new_value`) the transaction in a dedicated `audit_history` table.
* **UI Diff Inspector:** Clicking **"View Changes"** on any log row opens a state diff modal. It parses the JSON objects and compares properties side-by-side:
  - Red background/strike-through text represents deleted or modified old attributes.
  - Green background represents newly created or updated attributes.

### 2. ⚡ Live SQL Console Sandbox & Benchmarking
* **Overview:** An interactive SQL terminal in the admin dashboard for executing queries and viewing live metrics.
* **Under the Hood:** Enforces strict read-only validators using regex. Mutating statements (`DROP`, `DELETE`, `UPDATE`, `ALTER`, `TRUNCATE`, `INSERT`, etc.) are securely blocked.
* **Benchmarking:** Uses high-resolution system timers (`performance.now()`) to measure and output execution speed in milliseconds (`Execution Time: X.XX ms`).

### 3. 💾 One-Click SQL Database Exporter (Backups)
* **Overview:** Generates a full SQL backup file of the database directly from the web browser.
* **Under the Hood:** Programmatically queries table schemas and row contents using raw MySQL metadata commands. It compiles drop table queries, database structure declarations, and insert commands into a single `.sql` script downloadable as a browser attachment.

### 4. 📄 Printable Event Financial Statement Invoices (PDF Export)
* **Overview:** Generates printable transaction summaries for any active event.
* **Under the Hood:** Dynamically joins contribution allocations, expenses, and organizer profiles. Custom print media CSS rules (`@media print`) hide navigation components and buttons, rendering a clean, professional financial ledger statement optimized for standard browser **Print to PDF** actions.

