# Day 1 Evidence Runbook

This runbook proves the real Phase 1 data path:

```text
Python simulator -> Node.js HTTP API -> MongoDB -> authenticated query APIs
```

The simulator replays STPI-derived data. It is a network client and communicates exclusively through the backend HTTP API.

## Environment & Prerequisites

- **Node.js:** v24.14.0
- **Python:** 3.11.1
- **MongoDB:** MongoDB Community Edition 8.3.7 (`mongodb://127.0.0.1:27017/vidyutchain`)
- **Hardhat EVM:** Local Ethereum Private Chain (`http://127.0.0.1:8545`)
- **Backend Port:** 4000
- **AI Port:** 8000
- **Frontend Port:** 5173

---

## 1. Start The Database & Backend

From macOS terminal:

```bash
# Start MongoDB
brew services start mongodb/brew/mongodb-community

# Start Backend
cd implementation-phase1/backend
npm start
```

Verify backend readiness:

```bash
curl http://127.0.0.1:4000/health
```

Expected output:
```json
{"service":"vidyutchain-backend","status":"ok"}
```

---

## 2. Run Automated End-To-End Check

From `implementation-phase1/backend`:

```bash
E2E_PASSWORD="MySecurePassword123!" npm run e2e
```

**Observed Evidence Output:**
```json
{
  "status": "passed",
  "baseUrl": "http://127.0.0.1:4000",
  "email": "e2e-1787239277002@vidyutchain.local",
  "meterId": "E2E-METER-1787239277002",
  "checks": [
    "health",
    "register-or-login",
    "register-or-find-meter",
    "ingest-telemetry",
    "query-latest",
    "query-history",
    "query-aggregation",
    "reject-unauthenticated",
    "reject-invalid-telemetry",
    "reject-unknown-meter"
  ]
}
```

---

## 3. Run Real Python Telemetry Simulator

From `implementation-phase1`:

```bash
source .venv/bin/activate
python3 simulator/simulator.py \
  --base-url http://127.0.0.1:4000 \
  --token "<ACCESS_TOKEN>" \
  --meter-id M001 \
  --interval 0.05 \
  --max-records 50
```

**Observed Simulator Output:**
```text
sent meter=M001 timestamp=2006-12-16 17:15:00 status=201
sent meter=M001 timestamp=2006-12-16 17:30:00 status=201
...
sent meter=M001 timestamp=2006-12-17 05:30:00 status=201
replay complete attempted=50 skipped=0 failed=0
```

---

## 4. Query Latest & Historical Telemetry

```bash
curl -H "Authorization: Bearer <ACCESS_TOKEN>" http://127.0.0.1:4000/api/telemetry/latest/M001
```

**Observed Response:**
```json
{
  "meterId": "M001",
  "telemetry": {
    "meterId": "M001",
    "timestamp": "2006-12-17T00:00:00.000Z",
    "voltage": 243.19,
    "current": 7.43,
    "powerKw": 1.695,
    "powerFactor": 0.938,
    "importKwh": 0.4239,
    "exportKwh": 0,
    "anomalyType": "NORMAL",
    "status": "normal",
    "source": "simulator",
    "aiAnomalyType": "NORMAL",
    "aiRiskScore": 0.0938,
    "aiConfidence": 0.9062
  }
}
```

---

## 5. Daily Aggregation Verification

```bash
curl -H "Authorization: Bearer <ACCESS_TOKEN>" "http://127.0.0.1:4000/api/telemetry/aggregation/M001?interval=daily"
```

**Observed Response:**
```json
{
  "meterId": "M001",
  "interval": "daily",
  "aggregation": [
    {
      "timestamp": "2006-12-16T00:00:00.000Z",
      "readings": 28,
      "averagePowerKw": 3.05,
      "importKwh": 21.36,
      "exportKwh": 0
    },
    {
      "timestamp": "2006-12-17T00:00:00.000Z",
      "readings": 23,
      "averagePowerKw": 2.14,
      "importKwh": 12.31,
      "exportKwh": 0
    }
  ]
}
```

---

## 6. Database Document Counts

Verified via `mongosh`:
```bash
mongosh mongodb://127.0.0.1:27017/vidyutchain --eval "db.getCollectionNames().forEach(c => print(c + ': ' + db[c].countDocuments()))"
```

Output:
- `users`: 3
- `meters`: 7
- `telemetries`: 154+
- `alerts`: 11

---

## Status: Day 1 PASSED & VERIFIED

The Day 1 exit condition is fully satisfied with verifiable logs, database records, and passing test suites.
