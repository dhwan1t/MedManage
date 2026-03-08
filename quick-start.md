# MedManage -- Quick Start Guide

A step-by-step guide to get MedManage running on your local machine from a clean checkout.

---

## Prerequisites

Make sure the following are installed before you begin.

| Tool | Minimum Version | Verify Command |
|---|---|---|
| Node.js | 18 or higher | `node --version` |
| npm | 8 or higher (ships with Node.js) | `npm --version` |
| MongoDB Community Server | 6 or higher | `mongod --version` |
| Git | any recent version | `git --version` |

If any command returns "command not found", install the corresponding tool before continuing.

- Node.js: https://nodejs.org (LTS recommended)
- MongoDB Community: https://www.mongodb.com/try/download/community
- Git: https://git-scm.com

---

## Step 1 -- Clone the Repository

```
git clone https://github.com/dhwan1t/MedManage.git
cd MedManage
```

---

## Step 2 -- Install Dependencies

Install backend dependencies from the project root, then install frontend dependencies inside the `client/` directory.

```
npm install
cd client && npm install && cd ..
```

After this completes you should have `node_modules/` in both the root and `client/` directories.

---

## Step 3 -- Start MongoDB

MongoDB must be running before you seed or start the application.

**macOS (Homebrew):**

```
brew services start mongodb-community
```

**Windows (Command Prompt as Administrator):**

```
net start MongoDB
```

**Linux (systemd):**

```
sudo systemctl start mongod
```

**Verify MongoDB is running:**

```
mongosh --eval "db.runCommand({ ping: 1 })"
```

You should see `{ ok: 1 }` in the output. If `mongosh` is not installed, `mongo --eval "db.runCommand({ ping: 1 })"` works on older setups.

---

## Step 4 -- Configure Environment Variables

Create a `.env` file in the `server/` directory. If an `.env.example` file exists, copy it:

```
cp .env.example server/.env
```

If no `.env.example` exists, create `server/.env` manually with the following content:

```
MONGO_URI=mongodb://localhost:27017/medmanage
JWT_SECRET=replace-this-with-a-long-random-string
SEED_PASSWORD=pass123
PORT=5001
```

**Variable reference:**

| Variable | Required | Description |
|---|---|---|
| `MONGO_URI` | Yes | MongoDB connection string. Default: `mongodb://localhost:27017/medmanage` |
| `JWT_SECRET` | Yes | Any long random string used to sign JSON Web Tokens. Keep it secret. |
| `SEED_PASSWORD` | No | Password used for all demo user accounts. Must be `pass123` for the demo credentials listed below to work. If omitted, the seeder defaults to `pass123` with a console warning. |
| `PORT` | No | Port for the Express API server. Defaults to `5001` if not set. |

---

## Step 5 -- Seed the Database

Populate MongoDB with demo data:

```
npm run seed
```

This creates:

- 5 hospitals (City Medical Center, PGIMER Annex, Apollo Ludhiana, Civil Hospital, Max Super Speciality)
- 3 ambulances (AMB-2047, AMB-1023, AMB-3301)
- 6 user accounts (one per role plus extras for ambulance and hospital)
- 3 disease alerts (dengue outbreak, traffic accident, seasonal flu)
- 1 sample completed case with patient vitals and severity data

You should see a summary table in the terminal confirming all records were created.

---

## Step 6 -- Run the Application

```
npm run dev
```

This uses `concurrently` to start both servers in a single terminal. Expected output:

```
Server running on port 5001
  VITE v7.x.x  ready in XXX ms
  -> Local:   http://localhost:5173/
```

- **Backend API**: http://localhost:5001
- **Frontend UI**: http://localhost:5173

Open http://localhost:5173 in your browser to access the application.

---

## Step 7 -- Access the Application

### Demo mode (recommended for judges and evaluators)

Navigate to http://localhost:5173/demo for one-click role switching. This page lets you instantly log in as any role without typing credentials.

### Manual login

Go to http://localhost:5173/login and use one of these accounts:

| Role | Email | Password | Portal Path |
|---|---|---|---|
| Public | `public@mediroute.com` | `pass123` | `/` |
| Ambulance | `ambulance@mediroute.com` | `pass123` | `/ambulance` |
| Hospital | `hospital@mediroute.com` | `pass123` | `/hospital` |
| Admin | `admin@mediroute.com` | `pass123` | `/admin` |

### Pages that work without any login

These pages are fully public and require no account:

| Path | Page |
|---|---|
| `/` | Landing Page |
| `/alerts` | Disease Alerts |
| `/symptoms` | Symptom Checker |
| `/request-ambulance` | Request Ambulance |
| `/login` | Login Page |
| `/register` | Register Page |
| `/demo` | Demo Mode |

---

## Step 8 -- Verify the API

Test the public disease alerts endpoint with curl:

```
curl http://localhost:5001/api/public/disease-alerts
```

You should receive a JSON array of disease alert objects.

Run the AI model test suite:

```
node server/ai/test.js
```

Expected output:

```
  TEST SUMMARY
  Total:  47
  Passed: 47
  Failed: 0

All models executed successfully!
```

This confirms all 14 clinical scoring models (MEWS, Shock Index, GCS, RTS, Simplified SOFA, NEWS2, Modified Shock Index, qSOFA, PRESEP, Pulse Pressure, CPSS, CRB-65, PAT, START) are functioning correctly.

---

## Common Issues

### Port 5001 already in use

On macOS, AirPlay Receiver sometimes occupies port 5000 or 5001. Either disable AirPlay Receiver in System Settings > General > AirDrop & Handoff, or kill the process:

```
lsof -i :5001
kill -9 <PID>
```

Alternatively, change the `PORT` value in your `.env` file and update `client/vite.config.js` proxy target to match.

### MongoDB not connecting

1. Confirm the MongoDB service is running (see Step 3).
2. Confirm `MONGO_URI` in your `.env` file matches your local MongoDB address.
3. If using MongoDB Atlas or a remote instance, make sure your IP is whitelisted and the connection string includes credentials.

### Demo login failing (invalid credentials)

This usually means the seeder ran before `SEED_PASSWORD` was set, so passwords were hashed with a different value. Fix:

1. Set `SEED_PASSWORD=pass123` in `server/.env`.
2. Re-run the seeder: `npm run seed` (this drops and re-creates all demo data).
3. Try logging in again.

### Vite picks a different port (not 5173)

If port 5173 is occupied, Vite automatically picks the next available port (5174, 5175, etc.). Check the terminal output after `npm run dev` for the actual URL. The API proxy will still work because it is configured relative to the Vite dev server.

### npm install fails with peer dependency warnings

Try installing with the `--legacy-peer-deps` flag:

```
npm install --legacy-peer-deps
cd client && npm install --legacy-peer-deps && cd ..
```

---

## Scripts Reference

| Command | Description |
|---|---|
| `npm run dev` | Starts backend (port 5001) and frontend (port 5173) concurrently |
| `npm run seed` | Seeds the database with demo data (5 hospitals, 3 ambulances, 6 users, 3 alerts) |
| `node server/ai/test.js` | Runs 47 test cases across all 14 AI scoring models |