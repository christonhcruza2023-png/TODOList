# TaskFlow

A complete, minimal task-management web app built with **React + Vite + Tailwind CSS** on the frontend and **Node.js + Express + MongoDB (Mongoose)** on the backend. Tasks are persisted in MongoDB — not in mock data or localStorage — and every view, filter, statistic, and theme is backed by the real API.

TaskFlow is a **single-user demo**: there is no authentication. Anyone who can reach the app can read and modify its tasks.

---

## Features

- **Dashboard** — live totals for total, completed, pending, and overdue tasks; completion ring; productivity summary; recent tasks; today's tasks; quick add.
- **Full CRUD** — create, read, edit, delete, and complete/reopen tasks, all persisted to MongoDB.
- **Views** — All Tasks, Today (due today + overdue), Upcoming (future pending/in-progress), Completed, and Categories.
- **Search, filters, sorting** — search title and description; filter by status, priority, category, and due date; sort by newest, oldest, due date, priority, or alphabetically. All filters combine.
- **Categories** — Personal, School, Work, Health, Shopping, Projects, Other, with live counts and completion progress.
- **Light / dark / system theme** — theme is applied before first paint (no flash), follows the OS by default, persists in localStorage, and covers modals, forms, dropdowns, and toasts.
- **Settings** — theme, default view, default sorting, description visibility, compact cards, and clearing local preferences.
- **Polish** — skeleton loaders, empty states, inline validation, success/error toasts, confirm dialogs, accessible labels and keyboard focus styles, mobile drawer navigation, collapsible desktop sidebar.
- **Backend hardening** — schema + request validation, sanitized text, rate limiting, body-size limits, CORS allowlist in production, centralized error handling without stack traces.

---

## Tech stack

| Layer | Technology |
| --- | --- |
| Frontend | React 19, Vite 6, React Router 6, Tailwind CSS 3, Lucide React, Axios |
| Backend | Node.js, Express 4, Mongoose 8, dotenv, cors, express-rate-limit |
| Database | MongoDB (`taskflow_db` → `tasks`) |
| Tests | Node test runner + Supertest (API), Playwright (browser E2E) |

---

## Project structure

```
taskflow/
├── client/
│   ├── index.html                 # No-flash theme bootstrap
│   ├── package.json
│   ├── vite.config.js             # Dev/preview API proxy
│   ├── tailwind.config.js
│   ├── postcss.config.js
│   ├── .env.example
│   ├── public/favicon.svg
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── components/            # AppLayout, Sidebar, Navbar, TaskCard, TaskForm,
│       │                          # TaskModal, ConfirmDialog, ThemeToggle, Toast, etc.
│       ├── pages/                 # Dashboard, AllTasks, Today, Upcoming, Completed,
│       │                          # Categories, Settings, NotFound
│       ├── services/api.js        # Axios client + typed API errors
│       ├── hooks/                 # useTasksQuery, useStats, useDebouncedValue
│       ├── context/               # Theme, Preferences, Toast, Task store
│       ├── utils/                 # dates, category/priority/status metadata
│       └── styles/index.css       # Theme tokens + shared component classes
├── server/
│   ├── package.json
│   ├── server.js                  # Entry point (loads .env, connects DB, listens)
│   ├── app.js                     # Express app, CORS, rate limiting, static serving
│   ├── config/db.js
│   ├── models/Task.js
│   ├── routes/                    # taskRoutes.js, statsRoutes.js
│   ├── controllers/               # taskController.js, statsController.js
│   ├── middleware/errorHandler.js # ApiError, asyncHandler, 404 + error middleware
│   ├── utils/                     # validation, date/regex helpers
│   └── tests/tasks.test.js        # 20 API integration tests
├── e2e/taskflow.spec.js           # 14 Playwright browser tests
├── playwright.config.js
├── .env.example
├── .gitignore
└── README.md
```

---

## Prerequisites

- **Node.js 18+** and npm (developed and tested on Node 25 / npm 11)
- **MongoDB** — either a local server or a free MongoDB Atlas cluster
- **Google Chrome** for the Playwright end-to-end tests (optional)

---

## Quick start

From the project root:

```bash
# 1. Install dependencies for the root, server, and client
npm run install:all

# 2. Create your environment file
cp .env.example .env
# On Windows PowerShell: Copy-Item .env.example .env
```

Edit `.env`:

```env
MONGO_URI=mongodb://127.0.0.1:27017/taskflow_db
PORT=5000
NODE_ENV=development
CLIENT_ORIGIN=http://localhost:5173,http://localhost:4173
```

```bash
# 3. Start the API and Vite dev server together
npm run dev
```

Open **http://localhost:5173**. The API runs at **http://localhost:5000**, and Vite proxies `/api` requests to it.

> If your local MongoDB is not running, start it (`net start MongoDB` on Windows) or use an Atlas URI. The server exits with a clear message when the database is unreachable.

### Run the pieces separately

```bash
npm run dev:server   # API only, watch mode
npm run dev:client   # Vite only
```

### Production build locally

