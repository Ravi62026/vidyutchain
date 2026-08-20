# Day 1 Evidence Runbook

This runbook proves the real Phase 1 data path:

```text
Python simulator -> Node.js HTTP API -> MongoDB -> authenticated query APIs
```

The simulator is replaying STPI-derived data. It is not a physical meter and it never writes directly to MongoDB.

## Prerequisites

- Node.js 20 or later
- Python 3.11 or later
- A reachable MongoDB instance
- A configured backend `.env` based on `.env.example`

## Start The Backend

From `implementation-phase1/backend`:

```powershell
npm install
npm start
```

Verify readiness from another terminal:

```powershell
Invoke-RestMethod http://127.0.0.1:4000/health
```

The backend configures MongoDB Stable API version 1, pings the deployment, and must report a successful MongoDB connection before it opens the HTTP port.

## Run The End-To-End Check

Set the password in the local process environment. Do not commit it or place it in this document.

```powershell
Set-Location implementation-phase1/backend
$env:E2E_PASSWORD = '<local-only-password-at-least-8-characters>'
$env:E2E_EMAIL = 'e2e-reviewer@example.local'
$env:E2E_METER_ID = 'E2E-METER-001'
npm run e2e
```

The runner registers or logs in the user, registers or finds the meter, ingests telemetry, queries latest/history/daily aggregation, and verifies unauthenticated, invalid-value, and unknown-meter rejection. It prints no access token.

## Run The Real Simulator

Use a token obtained from the authenticated login response in the local terminal only:

```powershell
Set-Location implementation-phase1/simulator
C:\Programs\Python\python-3.13-amd64\python.exe -m pip install -r requirements.txt
$env:VIDYUTCHAIN_TOKEN = '<local-login-access-token>'
C:\Programs\Python\python-3.13-amd64\python.exe simulator.py `
  --base-url http://127.0.0.1:4000 `
  --token $env:VIDYUTCHAIN_TOKEN `
  --meter-id M001 `
  --interval 0 `
  --max-records 10
```

Expected simulator evidence includes successful HTTP statuses, meter IDs, timestamps, and a final replay summary. A reverse-energy source row must report `exportKwh` rather than `importKwh`.

## Recovery Check

1. Start a short simulator replay with a nonzero interval.
2. Stop the backend while requests are in flight.
3. Capture the simulator's network-failure or 5xx retry messages.
4. Restart the backend after MongoDB is ready.
5. Confirm later simulator requests succeed and the persisted history contains the successful records.

Do not call the Day 1 exit condition `DONE` until this runbook has passed against a real MongoDB instance.

## Current Evidence Boundary

Local source, schema, contract, simulator, and rejection tests pass. The supplied Atlas URL was attempted, but its SRV hostname returned a DNS `ENOTFOUND` error from this environment before authentication. Live persistence, latest/history records, aggregation totals, ownership checks against stored data, and recovery evidence remain pending until a reachable MongoDB URL is supplied.
