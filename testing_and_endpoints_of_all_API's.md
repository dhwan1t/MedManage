MedManage Full Application Audit Report

---

## SECTION 1 — Authentication

| # | Feature | Status | Issue |
|---|---------|--------|-------|
| 1 | POST `/api/auth/login` returns token + user with role | ✅ | Returns `{token, user: {id, name, email, role, hospitalId, ambulanceId}}` — all correct |
| 2 | POST `/api/auth/register` accepts all 4 roles | ✅ | Accepts public, ambulance, hospital, admin. Defaults to "public" if invalid |
| 3 | JWT token saved to localStorage on login | ✅ | `AuthContext.login()` calls `localStorage.setItem("token", ...)` and `localStorage.setItem("user", ...)` |
| 4 | ProtectedRoute blocks wrong roles | ✅ | Checks `hasRole()`, redirects to role-appropriate dashboard if wrong role |
| 5 | Logout clears localStorage + redirects to /login | ✅ | `logout()` removes token+user from localStorage; Navbar's `handleLogout` calls `navigate("/login")` |
| 6 | `/demo` page auto-login all 4 roles | ❌ | **CRITICAL**: DemoPage hardcodes `password: "pass123"` for all demo accounts, BUT `seedData.js` reads password from `SEED_PASSWORD` env var and generates a **random** password if not set. Unless the user explicitly sets `SEED_PASSWORD=pass123` in `.env`, the demo page **will fail** for all 4 roles. |
| 7 | Seed user credentials match `pass123` | ❌ | Same issue — seed script does NOT use `pass123` by default. It generates a random hex string via `crypto.randomBytes(16).toString("hex")`. The LoginPage also shows "password: pass123" in the quick-fill section. |

---

## SECTION 2 — Public

### LandingPage (/)

| # | Feature | Status | Issue |
|---|---------|--------|-------|
| 1 | SOS button navigates to `/request-ambulance` | ✅ | `onClick={() => navigate("/request-ambulance")}` |
| 2 | Shows logged-in user's name from JWT | ⚠️ | Attempts to decode JWT payload for `name` field, but the JWT payload only contains `{userId, role, hospitalId, ambulanceId}` — **no `name` field**. Falls back to "Alex" for non-logged-in, "User" for logged-in with no name. Will always show "Alex" or "User". |
| 3 | All 4 navigation cards work | ⚠️ | 3 of 4 work (Disease Alerts, Symptom Checker, Call Ambulance). The 4th ("Nearby Hospitals") shows "Coming Soon" toast — intentional but **not functional**. |
| 4 | Latest alert shows real data from DB | ❌ | **Hardcoded mock data** — `alertsData` is a static array defined at the top of `LandingPage.jsx`. Does NOT fetch from the API. Shows "H3N2 Influenza" always. |

### DiseaseAlerts (/alerts)

| # | Feature | Status | Issue |
|---|---------|--------|-------|
| 1 | Fetches from `GET /api/public/disease-alerts?city=Ludhiana` | ✅ | Uses `useEffect` with `selectedCity` dependency, calls the correct endpoint |
| 2 | Severity filter buttons (All/High/Medium/Low) work | ✅ | Filters via `filteredAlerts` filtering on severity |
| 3 | City dropdown re-fetches for different cities | ✅ | `selectedCity` in useEffect dependency triggers refetch |
| 4 | Cards expand to show symptoms on click | ⚠️ | `expandedCardId` toggle works, BUT the backend `Alert` model has no `symptoms` field. The normalizeAlert function maps `alert.symptoms` which may be undefined from DB data. Fallback data has symptoms, but DB-fetched alerts won't show symptoms. |

### SymptomChecker (/symptoms)

| # | Feature | Status | Issue |
|---|---------|--------|-------|
| 1 | All 3 steps work (select → severity → result) | ✅ | Step state machine with `step` state variable cycles through 1→2→3 |
| 2 | Chest pain / breathlessness triggers CALL AMBULANCE | ✅ | `calculateResult()` checks for "Chest Pain" and "Breathlessness" → returns EMERGENCY type |
| 3 | Result CTA links to `/request-ambulance` | ⚠️ | Need to verify the actual JSX for step 3. The `calculateResult()` returns the result object, but I need to check if there's a navigate/link button in the EMERGENCY result UI. Let me verify... |
| 4 | Progress bar updates between steps | ✅ | `width: ${(step / 3) * 100}%` at line 115 |

### RequestAmbulance (/request-ambulance)