```bash
npm run build        # builds client/dist
npm run start        # serves API + built SPA on http://localhost:5000
```

With `client/dist` present, Express serves the SPA and falls back to `index.html` for client-side routes. API routes still return JSON (including JSON 404s).

---

## Environment variables

### Server (`.env` in the project root)

| Variable | Required | Description |
| --- | --- | --- |
| `MONGO_URI` | Yes | MongoDB connection string. Use Atlas in production. |
| `PORT` | No | API port. Defaults to `5000`; Render provides this automatically. |
| `NODE_ENV` | No | `development`, `production`, or `test`. Production enables the CORS allowlist. |
| `CLIENT_ORIGIN` | Production | Comma-separated browser origins allowed by CORS, e.g. `https://taskflow.onrender.com`. |

`MONGO_URI` is never sent to the client. `.env` files are git-ignored; only `.env.example` is committed.

### Client (`client/.env`, optional)

| Variable | Default | Description |
| --- | --- | --- |
| `VITE_API_URL` | `/api` | API base URL. Leave unset in development (Vite proxy). Set it only when the frontend is hosted separately from the API. |
| `VITE_PROXY_TARGET` | `http://127.0.0.1:5000` | Dev/preview proxy target for `/api`. Used by the E2E config. |

---

## REST API

Base URL: `/api`

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/api/health` | API + database status |
| `GET` | `/api/tasks` | List tasks with search, filters, sorting, limit |
| `GET` | `/api/tasks/:id` | Get one task |
| `POST` | `/api/tasks` | Create a task |
| `PUT` | `/api/tasks/:id` | Update a task |
| `PATCH` | `/api/tasks/:id/status` | Change only the status |
| `DELETE` | `/api/tasks/:id` | Delete a task |
| `GET` | `/api/stats` | Dashboard statistics |

### `GET /api/tasks` query parameters

| Parameter | Example | Notes |
| --- | --- | --- |
| `search` | `report` | Case-insensitive regex over title + description |
| `status` | `Pending,In Progress` | Comma-separated enum values |
| `priority` | `High,Medium` | Comma-separated enum values |
| `category` | `Work` | Comma-separated category values |
| `sort` | `priority` | `newest`, `oldest`, `updated`, `dueDate`, `priority`, `alpha` |
| `dueFrom` / `dueTo` | ISO timestamps | Due-date range (`dueFrom` inclusive, `dueTo` exclusive) |
| `overdue` | `true` | Due before `dueFrom` (or now), not completed |
| `includeOverdue` | `true` | Used with a due range to include overdue uncompleted tasks |
| `limit` | `5` | Integer 1–200 |

The **Today** view sends the browser's local day boundaries, so "today" and "overdue" match the user's calendar day. Statistics accept optional `dayStart` / `dayEnd` ISO parameters for the same reason.

### Request bodies

```json
{
  "title": "Draft quarterly report",
  "description": "Outline highlights and blockers",
  "category": "Work",
  "priority": "High",
  "status": "In Progress",
  "dueDate": "2026-10-30"
}
```

- `title` — required, trimmed, max 120 chars
- `description` — optional, max 1000 chars
- `category` — one of `Personal`, `School`, `Work`, `Health`, `Shopping`, `Projects`, `Other`
- `priority` — `Low`, `Medium`, `High`
- `status` — `Pending`, `In Progress`, `Completed`
- `dueDate` — optional date-only (`YYYY-MM-DD`) or ISO timestamp; `null` clears it

### Response format

Success:

```json
{ "success": true, "count": 1, "data": [{ "_id": "…", "title": "…", "createdAt": "…", "updatedAt": "…" }] }
```

Error:

```json
{
  "success": false,
  "message": "Please fix the highlighted fields.",
  "errors": [{ "field": "title", "message": "Title is required." }]
}
```

Status codes: `200`, `201`, `400` (validation / malformed JSON / bad IDs), `403` (blocked CORS origin in production), `404` (missing task or route), `429` (rate limit), `500` (safe generic message).

### MongoDB model

Collection `tasks` in database `taskflow_db`:

| Field | Type | Notes |
| --- | --- | --- |
| `_id` | ObjectId | Auto-generated |
| `title` | String | Required, max 120 |
| `description` | String | Default `""`, max 1000 |
| `category` | String | Enum, default `Other` |
| `priority` | String | Enum, default `Medium` |
| `status` | String | Enum, default `Pending` |
| `dueDate` | Date \| null | Optional |
| `createdAt` / `updatedAt` | Date | Mongoose timestamps |

---

## Testing

### API integration tests — 20 tests

```bash
npm --prefix server test
```

Uses the Node test runner plus Supertest against the real Express app and MongoDB database `taskflow_test` (falls back to `mongodb://127.0.0.1:27017/taskflow_test`; override with `TEST_MONGO_URI`). The suite clears the test collection before each test and disconnects afterwards. It covers CRUD, persistence of timestamps, validation, malformed JSON, invalid IDs, 404s, search, every filter/sort, due ranges, stats, and error responses.

### Browser end-to-end tests — 14 tests

