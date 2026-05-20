# TaskFlow 🗓️

> **Never miss a thing.** A beautiful MERN-stack task manager with natural language input, cron-powered email reminders, and Google OAuth.

---

## What it does

- **Natural language task entry** — type _"Meeting with client at 7 pm today"_ or _"Exam at 3 pm tomorrow"_ and TaskFlow automatically parses the title, date, time, category, and priority. No forms, no dropdowns.
- **Email reminders** — get an email N minutes before each task's due time (configurable: 10 min → 1 day before).
- **Standing recurring reminders** — set a "Daily at 7 PM" alert once and forget it. TaskFlow emails you every day at that time automatically. Supports daily, weekdays, weekends, weekly, and one-time.
- **Full history** — completed and archived tasks are stored forever with month/year filtering.
- **Google OAuth + email/password** auth with JWT sessions.
- **Rate limiting** — 100 req / 15 min per IP on all routes; 10 req / 15 min on auth routes.

---

## Tech stack

| Layer | Technology |
|---|---|
| Frontend | React 18 + Vite, React Router v6, Recharts, react-hot-toast |
| Backend | Node.js, Express.js |
| Database | MongoDB Atlas (Mongoose ODM) |
| Auth | JWT + bcrypt, Google OAuth 2.0 (google-auth-library) |
| Scheduler | node-cron (runs every minute) |
| Mailer | Nodemailer + SMTP (Gmail App Password or SendGrid) |
| Security | helmet, express-rate-limit, CORS |

---

## Project structure

```
taskflow/
├── server/
│   ├── index.js                  ← Express entry point
│   ├── config/
│   │   └── db.js                 ← MongoDB connection
│   ├── models/
│   │   ├── User.js               ← name, email, googleId, avatar, timezone
│   │   ├── Task.js               ← title, dueDate, dueTime, category, status
│   │   └── Reminder.js           ← label, time, repeatType (daily/weekly/etc)
│   ├── controllers/
│   │   ├── authController.js     ← signup, login, Google OAuth, getMe
│   │   ├── taskController.js     ← CRUD + NLP parser + dashboard stats + history
│   │   └── reminderController.js ← CRUD for standing reminders
│   ├── middleware/
│   │   ├── authMiddleware.js     ← JWT verify
│   │   └── rateLimiter.js        ← express-rate-limit configs
│   ├── routes/
│   │   ├── auth.js
│   │   ├── tasks.js
│   │   └── reminders.js
│   ├── services/
│   │   ├── mailerService.js      ← Nodemailer + HTML email templates
│   │   └── cronService.js        ← Two cron jobs (standing + task-due reminders)
│   └── .env.example
│
├── client/
│   ├── src/
│   │   ├── main.jsx
│   │   ├── App.jsx               ← Router + protected routes
│   │   ├── index.css             ← Global design tokens + utility classes
│   │   ├── api/axios.js          ← Axios instance with JWT interceptor
│   │   ├── context/AuthContext.jsx
│   │   ├── components/
│   │   │   ├── Layout.jsx        ← Sidebar + main outlet
│   │   │   └── AddTaskModal.jsx  ← Natural language input modal with preview
│   │   └── pages/
│   │       ├── AuthPage.jsx      ← Login / Signup + Google Sign-In button
│   │       ├── Dashboard.jsx     ← Stats, progress bar, today's tasks
│   │       ├── TasksPage.jsx     ← Full task list with search + filter
│   │       ├── RemindersPage.jsx ← Create/manage standing recurring reminders
│   │       ├── HistoryPage.jsx   ← Completed tasks, paginated, month filter
│   │       └── SettingsPage.jsx  ← Profile, timezone, email notification toggle
│   └── .env.example
│
└── package.json                  ← Root scripts (dev, install:all)
```

---

## Setup — step by step

### 1. Clone and install

```bash
git clone <your-repo-url>
cd taskflow

npm install          # installs concurrently at root
npm run install:all  # installs server + client dependencies
```

### 2. Configure the server

```bash
cd server
cp .env.example .env
```

Open `.env` and fill in:

