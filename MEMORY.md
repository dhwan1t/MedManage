# MedManage — Project Memory

> Auto-generated from Security Audit Refactor session. Keep updated as the project evolves.

---

## Project Overview

MedManage is a real-time emergency medical management platform (Node/Express + React + MongoDB + Socket.IO). It coordinates ambulance dispatch, hospital bed availability, patient vitals streaming, and admin analytics.

---

## Security Audit Refactor — Summary (Completed)

### Critical Issues Fixed (P0)

| Issue | Fix |
|---|---|
| **Hardcoded JWT secret fallback** in `server/middleware/auth.js` and `server/routes/auth.js` | Removed fallback; server now **requires** `JWT_SECRET` env var and exits with a clear error if missing. |
| **CORS origin set to `'*'`** for Express + Socket.IO | Replaced with `CORS_ORIGIN` env var (comma-separated origins); both Express and Socket.IO use this. |
| **Public registration could create admin users** | `POST /api/auth/register` always creates `role: "public"`. Admins create privileged users via `POST /api/auth/admin/create-user` (admin-only). |
| **Seed script used hardcoded demo password (`pass123`)** | Seed reads `SEED_PASSWORD` env var; generates a secure random password if absent and prints it. |
| **Socket.IO lacked authentication** | `io.use()` middleware validates JWT on every socket connection. Clients pass token via `socket.handshake.auth.token`. |
| **Patient vitals broadcast globally (privacy leak)** | Vitals emitted to scoped rooms only (assigned hospital / selected hospital / ambulance / admin). |

### Important Issues Fixed (P1)

- **Role guards & ownership scoping** added to all case routes via `verifyRole` and `buildOwnershipFilter()`.
- **Dedup guard for timeline** — `pushTimelineEvent()` prevents duplicate entries within a short window.
- **Atomic ambulance assignment** — race condition fixed with `findOneAndUpdate({ status: "available" }, …)`.
- **New endpoints**: `GET /api/cases` (list + pagination + ownership), `GET /api/cases/:id/patient`.

### Hardcoded Data & Config Improvements (P2)

- **Shared `server/utils/geo.js`** — single Haversine `getDistance` used by ranker and public route (removed duplicate).
- **Shared `client/src/utils/socket.js`** — centralized Socket.IO client creation with auto-attached JWT.
- **Hospital ranker** — uses shared `getDistance`, no silent fallback to hardcoded coords, uses hospital-provided cost when available.
- **Admin analytics** — replaced static mock arrays with real MongoDB aggregation pipelines.
- **Admin CRUD** — added endpoints for hospitals, ambulances, and user listing.
- **Client components** — replaced hardcoded `http://localhost:5001` with shared `createSocket()` across all dashboards.
- **Removed** orphaned `server/ai/test.js`.

---

## Files Added

| File | Purpose |
|---|---|
| `server/utils/geo.js` | Shared Haversine distance utility |
| `client/src/utils/socket.js` | Shared Socket.IO client factory (auto-attaches JWT) |
| `server/.env.example` | Environment variable template |
| `audit.md` | Full security audit document |
| `MEMORY.md` | This file — project memory / context |

## Files Modified (key changes)

- `server/index.js` — env validation, scoped CORS, socket auth middleware
- `server/middleware/auth.js` — removed hardcoded JWT fallback
- `server/routes/auth.js` — role-locked registration, admin user creation endpoint
- `server/routes/cases.js` — ownership scoping, role guards, new list/patient endpoints
- `server/routes/admin.js` — real analytics aggregation, hospital/ambulance CRUD
- `server/routes/ambulance.js` — atomic assignment
- `server/routes/hospital.js` — ownership scoping
- `server/routes/public.js` — shared geo utility
- `server/ai/hospitalRanker.js` — shared geo, real cost handling
- `server/seed/seedData.js` — secure password handling
- `server/seed/seedUsers.js` — secure password handling
- `server/sockets/socketHandler.js` — scoped room emissions
- `server/models/Case.js` — timeline dedup helper
- `client/src/pages/Admin/AdminDashboard.jsx` — real API data
- `client/src/pages/Admin/AnalyticsPanel.jsx` — real API data
- `client/src/pages/Admin/LiveMap.jsx` — shared socket
- `client/src/pages/Ambulance/AmbulanceDashboard.jsx` — shared socket
- `client/src/pages/Ambulance/RouteView.jsx` — shared socket
- `client/src/pages/Hospital/BedManagement.jsx` — shared socket + real API
- `client/src/pages/Hospital/HospitalDashboard.jsx` — shared socket
- `client/src/pages/Hospital/IncomingPatientAlert.jsx` — shared socket
- `client/src/pages/Hospital/PriorityQueue.jsx` — shared socket + real API
- `.gitignore` — updated

## Files Removed

- `server/ai/test.js` — orphaned test file
- `server/ai/scoringFormulas.js` — unused

---

## Required Environment Variables

| Variable | Required | Description |
|---|---|---|
| `JWT_SECRET` | **Yes** | Server exits if missing |
| `MONGO_URI` | **Yes** | Server exits if missing |
| `PORT` | No | Defaults to `5001` |
| `CORS_ORIGIN` | No | Comma-separated allowed origins (defaults to `http://localhost:5173`) |
| `SEED_PASSWORD` | No | Password for seeded demo users; random generated if absent |

---

## New / Changed API Endpoints

| Method | Path | Auth | Notes |
|---|---|---|---|
| `POST` | `/api/auth/register` | Public | Always creates `role: "public"` |
| `POST` | `/api/auth/admin/create-user` | Admin | Create users with any role |
| `GET` | `/api/cases` | Authenticated | Ownership-scoped list with pagination |
| `GET` | `/api/cases/:id/patient` | Authenticated | Fetch patient for a case |
| `GET/POST/PUT/DELETE` | `/api/admin/hospitals` | Admin | Hospital CRUD |
| `GET/POST/PUT/DELETE` | `/api/admin/ambulances` | Admin | Ambulance CRUD |
| `GET` | `/api/admin/analytics` | Admin | Real DB-driven aggregation |

---

## Behavioral Changes to Note

1. **Socket.IO connections require a valid JWT** — the shared client utility handles this automatically.
2. **Registration is limited to `public` role** — admin must create privileged users.
3. **Admin dashboards/analytics reflect real data** — no more hardcoded mock arrays.
4. **Vitals are room-scoped** — only relevant parties receive updates.
5. **Ambulance assignment is atomic** — prevents double-dispatch race conditions.

---

## Recommended Next Steps

- [ ] Create `server/.env` from `server/.env.example` and populate required values
- [ ] Run `npm run seed` to seed demo data (prints credentials)
- [ ] Add end-to-end tests for auth, socket auth, ambulance allocation, timeline dedup, ownership scoping
- [ ] Add CI checks for linting, tests, env var validation
- [ ] Add logging/monitoring for socket auth failures and claim contention
- [ ] Consider admin actions audit logging
- [ ] Complete remaining client pages still using mock data (e.g., LiveMap GPS feed)

---

*Last updated: Security Audit Refactor pass — June 2025*