The E2E suite runs against a production build with Playwright using your installed Chrome. It starts Vite preview on `http://127.0.0.1:4173` and proxies `/api` to `http://127.0.0.1:5050`.

1. Start the API on port 5050 with a **separate** E2E database:

   ```bash
   MONGO_URI=mongodb://127.0.0.1:27017/taskflow_e2e PORT=5050 node server/server.js
   ```

   PowerShell:

   ```powershell
   $env:MONGO_URI="mongodb://127.0.0.1:27017/taskflow_e2e"; $env:PORT="5050"; node server/server.js
   ```

2. In another terminal:

   ```bash
   npm run build
   npm run test:e2e
   ```

The tests create and clean up tasks in `taskflow_e2e`, so your real `taskflow_db` is untouched. They cover creation, reload persistence, validation, editing, completion/reopening, dashboard stats, combined search/filters/sorting, delete confirmation, Today/Upcoming/Completed views, theme persistence, preferences, category filtering, default view, preference reset, console errors on every page, and the mobile navigation drawer.

If Chrome is not available, run `npx playwright install chromium` and remove `channel: 'chrome'` from `playwright.config.js`.

---

## Design and theme system

Theme colors are CSS variables (`--bg`, `--card`, `--elevated`, `--ink`, `--muted`, `--accent`, `--line`) exposing Tailwind tokens such as `bg-bg`, `bg-card`, `text-ink`, `text-muted`, `border-line`, and `bg-accent`. Dark mode uses the `dark` class on `<html>`.

An inline script in `client/index.html` reads `taskflow.theme` (or the OS preference) **before** React loads and sets the class, preventing a flash of the wrong theme. `ThemeContext` keeps the OS preference listener active while the mode is `system`.

localStorage keys:

| Key | Contents |
| --- | --- |
| `taskflow.theme` | `light`, `dark`, or `system` |
| `taskflow.prefs` | Default view, sorting, description visibility, compact mode |
| `taskflow.sidebar` | Desktop sidebar collapsed/expanded |

Tasks are **never** stored in localStorage.

---

## Security notes

- **Single-user demo** — there is no sign-in. Do not deploy it publicly with sensitive data unless you add authentication and per-user authorization.
- Request bodies are validated and sanitized; only known fields are accepted.
- Invalid and malformed requests receive consistent JSON errors; internals are logged server-side only.
- API requests are rate-limited to 300 per 15 minutes per IP (`NODE_ENV=test` skips this).
- JSON bodies are capped at 100 kB.
- In production, CORS only accepts origins listed in `CLIENT_ORIGIN`. Same-origin requests and server-side health checks are always allowed.
- Keep `.env` out of Git and rotate credentials if they are ever exposed.

---

## Deploying publicly

### 1. Create a MongoDB Atlas database

1. Create a free cluster at [MongoDB Atlas](https://www.mongodb.com/atlas).
2. Add a database user and allow network access (Render's IPs, or `0.0.0.0/0` for a demo).
3. Copy the connection string and append the database name:  
   `mongodb+srv://USER:PASSWORD@cluster.mongodb.net/taskflow_db?retryWrites=true&w=majority`

### 2. Push the project to GitHub

```bash
git init
git add .
git commit -m "Build TaskFlow task manager"
git branch -M main
git remote add origin https://github.com/YOUR_USERNAME/taskflow.git
git push -u origin main
```

`.env` is ignored; `.env.example` is committed.

### 3. Deploy the full app on Render (recommended)

Create a **Web Service** from the repository:

| Setting | Value |
| --- | --- |
| Root Directory | repository root (empty) |
| Build Command | `npm --prefix server install && npm --prefix client install --include=dev && npm run build` |
| Start Command | `npm start` |
| Health Check Path | `/api/health` |

Environment variables:

```env
MONGO_URI=mongodb+srv://…/taskflow_db?retryWrites=true&w=majority
NODE_ENV=production
CLIENT_ORIGIN=https://your-service.onrender.com
```

`PORT` is supplied by Render and read by `server.js`. The Express server serves `client/dist` and handles SPA fallback, so the frontend and API share one URL.

### 4. Optional: host the frontend separately

- Build a static site from `client` with `VITE_API_URL=https://your-api.onrender.com/api` and publish `client/dist` (rewrite all routes to `/index.html`).
- Deploy `server` as its own Web Service with `MONGO_URI` and `NODE_ENV=production`.
- Add the static site's URL to `CLIENT_ORIGIN` on the API.

Free Render services may sleep when idle, so the first request can take a few seconds.

---

## Useful notes

- **Theme showing the wrong color at startup?** The inline script handles first paint; make sure you are loading the built `index.html` (Vite injects the script unchanged).
- **API unreachable in development?** Start both processes with `npm run dev`, confirm the API runs on `PORT=5000`, and that nothing else occupies port 5000.
- **Due dates** are day-based. Date-only values are stored at local noon so the calendar day stays stable; Today/Upcoming filter using the browser's local day boundaries.
- **Rate limit errors** in development are returned as JSON with status `429`; wait for the 15-minute window or restart the server.
