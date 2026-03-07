[PROJECT MEMORY START]

Project Name: MedManage
Overview (1-2 sentences): Real-time emergency medical management platform coordinating ambulance dispatch, hospital bed availability, patient vitals streaming, AI-powered hospital ranking, and admin analytics. Full-stack Node/Express + React + MongoDB + Socket.IO application with role-based portals (Public, Ambulance, Hospital, Admin).

Tech Stack & Architecture:
  - Backend: Node.js, Express 5, MongoDB (Mongoose 9), Socket.IO 4, JWT auth, bcryptjs
  - Frontend: React (Vite), Tailwind CSS, Socket.IO client, Axios
  - AI/ML: Custom hospital ranker (severity aggregation, Haversine distance scoring, cost estimation)
  - Real-time: Socket.IO with JWT-authenticated connections, room-scoped event emission
  - Auth: JWT tokens, role-based middleware (verifyToken, verifyRole), ownership scoping per role
  - Deployment: Monorepo — root package.json runs both server and client via concurrently
  - Repo: https://github.com/dhwan1t/MedManage.git (branch: main)

Current Progress & State:
  - Security audit refactor COMPLETE (P0-P3 all addressed)
  - Latest commit: 86c5b20 — "feat(security): comprehensive security audit refactor (P0-P3)"
  - All code pushed to origin/main
  - SuperMemory MCP server configured in Zed with project scoping to org "tenacious-nw31"
  - App is functional but needs .env setup and seed run to demo

Key Files & Their Purpose:
  Server:
    - server/index.js — Express + Socket.IO entry point, env validation, CORS config, socket auth middleware
    - server/middleware/auth.js — JWT verification (verifyToken) and role guard (verifyRole), no hardcoded fallback
    - server/routes/auth.js — Login, public registration (role: "public" only), admin user creation endpoint
    - server/routes/cases.js — Case CRUD with ownership scoping (buildOwnershipFilter), role guards, pagination
    - server/routes/admin.js — Real MongoDB aggregation analytics, hospital/ambulance CRUD, user listing
    - server/routes/ambulance.js — Ambulance operations, atomic assignment (findOneAndUpdate race-condition fix)
    - server/routes/hospital.js — Hospital operations with ownership scoping
    - server/routes/public.js — Public endpoints (ambulance request, hospital search) using shared geo utility
    - server/sockets/socketHandler.js — Room-scoped event emissions (no global broadcast of vitals)
    - server/ai/hospitalRanker.js — AI hospital ranking using shared Haversine, real cost data when available
    - server/ai/severityAggregator.js — Severity scoring for patient triage
    - server/utils/geo.js — Shared Haversine getDistance (deduplicated from multiple files)
    - server/models/ — Mongoose models: Case.js (with timeline dedup helper), Patient.js, Hospital.js, Ambulance.js, User.js, Alert.js
    - server/seed/seedData.js — Seed script with secure password handling (SEED_PASSWORD env or random generation)
    - server/seed/seedUsers.js — User seeding with secure password handling
    - server/.env.example — Environment variable template
  Client:
    - client/src/App.jsx — React router with role-based portal routing
    - client/src/utils/socket.js — Centralized Socket.IO client factory (auto-attaches JWT from localStorage)
    - client/src/context/ — Auth context provider
    - client/src/pages/Admin/ — AdminDashboard.jsx (real API data), AnalyticsPanel.jsx (real aggregation), LiveMap.jsx, HospitalRatings.jsx
    - client/src/pages/Hospital/ — HospitalDashboard.jsx, BedManagement.jsx, IncomingPatientAlert.jsx, PriorityQueue.jsx (all use shared socket + real API)
    - client/src/pages/Ambulance/ — AmbulanceDashboard.jsx, RouteView.jsx, PatientVitalsForm.jsx, HospitalRecommendations.jsx
    - client/src/pages/Public/ — LandingPage.jsx, RequestAmbulance.jsx, SymptomChecker.jsx, DiseaseAlerts.jsx
    - client/src/pages/Auth/ — Login/Register pages
  Root:
    - package.json — Monorepo scripts: "npm run dev" (concurrently), "npm run seed"
    - audit.md — Full security audit document
    - MEMORY.md — This file (project memory for SuperMemory persistence)

Open Tasks / TODOs (prioritized):
  1. [HIGH] Create server/.env from server/.env.example and populate JWT_SECRET + MONGO_URI to run locally
  2. [HIGH] Run `npm run seed` to seed demo data (prints credentials if SEED_PASSWORD not set)
  3. [MEDIUM] Add end-to-end tests for: auth flow, socket auth, ambulance allocation race condition, timeline dedup, ownership scoping
  4. [MEDIUM] Add CI pipeline with linting, tests, env var validation for staging/prod
  5. [MEDIUM] Add logging/monitoring for socket auth failures and ambulance claim contention
  6. [LOW] Implement admin actions audit logging (who created/updated hospital or ambulance)
  7. [LOW] Complete remaining client pages still using local simulation (LiveMap GPS feed)
  8. [LOW] Add rate limiting to auth endpoints
  9. [LOW] Add input validation/sanitization middleware (express-validator or joi)

Recent Decisions & Changes:
  - Security audit refactor completed in one pass covering P0 (critical) through P3 (cleanup)
  - JWT_SECRET and MONGO_URI are now REQUIRED — server exits with clear error if missing
  - Registration always creates role: "public" — admin creates privileged users via POST /api/auth/admin/create-user
  - Socket.IO requires JWT auth on connection — client uses shared createSocket() utility
  - Patient vitals are room-scoped (hospital room / ambulance room / admin) — no global io.emit()
  - Ambulance assignment uses atomic findOneAndUpdate to prevent double-dispatch
  - Admin analytics replaced static mocks with real MongoDB aggregation pipelines
  - Removed orphaned files: server/ai/test.js, server/ai/scoringFormulas.js
  - SuperMemory MCP configured in Zed settings with project scope "tenacious-nw31"

User Preferences & Constraints:
  - User: Shresth Chauhan (shresthchauhan)
  - IDE: Zed with Claude Opus 4.6 via Copilot Chat provider
  - Keymap: JetBrains
  - Theme: One Light / One Dark (system mode)
  - Git remote: https://github.com/dhwan1t/MedManage.git
  - SuperMemory org: tenacious-nw31
  - Prefers comprehensive commits with conventional commit messages
  - Wants full-stack security-first approach

Last Session Summary:
  Completed comprehensive security audit refactor of MedManage (P0-P3). Fixed critical vulnerabilities (hardcoded JWT secret, wildcard CORS, unprotected registration, unauthenticated sockets, global vitals broadcast). Added role guards, ownership scoping, atomic ambulance assignment, shared utilities, real analytics. Removed orphaned files. Created MEMORY.md and audit.md. Committed as 86c5b20 and pushed to origin/main. Configured SuperMemory MCP server in Zed settings (~/.config/zed/settings.json) with project scoping to org "tenacious-nw31". Pending: Zed restart to activate MCP OAuth flow, then persist this memory block to SuperMemory.

[PROJECT MEMORY END]

→ STORE TO SUPERMEMORY VIA MCP: Save this entire [PROJECT MEMORY START]...[PROJECT MEMORY END] block as the canonical MedManage project memory under project "tenacious-nw31".