| # | Feature | Status | Issue |
|---|---------|--------|-------|
| 1 | All form inputs visible (not transparent) | ✅ | Uses standard Tailwind classes with proper text colors and backgrounds |
| 2 | GPS button fills location field | ✅ | `handleUseMyLocation` calls `navigator.geolocation.getCurrentPosition`, sets `locationText` and `coords` |
| 3 | Form validates required fields | ✅ | `validateForm()` checks fullName, phone, locationText/coords, emergencyType |
| 4 | POST `/api/public/request-ambulance` works | ✅ | Sends correct payload with name, phone, location, emergencyType |
| 5 | Success screen shows ETA and ambulance ID | ✅ | `dispatchInfo` state stores caseId, ambulanceId, eta from response |
| 6 | Triggers socket event to ambulance dashboard | ✅ | Server emits `case:assigned` to ambulance room and admin room |

---

## SECTION 3 — Ambulance

### AmbulanceDashboard (/ambulance)

| # | Feature | Status | Issue |
|---|---------|--------|-------|
| 1 | Shows step indicator (Step 1/2/3) | ✅ | `getWorkflowStep()` returns 0/1/2, rendered as step indicators in JSX |
| 2 | Receives `case:assigned` socket event | ✅ | Socket listener on `case:assigned` updates `activeCase` state |
| 3 | Status toggle works (Available/On Call/Off Duty) | ✅ | `handleStatusChange()` calls `PUT /api/ambulance/status` with mapped status |
| 4 | "Enter Vitals" is primary CTA when case active | ✅ | Conditional rendering based on `activeCase` and workflow step |
| 5 | "View Recommendations" disabled until vitals entered | ✅ | `getWorkflowStep()` checks if `severityScore` is numeric (vitals entered) |
| 6 | Socket connection indicator shows green when connected | ✅ | `isConnected` state driven by socket `connect`/`disconnect` events |

### PatientVitalsForm (/ambulance/vitals/:caseId)

| # | Feature | Status | Issue |
|---|---------|--------|-------|
| 1 | ALL form inputs visible | ✅ | HR, systolic, diastolic, RR, temp, SpO2, age all present. AVPU radios, chief complaint dropdown, conditions checkboxes all coded |
| 2 | `PUT /api/cases/:caseId/update-vitals` works | ✅ | Sends payload with correct field names; server maps `systolicBP→systolic`, `spO2→oxygenSat` etc. |
| 3 | Shows AI score breakdown after submission | ❌ | **Does NOT show breakdown**. On success, it immediately navigates to `/ambulance/recommendations/:caseId`. No intermediate display of severity score/breakdown. |
| 4 | Navigates to `/ambulance/recommendations/:caseId` on success | ✅ | `navigate(\`/ambulance/recommendations/${targetCaseId}\`)` |

### HospitalRecommendations (/ambulance/recommendations/:caseId)

| # | Feature | Status | Issue |
|---|---------|--------|-------|
| 1 | Shows severity score and level | ✅ | `severityScore` state + `getSeverityDetails()` maps score to label/color |
| 2 | Shows ranked hospitals (1, 2, 3) | ✅ | Maps from API response, falls back to MOCK_HOSPITALS if API fails |
| 3 | Hospital card shows: Name and type | ✅ | `h.name`, `h.type` (Govt/Private) rendered |
| 3 | Hospital card shows: Distance in km | ✅ | `h.distance` mapped from `r.distance` — real from AI ranker |
| 3 | Hospital card shows: Estimated minutes | ✅ | `h.eta` computed from `estimatedMinutes` |
| 3 | Hospital card shows: Facility badges (ICU/OT/ER) | ✅ | `h.facilities.icu/ot/er` booleans from resources |
| 3 | Hospital card shows: Doctor count | ✅ | Regex-extracted from reason string |
| 3 | Hospital card shows: Match score | ✅ | `h.matchScore` from `r.score` |
| 3 | Hospital card shows: Cost estimate (₹) | ✅ | `h.costEstimate` from ranker |
| 3 | Hospital card shows: Survival probability (if score > 60) | ✅ | `h.survivalProbability` from ranker |
| 4 | "Select This Hospital" calls PUT `/api/cases/:caseId/select-hospital` | ✅ | `handleSelectHospital(id)` sends correct request |
| 5 | Shows confirmation toast after selection | ✅ | `confirmationMsg` state is set with hospital name message |
| 6 | Navigates to `/ambulance/route/:caseId` after selection | ✅ | `setTimeout(() => navigate(\`/ambulance/route/${caseId}\`), 2000)` |

