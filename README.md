<div align="center">

<br/>

```
███╗   ███╗███████╗██████╗ ███╗   ███╗ █████╗ ███╗   ██╗ █████╗  ██████╗ ███████╗
████╗ ████║██╔════╝██╔══██╗████╗ ████║██╔══██╗████╗  ██║██╔══██╗██╔════╝ ██╔════╝
██╔████╔██║█████╗  ██║  ██║██╔████╔██║███████║██╔██╗ ██║███████║██║  ███╗█████╗
██║╚██╔╝██║██╔══╝  ██║  ██║██║╚██╔╝██║██╔══██║██║╚██╗██║██╔══██║██║   ██║██╔══╝
██║ ╚═╝ ██║███████╗██████╔╝██║ ╚═╝ ██║██║  ██║██║ ╚████║██║  ██║╚██████╔╝███████╗
╚═╝     ╚═╝╚══════╝╚═════╝ ╚═╝     ╚═╝╚═╝  ╚═╝╚═╝  ╚═══╝╚═╝  ╚═╝ ╚═════╝ ╚══════╝
```

**AI-Powered Emergency Medical Coordination Platform**

*The right hospital. The right resources. In seconds — when seconds are all that matter.*

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-Express%205-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%209-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![JWT](https://img.shields.io/badge/Auth-JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io)

</div>

---

## 📖 Table of Contents

1. [What is MedManage?](#-what-is-medmanage)
2. [Core Problem Statement](#-core-problem-statement)
3. [System Architecture](#%EF%B8%8F-system-architecture)
4. [AI Engine — How It Works](#-ai-engine--how-it-works)
5. [Database Schema](#%EF%B8%8F-database-schema)
6. [REST API Reference](#-rest-api-reference)
7. [Real-Time Events (Socket.IO)](#-real-time-events-socketio)
8. [Frontend — Role Portals](#-frontend--role-portals)
9. [Tech Stack](#-tech-stack)
10. [Getting Started](#-getting-started)
11. [Project Structure](#-project-structure)
12. [Team Assignments](#-team-assignments)

---

## 🏥 What is MedManage?

**MedManage** (internally named *MediRoute*) is a full-stack emergency medical coordination platform that connects **ambulances**, **hospitals**, and **the public** in real-time during a medical emergency.

When a patient is picked up, the ambulance operator enters vitals directly from the field. MedManage's **AI engine** runs four clinical scoring algorithms in under a millisecond to quantify the patient's severity, then cross-references every accepting hospital in the city to recommend the single **best destination** — ranked by proximity, resource fit, doctor availability, and hospital rating.

Hospitals receive live pre-arrival alerts. Admins watch the whole city from a live map and analytics dashboard. The public can request an ambulance or check disease alerts — no login required.

---

##  Core Problem Statement

Emergency medical response suffers from a fundamental coordination failure:

- **Ambulance crews** don't know in real-time which hospitals have ICU beds, OT theatres or ER bays available.
- **Hospitals** receive no advance warning before a critical patient arrives, preventing prep time.
- **Routing decisions** are often made on intuition rather than data — sending a trauma patient to a hospital 2 km away that has no surgeon on duty.
- **Administrators** have no centralized view of city-wide emergency resource utilization.

MedManage solves all four with a single, unified platform.

---

## System Architecture

```
┌───────────────────────────────────────────────────────────────────────┐
│                           CLIENT (React 19 + Vite)                    │
│                                                                       │
│  ┌─────────────┐  ┌──────────────┐  ┌─────────────┐ ┌─────────────┐ │
│  │   PUBLIC    │  │  AMBULANCE   │  │  HOSPITAL   │ │    ADMIN    │ │
│  │   PORTAL    │  │    PORTAL    │  │   PORTAL    │ │   PORTAL    │ │
│  │  (no auth)  │  │  (4 pages)   │  │  (4 pages)  │ │  (4 pages)  │ │
│  └─────────────┘  └──────────────┘  └─────────────┘ └─────────────┘ │
│                        Axios (REST)  +  Socket.IO Client              │
└───────────────────────────────┬───────────────────────────────────────┘
                                │ HTTP / WebSocket
┌───────────────────────────────▼───────────────────────────────────────┐
│                     SERVER (Node.js + Express 5)                      │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐    │
│  │  REST Routes                                                  │    │
│  │  /api/auth  /api/public  /api/cases  /api/ambulance          │    │
│  │  /api/hospital  /api/admin                                   │    │
│  └──────────────────────┬───────────────────────────────────────┘    │
│                         │                                             │
│  ┌──────────────────────▼───────────────────────────────────────┐    │
│  │  AI Engine                                                    │    │
│  │  severityAggregator.js → MEWS + ShockIndex + RTS + SOFA     │    │
│  │  hospitalRanker.js → Haversine + Resource + Doctor + Rating  │    │
│  └──────────────────────┬───────────────────────────────────────┘    │
│                         │                                             │
│  ┌──────────────────────▼───────────────────────────────────────┐    │
│  │  Socket.IO Server — socketHandler.js                         │    │
│  │  Events: case:created · patient:vitals_update                │    │
│  │          case:assigned · ambulance:dispatch · er:alert       │    │
│  └──────────────────────┬───────────────────────────────────────┘    │
└───────────────────────────────┬───────────────────────────────────────┘
                                │ Mongoose ODM
┌───────────────────────────────▼───────────────────────────────────────┐
│                    MongoDB (mediroute database)                        │
│                                                                       │
│   users · hospitals · ambulances · cases · patients · alerts          │
└───────────────────────────────────────────────────────────────────────┘
```

---

## AI Engine — How It Works

The AI engine is the heart of MedManage. It doesn't call any external API — every decision is made locally using **evidence-based clinical scoring formulas** that are standard in pre-hospital emergency medicine.

### Step 1 — Severity Assessment (`severityAggregator.js`)

Four independent scoring models run in parallel on the patient's vitals:

| Score | What It Measures | Normal → Critical |
|---|---|---|
| **MEWS** (Modified Early Warning Score) | Composite early-warning across resp. rate, HR, BP, temp, consciousness | 0 → ≥ 5 = high risk |
| **Shock Index** | `Heart Rate ÷ Systolic BP` — proxy for circulatory shock | < 0.9 normal → > 1.4 = severe shock |
| **RTS** (Revised Trauma Score) | GCS + Systolic BP + Resp. Rate weighted formula for trauma | 7.84 = normal → 0 = unsurvivable |
| **Simplified SOFA** | SpO₂ + MAP + GCS — organ failure proxy | 0 = no failure → 8 = severe |

**Composite scoring formula:**

```
rawScore = (MEWS_normalized × 0.30)
         + (RTS_inverted   × 0.25)
         + (SOFA_normalized × 0.25)
         + (ShockIdx_norm  × 0.20)

finalScore = clamp(rawScore × conditionMultiplier, 0, 100)
```

**Condition multipliers** adjust for comorbidities:
- Heart Disease + tachycardia → `+15%`
- Diabetes + fever → `+10%`
- Age > 65 → `+10%`

**Output object:**

```json
{
  "score": 78,
  "level": "critical",
  "canWait": false,
  "flags": ["shock_risk", "respiratory_distress"],
  "breakdown": {
    "mews": 7,
    "shockIndex": 1.21,
    "rts": 4.5,
    "sofa": 4
  },
  "survivalProbability": 0.72
}
```

**Severity Levels:**

| Score Range | Level | `canWait` |
|---|---|---|
| 0 – 39 | 🟢 Stable | `true` |
| 40 – 69 | 🟡 Urgent | `true` (< 60) |
| 70 – 100 | 🔴 Critical | `false` |

---

### Step 2 — Hospital Ranking (`hospitalRanker.js`)

Once severity is computed, the AI ranks every `accepting` hospital using a **100-point scoring model**:

| Criterion | Max Points | Logic |
|---|---|---|
| **Facility Match** | 35 pts | Does hospital have > 0 available units of all *required* resource types? *(ICU if score > 70; OT if critical trauma flag; ER if respiratory distress; else general beds)* |
| **Distance** | 30 pts | `max(0, 30 − distance_km × 3)` — Haversine formula (Earth radius 6371 km) |
| **Doctor Availability** | 20 pts | `min(availableDoctors × 5, 20)` |
| **Hospital Rating** | 15 pts | `(rating / 5) × 15` |
| **Critical Override** | +20 pts | Bonus if `canWait = false` AND hospital is < 3 km away |

Returns the **top 3 hospitals**, each with:
- Score, distance, estimated travel time (`dist × 2.5 + 2` minutes)
- Reason string (human-readable explanation)
- Estimated cost: `₹2,000–5,000` (govt) vs `₹8,000–20,000` (private/trust)
- Survival probability from RTS

---

## 🗄️ Database Schema

### `users`
| Field | Type | Notes |
|---|---|---|
| `name`, `email`, `password` | String | bcrypt-hashed password |
| `role` | Enum | `public` · `ambulance` · `hospital` · `admin` |
| `phone` | String | |
| `location` | `{lat, lng}` | |
| `hospitalId` | ObjectId → Hospital | For hospital staff |
| `ambulanceId` | ObjectId → Ambulance | For ambulance operators |

### `hospitals`
| Field | Type | Notes |
|---|---|---|
| `name`, `type` | String, Enum | `govt` · `private` · `trust` |
| `location` | `{lat, lng, address}` | |
| `resources` | Object | `generalBeds`, `icuBeds`, `otTheatres`, `erBays` — each with `total` and `available` |
| `doctors` | Array | `[{name, speciality, available}]` |
| `status` | Enum | `accepting` · `at_capacity` · `emergency_only` |
| `rating`, `totalCases`, `avgResponseTime` | Number | |

### `ambulances`
| Field | Type | Notes |
|---|---|---|
| `ambulanceId` | String | Unique identifier |
| `status` | Enum | `available` · `on_call` · `off_duty` |
| `currentLocation` | `{lat, lng}` | |
| `assignedCase` | ObjectId → Case | |
| `operatorId` | ObjectId → User | |

### `cases`
| Field | Type | Notes |
|---|---|---|
| `caseId` | String | Auto-generated: `CASE-{timestamp}` |
| `patient` | ObjectId → Patient | |
| `ambulance`, `hospital` | ObjectId refs | |
| `status` | Enum | `dispatched` · `en_route` · `arrived` · `completed` |
| `timeline` | Array | `[{event, timestamp}]` — append-only log |
| `aiRecommendations` | Array | `[{hospitalId, score, reason, distance}]` |
| `selectedHospital` | ObjectId → Hospital | The hospital the paramedic chose |

### `patients`
| Field | Type | Notes |
|---|---|---|
| `name`, `age`, `gender` | String/Number | |
| `vitals` | Object | `heartRate`, `systolic`, `diastolic`, `respiratoryRate`, `temperature`, `oxygenSat`, `consciousness`, `chiefComplaint`, `conditions[]` |
| `severity` | Object | AI output: `{score, level, canWait, flags, breakdown, survivalProbability}` |
| `status` | Enum | `incoming` · `arrived` · `admitted` · `discharged` |

### `alerts`
| Field | Type | Notes |
|---|---|---|
| `type` | Enum | `disease` · `emergency` · `system` |
| `title`, `message` | String | |
| `severity` | Enum | `high` · `medium` · `low` |
| `affectedZones[]`, `city` | String | For geo-filtering |
| `active` | Boolean | Filter toggle |

---

## 🌐 REST API Reference

### Authentication — `/api/auth`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | ❌ | Register new user (returns JWT) |
| `POST` | `/auth/login` | ❌ | Login (returns JWT + user object) |

> JWT expires in **24h**. All protected routes require `Authorization: Bearer <token>` header.

### Public — `/api/public`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/public/disease-alerts?city=` | ❌ | Active alerts sorted by severity (high → low) |
| `POST` | `/public/request-ambulance` | ❌ | Request ambulance; auto-assigns nearest available unit, creates Case + Patient, emits `case:assigned` socket event |

### Cases — `/api/cases`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/cases/create` | ✅ | Create a new case + patient record, emits `case:created` |
| `PUT` | `/cases/:id/update-vitals` | ✅ | Update patient vitals → triggers AI severity calculation → emits `patient:vitals_update` |
| `GET` | `/cases/:id/recommendation` | ✅ | Run hospital ranker → stores `aiRecommendations` on case → returns top 3 |
| `PUT` | `/cases/:id/select-hospital` | ✅ | Paramedic confirms hospital → sets status to `en_route` → emits `ambulance:dispatch` to hospital room |
| `PUT` | `/cases/:id/status` | ✅ | Update case status → emits `case:arrived` when status = `arrived` |

### Ambulance — `/api/ambulance`
| Method | Endpoint | Auth | Role |
|---|---|---|---|
| `PUT` | `/ambulance/status` | ✅ | `ambulance` — Update own unit status |
| `GET` | `/ambulance/active-case` | ✅ | `ambulance` — Get current assigned case with populated patient |

### Hospital — `/api/hospital`
| Method | Endpoint | Auth | Role |
|---|---|---|---|
| `PUT` | `/hospital/availability` | ✅ | `hospital` — Update resource availability; emits `hospital:bed_update` |
| `PUT` | `/hospital/allocate` | ✅ | `hospital` — Allocate ICU/OT/ER to incoming case (decrements available count) |
| `POST` | `/hospital/alert-er` | ✅ | `hospital` — Trigger ER alert broadcast via `er:alert` |

### Admin — `/api/admin`
| Method | Endpoint | Auth | Role |
|---|---|---|---|
| `GET` | `/admin/dashboard?city=` | ✅ | `admin` — All hospitals, ambulances, today's case count, city-wide stats |
| `GET` | `/admin/analytics` | ✅ | `admin` — Weekly case trends, avg response times, top hospitals, severity distribution |

---

## ⚡ Real-Time Events (Socket.IO)

All events are broadcast system-wide (or to a hospital room) over a persistent WebSocket connection.

| Event Name | Direction | Payload | Trigger |
|---|---|---|---|
| `case:created` | Server → All | `caseObject` | New case opened by ambulance |
| `case:assigned` | Server → All | `{case, ambulanceId}` | Public ambulance request fulfilled |
| `patient:vitals_update` | Server → All | `{caseId, severity}` | Vitals updated + AI severity recalculated |
| `ambulance:dispatch` | Server → Hospital Room | `{case, patient, eta}` | Paramedic selects this hospital |
| `hospital:bed_update` | Server → All | `{resources}` | Hospital updates resource availability |
| `er:alert` | Server → All | `{caseId}` | Hospital alerts ER staff |
| `case:arrived` | Server → All | `{caseId}` | Ambulance marks arrival |

---

## 💻 Frontend — Role Portals

The frontend is a **React 19 SPA** with **React Router v6** and role-based route protection (`ProtectedRoute` component checks JWT role).

### 🔓 Public Portal (`/` · `/alerts` · `/symptoms` · `/request-ambulance`)
> No authentication required

| Page | Key Features |
|---|---|
| `LandingPage` | Hero section, platform overview, CTA buttons |
| `DiseaseAlerts` | Real-time disease/emergency alerts filtered by city, color-coded by severity |
| `SymptomChecker` | Guided symptom input form with severity estimation for the public |
| `RequestAmbulance` | One-tap ambulance request form; shows assigned ambulance ID + ETA |

---

### 🚑 Ambulance Portal (`/ambulance/*`)
> Role: `ambulance`

```
  AmbulanceDashboard
       │
       ├── PatientVitalsForm  (/ambulance/vitals/:caseId)
       │        └── Inputs: HR, BP, RR, Temp, SpO₂, Consciousness, Age, Conditions
       │        └── On submit → PUT /api/cases/:id/update-vitals → AI severity returned
       │
       ├── HospitalRecommendations  (/ambulance/recommendations/:caseId)
       │        └── Displays top 3 AI-ranked hospitals with score, distance, ETA, cost
       │        └── On confirm → PUT /api/cases/:id/select-hospital
       │
       └── RouteView  (/ambulance/route/:caseId)
                └── Navigation/map view to the selected hospital
```

**Key workflow:** Dispatch → Enter Vitals → View AI Recommendations → Confirm Hospital → Navigate

---

### 🏥 Hospital Portal (`/hospital/*`)
> Role: `hospital`

| Page | Key Features |
|---|---|
| `HospitalDashboard` | Overview of own resources, incoming case queue |
| `IncomingPatientAlert` | Real-time pre-arrival alert: patient name, severity score, flags, ETA |
| `BedManagement` | Live UI to update available counts for General Beds, ICU, OT, ER bays |
| `PriorityQueue` | Queued incoming cases sorted by AI severity score (critical → urgent → stable) |

Hospital staff receive `ambulance:dispatch` socket events the moment a paramedic selects their hospital — giving lead time to prepare the right room/resources.

---

### 🛡️ Admin Portal (`/admin/*`)
> Role: `admin`

| Page | Key Features |
|---|---|
| `AdminDashboard` | City-wide stats: active ambulances, total available beds, today's case count; hospital + ambulance directory |
| `AnalyticsPanel` | Weekly case trend chart (Recharts), avg response times, top hospitals by volume, severity distribution pie |
| `HospitalRatings` | Hospital performance review — rating, total cases, avg response time |
| `LiveMap` | Real-time map view of all ambulances and hospital locations |

---

## 🛠 Tech Stack

### Backend
| Technology | Version | Role |
|---|---|---|
| `Node.js` | 20+ | Runtime |
| `Express` | 5.x | HTTP framework |
| `Mongoose` | 9.x | MongoDB ODM |
| `Socket.IO` | 4.8 | Real-time WebSocket |
| `bcryptjs` | 3.x | Password hashing |
| `jsonwebtoken` | 9.x | JWT auth tokens |
| `dotenv` | 17.x | Environment config |
| `cors` | 2.8 | Cross-origin policy |

### Frontend
| Technology | Version | Role |
|---|---|---|
| `React` | 19 | UI framework |
| `Vite` | 7 | Build tool & dev server |
| `React Router DOM` | 6.x | Client-side routing |
| `Axios` | 1.x | HTTP client |
| `Socket.IO Client` | 4.8 | Real-time events |
| `Recharts` | 3.x | Analytics charts |
| `Lucide React` | 0.577 | Icon library |
| `TailwindCSS` | 3.x | Utility-first CSS |

### Database & Infrastructure
| Technology | Notes |
|---|---|
| `MongoDB` | Default db: `mediroute` (localhost:27017 or via `MONGO_URI`) |
| `concurrently` | Runs server + client dev servers in one command |

---

## 🚀 Getting Started

### Prerequisites
- **Node.js** ≥ 18
- **MongoDB** running locally (or provide `MONGO_URI` in `.env`)

### 1. Clone & Install

```bash
git clone https://github.com/dhwan1t/MedManage.git
cd MedManage

# Install root dependencies (concurrently, express, mongoose, etc.)
npm install

# Install client dependencies (React, Vite, Tailwind, etc.)
cd client && npm install && cd ..
```

### 2. Environment Setup

Create a `.env` file in the project root:

```env
MONGO_URI=mongodb://localhost:27017/mediroute
JWT_SECRET=your_secret_key_here
PORT=5000
```

### 3. Seed the Database

Populate the database with sample hospitals, ambulances, and alerts:

```bash
npm run seed
```

### 4. Run in Development

```bash
npm run dev
```

This starts **both** servers concurrently:
- 🔵 **API Server**: `http://localhost:5000`
- 🟣 **Vite Dev Server**: `http://localhost:5173`

### 5. Login Roles

After seeding, use these role types to log in via `/login`:

| Role | Portal Path | Description |
|---|---|---|
| `public` | `/` | No login needed for most features |
| `ambulance` | `/ambulance` | Paramedic workflow |
| `hospital` | `/hospital` | Hospital staff dashboard |
| `admin` | `/admin` | City-wide operations view |

---

## 📁 Project Structure

```
medmanage/
├── package.json                  # Root: scripts (dev, seed), shared deps
│
├── server/                       # Node.js + Express backend
│   ├── index.js                  # Server entry: Express, Socket.IO, MongoDB, routes
│   ├── middleware/
│   │   └── auth.js               # JWT verifyToken + verifyRole middleware
│   ├── models/
│   │   ├── User.js               # 4-role user schema
│   │   ├── Hospital.js           # Resources, doctors, status, location
│   │   ├── Ambulance.js          # Status, location, assigned case
│   │   ├── Case.js               # Timeline log + AI recommendations
│   │   ├── Patient.js            # Vitals + computed severity
│   │   └── Alert.js              # Disease/emergency alerts
│   ├── routes/
│   │   ├── auth.js               # POST /register, POST /login
│   │   ├── public.js             # GET /disease-alerts, POST /request-ambulance
│   │   ├── cases.js              # Full case lifecycle + AI pipeline trigger
│   │   ├── ambulance.js          # Operator status + active case lookup
│   │   ├── hospital.js           # Resource management + ER alerts
│   │   └── admin.js              # Dashboard stats + analytics
│   ├── ai/
│   │   ├── severityAggregator.js # Master AI function → 0-100 severity score
│   │   ├── hospitalRanker.js     # Haversine distance + multi-factor ranking
│   │   ├── scoringFormulas.js    # Pure scoring functions (MEWS, SI, RTS, SOFA, GCS)
│   │   └── scores/               # Individual score modules imported by aggregator
│   ├── sockets/
│   │   └── socketHandler.js      # Socket.IO event definitions
│   └── seed/
│       └── seedData.js           # Database seeder
│
└── client/                       # React 19 + Vite frontend
    ├── index.html                # SPA shell
    ├── vite.config.js            # Vite config (proxy: /api → localhost:5000)
    ├── tailwind.config.js        # TailwindCSS config
    └── src/
        ├── main.jsx              # React root mount
        ├── App.jsx               # Router + ProtectedRoute guards
        ├── context/
        │   ├── AuthContext.jsx   # JWT storage, login/logout, user state
        │   ├── ThemeContext.jsx  # Dark/light theme toggle
        │   ├── useAuth.js        # Auth context hook
        │   └── useTheme.js       # Theme context hook
        ├── components/
        │   └── shared/
        │       └── ProtectedRoute.jsx  # Role-based route guard
        └── pages/
            ├── Auth/             # LoginPage, RegisterPage
            ├── Public/           # LandingPage, DiseaseAlerts, SymptomChecker, RequestAmbulance
            ├── Ambulance/        # AmbulanceDashboard, PatientVitalsForm, HospitalRecommendations, RouteView
            ├── Hospital/         # HospitalDashboard, IncomingPatientAlert, BedManagement, PriorityQueue
            └── Admin/            # AdminDashboard, AnalyticsPanel, HospitalRatings, LiveMap
```

---

## 👥 Team Assignments

| Member | Ownership Area | Files |
|---|---|---|
| **P1** | Public & Ambulance Frontend | `client/src/pages/Public/` · `client/src/pages/Ambulance/` |
| **P2** | Hospital & Admin Frontend | `client/src/pages/Hospital/` · `client/src/pages/Admin/` |
| **P3** | Full Backend (except AI) | `server/` — routes, models, middleware, sockets, seed |
| **P4** | AI Engine | `server/ai/` — severity aggregator, hospital ranker, scoring formulas |

---

<div align="center">

**Built for emergencies. Engineered for speed.**

*MedManage — Because the right hospital at the right time saves lives.*

</div>
