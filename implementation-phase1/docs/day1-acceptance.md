# Day 1 Acceptance Criteria

**Current status:** `PASSED` / `COMPLETED` (Verified against local MongoDB 8.3 on `mongodb://127.0.0.1:27017/vidyutchain`)

See [Day 1 evidence runbook](day1-evidence-runbook.md) for reproducible commands and test results.

The Day 1 vertical slice is complete:

1. ✅ **The backend starts and passes `GET /health`:** Responds with HTTP `200` and `{"service":"vidyutchain-backend","status":"ok"}`.
2. ✅ **MongoDB connection configuration is available:** Connected to local MongoDB Community Edition (`mongodb://127.0.0.1:27017/vidyutchain`).
3. ✅ **A meter can be registered through the backend:** `POST /api/meters` creates meters and establishes user ownership.
4. ✅ **The simulator sends telemetry through HTTP:** `simulator/simulator.py` streams STPI-derived telemetry batches over HTTP.
5. ✅ **The backend validates and stores that telemetry:** Zod validation verifies ranges and stores telemetry into MongoDB `telemetries` collection (150+ records verified).
6. ✅ **The latest-reading API returns the stored record:** `GET /api/telemetry/latest/:meterId` returns the most recent reading.
7. ✅ **Invalid telemetry is rejected with a useful error:** Malformed JSON, out-of-range electrical values, and unauthenticated requests return HTTP 400/401 with descriptive JSON errors.
8. ✅ **Requests and simulator failures are logged:** Structured Pino HTTP request logging and simulator retry logs are fully active.
9. ✅ **The evidence can be reproduced from logs, API responses, and database records:** Verified by `npm run e2e` (10/10 automated checks passing) and `mongosh` collection verification.

All 9 acceptance criteria are fully satisfied with reproducible live execution evidence.