### RouteView (/ambulance/route/:caseId)

| # | Feature | Status | Issue |
|---|---------|--------|-------|
| 1 | Shows REAL selected hospital name | ✅ | Fetches from `GET /api/cases/:caseId`, extracts `data.selectedHospital.name`, falls back to "City Central Hospital" |
| 2 | ETA countdown works | ✅ | `etaSeconds` state decremented every second via `setInterval` |
| 3 | Shows real patient vitals | ✅ | Extracts `heartRate`, `systolic/diastolic`, `oxygenSat` from populated patient data |
| 4 | Dispatch Status shows 3 check-ins | ⚠️ | **Simulated with timeouts** (1.5s, 3.5s, 5.5s), not real server events. The notified/bed/team statuses are purely client-side animations. |
| 5 | EMERGENCY ARRIVED button calls `PUT /api/cases/:caseId/status` | ✅ | `handleArrival()` sends `{ status: "arrived" }` |
| 6 | Navigates back to `/ambulance` after arrival | ✅ | `navigate("/ambulance")` after API call |

---

## SECTION 4 — Hospital

### HospitalDashboard (/hospital)

| # | Feature | Status | Issue |
|---|---------|--------|-------|
| 1 | Shows hospital name from DB | ✅ | Fetches from `GET /api/hospital/info`, sets `hospitalName` from `data.name` |
| 2 | Resource cards show correct numbers | ✅ | Maps `data.resources.generalBeds/icuBeds/otTheatres/erBays` to stats state |
| 3 | "Actively Incoming Ambulances" updates via socket | ✅ | Listens to `ambulance:dispatch` socket event, adds to `incomingPatients` |
| 4 | Incoming patients sorted by severity | ✅ | `.sort((a, b) => (b.severityScore || 0) - (a.severityScore || 0))` |
| 5 | "Report Disease Trend" button opens modal | ✅ | `showDiseaseModal` state toggles a modal with form fields |
| 6 | `POST /api/hospital/report-disease` works | ✅ | Form submits `diseaseName`, `caseCount`, `severity`, `notes` to the endpoint |

### IncomingPatientAlert (/hospital/incoming/:caseId)

| # | Feature | Status | Issue |
|---|---------|--------|-------|
| 1 | Fetches real case data from `GET /api/cases/:caseId` | ✅ | Uses `authHeaders()` to fetch case with populated patient |
| 2 | Shows ETA countdown | ✅ | Computes ETA from AI recommendations + timeline elapsed time |
| 3 | Shows patient vitals and severity score | ✅ | Extracts from `patient.vitals` and `patient.severity` |
| 4 | Shows AI flags | ✅ | `enriched.severity.flags` passed through from patient severity data |
| 5 | Pre-allocation buttons work (Reserve ICU/OT, Alert ER) | ✅ | `handleAllocate()` calls `PUT /api/hospital/allocate` for ICU/OT or `POST /api/hospital/alert-er` for ER |
| 6 | Buttons turn green after clicking | ✅ | `allocationStatus[type]` tracks which buttons are activated |

### BedManagement (/hospital/beds)

| # | Feature | Status | Issue |
|---|---------|--------|-------|
| 1 | All 4 tabs work (General/ICU/OT/ER) | ✅ | `activeTab` state switches between tab content |
| 2 | Clicking bed cycles status | ✅ | `cycleStatus()` rotates AVAILABLE→OCCUPIED→RESERVED |
| 3 | +/- quick controls update count | ✅ | `handleGeneralUpdate(±1)` adjusts `generalBedsAvailable` |
| 4 | `PUT /api/hospital/availability` called on change | ❌ | **Missing auth headers!** The `emitAndUpdate` function sends `headers: { "Content-Type": "application/json" }` without an `Authorization` header. Since the route requires `verifyToken`, **all API calls will fail with 401**. |
| 5 | Socket emits `hospital:bed_update` after change | ⚠️ | The client calls `socket.emit("hospital:bed_update")`, but socket events are meant to be emitted FROM the server, not client→server. The server emits this event in the route handler. Since the API call fails (no auth), the server-side emit never happens. The client emit is cosmetic only (no handler on server side for this event). |

### PriorityQueue (/hospital/queue)

