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

*The right hospital. The right resources. In seconds -- when seconds are all that matter.*

<br/>

[![Node.js](https://img.shields.io/badge/Node.js-Express%205-339933?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![MongoDB](https://img.shields.io/badge/MongoDB-Mongoose%209-47A248?style=for-the-badge&logo=mongodb&logoColor=white)](https://mongodb.com)
[![Socket.IO](https://img.shields.io/badge/Socket.IO-4.8-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io)
[![Vite](https://img.shields.io/badge/Vite-7-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev)
[![TailwindCSS](https://img.shields.io/badge/Tailwind-v3-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white)](https://tailwindcss.com)
[![JWT](https://img.shields.io/badge/Auth-JWT-000000?style=for-the-badge&logo=jsonwebtokens&logoColor=white)](https://jwt.io)

</div>

<div align="center">

**Built for emergencies. Engineered for speed.**

**AI Assists, But Human commands**

**We Team Tenacious position our system as compliant infrastructure, not a liability risk.**

*MedManage -- Because the right hospital at the right time saves lives.*

<!--</div>

<div align="center">

**AI Assists, But Human commands** 

</div>-->

---

## Table of Contents

1. [What is MedManage?](#what-is-medmanage)
2. [Key Features](#key-features)
3. [Core Problem Statement](#core-problem-statement)
4. [System Architecture](#system-architecture)
5. [AI Engine -- How It Works](#ai-engine--how-it-works)
6. [Database Schema](#database-schema)
7. [REST API Reference](#rest-api-reference)
8. [Real-Time Events (Socket.IO)](#real-time-events-socketio)
9. [Frontend -- Role Portals](#frontend--role-portals)
10. [Access Control](#access-control)
11. [Tech Stack](#tech-stack)
12. [Getting Started](#getting-started)
13. [Scripts](#scripts)
14. [Project Structure](#project-structure)
15. [Team Assignments](#team-assignments)

---

## What is MedManage?

**MedManage** (internally named *MediRoute*) is a full-stack emergency medical coordination platform that connects **ambulances**, **hospitals**, and **the public** in real-time during a medical emergency.

When a patient is picked up, the ambulance operator enters vitals directly from the field. MedManage's **AI engine** runs **14 clinical scoring algorithms** in under a millisecond to quantify the patient's severity -- covering early-warning deterioration, shock, sepsis, stroke, trauma, organ failure, pneumonia, pediatric emergencies, and mass casualty triage. It then cross-references every accepting hospital in the city to recommend the single **best destination** -- ranked by proximity, resource fit, doctor availability, hospital rating, and specialty matching (e.g. routing stroke patients to neurology-capable centres).

Hospitals receive live pre-arrival alerts with clinical flags. Admins watch the whole city from a live map and analytics dashboard. The public can request an ambulance, check disease alerts, or use the symptom checker -- **no login required**.

See [quick-start.md](quick-start.md) for full setup instructions.

---

## Key Features

- **No-login public access** -- Bystanders and first-time users can request an ambulance, view disease alerts, and check symptoms without creating an account. In an emergency nobody should be forced to register first.
- **14 clinical AI scoring models** -- MEWS, Shock Index, GCS, RTS, Simplified SOFA, NEWS2, Modified Shock Index, qSOFA, PRESEP, Pulse Pressure, CPSS (stroke screen), CRB-65, PAT (pediatric), and START mass casualty triage. All run locally with zero external API calls.
- **Extended vitals form** -- Supplemental oxygen status, stroke screening (CPSS: facial droop, arm drift, speech abnormality), and nursing home resident flag feed directly into the scoring engine.
- **Clinical alert banners** -- Hospital recommendations page shows prominent banners when stroke risk, sepsis risk, pediatric emergency, or mass casualty immediate triage is detected.
- **Stroke-aware hospital routing** -- When CPSS flags a stroke, the hospital ranker boosts neurology-capable centres by 25 points.
- **Hospital webhook integration** -- Hospitals that use their own systems can receive MedManage dispatch data automatically via configurable webhooks. Admins configure and test webhook URLs from the Hospital Ratings page.
- **Disease alert pipeline** -- Hospitals report outbreaks, admins approve alerts, and the public sees them in real time on the Disease Alerts page. No login needed to view.
- **Priority queue sorted by severity** -- Hospital incoming patient queue is sorted by AI severity score, not arrival time. Critical patients surface to the top automatically.
- **Real-time Socket.IO events** -- Pre-arrival alerts, vitals updates, bed availability changes, and dispatch notifications are pushed instantly to the correct role portal.
- **Role-based portals** -- Four distinct interfaces (Public, Ambulance, Hospital, Admin) with JWT-based route protection.
- **Demo mode** -- One-click role switching on the `/demo` page for judges and evaluators.

---

## Core Problem Statement

Emergency medical response suffers from a fundamental coordination failure:

- **Ambulance crews** don't know in real-time which hospitals have ICU beds, OT theatres or ER bays available.
- **Hospitals** receive no advance warning before a critical patient arrives, preventing prep time.
- **Routing decisions** are often made on intuition rather than data -- sending a trauma patient to a hospital 2 km away that has no surgeon on duty.
- **Administrators** have no centralized view of city-wide emergency resource utilization.

MedManage solves all four with a single, unified platform.

---

## System Architecture

```
+---------------------------------------------------------------------------+
|                           CLIENT (React 19 + Vite)                        |
|                                                                           |
|  +-------------+  +--------------+  +-------------+ +-------------+      |
|  |   PUBLIC    |  |  AMBULANCE   |  |  HOSPITAL   | |    ADMIN    |      |
|  |   PORTAL    |  |    PORTAL    |  |   PORTAL    | |   PORTAL    |      |
|  |  (no auth)  |  |  (4 pages)   |  |  (4 pages)  | |  (4 pages)  |      |
|  +-------------+  +--------------+  +-------------+ +-------------+      |
|                        Axios (REST)  +  Socket.IO Client                  |
+--------------------------------------+------------------------------------+
                                       | HTTP / WebSocket
+--------------------------------------v------------------------------------+
|                     SERVER (Node.js + Express 5)                          |
|                                                                           |
|  +----------------------------------------------------------------+      |
|  |  REST Routes                                                    |      |
|  |  /api/auth  /api/public  /api/cases  /api/ambulance            |      |
|  |  /api/hospital  /api/admin                                     |      |
|  +----------------------------+-----------------------------------+      |
|                               |                                           |
|  +----------------------------v-----------------------------------+      |
|  |  AI Engine (14 models)                                          |      |
|  |  severityAggregator.js --> 14 clinical scores --> 0-100 score  |      |
|  |  hospitalRanker.js --> distance + resources + doctors + rating  |      |
|  +----------------------------+-----------------------------------+      |
|                               |                                           |
|  +----------------------------v-----------------------------------+      |
|  |  Webhook Utility (webhook.js)                                   |      |
|  |  Sends dispatch data to external hospital systems               |      |
|  +----------------------------+-----------------------------------+      |
|                               |                                           |
|  +----------------------------v-----------------------------------+      |
|  |  Socket.IO Server -- socketHandler.js                           |      |
|  |  Events: case:created, patient:vitals_update                    |      |
|  |          case:assigned, ambulance:dispatch, er:alert            |      |
|  +----------------------------+-----------------------------------+      |
+--------------------------------------+------------------------------------+
                                       | Mongoose ODM
+--------------------------------------v------------------------------------+
|                    MongoDB (mediroute database)                            |
|                                                                           |
|   users, hospitals, ambulances, cases, patients, alerts                   |
+---------------------------------------------------------------------------+
```

---

## AI Engine -- How It Works

The AI engine is the heart of MedManage. It doesn't call any external API -- every decision is made locally using **evidence-based clinical scoring formulas** that are standard in pre-hospital emergency medicine.

### Step 1 -- Severity Assessment (`severityAggregator.js`)

Fourteen independent scoring models run on the patient's vitals:

**Core models (original 5):**

| Score | What It Measures | Normal to Critical |
|---|---|---|
| **MEWS** (Modified Early Warning Score) | Composite early-warning across resp. rate, HR, BP, temp, consciousness | 0 to 5+ = high risk |
| **Shock Index** | Heart Rate / Systolic BP -- proxy for circulatory shock | < 0.9 normal, > 1.4 = severe shock |
| **GCS** (Glasgow Coma Scale) | Consciousness level derived from AVPU | 15 = alert, 3 = unresponsive |
| **RTS** (Revised Trauma Score) | GCS + Systolic BP + Resp. Rate weighted formula for trauma | 7.84 = normal, 0 = unsurvivable |
| **Simplified SOFA** | SpO2 + MAP + GCS -- organ failure proxy | 0 = no failure, 9 = severe |

**Extended models (9 new):**

| Score | What It Measures | Trigger |
|---|---|---|
| **NEWS2** (National Early Warning Score 2) | Deterioration risk across 7 parameters including supplemental O2 awareness | Score 7+ = high deterioration risk |
| **Modified Shock Index** | Heart Rate / Mean Arterial Pressure -- more sensitive than standard SI | MSI > 1.0 = shock risk |
| **qSOFA** (quick SOFA) | Bedside sepsis screen: resp. rate, systolic BP, mental status | Score 2+ = sepsis risk |
| **PRESEP** (Pre-hospital Sepsis) | 7-criterion sepsis screening including age, nursing home status, temperature | Score 4+ = high sepsis risk |
| **Pulse Pressure** | Systolic minus Diastolic BP -- cardiac tamponade/aortic regurgitation | < 25 = narrow (tamponade risk) |
| **CPSS** (Cincinnati Prehospital Stroke Scale) | Facial droop, arm drift, speech abnormality | Any 1 positive = stroke risk |
| **CRB-65** | Pneumonia severity: confusion, resp. rate, BP, age 65+ | Score 3+ = severe pneumonia |
| **PAT** (Pediatric Assessment Triangle) | Age-adjusted vital sign scoring for patients under 18 | Score 3+ = pediatric critical |
| **START** (Simple Triage and Rapid Treatment) | Mass casualty triage: DECEASED / IMMEDIATE / DELAYED / MINIMAL | IMMEDIATE = red priority |

**Composite scoring formula (unchanged from original 5):**

```
rawScore = (MEWS_normalized  x 0.30)
         + (RTS_inverted     x 0.25)
         + (SOFA_normalized  x 0.25)
         + (ShockIdx_norm    x 0.20)

finalScore = clamp(rawScore x conditionMultiplier, 0, 100)
```

**Condition multipliers** adjust for comorbidities:
- Heart Disease + tachycardia: +15%
- Diabetes + fever: +10%
- Age > 65: +10%

**Conditional score bumps from extended models:**
- qSOFA score 2+ AND existing score < 50: bump score up by 10
- CPSS stroke risk AND existing score < 60: bump to minimum 65
- PAT pediatric concern AND existing score < 55: bump to minimum 60
- START category IMMEDIATE: force score to minimum 75

**Output object:**

```json
{
  "score": 78,
  "level": "critical",
  "canWait": false,
  "flags": ["shock_risk", "stroke_risk", "high_deterioration_risk"],
  "breakdown": {
    "mews": 7,
    "shockIndex": 1.21,
    "rts": 4.5,
    "sofa": 4
  },
  "survivalProbability": 72,
  "extendedScores": {
    "news2": { "score": 9, "riskLevel": "High" },
    "modifiedShockIndex": { "msi": 1.35, "level": "shock_risk" },
    "qsofa": { "score": 2, "sepsisRisk": true },
    "presep": { "score": 3, "riskLevel": "Moderate" },
    "pulsePressure": { "pulsePressure": 40, "category": "Low-normal" },
    "cpss": { "score": 2, "strokeRisk": true },
    "crb65": { "score": 1, "severity": "Moderate" },
    "pat": { "notApplicable": true },
    "startTriage": { "category": "DELAYED", "color": "yellow" }
  }
}
```

**Severity Levels:**

| Score Range | Level | `canWait` |
|---|---|---|
| 0 -- 39 | Stable | `true` |
| 40 -- 69 | Urgent | `true` (< 60) |
| 70 -- 100 | Critical | `false` |

**Clinical flags added by extended models:**

| Flag | Triggered By |
|---|---|
| `sepsis_risk` | qSOFA score 2+ or PRESEP score 4+ |
| `stroke_risk` | CPSS any positive finding |
| `shock_risk` | Modified Shock Index > 1.0 |
| `cardiac_tamponade_risk` | Pulse Pressure < 25 |
| `severe_pneumonia_risk` | CRB-65 score 3+ |
| `pediatric_critical` | PAT score 3+ (age < 18 only) |
| `mass_casualty_immediate` | START triage category IMMEDIATE |
| `high_deterioration_risk` | NEWS2 score 7+ |

---

### Step 2 -- Hospital Ranking (`hospitalRanker.js`)

Once severity is computed, the AI ranks every `accepting` hospital using a **100-point scoring model**:

| Criterion | Max Points | Logic |
|---|---|---|
| **Facility Match** | 35 pts | Does hospital have > 0 available units of all *required* resource types? (ICU if score > 70; OT if critical trauma flag; ER if respiratory distress; else general beds) |
| **Distance** | 30 pts | `max(0, 30 - distance_km x 3)` -- Haversine formula (Earth radius 6371 km) |
| **Doctor Availability** | 20 pts | `min(availableDoctors x 5, 20)` |
| **Hospital Rating** | 15 pts | `(rating / 5) x 15` |
| **Critical Override** | +20 pts | Bonus if `canWait = false` AND hospital is < 3 km away |
| **Stroke Routing** | +25 pts | Bonus if `stroke_risk` flag AND hospital has neurology specialty or neuro-related name |

Returns the **top 3 hospitals**, each with:
- Score, distance, estimated travel time (`dist x 2.5 + 2` minutes)
- Reason string (human-readable explanation)
- Estimated cost
- Survival probability from RTS

---

## Database Schema

### `users`
| Field | Type | Notes |
|---|---|---|
| `name`, `email`, `password` | String | bcrypt-hashed password |
| `role` | Enum | `public`, `ambulance`, `hospital`, `admin` |
| `phone` | String | |
| `location` | `{lat, lng}` | |
| `hospitalId` | ObjectId -> Hospital | For hospital staff |
| `ambulanceId` | ObjectId -> Ambulance | For ambulance operators |

### `hospitals`
| Field | Type | Notes |
|---|---|---|
| `name`, `type` | String, Enum | `govt`, `private`, `trust` |
| `location` | `{lat, lng, address}` | |
| `resources` | Object | `generalBeds`, `icuBeds`, `otTheatres`, `erBays` -- each with `total` and `available` |
| `doctors` | Array | `[{name, speciality, available}]` |
| `status` | Enum | `accepting`, `at_capacity`, `emergency_only` |
| `rating`, `totalCases`, `avgResponseTime` | Number | |
| `webhookUrl` | String | URL for external system integration (default: null) |
| `webhookEnabled` | Boolean | Whether to send webhook notifications (default: false) |

### `ambulances`
| Field | Type | Notes |
|---|---|---|
| `ambulanceId` | String | Unique identifier |
| `status` | Enum | `available`, `on_call`, `off_duty` |
| `currentLocation` | `{lat, lng}` | |
| `assignedCase` | ObjectId -> Case | |
| `operatorId` | ObjectId -> User | |

### `cases`
| Field | Type | Notes |
|---|---|---|
| `caseId` | String | Auto-generated: `CASE-{timestamp}` |
| `patient` | ObjectId -> Patient | |
| `ambulance`, `hospital` | ObjectId refs | |
| `status` | Enum | `dispatched`, `en_route`, `arrived`, `completed` |
| `timeline` | Array | `[{event, timestamp}]` -- append-only log |
| `aiRecommendations` | Array | `[{hospitalId, score, reason, distance}]` |
| `selectedHospital` | ObjectId -> Hospital | The hospital the paramedic chose |

### `patients`
| Field | Type | Notes |
|---|---|---|
| `name`, `age`, `gender` | String/Number | |
| `vitals` | Object | `heartRate`, `systolic`, `diastolic`, `respiratoryRate`, `temperature`, `oxygenSat`, `consciousness`, `chiefComplaint`, `conditions[]`, `onSupplementalOxygen`, `facialDroop`, `armDrift`, `speechAbnormality`, `nursingHomeResident` |
| `severity` | Object | AI output: `{score, level, canWait, flags, breakdown, survivalProbability, extendedScores}` |
| `status` | Enum | `incoming`, `arrived`, `admitted`, `discharged` |

### `alerts`
| Field | Type | Notes |
|---|---|---|
| `type` | Enum | `disease`, `emergency`, `system` |
| `title`, `message` | String | |
| `severity` | Enum | `high`, `medium`, `low` |
| `affectedZones[]`, `city` | String | For geo-filtering |
| `active` | Boolean | Filter toggle |

---

## REST API Reference

### Authentication -- `/api/auth`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/auth/register` | No | Register new user (returns JWT) |
| `POST` | `/auth/login` | No | Login (returns JWT + user object) |

> JWT expires in **24h**. All protected routes require `Authorization: Bearer <token>` header.

### Public -- `/api/public`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `GET` | `/public/disease-alerts?city=` | No | Active alerts sorted by severity (high to low) |
| `POST` | `/public/request-ambulance` | No | Request ambulance; auto-assigns nearest available unit, creates Case + Patient, emits `case:assigned` socket event |

### Cases -- `/api/cases`
| Method | Endpoint | Auth | Description |
|---|---|---|---|
| `POST` | `/cases/create` | Yes | Create a new case + patient record, emits `case:created` |
| `PUT` | `/cases/:id/update-vitals` | Yes | Update patient vitals (including extended fields) -> triggers AI severity calculation with all 14 models -> emits `patient:vitals_update` |
| `GET` | `/cases/:id/recommendation` | Yes | Run hospital ranker -> stores `aiRecommendations` on case -> returns top 3 |
| `PUT` | `/cases/:id/select-hospital` | Yes | Paramedic confirms hospital -> sets status to `en_route` -> emits `ambulance:dispatch` to hospital room -> sends webhook to hospital external system |
| `PUT` | `/cases/:id/status` | Yes | Update case status -> emits `case:arrived` when status = `arrived` |

### Ambulance -- `/api/ambulance`
| Method | Endpoint | Auth | Role |
|---|---|---|---|
| `PUT` | `/ambulance/status` | Yes | `ambulance` -- Update own unit status |
| `GET` | `/ambulance/active-case` | Yes | `ambulance` -- Get current assigned case with populated patient |

### Hospital -- `/api/hospital`
| Method | Endpoint | Auth | Role |
|---|---|---|---|
| `PUT` | `/hospital/availability` | Yes | `hospital` -- Update resource availability; emits `hospital:bed_update` |
| `PUT` | `/hospital/allocate` | Yes | `hospital` -- Allocate ICU/OT/ER to incoming case (decrements available count) |
| `POST` | `/hospital/alert-er` | Yes | `hospital` -- Trigger ER alert broadcast via `er:alert` |

### Admin -- `/api/admin`
| Method | Endpoint | Auth | Role |
|---|---|---|---|
| `GET` | `/admin/dashboard?city=` | Yes | `admin` -- All hospitals, ambulances, today's case count, city-wide stats |
| `GET` | `/admin/analytics` | Yes | `admin` -- Weekly case trends, avg response times, top hospitals, severity distribution |
| `PUT` | `/admin/hospitals/:id/webhook` | Yes | `admin` -- Configure hospital webhook URL and enabled status |
| `POST` | `/admin/hospitals/:id/webhook/test` | Yes | `admin` -- Send a test webhook to verify the hospital's configured URL |

---

## Real-Time Events (Socket.IO)

All events are broadcast system-wide (or to a hospital room) over a persistent WebSocket connection.

| Event Name | Direction | Payload | Trigger |
|---|---|---|---|
| `case:created` | Server -> All | `caseObject` | New case opened by ambulance |
| `case:assigned` | Server -> All | `{case, ambulanceId}` | Public ambulance request fulfilled |
| `patient:vitals_update` | Server -> Hospital/Ambulance/Admin rooms | `{caseId, severity, vitals}` | Vitals updated + AI severity recalculated |
| `ambulance:dispatch` | Server -> Hospital Room | `{case, patient, eta}` | Paramedic selects this hospital |
| `hospital:bed_update` | Server -> All | `{resources}` | Hospital updates resource availability |
| `er:alert` | Server -> All | `{caseId}` | Hospital alerts ER staff |
| `case:arrived` | Server -> All | `{caseId}` | Ambulance marks arrival |

---

## Frontend -- Role Portals

The frontend is a **React 19 SPA** with **React Router v6** and role-based route protection (`ProtectedRoute` component checks JWT role).

### Public Portal (`/`, `/alerts`, `/symptoms`, `/request-ambulance`)
> No authentication required

| Page | Key Features |
|---|---|
| `LandingPage` | Hero section, platform overview, CTA buttons |
| `DiseaseAlerts` | Real-time disease/emergency alerts filtered by city, color-coded by severity |
| `SymptomChecker` | Guided symptom input form with severity estimation for the public |
| `RequestAmbulance` | One-tap ambulance request form; shows assigned ambulance ID + ETA |

---

### Ambulance Portal (`/ambulance/*`)
> Role: `ambulance`

```
  AmbulanceDashboard
       |
       +-- PatientVitalsForm  (/ambulance/vitals/:caseId)
       |        Inputs: HR, BP, RR, Temp, SpO2, Consciousness, Age, Conditions
       |        Extended: Supplemental O2, Stroke Screen (CPSS), Nursing Home Resident
       |        On submit: PUT /api/cases/:id/update-vitals -> AI severity (14 models)
       |
       +-- HospitalRecommendations  (/ambulance/recommendations/:caseId)
       |        Displays top 3 AI-ranked hospitals with score, distance, ETA, cost
       |        Shows clinical alert banners: stroke, sepsis, pediatric, mass casualty
       |        On confirm: PUT /api/cases/:id/select-hospital
       |
       +-- RouteView  (/ambulance/route/:caseId)
                Navigation/map view to the selected hospital
```

**Key workflow:** Dispatch -> Enter Vitals -> View AI Recommendations -> Confirm Hospital -> Navigate

---

### Hospital Portal (`/hospital/*`)
> Role: `hospital`

| Page | Key Features |
|---|---|
| `HospitalDashboard` | Overview of own resources, incoming case queue |
| `IncomingPatientAlert` | Real-time pre-arrival alert: patient name, severity score, flags, ETA |
| `BedManagement` | Live UI to update available counts for General Beds, ICU, OT, ER bays |
| `PriorityQueue` | Queued incoming cases sorted by AI severity score (critical -> urgent -> stable) |

Hospital staff receive `ambulance:dispatch` socket events the moment a paramedic selects their hospital -- giving lead time to prepare the right room/resources.

---

### Admin Portal (`/admin/*`)
> Role: `admin`

| Page | Key Features |
|---|---|
| `AdminDashboard` | City-wide stats: active ambulances, total available beds, today's case count; hospital + ambulance directory |
| `AnalyticsPanel` | Weekly case trend chart (Recharts), avg response times, top hospitals by volume, severity distribution pie |
| `HospitalRatings` | Hospital performance review -- rating, total cases, avg response time, webhook integration configuration |
| `LiveMap` | Real-time map view of all ambulances and hospital locations |

---

## Access Control

MedManage uses JWT-based authentication with role-based route protection.

**Public routes (no authentication required):**

| Path | Page |
|---|---|
| `/` | Landing Page |
| `/alerts` | Disease Alerts |
| `/symptoms` | Symptom Checker |
| `/request-ambulance` | Request Ambulance |
| `/login` | Login Page |
| `/register` | Register Page |
| `/demo` | Demo Mode (one-click role switching) |

These routes render even if `localStorage` has no token. In a real emergency, nobody should need to create an account to request help.

**Protected routes (require authentication and specific role):**

| Path Pattern | Required Role |
|---|---|
| `/ambulance/*` | `ambulance` |
| `/hospital/*` | `hospital` |
| `/admin/*` | `admin` |

If an unauthenticated user tries to access a protected route, they are redirected to `/login`. If an authenticated user tries to access a route for a different role, they are redirected to their own dashboard.

---

## Tech Stack

### Backend
| Technology | Version | Role |
|---|---|---|
| `Node.js` | 20+ | Runtime |
| `Express` | 5.x | HTTP framework |
| `Mongoose` | 9.x | MongoDB ODM |
| `Socket.IO` | 4.8 | Real-time WebSocket |
| `Axios` | 1.x | HTTP client (webhook delivery) |
| `bcryptjs` | 3.x | Password hashing |
| `jsonwebtoken` | 9.x | JWT auth tokens |
| `dotenv` | 17.x | Environment config |
| `cors` | 2.8 | Cross-origin policy |

### Frontend
| Technology | Version | Role |
|---|---|---|
| `React` | 19 | UI framework |
| `Vite` | 7 | Build tool and dev server |
| `React Router DOM` | 6.x | Client-side routing |
| `Axios` | 1.x | HTTP client |
| `Socket.IO Client` | 4.8 | Real-time events |
| `Recharts` | 3.x | Analytics charts |
| `Lucide React` | 0.577 | Icon library |
| `TailwindCSS` | 3.x | Utility-first CSS |

### Database and Infrastructure
| Technology | Notes |
|---|---|
| `MongoDB` | Default db: `mediroute` (localhost:27017 or via `MONGO_URI`) |
| `concurrently` | Runs server + client dev servers in one command |

---

## Getting Started

### Prerequisites
- **Node.js** >= 18
- **MongoDB** running locally (or provide `MONGO_URI` in `.env`)

See [quick-start.md](quick-start.md) for full setup instructions including platform-specific MongoDB startup and troubleshooting.

### 1. Clone and Install

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
SEED_PASSWORD=pass123
PORT=5001
```

> `SEED_PASSWORD` must be set to `pass123` for the demo credentials listed below to work. If omitted, the seeder defaults to `pass123` with a console warning.

### 3. Seed the Database

Populate the database with sample hospitals, ambulances, users, and alerts:

```bash
npm run seed
```

This creates: 5 hospitals, 3 ambulances, 6 user accounts (one per role, plus extras), 3 disease alerts, and 1 sample completed case.

### 4. Run in Development

```bash
npm run dev
```

This starts **both** servers concurrently:
- **API Server**: `http://localhost:5001`
- **Vite Dev Server**: `http://localhost:5173`

### 5. Demo Credentials

After seeding, use these accounts to log in via `/login`:

| Role | Email | Password |
|---|---|---|
| Public | `public@mediroute.com` | `pass123` |
| Ambulance | `ambulance@mediroute.com` | `pass123` |
| Hospital | `hospital@mediroute.com` | `pass123` |
| Admin | `admin@mediroute.com` | `pass123` |

Or use the `/demo` page for one-click role switching without manual login.

---

## Scripts

| Command | Description |
|---|---|
| `npm run dev` | Starts backend (port 5001) and frontend (port 5173) concurrently |
| `npm run seed` | Seeds the database with demo data (hospitals, ambulances, users, alerts) |
| `node server/ai/test.js` | Runs all 47 AI model test cases across all 14 scoring models |

---

## Project Structure

```
medmanage/
|-- package.json                  # Root: scripts (dev, seed), shared deps
|
|-- server/                       # Node.js + Express backend
|   |-- index.js                  # Server entry: Express, Socket.IO, MongoDB, routes
|   |-- middleware/
|   |   +-- auth.js               # JWT verifyToken + verifyRole middleware
|   |-- models/
|   |   |-- User.js               # 4-role user schema
|   |   |-- Hospital.js           # Resources, doctors, status, location, webhook config
|   |   |-- Ambulance.js          # Status, location, assigned case
|   |   |-- Case.js               # Timeline log + AI recommendations
|   |   |-- Patient.js            # Vitals + computed severity
|   |   +-- Alert.js              # Disease/emergency alerts
|   |-- routes/
|   |   |-- auth.js               # POST /register, POST /login
|   |   |-- public.js             # GET /disease-alerts, POST /request-ambulance
|   |   |-- cases.js              # Full case lifecycle + AI pipeline trigger + webhook dispatch
|   |   |-- ambulance.js          # Operator status + active case lookup
|   |   |-- hospital.js           # Resource management + ER alerts
|   |   +-- admin.js              # Dashboard stats + analytics + webhook management
|   |-- ai/
|   |   |-- severityAggregator.js # Master AI function: runs all 14 models, returns 0-100 score
|   |   |-- hospitalRanker.js     # Haversine distance + multi-factor ranking + stroke routing
|   |   |-- test.js               # Test runner for all 14 models (47 test cases)
|   |   +-- scores/               # Individual scoring model modules (14 files)
|   |       |-- mews.js           # Modified Early Warning Score
|   |       |-- shockIndex.js     # Shock Index (HR / Systolic BP)
|   |       |-- gcs.js            # Glasgow Coma Scale + AVPU derivation
|   |       |-- rts.js            # Revised Trauma Score
|   |       |-- sofa.js           # Simplified SOFA
|   |       |-- news2.js          # National Early Warning Score 2
|   |       |-- modifiedShockIndex.js  # Modified Shock Index (HR / MAP)
|   |       |-- qsofa.js          # Quick SOFA (sepsis screen)
|   |       |-- presep.js         # Pre-hospital Sepsis Screening
|   |       |-- pulsePressure.js  # Pulse Pressure Analysis
|   |       |-- cpss.js           # Cincinnati Prehospital Stroke Scale
|   |       |-- crb65.js          # CRB-65 Pneumonia Severity
|   |       |-- pat.js            # Pediatric Assessment Triangle
|   |       +-- startTriage.js    # START Mass Casualty Triage
|   |-- utils/
|   |   |-- geo.js                # Haversine distance calculation
|   |   +-- webhook.js            # Webhook delivery utility (silent failure)
|   |-- sockets/
|   |   +-- socketHandler.js      # Socket.IO event definitions
|   +-- seed/
|       +-- seedData.js           # Database seeder
|
+-- client/                       # React 19 + Vite frontend
    |-- index.html                # SPA shell
    |-- vite.config.js            # Vite config (proxy: /api -> localhost:5001)
    |-- tailwind.config.js        # TailwindCSS config
    +-- src/
        |-- main.jsx              # React root mount
        |-- App.jsx               # Router + ProtectedRoute guards
        |-- context/
        |   |-- AuthContext.jsx   # JWT storage, login/logout, user state
        |   |-- ThemeContext.jsx  # Dark/light theme toggle
        |   |-- useAuth.js        # Auth context hook
        |   +-- useTheme.js       # Theme context hook
        |-- components/
        |   +-- shared/
        |       |-- ProtectedRoute.jsx  # Role-based route guard
        |       +-- Navbar.jsx          # Context-aware navigation bar
        +-- pages/
            |-- Auth/             # LoginPage, RegisterPage, DemoPage
            |-- Public/           # LandingPage, DiseaseAlerts, SymptomChecker, RequestAmbulance
            |-- Ambulance/        # AmbulanceDashboard, PatientVitalsForm, HospitalRecommendations, RouteView
            |-- Hospital/         # HospitalDashboard, IncomingPatientAlert, BedManagement, PriorityQueue
            +-- Admin/            # AdminDashboard, AnalyticsPanel, HospitalRatings, LiveMap
```

---

## Team Assignments

| Member | Ownership Area | Files |
|---|---|---|
| **P1** | Public and Ambulance Frontend | `client/src/pages/Public/`, `client/src/pages/Ambulance/` |
| **P2** | Hospital and Admin Frontend | `client/src/pages/Hospital/`, `client/src/pages/Admin/` |
| **P3** | Full Backend (except AI) | `server/` -- routes, models, middleware, sockets, seed |
| **P4** | AI Engine | `server/ai/` -- severity aggregator, hospital ranker, 14 scoring models |

---