| Variable | Where to get it |
|---|---|
| `MONGO_URI` | [MongoDB Atlas](https://cloud.mongodb.com) → Create a free cluster → Get connection string |
| `JWT_SECRET` | Any long random string (e.g. run `node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"`) |
| `GOOGLE_CLIENT_ID` + `GOOGLE_CLIENT_SECRET` | [Google Cloud Console](https://console.cloud.google.com/apis/credentials) → Create OAuth 2.0 Client → Add `http://localhost:5173` to Authorised Origins |
| `SMTP_USER` + `SMTP_PASS` | Gmail account + 16-char [App Password](https://myaccount.google.com/apppasswords) (requires 2FA) |

### 3. Configure the client

```bash
cd client
cp .env.example .env
```

Set `VITE_GOOGLE_CLIENT_ID` to the same Google Client ID.

### 4. Run in development

```bash
# From root
npm run dev
```

This starts the Express server on **:5000** and the Vite dev server on **:5173** simultaneously.

---

## How the reminder system works

### Task-due reminders (automatic)

When you create a task like _"Exam at 3 pm tomorrow"_, a `dueDate` is saved to MongoDB. A cron job runs **every minute** and queries for tasks due within the next `remindBeforeMinutes` (default: 30 min). When it finds one, it sends you an email via Nodemailer and marks `taskReminderSent: true` so you only get one email per task.

### Standing recurring reminders

From the **Reminders** page you can create reminders like:

| Label | Time | Repeat |
|---|---|---|
| Evening review | 19:00 | Daily |
| Morning standup | 09:00 | Weekdays |
| Weekly planning | 10:00 | Weekly (Monday) |
| Pay rent | 09:00 | Once (1st of month) |

The same cron job (every minute) checks if `reminder.time === currentHH:MM` and fires the appropriate ones. Daily/weekday/weekend/weekly reminders fire every time they match. `once` reminders fire once and are marked `fired: true`.

**You set it once. TaskFlow handles the rest.**

---

## API reference

### Auth

| Method | Route | Body | Protected |
|---|---|---|---|
| POST | `/api/auth/signup` | `{ name, email, password }` | No |
| POST | `/api/auth/login` | `{ email, password }` | No |
| POST | `/api/auth/google` | `{ idToken }` | No |
| GET | `/api/auth/me` | — | Yes |
| PATCH | `/api/auth/me` | `{ name, timezone, emailNotifications }` | Yes |

### Tasks

| Method | Route | Notes |
|---|---|---|
| POST | `/api/tasks` | Body: `{ rawInput, notes?, remindBeforeMinutes? }` |
| GET | `/api/tasks` | Query: `status, category, priority, search, page, limit` |
| GET | `/api/tasks/dashboard` | Returns stats + today's tasks |
| GET | `/api/tasks/history` | Query: `page, limit, month, year` |
| GET | `/api/tasks/:id` | |
| PATCH | `/api/tasks/:id` | Partial update |
| DELETE | `/api/tasks/:id` | |

### Reminders

| Method | Route | Notes |
|---|---|---|
| POST | `/api/reminders` | Body: `{ label, time, repeatType, repeatDayOfWeek?, onceDate? }` |
| GET | `/api/reminders` | All reminders for the user |
| PATCH | `/api/reminders/:id` | Toggle `isActive`, change time, etc. |
| DELETE | `/api/reminders/:id` | |

---

## Natural language parser — supported phrases

The parser in `taskController.js` handles:

```
"Meeting with client at 7 pm today"           → today at 19:00, category: work
"Exam at 3 pm tomorrow"                       → tomorrow at 15:00, category: study
"Submit report at 11:30 am on Friday"         → this/next Friday at 11:30
"Doctor appointment at 2 pm next Monday"      → next Monday at 14:00, category: health
"Pay electricity bill today"                  → today, category: finance
"Gym session at 6:30 am tomorrow"             → tomorrow at 06:30, category: health
"Client call at 15:00"                        → today (24-hour format), category: work
```

Auto-detected categories based on keywords: `work`, `study`, `health`, `finance`, `personal`, `other`.

---

## Production deployment

**Backend** → deploy to Render / Railway / VPS (any Node.js host).

**Frontend** → run `npm run build` in `/client`, deploy `/dist` to Vercel / Netlify.

Update `CLIENT_URL` in server `.env` to your production frontend URL, and add your production frontend URL to the Google OAuth Authorised Origins.

---

## Rate limits

| Route group | Limit |
|---|---|
| All `/api/*` routes | 100 requests / 15 min / IP |
| `/api/auth/login`, `/api/auth/signup`, `/api/auth/google` | 10 requests / 15 min / IP |

---

## License

MIT — personal project, use freely.