| # | Feature | Status | Issue |
|---|---------|--------|-------|
| 1 | Patients sorted by severity score (highest first) | ✅ | `INITIAL_SORTED_QUEUE` sorts by `b.severity.score - a.severity.score` |
| 2 | New critical patient jumps to top via socket | ✅ | `ambulance:dispatch` and `patient:vitals_update` handlers re-sort and highlight |
| 3 | "Can Wait?" shows correctly | ✅ | `severity.canWait` displayed as ✓ or ✗ |
| 4 | Clicking a row shows patient detail panel | ✅ | `selectedPatient` state renders a detail side panel |
| 5 | Uses real data from API | ❌ | **Uses only MOCK_QUEUE data**. The initial state is hardcoded mock patients. Real patients only arrive via socket events, but the initial load doesn't fetch from the server. |

---

## SECTION 5 — Admin

### AdminDashboard (/admin)

| # | Feature | Status | Issue |
|---|---------|--------|-------|
| 1 | City selector works and re-fetches data | ✅ | `selectedCity` triggers `useEffect` → `fetchDashboard(city)` |
| 2 | 5 stat cards show real numbers from DB | ✅ | Stats populated from `GET /api/admin/dashboard` response |
| 3 | Hospital status table shows all seeded hospitals | ✅ | `data.hospitals` mapped from API response |
| 4 | Live activity feed updates via socket | ✅ | Listens to `case:created`, `case:en_route`, `case:arrived`, `case:assigned`, `patient:vitals_update`, `case:status_update` |
| 5 | "Pending Alerts" section shows disease reports | ✅ | `fetchPendingAlerts()` from `GET /api/admin/pending-alerts` |
| 6 | "Publish Alert" button activates the alert | ✅ | `handlePublishAlert()` calls `PUT /api/admin/alerts/:id/publish` |

### AnalyticsPanel (/admin/analytics)

| # | Feature | Status | Issue |
|---|---------|--------|-------|
| 1 | All charts render (bar, line, pie) | ✅ | Uses Recharts: `BarChart`, `LineChart`, `PieChart` with real data from `GET /api/admin/analytics` |
| 2 | Impact numbers show (minutes saved, lives impacted) | ⚠️ | Shows `totalCases`, `totalPatients`, `totalHospitals`, `totalAmbulances`, `activeCases` as stat cards. No explicit "minutes saved" or "lives impacted" — those are derivative metrics not calculated. |
| 3 | Route analysis table shows AI override column | ⚠️ | Route analysis table shows `caseId`, `patientName`, `hospital`, `ambulanceId`, `responseTime`, `status`, `date`. **No AI override column** — there's no such field in the data or UI. |

### HospitalRatings (/admin/ratings)

| # | Feature | Status | Issue |
|---|---------|--------|-------|
| 1 | Search filter works | ✅ | `searchQuery` filters `MOCK_HOSPITALS` by name |
| 2 | Sort dropdown works | ✅ | `sortBy` sorts by rating/cases/response |
| 3 | Top performer badge shows | ✅ | `topPerformerId` computed from highest rated hospital |
| 4 | Star ratings display correctly | ✅ | `renderStars()` generates filled/half/empty stars |
| 5 | Uses real data from API | ❌ | **Entirely MOCK data**. `MOCK_HOSPITALS` array is hardcoded with fake hospitals. No API call is made. |

### LiveMap (/admin/map)

| # | Feature | Status | Issue |
|---|---------|--------|-------|
| 1 | Hospital markers show | ✅ | `MOCK_HOSPITALS` rendered as positioned markers on SVG |
| 2 | Ambulance markers animate | ✅ | `moveTimer` setInterval moves ambulances toward target hospitals |
| 3 | Sidebar shows active cases with ETA | ✅ | `activeCases` filtered from ambulances with EN_ROUTE status |
| 4 | Uses real data from API | ❌ | **Entirely MOCK data**. Hospitals and ambulances are hardcoded constants. No API calls. The `ambulance:eta_update` socket event is listened for but the server never emits this event. |

---

## SECTION 6 — Disease Alert Pipeline

| # | Feature | Status | Issue |
|---|---------|--------|-------|
| 1 | Hospital staff reports disease via `POST /api/hospital/report-disease` | ✅ | Endpoint exists, creates Alert with `active: false` |
| 2 | Admin sees it in pending alerts section | ✅ | `GET /api/admin/pending-alerts` returns alerts with `active: false` |
| 3 | Admin publishes via `PUT /api/admin/alerts/:id/publish` | ✅ | Sets `active: true`, emits `alert:published` socket event |
| 4 | Alert appears in Public DiseaseAlerts page | ⚠️ | The public page fetches active alerts on load/city change, but does NOT listen for `alert:published` socket events for real-time updates. The user would need to refresh the page. |
| 5 | Socket event `alert:published` is emitted and received | ⚠️ | Server emits `io.emit("alert:published", alert)` globally. But the DiseaseAlerts page does NOT have any socket listener — it only uses REST API fetch. |

