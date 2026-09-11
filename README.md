# EduBatch — Education Batch Management Platform (MVP)

A full-stack MVP built with **React 18 + Vite + Tailwind CSS** (frontend) and **Node.js + Express + MongoDB** (backend), including JWT auth, role-based access (Admin/Teacher/Student), batch management, student enrollment, Razorpay payments, attendance, notices, dashboards, and profile management.

---

## 1. Project structure

```
edubatch/
├── client/              # React + Vite frontend
│   ├── src/
│   │   ├── api/         # axios wrappers per resource
│   │   ├── components/  # Navbar, ProtectedRoute, Loader, Alerts
│   │   ├── context/     # AuthContext (JWT session state)
│   │   └── pages/       # Login, Register, Dashboards, Batches, Payments, etc.
│   └── .env.example
├── server/              # Express REST API
│   ├── src/
│   │   ├── config/      # db.js, razorpay.js
│   │   ├── models/      # User, Batch, Enrollment, Payment, Attendance, Notice
│   │   ├── middleware/  # auth (JWT), role (RBAC), validate (zod), errorHandler
│   │   ├── controllers/
│   │   ├── routes/
│   │   └── app.js / server.js
│   ├── seed.js          # creates demo admin/teacher/student + sample batch
│   └── .env.example
└── README.md            # this file
```

---

## 2. Prerequisites

Install these on your machine before you start:

| Tool                                 | Version                                        | Check with                      |
| ------------------------------------ | ---------------------------------------------- | ------------------------------- |
| Node.js                              | 18+                                            | `node -v`                       |
| npm                                  | 9+                                             | `npm -v`                        |
| MongoDB                              | 6+ (local) **or** a free MongoDB Atlas cluster | `mongod --version`              |
| A Razorpay account (free, test mode) | —                                              | https://dashboard.razorpay.com/ |

> You do **not** need to pay anything — Razorpay's **Test Mode** keys work end-to-end with test card/UPI numbers.

---

## 3. Backend setup (run this first)

```bash
cd server
npm install
cp .env.example .env
```

Now open `server/.env` and fill in:

- `MONGO_URI` — either a local Mongo instance (`mongodb://127.0.0.1:27017/edubatch`) or your MongoDB Atlas connection string.
- `JWT_ACCESS_SECRET` / `JWT_REFRESH_SECRET` — any long random strings (e.g. run `openssl rand -hex 32` twice).
- `RAZORPAY_KEY_ID` / `RAZORPAY_KEY_SECRET` — from Razorpay Dashboard → **Settings → API Keys** (use the **Test Mode** keys).
- Leave `SMTP_*` blank if you don't want to configure real email — in that case, password-reset and receipt emails are simply printed to the server console (see §6).

### Start MongoDB locally (skip if you're using Atlas)

```bash
# macOS (Homebrew)
brew services start mongodb-community

# Ubuntu/Debian
sudo systemctl start mongod

# Or just run it directly
mongod --dbpath /path/to/your/data/folder
```

### Seed demo data (recommended — creates test login credentials)

```bash
npm run seed
```

This creates:

| Role    | Email                    | Password       |
| ------- | ------------------------ | -------------- |
| Admin   | `admin@edubatch.local`   | `Password@123` |
| Teacher | `teacher@edubatch.local` | `Password@123` |
| Student | `student@edubatch.local` | `Password@123` |

...plus one sample batch ("JEE 2027 Morning Batch") with the demo student already enrolled (payment pending), so you can test the Razorpay flow immediately.

### Run the API server

```bash
npm run dev        # with nodemon (auto-restart on changes)
# or
npm start          # plain node
```

You should see:

```
MongoDB connected: ...
EduBatch API server running on http://localhost:5000
Health check: http://localhost:5000/api/v1/health
```

Visit `http://localhost:5000/api/v1/health` in your browser — it should return `{"success":true,"data":{"status":"ok"},...}`. If you don't see this, the frontend won't be able to reach the API.

---

## 4. Frontend setup

Open a **new terminal tab** (keep the backend running):

```bash
cd client
npm install
cp .env.example .env
```

Open `client/.env` and set:

- `VITE_API_BASE_URL=http://localhost:5000/api/v1` (already the default)
- `VITE_RAZORPAY_KEY_ID` — same **public** Key ID you used in the backend `.env` (not the secret).

Run it:

```bash
npm run dev
```

Open **http://localhost:5173** in your browser. Log in with any of the seeded credentials above.

---

## 5. Quick end-to-end test checklist

Do these in order to exercise every module (matches the testing checklist from the project documentation):