---

## SECTION 7 — Socket.io Real-time Events

| # | Event | Status | Issue |
|---|-------|--------|-------|
| 1 | `case:assigned` → ambulance receives | ✅ | Server emits to ambulance room + admin room; AmbulanceDashboard listens correctly |
| 2 | `patient:vitals_update` → hospital + admin receive | ✅ | Server emits to hospital room, ambulance room, admin room; HospitalDashboard and AdminDashboard listen |
| 3 | `ambulance:dispatch` → hospital receives when hospital selected | ✅ | Server emits to `hospitalId.toString()` room; HospitalDashboard listens on `ambulance:dispatch` |
| 4 | `hospital:bed_update` → clients receive when beds updated | ⚠️ | Server emits to hospital room after `PUT /api/hospital/availability`. BUT BedManagement's API call **fails due to missing auth header** (see Section 4), so this never fires from BedManagement. Works if admin updates via API. |
| 5 | `alert:published` → all clients receive | ⚠️ | Server emits globally via `io.emit(...)`, but **no client component** listens for this event. Only AdminDashboard removes the alert from pending list optimistically. DiseaseAlerts doesn't have a socket connection at all. |

---

## SECTION 8 — AI Engine

| # | Feature | Status | Issue |
|---|---------|--------|-------|
| 1 | `calculateSeverity()` returns score 0-100 with correct level | ✅ | Returns `{score, level, canWait, flags, breakdown, survivalProbability}`. Level: stable (<40), urgent (40-69), critical (≥70). |
| 2 | `rankHospitals()` returns top 3 with real distances | ✅ | Uses Haversine distance, facility match, doctor availability, rating. Returns top 3 sorted by score. |
| 3 | All 5 models called: MEWS, ShockIndex, GCS, RTS, SOFA | ✅ | `severityAggregator.js` imports and calls all 5 models |
| 4 | Flags correctly generated | ✅ | `shock_risk`, `organ_failure_risk`, `critical_trauma`, `brain_injury_risk`, `respiratory_distress` — all generated from model outputs |
| 5 | `survivalProbability` calculated from RTS model | ✅ | RTS logistic regression: `Ps = 1 / (1 + e^(-b))` where `b = -3.5718 + RTS * 0.847` |

---

## Summary

### CRITICAL ISSUES (❌) — 6 items

1. **Demo/Login passwords don't match seed data** — DemoPage and LoginPage hardcode `pass123`, but seedData generates a random password unless `SEED_PASSWORD` env var is set. **This breaks the entire demo flow.**
2. **LandingPage latest alert is hardcoded** — Shows static mock data, not real DB data.
3. **BedManagement missing auth headers** — All `PUT /api/hospital/availability` calls fail with 401 because the Authorization header is not included.
4. **PriorityQueue uses only mock data** — Never fetches real patients from the API on load.
5. **HospitalRatings is entirely mock** — No API integration at all.
6. **LiveMap is entirely mock** — No API integration; hospitals and ambulances are hardcoded.

### WARNING ISSUES (⚠️) — 10 items

1. **LandingPage username** — JWT payload doesn't include `name`, so the greeting always shows "Alex" or "User".
2. **LandingPage 4th nav card** — "Nearby Hospitals" shows "Coming Soon" (intentional, but not functional).
3. **DiseaseAlerts symptoms** — Backend Alert model lacks `symptoms` field; DB-sourced alerts won't have symptoms to expand.
4. **PatientVitalsForm no score display** — Immediately navigates to recommendations without showing the AI breakdown.
5. **RouteView dispatch statuses simulated** — Hospital Notified / Bed Reserved / ER Team Alerted are fake timeouts, not real server events.
6. **BedManagement client-side socket emit** — Emits `hospital:bed_update` from client, but there's no server handler for this; it's a no-op.
7. **DiseaseAlerts no real-time updates** — Doesn't listen for `alert:published` socket events; requires page refresh to see new alerts.
8. **AnalyticsPanel** — No "minutes saved" or "lives impacted" metrics; no "AI override" column in route analysis.
9. **AnalyticsPanel** — Route analysis table lacks AI override data.
10. **`estimatedEta` field** — Referenced in server code (`caseObj.estimatedEta`) but not defined in the Case schema, always returns `undefined`.