1. **Auth**
   - Register a new student at `/register` → should log you straight in.
   - Log out, log back in with wrong password → should show an error, not crash.
   - Try visiting `/admin` while logged in as a student → should redirect away (role guard working).
2. **Batches** (log in as `admin@edubatch.local`)
   - Go to **Batches → + New Batch**, create one with capacity `1`.
   - Edit it, change its status to `active`.
3. **Enrollment & capacity**
   - Open the batch you created → **Enroll Student** → search for and select the seeded student from the dropdown (no need to look up Mongo IDs manually).
   - Try enrolling a second student into the same batch (capacity 1) → should be rejected with "Batch capacity is full".
     3a. **Staff management**
   - As admin, go to **Manage Staff** (`/admin/staff`) → create a new teacher account → it should immediately be selectable in the "Assign Teacher" dropdown on the Batches page.
4. **Payments (Razorpay test mode)**
   - Log in as `student@edubatch.local` → **Payments** → click **Pay Now** on the pre-seeded batch.
   - In the Razorpay checkout popup, use a **test card**: • Visa: 4100 2800 0000 1007 • Mastercard: 5500 6700 0000 1002 • RuPay: 6527 6589 0000 1005, any future expiry, any CVV, any name — or use test UPI id `success@razorpay`.
   - On success, the enrollment should flip to "Paid" and a receipt "email" will be printed in the backend terminal (if SMTP isn't configured).
5. **Attendance**
   - Log in as `admin@edubatch.local` (or the assigned teacher) → open the batch → **Mark Attendance** for today → save.
   - Log back in as the student → **Profile** page → "My Attendance" should show the percentage.
6. **Notices**
   - As admin, post a **global** notice from the `/notices` page, and a **batch-specific** one from the batch detail page.
   - Log in as the student → both should appear on `/notices`.
7. **Dashboards**
   - Check `/admin`, `/teacher`, `/student` each show sensible numbers (student count, revenue, pending fees, upcoming classes).
8. **Security**
   - Call any protected API route without a token (e.g. `curl http://localhost:5000/api/v1/batches`) → should return `401`.
   - Try the same route with a student token but an admin-only action (e.g. `POST /batches`) → should return `403`.

---

## 6. API documentation (summary)

Base URL: `http://localhost:5000/api/v1`. All protected routes need header `Authorization: Bearer <accessToken>`.
Standard response shape: `{ "success": boolean, "data": any, "message": string }`.

| Method | Endpoint                                       | Auth          | Description                                                                           |
| ------ | ---------------------------------------------- | ------------- | ------------------------------------------------------------------------------------- |
| POST   | `/auth/register`                               | Public        | Register as student                                                                   |
| POST   | `/auth/register-staff`                         | Admin         | Create teacher/admin accounts                                                         |
| POST   | `/auth/login`                                  | Public        | Returns access + refresh tokens                                                       |
| POST   | `/auth/refresh`                                | Public        | Exchange refresh token for new access token                                           |
| POST   | `/auth/forgot-password`                        | Public        | Sends reset link (or logs it to console)                                              |
| POST   | `/auth/reset-password`                         | Public        | Reset with token                                                                      |
| GET    | `/auth/me`                                     | Yes           | Current user                                                                          |
| GET    | `/auth/teachers`                               | Admin         | List teacher accounts (for batch assignment)                                          |
| GET    | `/auth/students`                               | Admin/Teacher | List student accounts (for the enroll picker)                                         |
| GET    | `/auth/staff`                                  | Admin         | List teacher + admin accounts (Manage Staff page)                                     |
| GET    | `/batches`                                     | Yes           | List batches                                                                          |
| GET    | `/batches/:id`                                 | Yes           | Batch details + enrolled count                                                        |
| POST   | `/batches`                                     | Admin         | Create batch                                                                          |
| PUT    | `/batches/:id`                                 | Admin         | Update batch                                                                          |
| PATCH  | `/batches/:id/status`                          | Admin         | Change status                                                                         |
| DELETE | `/batches/:id`                                 | Admin         | Soft-archive                                                                          |
| POST   | `/enrollments`                                 | Admin/Teacher | Enroll a student `{studentId, batchId}` (teacher limited to their own assigned batch) |
| DELETE | `/enrollments/:id`                             | Admin/Teacher | Deactivate enrollment (teacher limited to their own assigned batch)                   |
| GET    | `/enrollments/my`                              | Student       | My enrollments                                                                        |
| GET    | `/enrollments/batch/:batchId`                  | Admin/Teacher | Students in a batch                                                                   |
| POST   | `/payments/create-order`                       | Student       | Create Razorpay order `{enrollmentId}`                                                |
| POST   | `/payments/verify`                             | Student       | Verify signature & mark paid                                                          |
| GET    | `/payments/history`                            | Yes           | Payment history (role-filtered)                                                       |
| GET    | `/payments/:id/receipt`                        | Yes           | Download a PDF receipt for a paid payment                                             |
| POST   | `/attendance`                                  | Admin/Teacher | Mark attendance for a batch+date                                                      |
| GET    | `/attendance/batch/:id`                        | Yes           | Attendance for a batch                                                                |
| GET    | `/attendance/my`                               | Student       | My attendance %                                                                       |
| POST   | `/notices`                                     | Admin/Teacher | Create notice (batch-wise or global)                                                  |
| GET    | `/notices`                                     | Yes           | List notices (role-aware)                                                             |
| GET    | `/dashboard/admin` \| `/teacher` \| `/student` | role-matched  | Dashboard stats                                                                       |
| PUT    | `/profile`                                     | Yes           | Update name/phone/avatar                                                              |
| PUT    | `/profile/password`                            | Yes           | Change password                                                                       |

---

## 7. Security notes

- Passwords hashed with **bcrypt** (10 salt rounds).
- **JWT** access tokens (15 min) + refresh tokens (7 days); the frontend axios client auto-refreshes on 401.
- **Role-based route guards** on every sensitive backend route (never trust the frontend role alone).
- **Razorpay signature verification happens server-side** (`crypto.createHmac`) — the client can never fake a "paid" status.
- `helmet`, restricted `CORS` (only `CLIENT_URL`), and `express-rate-limit` on all auth endpoints (10 req / 15 min by default).
- All input validated with **zod** schemas before touching the database.
- `.env` files are git-ignored; only `.env.example` (no real secrets) is committed.

---

## 8. Known limitations / assumptions (MVP scope, per the 4-day brief)

- **Refresh token storage**: for simplicity the refresh token is kept in `localStorage` alongside the access token rather than an httpOnly cookie. For a production deployment this should move to an httpOnly, secure cookie.
- **Razorpay webhook** (server-to-server confirmation) is not wired up — verification currently happens only via the client-side `/payments/verify` call after checkout, which is sufficient for MVP/demo but a production app should also listen to Razorpay webhooks for reliability.
- **Email sending** works out of the box in "log to console" mode; wire up `SMTP_*` or Resend in `.env` for real emails.
- No automated test suite (unit/integration) is included given the time constraint — see §5 for a manual test checklist that covers the required testing checklist from the project documentation.

> Previously listed here as limitations, now implemented: **enrollment** uses a searchable student dropdown on the batch page (`GET /auth/students`) instead of a manual Mongo `_id` paste; **receipt PDF generation** is fully implemented (`server/src/utils/pdfReceipt.js` + the "Receipt" download button on the Payments page — `GET /payments/:id/receipt`); **admin staff management** now has a UI at `/admin/staff` to create teacher/admin accounts (`POST /auth/register-staff`); and the **admin dashboard** shows a 6-month revenue bar chart (Recharts) instead of just the raw ₹ figure.

---

## 9. Deployment (optional, if you want a live demo)

The project doc recommends: **Vercel** (frontend), **Render/Railway** (backend), **MongoDB Atlas** (database). At a high level:

1. Push this project to a GitHub repo (`.env` files are already git-ignored).
2. **MongoDB Atlas**: create a free M0 cluster, whitelist `0.0.0.0/0` (or your host's IP), copy the connection string into your backend host's environment variables as `MONGO_URI`.
3. **Backend (Render/Railway)**: new Web Service from your repo, root directory `server`, build command `npm install`, start command `npm start`. Add all variables from `server/.env.example` as environment variables (with real values), plus set `CLIENT_URL` to your deployed frontend URL.
4. **Frontend (Vercel)**: import the repo, root directory `client`, framework preset "Vite". Add `VITE_API_BASE_URL` (your deployed backend URL + `/api/v1`) and `VITE_RAZORPAY_KEY_ID` as environment variables.
5. Switch Razorpay from test to live keys only when you're ready to accept real payments.

---

## 10. Tech stack (as specified)

Frontend: React 18 + Vite + Tailwind CSS · Backend: Node.js + Express · Database: MongoDB + Mongoose · Auth: JWT + bcrypt · Payments: Razorpay · Email: Nodemailer (SMTP) with console-log fallback.