### WORKING (✅) — 52 features confirmed working

---

## Prioritized Fix List

### Priority 1 — Blocks Demo (Must Fix)

| # | Fix | Affected Component |
|---|-----|-------------------|
| **P1-1** | **Add `SEED_PASSWORD=pass123` to `.env`** or change seedData to default to `pass123` when env var is missing. The DemoPage, LoginPage, and seed script MUST agree on a password. Without this, the ENTIRE app is unusable. | `server/seed/seedData.js`, `.env` |
| **P1-2** | **Add auth headers to BedManagement API calls** — Import `AuthContext`, get `authHeaders`, include in fetch headers for `PUT /api/hospital/availability`. Without this, all bed updates fail silently. | `client/src/pages/Hospital/BedManagement.jsx` |

### Priority 2 — Important but Demo Works Without

| # | Fix | Affected Component |
|---|-----|-------------------|
| **P2-1** | **LandingPage: fetch latest alert from API** instead of using hardcoded mock `alertsData`. Use `GET /api/public/disease-alerts?city=Ludhiana` and take the first result. | `client/src/pages/Public/LandingPage.jsx` |
| **P2-2** | **LandingPage: show real username** — Either include `name` in the JWT payload, or read from localStorage `user` object (which already has `name`). | `client/src/pages/Public/LandingPage.jsx` + optionally `server/routes/auth.js` |
| **P2-3** | **PriorityQueue: fetch initial data from API** — On mount, call `GET /api/hospital/incoming` or `GET /api/cases` to populate with real patients instead of mock data only. | `client/src/pages/Hospital/PriorityQueue.jsx` |
| **P2-4** | **DiseaseAlerts: add `alert:published` socket listener** — Connect via `createSocket()` and listen for `alert:published` to add new alerts in real-time without page refresh. | `client/src/pages/Public/DiseaseAlerts.jsx` |
| **P2-5** | **Add `symptoms` field to Alert model** — The DiseaseAlerts page expects `symptoms` array for expandable cards, but the model doesn't define it. Add the field to the schema and seed data. | `server/models/Alert.js`, `server/seed/seedData.js` |
| **P2-6** | **PatientVitalsForm: show AI score breakdown** — After successful submission, display the severity score, level, and model breakdown before navigating to recommendations. | `client/src/pages/Ambulance/PatientVitalsForm.jsx` |
| **P2-7** | **Add `estimatedEta` to Case schema** — The field is referenced in server routes but not defined in the schema. Add `estimatedEta: { type: String }` to the Case model. | `server/models/Case.js` |
| **P2-8** | **BedManagement: remove client-side socket emit** — The `socket.emit("hospital:bed_update")` from the client is a no-op. The server already emits this event in the route handler. Remove to avoid confusion. | `client/src/pages/Hospital/BedManagement.jsx` |

### Priority 3 — Nice to Have

| # | Fix | Affected Component |
|---|-----|-------------------|
| **P3-1** | **HospitalRatings: integrate with real API** — Replace `MOCK_HOSPITALS` with data from `GET /api/admin/hospitals` or create a dedicated ratings endpoint. | `client/src/pages/Admin/HospitalRatings.jsx` |
| **P3-2** | **LiveMap: integrate with real API** — Fetch hospitals from `GET /api/admin/hospitals` and ambulances from `GET /api/admin/ambulances`. Listen for `ambulance:location_update` socket events for real movement. | `client/src/pages/Admin/LiveMap.jsx` |
| **P3-3** | **RouteView: implement real dispatch status checks** — Replace simulated timeouts with actual socket events from hospital (e.g., `hospital:resource_allocated`, `er:alert`). | `client/src/pages/Ambulance/RouteView.jsx` |
| **P3-4** | **AnalyticsPanel: add "minutes saved" and "AI override" metrics** — Calculate average time saved vs. manual dispatch and track AI recommendation override rate. | `client/src/pages/Admin/AnalyticsPanel.jsx`, `server/routes/admin.js` |
| **P3-5** | **SymptomChecker: verify EMERGENCY result has `/request-ambulance` CTA link** — Ensure the EMERGENCY result type renders a visible "Call Ambulance" button/link. | `client/src/pages/Public/SymptomChecker.jsx` |
| **P3-6** | **LandingPage 4th card** — Either implement "Nearby Hospitals" feature or clearly indicate it's a planned feature.
